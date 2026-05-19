import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("redirect") || "/entrenamiento";
  
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", requestUrl.origin));
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  
  const cookieStore = await cookies();
  
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          console.error("Error setting cookies:", error);
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (error || !data.user) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(new URL("/login?error=auth_failed", requestUrl.origin));
  }

  const adminClient = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    const userMetadata = data.user.user_metadata || {};
    
    await adminClient.from("profiles").upsert({
      id: data.user.id,
      email: data.user.email,
      gender: userMetadata.gender || "",
      full_name: userMetadata.full_name || userMetadata.name || "",
      avatar_url: userMetadata.avatar_url || "",
      provider: data.user.app_metadata?.provider || "google",
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
  return NextResponse.redirect(new URL(next, baseUrl));
}