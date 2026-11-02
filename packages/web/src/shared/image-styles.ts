export const imageStyles = [
  {
    id: "cartoon",
    label: "Cartoon",
    description: "Bold outlines, expressive shapes and playful colors.",
    prompt:
      "Cartoon illustration with bold clean outlines, expressive shapes, vibrant colors and playful exaggerated details.",
  },
  {
    id: "realistic",
    label: "Realistic",
    description: "Lifelike detail and natural photographic lighting.",
    prompt:
      "Photorealistic photography with lifelike textures, natural lighting, realistic proportions and sharp photographic detail.",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    description: "Dramatic lighting and a movie-like atmosphere.",
    prompt:
      "Cinematic movie still with dramatic lighting, rich color grading, atmospheric depth and high-impact film composition.",
  },
  {
    id: "anime",
    label: "Anime",
    description: "Expressive anime artwork with crisp cel shading.",
    prompt:
      "Anime illustration with crisp linework, expressive forms, cel shading and a richly illustrated background.",
  },
  {
    id: "3d-render",
    label: "3D Render",
    description: "Polished three-dimensional forms and studio lighting.",
    prompt:
      "Polished 3D render with dimensional forms, detailed materials, soft global illumination and vibrant studio lighting.",
  },
  {
    id: "comic-book",
    label: "Comic Book",
    description: "Inked outlines, halftone texture and punchy contrast.",
    prompt:
      "Comic book artwork with strong ink outlines, halftone textures, dynamic composition and punchy high-contrast colors.",
  },
  {
    id: "watercolor",
    label: "Watercolor",
    description: "Soft painted washes and textured paper.",
    prompt:
      "Watercolor painting with soft translucent pigment washes, hand-painted edges, textured paper and delicate color blending.",
  },
  {
    id: "oil-painting",
    label: "Oil Painting",
    description: "Rich paint textures and visible brushstrokes.",
    prompt:
      "Oil painting with rich pigments, visible expressive brushstrokes, layered paint texture and painterly lighting.",
  },
  {
    id: "pixel-art",
    label: "Pixel Art",
    description: "Crisp retro pixels and a limited color palette.",
    prompt:
      "Retro pixel art with crisp deliberately placed pixels, a limited color palette, clean pixel edges and no photographic textures.",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    description: "Neon highlights and a futuristic sci-fi mood.",
    prompt:
      "Cyberpunk visual style with neon highlights, futuristic sci-fi details, moody shadows and electric high-contrast colors.",
  },
] as const;

export type ImageStyleId = (typeof imageStyles)[number]["id"];

export function buildImagePrompt(prompt: string, negative: string, style?: ImageStyleId): string {
  const selected = imageStyles.find((s) => s.id === style);
  return [
    prompt.trim(),
    selected ? `Visual style: ${selected.prompt}` : "",
    negative.trim() ? `Avoid the following: ${negative.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
