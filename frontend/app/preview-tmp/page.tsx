"use client";

// TEMPORARY harness — records canvas writes so autosave behaviour can be
// asserted. Deleted after checks.
import dynamic from "next/dynamic";
import { AuthProvider } from "@/lib/auth";
import { ConfirmProvider, ToastProvider } from "@/components/ui";

const CanvasWorkspace = dynamic(
  () => import("@/components/canvas/CanvasWorkspace"),
  { ssr: false },
);

const user = { id: "u1", name: "Ajay", email: "ajay@example.com" };

if (typeof window !== "undefined") {
  localStorage.setItem("glazia_access_token", "preview-token");
  localStorage.setItem("glazia_user", JSON.stringify(user));
  (window as any).__writes = [];

  const ok = (data: unknown) =>
    new Response(JSON.stringify({ success: true, statusCode: 200, data }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  const real = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(typeof input === "string" ? input : (input as Request).url ?? input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/auth/")) return ok({ user });
    if (url.includes("/canvases")) {
      if (method !== "GET") {
        (window as any).__writes.push({ method, body: init?.body ? JSON.parse(String(init.body)) : null });
        return ok({ canvas: { id: "c1", owner: "u1", title: "Untitled canvas", shapes: [], viewport: { x: 0, y: 0, scale: 1 } } });
      }
      return ok({ canvases: [] });
    }
    return real(input as RequestInfo, init);
  };
}

export default function Preview() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <CanvasWorkspace />
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
