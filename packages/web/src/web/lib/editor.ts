import type { ImageStyleId } from "../../shared/image-styles";

export const fonts = [
  "Bebas Neue",
  "Anton",
  "Oswald",
  "Barlow Condensed",
  "Teko",
  "Archivo Black",
  "Bangers",
  "Luckiest Guy",
  "Permanent Marker",
  "Russo One",
  "Black Ops One",
  "Righteous",
  "Alfa Slab One",
  "Passion One",
  "Staatliches",
  "Orbitron",
  "Audiowide",
  "Monoton",
  "Fredoka",
  "Lilita One",
  "Creepster",
  "Boogaloo",
  "Saira Condensed",
  "Lobster",
  "Poppins",
];
export type Layer = {
  id: string;
  kind: "text" | "sticker";
  name: string;
  text: string;
  font: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  curve: number;
  skew: number;
  spacing: number;
  color: string;
  stroke: number;
  shadow: boolean;
  visible: boolean;
  src?: string;
};
export type Project = {
  name: string;
  background: string;
  dim: number;
  layers: Layer[];
  imageStyle?: ImageStyleId;
};
export const initialProject: Project = {
  name: "Into the wild",
  background: "/images/alpine.jpg",
  dim: 25,
  layers: [
    {
      id: "text-1",
      kind: "text",
      name: "Text 01",
      text: "OFF THE",
      font: "Bebas Neue",
      x: 346,
      y: 239,
      size: 126,
      rotation: -5,
      curve: 0,
      skew: -5,
      spacing: 3,
      color: "#ffffff",
      stroke: 0,
      shadow: true,
      visible: true,
    },
    {
      id: "text-2",
      kind: "text",
      name: "Text 02",
      text: "GRID",
      font: "Anton",
      x: 350,
      y: 397,
      size: 180,
      rotation: -5,
      curve: 0,
      skew: -5,
      spacing: 2,
      color: "#ff8649",
      stroke: 0,
      shadow: true,
      visible: true,
    },
    {
      id: "text-3",
      kind: "text",
      name: "Text 03",
      text: "48 HOURS IN THE WILD",
      font: "Barlow Condensed",
      x: 335,
      y: 556,
      size: 35,
      rotation: -5,
      curve: 0,
      skew: 0,
      spacing: 4,
      color: "#ffffff",
      stroke: 0,
      shadow: true,
      visible: true,
    },
  ],
};
const svg = (body: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${body}</svg>`)}`;
export const stickers = [
  {
    name: "Curved arrow",
    src: svg(
      '<path d="M16 90Q10 20 91 29L77 13M91 29L72 46" fill="none" stroke="#ff8549" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>',
    ),
  },
  {
    name: "Lightning",
    src: svg(
      '<path d="M70 5L22 69H54L43 115L100 48H67Z" fill="#ffcf47" stroke="#fff2b6" stroke-width="3" stroke-linejoin="round"/>',
    ),
  },
  {
    name: "Star",
    src: svg(
      '<path d="M60 6L75 41L113 45L84 70L93 108L60 88L27 108L36 70L7 45L45 41Z" fill="#ffcf47" stroke="#fff2b6" stroke-width="4" stroke-linejoin="round"/>',
    ),
  },
  {
    name: "Fire",
    src: svg(
      '<path d="M67 4Q80 33 67 45Q91 36 92 25Q125 80 83 106Q34 137 21 88Q11 66 42 35Q33 63 50 67Q71 58 67 4Z" fill="#ff6b30"/><path d="M63 63Q90 98 65 108Q40 116 40 92Q55 80 63 63" fill="#ffdc57"/>',
    ),
  },
  {
    name: "Circle highlight",
    src: svg(
      '<ellipse cx="60" cy="60" rx="50" ry="41" fill="none" stroke="#ff8549" stroke-width="8" transform="rotate(-12 60 60)"/><path d="M13 71Q5 35 45 17" stroke="#ff8549" stroke-width="4" fill="none"/>',
    ),
  },
  {
    name: "Play button",
    src: svg(
      '<rect x="8" y="23" width="104" height="74" rx="22" fill="#f43f43"/><path d="M49 40L82 60L49 80Z" fill="white"/>',
    ),
  },
  {
    name: "WOW!",
    src: svg(
      '<path d="M10 36L27 33L20 10L47 25L60 3L73 25L104 13L97 37L117 51L99 71L111 100L77 96L61 116L43 96L10 106L20 75L2 57Z" fill="#ffce42" stroke="#151515" stroke-width="4"/><text x="60" y="73" text-anchor="middle" font-family="Arial" font-weight="900" font-size="28" fill="#171717">WOW!</text>',
    ),
  },
  {
    name: "Sparkles",
    src: svg(
      '<path d="M60 8Q65 55 105 60Q65 65 60 112Q55 65 15 60Q55 55 60 8Z" fill="white"/><path d="M100 4Q102 17 115 20Q102 23 100 36Q98 23 85 20Q98 17 100 4Z" fill="#ffcf47"/>',
    ),
  },
];

const images = new Map<string, HTMLImageElement>();
export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = images.get(src);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      images.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}
export type Box = { width: number; height: number };
function geometry(ctx: CanvasRenderingContext2D, layer: Layer) {
  ctx.font = `${layer.size}px "${layer.font}"`;
  const glyphs = Array.from(layer.text);
  const widths = glyphs.map((c) => ctx.measureText(c).width);
  const width = widths.reduce((a, b) => a + b, 0) + Math.max(0, glyphs.length - 1) * layer.spacing;
  const angle = (layer.curve * Math.PI) / 180;
  const radius = angle ? Math.max(1, width) / Math.abs(angle) : 0;
  const rise = radius * (1 - Math.cos(Math.abs(angle) / 2));
  return { glyphs, widths, width, angle, radius, rise };
}
export function layerBox(ctx: CanvasRenderingContext2D, layer: Layer): Box {
  if (layer.kind === "sticker") return { width: layer.size, height: layer.size };
  const geo = geometry(ctx, layer);
  return {
    width:
      Math.max(50, geo.width) + Math.abs(Math.tan((layer.skew * Math.PI) / 180)) * layer.size + 26,
    height: layer.size * 1.28 + geo.rise * 2 + 20,
  };
}
export function drawLayer(ctx: CanvasRenderingContext2D, layer: Layer) {
  if (!layer.visible) return;
  ctx.save();
  ctx.translate(layer.x, layer.y);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  if (layer.kind === "sticker") {
    const img = layer.src && images.get(layer.src);
    if (img) ctx.drawImage(img, -layer.size / 2, -layer.size / 2, layer.size, layer.size);
  } else {
    const g = geometry(ctx, layer);
    ctx.transform(1, 0, Math.tan((layer.skew * Math.PI) / 180), 1, 0, 0);
    ctx.fillStyle = layer.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "#101113";
    ctx.lineWidth = layer.stroke;
    ctx.lineJoin = "round";
    if (layer.shadow) {
      ctx.shadowColor = "#000000b0";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;
    }
    let offset = -g.width / 2;
    g.glyphs.forEach((char, i) => {
      const center = offset + g.widths[i] / 2;
      ctx.save();
      if (g.angle) {
        const theta = center / g.radius;
        const sign = Math.sign(g.angle);
        ctx.translate(
          g.radius * Math.sin(theta),
          sign * (g.radius * (1 - Math.cos(theta)) - g.rise / 2),
        );
        ctx.rotate(sign * theta);
      } else ctx.translate(center, 0);
      if (layer.stroke) ctx.strokeText(char, 0, 0);
      ctx.fillText(char, 0, 0);
      ctx.restore();
      offset += g.widths[i] + layer.spacing;
    });
  }
  ctx.restore();
}
export async function renderProject(
  canvas: HTMLCanvasElement,
  project: Project,
  selected?: string,
  guides = false,
) {
  await Promise.all([
    loadImage(project.background),
    ...project.layers.filter((l) => l.src).map((l) => loadImage(l.src!)),
    ...project.layers
      .filter((l) => l.kind === "text")
      .map((l) => document.fonts.load(`${l.size}px "${l.font}"`)),
  ]);
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 1280, 720);
  const background = images.get(project.background)!;
  const scale = Math.max(1280 / background.width, 720 / background.height);
  ctx.drawImage(
    background,
    (1280 - background.width * scale) / 2,
    (720 - background.height * scale) / 2,
    background.width * scale,
    background.height * scale,
  );
  ctx.fillStyle = `rgba(0,0,0,${project.dim / 100})`;
  ctx.fillRect(0, 0, 1280, 720);
  if (guides) {
    ctx.strokeStyle = "#ffffff50";
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    for (const x of [1280 / 3, (1280 * 2) / 3]) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 720);
      ctx.stroke();
    }
    for (const y of [240, 480]) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1280, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  project.layers.forEach((l) => drawLayer(ctx, l));
  const layer = project.layers.find((l) => l.id === selected && l.visible);
  if (layer) {
    const b = layerBox(ctx, layer);
    ctx.save();
    ctx.translate(layer.x, layer.y);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.strokeStyle = "#ff8549";
    ctx.lineWidth = 2;
    ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);
    ctx.fillStyle = "#fff";
    for (const x of [-b.width / 2, b.width / 2])
      for (const y of [-b.height / 2, b.height / 2]) {
        ctx.fillRect(x - 5, y - 5, 10, 10);
        ctx.strokeRect(x - 5, y - 5, 10, 10);
      }
    ctx.beginPath();
    ctx.moveTo(0, -b.height / 2);
    ctx.lineTo(0, -b.height / 2 - 34);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -b.height / 2 - 34, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#ff8549";
    ctx.fill();
    ctx.restore();
  }
}
export function localPoint(layer: Layer, x: number, y: number) {
  const angle = (-layer.rotation * Math.PI) / 180;
  return {
    x: (x - layer.x) * Math.cos(angle) - (y - layer.y) * Math.sin(angle),
    y: (x - layer.x) * Math.sin(angle) + (y - layer.y) * Math.cos(angle),
  };
}
export function downloadFile(data: string, name: string) {
  const a = document.createElement("a");
  a.href = data;
  a.download = name;
  a.click();
}
