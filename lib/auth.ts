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

export async function signInWithGoogle(redirectTo = "/entrenamiento"): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });
  
  if (error) {
    return { error: error.message };
  }
  
  return { error: null };
}