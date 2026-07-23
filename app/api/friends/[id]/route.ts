import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;
    const userId = session.user.id;

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: deleteError } = await adminClient
      .from("friends")
      .delete()
      .eq("user_id", userId)
      .eq("friend_id", id);

    if (deleteError) throw deleteError;

    const { error: deleteReverseError } = await adminClient
      .from("friends")
      .delete()
      .eq("user_id", id)
      .eq("friend_id", userId);

    if (deleteReverseError) throw deleteReverseError;

    const { error: cancelRequest } = await adminClient
      .from("friend_requests")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${userId})`)
      .in("status", ["pending", "accepted"]);

    if (cancelRequest) throw cancelRequest;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing friend:", error);
    return NextResponse.json({ error: "Failed to remove friend" }, { status: 500 });
  }
}
