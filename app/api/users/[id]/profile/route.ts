import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { computeUserStats } from "@/lib/gamification/computeUserStats";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (session.user.id !== id) {
      const { data: friendRow } = await adminClient
        .from("friends")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("friend_id", id)
        .maybeSingle();

      const { data: clientRow } = await adminClient
        .from("trainer_clients")
        .select("id")
        .eq("trainer_id", session.user.id)
        .eq("user_id", id)
        .maybeSingle();

      if (!friendRow && !clientRow) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("id, email, avatar_url")
      .eq("id", id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fallback to auth.users email if profile email is missing
    if (!profile.email) {
      const { data: authEmail } = await adminClient.rpc("get_user_email", { p_user_id: id });
      if (authEmail) profile.email = authEmail as string;
    }

    const stats = await computeUserStats(adminClient, id);

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      avatarUrl: profile.avatar_url || null,
      ...stats,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
