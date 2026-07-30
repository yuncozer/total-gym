import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { avatarPublicUrl, removeAvatarObject } from "@/lib/avatar/storage";

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

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  const authClient = createAuthClient(request);
  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("avatar_url")
    .eq("id", session.user.id)
    .maybeSingle();

  return NextResponse.json({ avatarUrl: data?.avatar_url || null });
}

export async function POST(request: NextRequest) {
  const authClient = createAuthClient(request);
  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const avatarUrl = avatarPublicUrl(admin, "users", session.user.id);

  const { error: updateError } = await admin
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", session.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ avatarUrl });
}

export async function DELETE(request: NextRequest) {
  const authClient = createAuthClient(request);
  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  await removeAvatarObject(admin, "users", session.user.id);

  const { error: updateError } = await admin
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", session.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ avatarUrl: null });
}
