import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: link } = await admin
    .from("trainer_clients")
    .select("id, trainer_id")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!link) {
    return NextResponse.json({ upcoming: null });
  }

  const { data: upcoming } = await admin
    .from("training_sessions")
    .select("id, scheduled_at, duration_minutes, location, status")
    .eq("client_id", link.id)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!upcoming) {
    return NextResponse.json({ upcoming: null });
  }

  const { data: trainer } = await admin
    .from("trainers")
    .select("display_name")
    .eq("user_id", link.trainer_id)
    .maybeSingle();

  return NextResponse.json({
    upcoming: {
      id: upcoming.id,
      scheduledAt: upcoming.scheduled_at,
      durationMinutes: upcoming.duration_minutes,
      location: upcoming.location,
      trainerName: trainer?.display_name || null,
    },
  });
}
