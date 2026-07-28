import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin/route";
import { getAdminClient } from "@/lib/admin/client";
import { slugify } from "@/lib/trainer/slug";

export async function GET(request: NextRequest) {
  const { error } = await checkAdminAccess(request);
  if (error) return error;

  const supabase = getAdminClient();

  const { data, error: trainersError } = await supabase
    .from("trainers")
    .select("user_id, display_name, specialty, is_active, created_at")
    .order("created_at", { ascending: false });

  if (trainersError) {
    return NextResponse.json({ error: trainersError.message }, { status: 500 });
  }

  const userIds = (data || []).map((t: { user_id: string }) => t.user_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds.length > 0 ? userIds : ["none"]);

  const emailMap: Record<string, string> = {};
  for (const p of profiles || []) {
    emailMap[p.id] = p.email;
  }

  const trainers = (data || []).map((t) => ({
    userId: t.user_id,
    email: emailMap[t.user_id] || "Unknown",
    displayName: t.display_name,
    specialty: t.specialty,
    isActive: t.is_active,
    createdAt: t.created_at,
  }));

  return NextResponse.json(trainers);
}

export async function POST(request: NextRequest) {
  const { error: authError } = await checkAdminAccess(request);
  if (authError) return authError;

  const supabase = getAdminClient();

  const { email, displayName, specialty } = await request.json();

  if (!email || !displayName) {
    return NextResponse.json({ error: "email and displayName are required" }, { status: 400 });
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
    .from("trainers")
    .insert({
      user_id: users[0].id,
      display_name: displayName,
      specialty: specialty || null,
      public_slug: slugify(displayName),
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "User is already a trainer" }, { status: 409 });
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
    .from("trainers")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
