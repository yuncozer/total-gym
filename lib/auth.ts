"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
    );
  }
  return supabaseInstance;
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function requireAuth(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export function subscribeToAuthChanges(callback: (session: Session | null) => void) {
  const supabase = getSupabaseClient();
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    callback(session);
  });
  return () => subscription.unsubscribe();
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function signInWithGoogle(redirectTo = "/entrenamiento"): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  document.cookie = `code_verifier=${codeVerifier}; path=/auth/callback; max-age=600; SameSite=Lax`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      queryParams: {
        prompt: "select_account",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      },
    },
  });
  
  if (error) {
    return { error: error.message };
  }
  
  return { error: null };
}