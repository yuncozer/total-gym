import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getTrainerAdminClient } from "./client";

export async function checkTrainerAccess(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return {
      supabase: null,
      session: null,
      trainerId: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const trainerClient = getTrainerAdminClient();
  const { data } = await trainerClient
    .from("trainers")
    .select("user_id")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) {
    return {
      supabase: null,
      session: null,
      trainerId: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { supabase, session, trainerId: session.user.id, error: null };
}
