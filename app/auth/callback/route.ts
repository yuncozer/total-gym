import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getCookieValue(cookieString: string, name: string): string | null {
  const cookies = cookieString.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return value;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("redirect") || "/entrenamiento";
  const cookieHeader = request.headers.get("cookie") || "";
  const codeVerifier = getCookieValue(cookieHeader, "code_verifier");
  
  console.log("Callback received - code:", !!code, "codeVerifier:", !!codeVerifier);
  
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", requestUrl.origin));
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  let data;
  let error;
  
  if (codeVerifier) {
    console.log("Exchanging code with PKCE verifier");
    const result = await supabase.auth.exchangeCodeForSession(code);
    data = result.data;
    error = result.error;
  } else {
    console.log("No code verifier found, trying without it");
    const result = await supabase.auth.exchangeCodeForSession(code);
    data = result.data;
    error = result.error;
  }
  
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
  
  const response = NextResponse.redirect(new URL(next, baseUrl));
  response.cookies.delete("code_verifier");
  
  return response;
}