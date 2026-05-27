import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin/route";
import { getAdminClient } from "@/lib/admin/client";

export async function GET(request: NextRequest) {
  const { error } = await checkAdminAccess(request);
  if (error) return error;

  const supabase = getAdminClient();

  const { data, error: adminsError } = await supabase
    .from("admin_users")
    .select("user_id, created_at");

  if (adminsError) {
    return NextResponse.json({ error: adminsError.message }, { status: 500 });
  }

  const userIds = (data || []).map((a: { user_id: string }) => a.user_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds.length > 0 ? userIds : ["none"]);

  const emailMap: Record<string, string> = {};
  for (const p of profiles || []) {
    emailMap[p.id] = p.email;
  }

  const admins = (data || []).map((a: { user_id: string; created_at: string }) => ({
    userId: a.user_id,
    email: emailMap[a.user_id] || "Unknown",
    createdAt: a.created_at,
  }));

  return NextResponse.json(admins);
}

export async function POST(request: NextRequest) {
  const { error: authError } = await checkAdminAccess(request);
  if (authError) return authError;

  const supabase = getAdminClient();

  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (!users || users.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error: insertError } = await supabase
    .from("admin_users")
    .insert({ user_id: users[0].id });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "User is already an admin" }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { error: authError } = await checkAdminAccess(request);
  if (authError) return authError;

  const supabase = getAdminClient();

  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("admin_users")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
