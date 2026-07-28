import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:notifications@totalgym.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

function createAuthClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function resolveAccess(admin: ReturnType<typeof getAdminClient>, workoutId: string, userId: string) {
  const { data: workout } = await admin
    .from("workouts")
    .select("id, user_id, name")
    .eq("id", workoutId)
    .maybeSingle();

  const notFound = { workout: null, role: null as "client" | "trainer" | null, trainerId: null as string | null, clientRecordId: null as string | null };
  if (!workout) return notFound;

  if (workout.user_id === userId) {
    const { data: link } = await admin
      .from("trainer_clients")
      .select("id, trainer_id")
      .eq("user_id", workout.user_id)
      .eq("status", "active")
      .maybeSingle();
    return { workout, role: "client" as const, trainerId: link?.trainer_id ?? null, clientRecordId: link?.id ?? null };
  }

  const { data: link } = await admin
    .from("trainer_clients")
    .select("id, trainer_id")
    .eq("user_id", workout.user_id)
    .eq("trainer_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (link) {
    return { workout, role: "trainer" as const, trainerId: userId, clientRecordId: link.id };
  }

  return { ...notFound, workout };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: workoutId } = await params;
  const authClient = createAuthClient(request);
  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  const { workout, role, trainerId } = await resolveAccess(admin, workoutId, session.user.id);

  if (!workout || !role) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let trainerName: string | null = null;
  let clientName: string | null = null;
  if (trainerId) {
    const { data: trainer } = await admin.from("trainers").select("display_name").eq("user_id", trainerId).maybeSingle();
    trainerName = trainer?.display_name ?? null;
    const { data: clientRow } = await admin
      .from("trainer_clients")
      .select("display_name")
      .eq("user_id", workout.user_id)
      .eq("trainer_id", trainerId)
      .maybeSingle();
    clientName = clientRow?.display_name ?? null;
  }

  const { data: comments, error } = await admin
    .from("session_comments")
    .select("id, author_id, body, created_at, read_at")
    .eq("workout_id", workoutId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (role === "client") {
    const unreadIds = (comments || []).filter((c) => c.author_id !== session.user.id && !c.read_at).map((c) => c.id);
    if (unreadIds.length > 0) {
      await admin.from("session_comments").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
    }
  }

  const mapped = (comments || []).map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    isMine: c.author_id === session.user.id,
    authorName: c.author_id === session.user.id
      ? null
      : (c.author_id === workout.user_id ? clientName : trainerName),
  }));

  return NextResponse.json({ comments: mapped, workoutName: workout.name });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: workoutId } = await params;
  const authClient = createAuthClient(request);
  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  const { workout, role, trainerId, clientRecordId } = await resolveAccess(admin, workoutId, session.user.id);

  if (!workout || !role) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 1000) : "";
  if (!text) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const { data: comment, error } = await admin
    .from("session_comments")
    .insert({ workout_id: workoutId, author_id: session.user.id, body: text })
    .select("id, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const recipientUserId = role === "trainer" ? workout.user_id : trainerId;
  const pushUrl = role === "trainer" ? `/workout/${workoutId}` : `/entrenador/clientes/${clientRecordId}/sesiones/${workoutId}`;
  if (recipientUserId) {
    const { data: subs } = await admin.from("push_subs").select("*").eq("user_id", recipientUserId);
    const title = role === "trainer" ? "Comentario de tu entrenador 💬" : "Tu cliente te respondió 💬";
    for (const sub of subs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body: text, icon: "/icon-192.png", url: pushUrl })
        );
      } catch {}
    }
  }

  return NextResponse.json({
    comment: { id: comment.id, body: text, createdAt: comment.created_at, isMine: true, authorName: null },
  });
}
