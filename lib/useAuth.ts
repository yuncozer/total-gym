"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSession, subscribeToAuthChanges } from "./auth";

export function useAuth(requireAuth = false) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    const session = await getSession();
    
    if (session?.user) {
      setAuthenticated(true);
      setUser({ id: session.user.id, email: session.user.email });
    } else {
      setAuthenticated(false);
      setUser(null);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();

    const unsubscribe = subscribeToAuthChanges((session) => {
      if (session?.user) {
        setAuthenticated(true);
        setUser({ id: session.user.id, email: session.user.email });
      } else {
        setAuthenticated(false);
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [checkAuth]);

  useEffect(() => {
    if (!loading && requireAuth && !authenticated) {
      const redirectUrl = typeof window !== "undefined" ? window.location.pathname : "";
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [loading, requireAuth, authenticated, router]);

  return { loading, authenticated, user, checkAuth };
}