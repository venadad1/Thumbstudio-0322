import { useEffect, useRef } from "react";
import { layerBox, localPoint, renderProject, type Project } from "../lib/editor";

export function ThumbnailCanvas({
  project,
  selected,
  onSelect,
  onChange,
  onDragStart,
  guides,
  preview,
  onEdit,
}: {
  project: Project;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, values: { x?: number; y?: number; rotation?: number }) => void;
  onDragStart: () => void;
  guides: boolean;
  preview: boolean;
  onEdit: (id: string) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{
    id: string;
    mode: "move" | "rotate";
    dx: number;
    dy: number;
    x: number;
    y: number;
  } | null>(null);
  useEffect(() => {
    let active = true;
    const buffer = document.createElement("canvas");
    buffer.width = 1280;
    buffer.height = 720;
    renderProject(buffer, project, preview ? undefined : selected || undefined, guides && !preview)
      .then(() => {
        if (active) canvas.current?.getContext("2d")?.drawImage(buffer, 0, 0);
      })
      .catch(console.error);
    return () => {
      active = false;
    };
  }, [project, selected, guides, preview]);
  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * 1280) / r.width,
      y: ((e.clientY - r.top) * 720) / r.height,
    };
  }
  return (
    <canvas
      ref={canvas}
      width={1280}
      height={720}
      aria-label="Thumbnail editing canvas"
      className={preview ? "preview-canvas" : "editor-canvas"}
      onDoubleClick={() => {
        if (selected && !preview) onEdit(selected);
      }}
      onPointerDown={(e) => {
        if (preview) return;
        const p = point(e),
          ctx = e.currentTarget.getContext("2d")!;
        const current = project.layers.find((l) => l.id === selected && l.visible);
        if (current) {
          const b = layerBox(ctx, current),
            q = localPoint(current, p.x, p.y);
          if (Math.hypot(q.x, q.y + b.height / 2 + 34) < 22) {
            onDragStart();
            drag.current = {
              id: current.id,
              mode: "rotate",
              dx: 0,
              dy: 0,
              x: current.x,
              y: current.y,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
          }
        }
        const hit = [...project.layers].reverse().find((l) => {
          if (!l.visible) return false;
          const q = localPoint(l, p.x, p.y),
            b = layerBox(ctx, l);
          return Math.abs(q.x) < b.width / 2 && Math.abs(q.y) < b.height / 2;
        });
        onSelect(hit?.id || null);
        if (hit) {
          onDragStart();
          drag.current = {
            id: hit.id,
            mode: "move",
            dx: p.x - hit.x,
            dy: p.y - hit.y,
            x: hit.x,
            y: hit.y,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const p = point(e);
        if (d.mode === "move")
          onChange(d.id, {
            x: Math.max(0, Math.min(1280, p.x - d.dx)),
            y: Math.max(0, Math.min(720, p.y - d.dy)),
          });
        else
          onChange(d.id, {
            rotation:
              ((((Math.atan2(p.y - d.y, p.x - d.x) * 180) / Math.PI + 90) % 360) + 360) % 360,
          });
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    />
  );
}
