"use client";

import { useRef, useState } from "react";
import { AuthBar, type AuthMode } from "@/components/auth";
import DrawingCanvas, {
  type DrawingCanvasHandle,
} from "@/components/canvas/DrawingCanvas";
import { CanvasSidebar } from "@/components/canvas/CanvasSidebar";

export default function CanvasWorkspace() {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState("Untitled canvas");
  const [dirty, setDirty] = useState(false);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <DrawingCanvas ref={canvasRef} onDirtyChange={setDirty} />
      <AuthBar mode={authMode} onModeChange={setAuthMode} />
      <CanvasSidebar
        canvasRef={canvasRef}
        activeCanvasId={activeCanvasId}
        activeTitle={activeTitle}
        dirty={dirty}
        onActiveChange={({ id, title }) => {
          setActiveCanvasId(id);
          setActiveTitle(title);
        }}
        onRequestLogin={() => setAuthMode("login")}
      />
    </main>
  );
}
