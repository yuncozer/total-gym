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
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  };

  const subscribe = async () => {
    if (!supported || loading) {
      return null;
    }
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const existingSub = await registration.pushManager.getSubscription();
      
      if (existingSub) {
        setSubscription(existingSub);
        setLoading(false);
        return existingSub;
      }

      const newSub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

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