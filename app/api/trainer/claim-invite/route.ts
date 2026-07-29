import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { claimInviteToken } from "@/lib/trainer/claim";

export async function POST(request: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const inviteToken = typeof body.inviteToken === "string" ? body.inviteToken : null;
  if (!inviteToken) {
    return NextResponse.json({ error: "inviteToken is required" }, { status: 400 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const claimed = await claimInviteToken(adminClient, user.id, inviteToken);
  return NextResponse.json({ claimed });
}
