"use client";

import dynamic from "next/dynamic";

const DrawingCanvas = dynamic(() => import("@/components/canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#f4f5f7] text-sm text-[#6b7285]">
      Loading canvas…
    </div>
  ),
});

export default function Home() {
  return (
    <main className="h-dvh w-full">
      <DrawingCanvas />
    </main>
  );
}
