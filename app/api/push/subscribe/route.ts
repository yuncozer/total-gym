import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Missing subscription data" }, { status: 400 });
  }

  const { error } = await supabase.from("push_subs").insert({
    user_id: user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });

  if (error) {
    if (error.code === "23505") {
      const { error: updateError } = await supabase
        .from("push_subs")
        .update({
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Update push_sub error:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      console.error("Insert push_sub error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ notify_enabled: true })
    .eq("id", user.id);

  if (profileError) {
    console.error("Update profile error:", profileError);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}