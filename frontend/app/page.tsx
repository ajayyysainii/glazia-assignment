"use client";

import dynamic from "next/dynamic";
import { AuthProvider } from "@/lib/auth";
import { ConfirmProvider, ToastProvider } from "@/components/ui";
import { ServerBootGate } from "@/components/ServerBootGate";

const CanvasWorkspace = dynamic(
  () => import("@/components/canvas/CanvasWorkspace"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh w-full items-center justify-center bg-[#f4f5f7] text-sm text-[#6b7285]">
        Loading canvas…
      </div>
    ),
  },
);

export default function Home() {
  return (
    // Outside AuthProvider on purpose: session restore hits the API, and
    // firing that at a sleeping server just stalls behind the cold start.
    <ServerBootGate>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <CanvasWorkspace />
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </ServerBootGate>
  );
}
