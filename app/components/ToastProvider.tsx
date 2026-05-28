"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      gutter={12}
      containerClassName="mt-2"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#18181b",
          color: "#ededed",
          border: "1px solid #3f3f46",
          borderRadius: "12px",
          fontSize: "14px",
          padding: "12px 16px",
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "#18181b",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#18181b",
          },
          duration: 6000,
        },
      }}
    />
  );
}
