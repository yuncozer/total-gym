"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export function usePushNotifications() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setSupported(true);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  };

  const subscribe = async () => {
    if (!supported || loading) {
      console.log("subscribe: not supported or loading", { supported, loading });
      return null;
    }
    setLoading(true);

    try {
      console.log("subscribe: getting service worker ready...");
      const registration = await navigator.serviceWorker.ready;
      console.log("subscribe: service worker ready, getting existing subscription...");
      
      const existingSub = await registration.pushManager.getSubscription();
      console.log("subscribe: existing subscription:", existingSub);
      
      if (existingSub) {
        setSubscription(existingSub);
        setLoading(false);
        return existingSub;
      }

      console.log("subscribe: no existing sub, creating new subscription with vapid key...");
      console.log("subscribe: VAPID_KEY:", VAPID_PUBLIC_KEY);
      
      const newSub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log("subscribe: new subscription created:", newSub);
      setSubscription(newSub);
      setLoading(false);
      return newSub;
    } catch (error) {
      console.error("Push subscription failed:", error);
      setLoading(false);
      return null;
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
    } catch (error) {
      console.error("Unsubscribe failed:", error);
    }
  };

  return { subscription, supported, subscribe, unsubscribe, loading };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function saveSubscription(subscription: PushSubscription) {
  try {
    const subAny = subscription as any;
    
    // Las keys pueden estar en diferentes lugares dependiendo del navegador
    const keys = subAny.keys || subAny.options?.keys || subAny._json?.keys;
    const p256dh = keys?.p256dh || (subscription as any).getKey?.('p256dh');
    const auth = keys?.auth || (subscription as any).getKey?.('auth');
    
    console.log("Full subscription object:", subAny);
    console.log("Keys from subAny.keys:", subAny.keys);
    console.log("Keys from subAny.options?.keys:", subAny.options?.keys);
    console.log("Keys with getKey:", subscription.getKey ? {
      p256dh: subscription.getKey('p256dh'),
      auth: subscription.getKey('auth')
    } : 'not available');
    
    // Convertir ArrayBuffer a base64 si es necesario
    const arrayBufferToBase64 = (buffer: ArrayBuffer | undefined) => {
      if (!buffer) return '';
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };
    
    const payload = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: typeof p256dh === 'string' ? p256dh : arrayBufferToBase64(p256dh),
        auth: typeof auth === 'string' ? auth : arrayBufferToBase64(auth),
      },
    };
    
    console.log("Saving subscription with payload:", JSON.stringify(payload));

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Save subscription error:", data);
      throw new Error(data.error || `Error ${response.status}: Failed to save subscription`);
    }

    console.log("Subscription saved successfully:", data);
    return data;
  } catch (error) {
    console.error("saveSubscription error:", error);
    throw error;
  }
}

export async function updateNotificationSettings(enabled: boolean) {
  const response = await fetch("/api/push/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notify_enabled: enabled }),
  });

  return response.json();
}