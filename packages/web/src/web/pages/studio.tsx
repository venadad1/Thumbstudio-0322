import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Eye,
  EyeOff,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Layers3,
  LoaderCircle,
  Maximize2,
  MousePointer2,
  Plus,
  Redo2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sticker,
  Trash2,
  Type,
  Undo2,
  Upload,
  X,
  WandSparkles,
  Grid2X2,
  Save,
  RotateCw,
} from "lucide-react";
import { ThumbnailCanvas } from "../components/thumbnail-canvas";
import { LayerProperties } from "../components/layer-properties";
import {
  initialProject,
  stickers,
  renderProject,
  downloadFile,
  type Project,
  type Layer,
} from "../lib/editor";
import { useGenerate, useGenerationStatus, useCheckApiConnection } from "../queries/generation";
import { generationErrorMessage } from "../lib/generation-errors";
import { buildImagePrompt, imageStyles, type ImageStyleId } from "../../shared/image-styles";

type Modal = "api" | "help" | "projects" | "preview" | null;
type Scene = { name: string; src: string; tag: string };
const scenes: Scene[] = [
  { name: "Alpine escape", src: "/images/alpine.jpg", tag: "ADVENTURE" },
  { name: "Chasing sunsets", src: "/images/sunset.jpg", tag: "TRAVEL" },
  { name: "Under the stars", src: "/images/snow.jpg", tag: "OUTDOORS" },
];
const clone = (p: Project): Project => structuredClone(p);
function getInitial(): Project {
  try {
    const p = JSON.parse(localStorage.getItem("thumb-studio-draft") || "null");
    if (
      p &&
      typeof p.background === "string" &&
      Array.isArray(p.layers) &&
      p.layers.filter((l: Layer) => l.kind === "text").length === 3 &&
      p.layers.filter((l: Layer) => l.kind === "sticker").length <= 5
    )
      return p;
  } catch {}
  return clone(initialProject);
}

export default function Studio() {
  const [project, setProject] = useState<Project>(getInitial);
  const [selected, setSelected] = useState<string | null>("text-2");
  const [tab, setTab] = useState<"background" | "text" | "stickers">("background");
  const [modal, setModal] = useState<Modal>(null);
  const [prompt, setPrompt] = useState(
    "A cinematic mountain campsite at golden hour, dramatic Himalayan peaks in the background, warm orange light, adventurous atmosphere. Leave space on the left for bold text.",
  );
  const [negative, setNegative] = useState("blurry, low quality, watermark, text, distorted");
  const [key, setKey] = useState("");
  const [keyDraft, setKeyDraft] = useState("");
  const [revealKey, setRevealKey] = useState(false);
  const [task, setTask] = useState("");
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState("");
  const [guides, setGuides] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState<Project[]>([]);
  const [future, setFuture] = useState<Project[]>([]);
  const [saved, setSaved] = useState<Project[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("thumb-studio-projects") || "[]");
    } catch {
      return [];
    }
  });
  const [saveState, setSaveState] = useState("Saved locally");
  const [editText, setEditText] = useState<string | null>(null);
  const clicks = useRef({ count: 0, time: 0 });
  const current = useRef(project);
  current.current = project;
  const upload = useRef<HTMLInputElement>(null);
  const importProject = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generate = useGenerate();
  const checkApi = useCheckApiConnection();
  const status = useGenerationStatus(key, task, generating);
  const layer = project.layers.find((l) => l.id === selected);
  const stickerCount = project.layers.filter((l) => l.kind === "sticker").length;
  const selectedStyle = imageStyles.find((style) => style.id === project.imageStyle);
  const combinedPromptLength = buildImagePrompt(prompt, negative, selectedStyle?.id).length;
  const notify = useCallback((text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  }, []);
  const record = useCallback(() => {
    setHistory((h) => [...h.slice(-59), clone(current.current)]);
    setFuture([]);
  }, []);
  const change = useCallback(
    (transform: (p: Project) => Project, undo = true) => {
      if (undo) record();
      setProject((p) => transform(p));
    },
    [record],
  );
  const updateLayer = useCallback(
    (id: string, values: Partial<Layer>, undo = true) =>
      change(
        (p) => ({ ...p, layers: p.layers.map((l) => (l.id === id ? { ...l, ...values } : l)) }),
        undo,
      ),
    [change],
  );
  function undo() {
    if (!history.length) return;
    setFuture((f) => [clone(project), ...f]);
    setProject(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  }
  function redo() {
    if (!future.length) return;
    setHistory((h) => [...h, clone(project)]);
    setProject(future[0]);
    setFuture((f) => f.slice(1));
  }
  useEffect(() => {
    setSaveState("Saving…");
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("thumb-studio-draft", JSON.stringify(project));
        setSaveState("Saved locally");
      } catch {
        setSaveState("Storage full — export project");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [project]);
  useEffect(() => {
    if (status.data?.state === "success" && status.data.image) {
      change((p) => ({ ...p, background: status.data.image!, dim: 10 }));
      setGenerating(false);
      notify("Your background is ready. Make it yours.");
    }
  }, [status.data, change, notify]);
  useEffect(() => {
    if (status.error) {
      setGenerating(false);
      notify(generationErrorMessage(status.error));
    }
  }, [status.error, notify]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input,textarea,select")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === "Escape") {
        setModal(null);
        setSelected(null);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && layer?.kind === "sticker") {
        e.preventDefault();
        deleteSticker(layer.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  function secretClick() {
    const now = Date.now();
    const c = clicks.current;
    c.count = now - c.time > 2500 ? 1 : c.count + 1;
    c.time = now;
    if (c.count === 7) {
      setKeyDraft(key);
      setModal("api");
      c.count = 0;
    }
  }
  async function startGeneration() {
    if (!key) {
      notify("Connect your Kie.ai key: click “thumbstudio” seven times.");
      return;
    }
    if (!prompt.trim()) {
      notify("Write a prompt for your background first.");
      return;
    }
    if (combinedPromptLength > 1000) {
      notify(
        "Shorten your prompt: prompt, style and negative instructions must fit within 1,000 characters.",
      );
      return;
    }
    setGenerating(true);
    setTask("");
    try {
      // Check the deployment before sending a private key or creating a paid task.
      await checkApi.mutateAsync(undefined);
      const result = await generate.mutateAsync({
        apiKey: key,
        prompt,
        negative,
        style: selectedStyle?.id,
      });
      setTask(result.taskId);
    } catch (e) {
      setGenerating(false);
      notify(generationErrorMessage(e));
    }
  }
  async function exportPNG() {
    try {
      await document.fonts.ready;
      const c = document.createElement("canvas");
      c.width = 1280;
      c.height = 720;
      await renderProject(c, project);
      downloadFile(
        c.toDataURL("image/png"),
        `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "thumbnail"}.png`,
      );
      notify("PNG exported · 1280 × 720");
    } catch {
      notify("Could not export. Check that your image has finished loading.");
    }
  }
  function saveProject() {
    const items = [clone(project), ...saved.filter((p) => p.name !== project.name)].slice(0, 12);
    try {
      localStorage.setItem("thumb-studio-projects", JSON.stringify(items));
      setSaved(items);
      notify("Project saved to this browser.");
    } catch {
      notify("Browser storage is full. Download a project backup instead.");
    }
  }
  function addSticker(src: string, name: string) {
    if (stickerCount >= 5) {
      notify("Five stickers max. Remove one to add another.");
      return;
    }
    const id = crypto.randomUUID();
    change((p) => ({
      ...p,
      layers: [
        ...p.layers,
        {
          ...initialProject.layers[0],
          id,
          kind: "sticker",
          name,
          src,
          text: "",
          size: 150,
          x: 920,
          y: 340,
          rotation: 0,
          curve: 0,
          skew: 0,
          spacing: 0,
        },
      ],
    }));
    setSelected(id);
  }
  function deleteSticker(id: string) {
    change((p) => ({ ...p, layers: p.layers.filter((l) => l.id !== id) }));
    if (selected === id) setSelected(null);
  }
  async function uploadAsset(file: File) {
    if (file.size > 10_000_000) {
      notify("Choose an image smaller than 10 MB.");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      notify("Use a PNG, JPG or WebP image.");
      return;
    }
    const data = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(file);
    });
    if (tab === "stickers") addSticker(data, file.name.replace(/\.[^.]+$/, ""));
    else {
      change((p) => ({ ...p, background: data, dim: 0 }));
      notify("Background uploaded.");
    }
  }
  function resetLayer() {
    if (!layer) return;
    const defaults = initialProject.layers.find((l) => l.id === layer.id);
    if (defaults) updateLayer(layer.id, { ...defaults, text: layer.text });
    else updateLayer(layer.id, { rotation: 0, size: 150, x: 920, y: 340 });
  }
  function chooseScene(scene: Scene) {
    change((p) => ({ ...p, background: scene.src, dim: 25 }));
    notify(`${scene.name} example loaded.`);
  }
  function selectLayer(id: string | null) {
    setSelected(id);
  }
  const busy = generating || generate.isPending;

  return (
    <div className="studio-app">
      <header className="topbar">
        <button className="brand" onClick={secretClick} title="Thumb Studio">
          <span className="brand-mark">
            <Film size={20} />
          </span>
          <span>
            thumb<span className="brand-light">studio</span>
            <i />
          </span>
        </button>
        <span className="header-divider" />
        <div className="project-breadcrumb">
          <span>Workspace</span>
          <span>/</span>
          <input
            aria-label="Project name"
            value={project.name}
            maxLength={50}
            onChange={(e) => change((p) => ({ ...p, name: e.target.value }))}
          />
          <ChevronDown size={13} />
        </div>
        <div className="header-right">
          <span className="save-status">
            <span />
            {saveState}
          </span>
          <button className="icon-button" onClick={() => setModal("help")} title="Help">
            <CircleHelp size={19} />
          </button>
          <button className="avatar" onClick={() => setModal("projects")} title="My projects">
            TS
          </button>
        </div>
      </header>
      <div className="app-body">
        <nav className="navigation-rail">
          <button
            className="rail-item active"
            onClick={() => {
              setTab("background");
              setModal(null);
            }}
            title="Editor"
          >
            <SlidersHorizontal size={21} />
            <span>Editor</span>
          </button>
          <button className="rail-item" onClick={() => setModal("projects")} title="Projects">
            <FolderOpen size={21} />
            <span>Projects</span>
          </button>
          <button
            className="rail-item"
            onClick={() => {
              setTab("text");
              setSelected("text-1");
            }}
            title="Text layers"
          >
            <Type size={21} />
            <span>Text</span>
          </button>
          <button className="rail-item" onClick={() => setTab("stickers")} title="Stickers">
            <Sticker size={21} />
            <span>Stickers</span>
          </button>
          <div className="rail-bottom">
            <button className="rail-item" onClick={() => setModal("help")}>
              <CircleHelp size={21} />
              <span>Help</span>
            </button>
            <div className="rail-monogram">ts.</div>
          </div>
        </nav>
        <aside className="creation-panel">
          <div className="creation-title">
            <h1>Make them click.</h1>
            <p>Big ideas. Scroll-stopping thumbnails.</p>
          </div>
          <div className="creation-tabs">
            {(
              [
                { id: "background", icon: Sparkles, label: "Generate" },
                { id: "text", icon: Type, label: "Text" },
                { id: "stickers", icon: Sticker, label: "Stickers" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                className={tab === t.id ? "active" : ""}
                onClick={() => setTab(t.id)}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </div>
          <div className="creation-scroll">
            {tab === "background" && (
              <>
                <div className="section-heading">
                  <span>AI BACKGROUND</span>
                  <span className="model-badge">
                    <span />
                    Z-Image
                  </span>
                </div>
                <label className="field-label" htmlFor="image-style">
                  Image style<span>10 styles</span>
                </label>
                <div className="select-wrap image-style-select">
                  <select
                    id="image-style"
                    aria-label="Image style"
                    value={selectedStyle?.id || ""}
                    disabled={busy}
                    onChange={(e) =>
                      change((p) => ({
                        ...p,
                        imageStyle: e.target.value ? (e.target.value as ImageStyleId) : undefined,
                      }))
                    }
                  >
                    <option value="">Use prompt only</option>
                    {imageStyles.map((style) => (
                      <option key={style.id} value={style.id}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} />
                </div>
                <p className="image-style-description">
                  {selectedStyle?.description ||
                    "Choose a look for your next generated background."}
                </p>
                <label className="field-label" htmlFor="prompt">
                  Your imagination, in words
                  <Sparkles size={13} />
                </label>
                <div className="prompt-box">
                  <textarea
                    id="prompt"
                    aria-label="Background prompt"
                    value={prompt}
                    maxLength={1000}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your perfect thumbnail background…"
                  />
                  <div className="textarea-footer">
                    <span>Includes style & exclusions.</span>
                    <span className={combinedPromptLength > 1000 ? "prompt-limit-warning" : ""}>
                      {combinedPromptLength}/1000
                    </span>
                  </div>
                </div>
                <label className="field-label negative-label" htmlFor="negative">
                  Negative prompt<span>Optional</span>
                </label>
                <textarea
                  id="negative"
                  aria-label="Negative prompt"
                  className="negative-input"
                  value={negative}
                  maxLength={500}
                  onChange={(e) => setNegative(e.target.value)}
                  placeholder="What should we leave out?"
                />
                <p className="negative-note">
                  Added as “avoid” instructions. Z-Image has no separate negative-prompt parameter.
                </p>
                <div className="format-row">
                  <span>
                    <ImageIcon size={16} />
                    YouTube thumbnail
                  </span>
                  <strong>16:9</strong>
                </div>
                <button
                  className="primary-button generate-button"
                  disabled={busy}
                  onClick={startGeneration}
                >
                  {busy ? <LoaderCircle className="spin" size={17} /> : <WandSparkles size={17} />}{" "}
                  {busy ? "Creating your background…" : "Generate background"}
                  {!busy && <ArrowRight size={16} />}
                </button>
                <div className="generation-meta">
                  <span>Powered by Kie.ai</span>
                  <span className={key ? "key-ready" : ""}>
                    <span />
                    {key ? "API connected" : "API not connected"}
                  </span>
                </div>
                {task && !generating && status.error && (
                  <button
                    className="subtle-button"
                    onClick={() => {
                      setGenerating(true);
                      status.refetch();
                    }}
                  >
                    Retry checking generated image
                  </button>
                )}
                <div className="or-divider">
                  <span />
                  or start with your own
                  <span />
                </div>
                <button className="upload-button" onClick={() => upload.current?.click()}>
                  <Upload size={16} />
                  Upload background<span>PNG, JPG, WebP</span>
                </button>
                <div className="panel-divider" />
              </>
            )}
            {tab === "text" && (
              <div className="tab-intro">
                <h3>Say it loud.</h3>
                <p>
                  Three text layers. Endless possibilities.
                  <br />
                  Select a layer to fine-tune its style.
                </p>
              </div>
            )}
            {tab !== "stickers" && (
              <>
                <div className="section-heading text-section">
                  <span>TEXT LAYERS</span>
                  <span>3 / 3</span>
                </div>
                <div className="text-layer-list">
                  {project.layers
                    .filter((l) => l.kind === "text")
                    .map((l, i) => (
                      <div
                        key={l.id}
                        className={`text-layer ${selected === l.id ? "selected" : ""}`}
                      >
                        <div className="text-layer-top">
                          <span className="text-slot">
                            T<span>{i + 1}</span>
                          </span>
                          <button className="select-layer-button" onClick={() => setSelected(l.id)}>
                            {l.name}
                          </button>
                          <button
                            title={l.visible ? "Hide text" : "Show text"}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateLayer(l.id, { visible: !l.visible });
                            }}
                          >
                            {l.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                        </div>
                        <input
                          id={`input-${l.id}`}
                          aria-label={l.name}
                          value={l.text}
                          maxLength={100}
                          onFocus={() => setSelected(l.id)}
                          onChange={(e) => updateLayer(l.id, { text: e.target.value })}
                          placeholder={`Type text ${i + 1}…`}
                        />
                        <div className="text-layer-footer">
                          <span>{l.font}</span>
                          <span className="tiny-color" style={{ background: l.color }} />
                        </div>
                      </div>
                    ))}
                </div>
                <p className="mini-hint">
                  <MousePointer2 size={13} />
                  Click text on the canvas to edit & move.
                </p>
              </>
            )}
            {tab === "stickers" && (
              <>
                <div className="tab-intro">
                  <h3>A little extra personality.</h3>
                  <p>
                    Click to add, drag to place. Up to five
                    <br />
                    stickers on your canvas.
                  </p>
                </div>
                <div className="section-heading">
                  <span>STICKER LIBRARY</span>
                  <span>{stickerCount} / 5</span>
                </div>
                <div className="sticker-library">
                  {stickers.map((s) => (
                    <button
                      key={s.name}
                      title={`Add ${s.name}`}
                      aria-label={`Add ${s.name}`}
                      disabled={stickerCount >= 5}
                      onClick={() => addSticker(s.src, s.name)}
                    >
                      <img src={s.src} alt={s.name} />
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="upload-button"
                  disabled={stickerCount >= 5}
                  onClick={() => upload.current?.click()}
                >
                  <Upload size={16} />
                  Upload a sticker<span>Transparent PNG works best</span>
                </button>
              </>
            )}
            {stickerCount > 0 && (
              <>
                <div className="section-heading sticker-layer-heading">
                  <span>STICKER LAYERS</span>
                  <span>{stickerCount} / 5</span>
                </div>
                {project.layers
                  .filter((l) => l.kind === "sticker")
                  .map((l) => (
                    <div
                      key={l.id}
                      className={`sticker-layer ${selected === l.id ? "selected" : ""}`}
                    >
                      <img src={l.src} alt="" />
                      <button className="select-layer-button" onClick={() => setSelected(l.id)}>
                        {l.name}
                      </button>
                      <button
                        title="Remove sticker"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSticker(l.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
              </>
            )}
          </div>
          <div className="creation-bottom">
            <ShieldCheck size={14} />
            <span>Your ideas stay yours.</span>
            <span className="version">v1.0</span>
          </div>
        </aside>
        <main className="workspace">
          <div className="workspace-heading">
            <div>
              <div className="eyebrow">THE CREATIVE WORKSPACE</div>
              <h2>
                A thumbnail worth a thousand clicks<span>.</span>
              </h2>
            </div>
            <button className="save-project-button" onClick={saveProject} title="Save project">
              <Save size={15} />
              <span>Save project</span>
            </button>
          </div>
          <div className="canvas-toolbar">
            <div className="canvas-label">
              <span className="canvas-dot" />
              Canvas<span className="canvas-dimensions">1280 × 720</span>
            </div>
            <div className="canvas-actions">
              <button title="Undo (Ctrl+Z)" disabled={!history.length} onClick={undo}>
                <Undo2 size={17} />
              </button>
              <button title="Redo (Ctrl+Shift+Z)" disabled={!future.length} onClick={redo}>
                <Redo2 size={17} />
              </button>
              <span className="toolbar-divider" />
              <button
                className={guides ? "active" : ""}
                title="Toggle composition guides"
                onClick={() => setGuides(!guides)}
              >
                <Grid2X2 size={17} />
              </button>
              <button title="Preview thumbnail" onClick={() => setModal("preview")}>
                <Maximize2 size={17} />
              </button>
              <span className="toolbar-divider" />
              <select
                aria-label="Canvas zoom"
                value={zoom}
                onChange={(e) => setZoom(+e.target.value)}
              >
                <option value={100}>Fit</option>
                <option value={75}>75%</option>
                <option value={50}>50%</option>
                <option value={125}>125%</option>
              </select>
            </div>
          </div>
          <div className="canvas-stage">
            <div className="canvas-container" style={{ width: `${zoom}%` }}>
              <ThumbnailCanvas
                project={project}
                selected={selected}
                onSelect={selectLayer}
                onChange={(id, v) => updateLayer(id, v, false)}
                onDragStart={record}
                guides={guides}
                preview={false}
                onEdit={(id) => {
                  if (project.layers.find((l) => l.id === id)?.kind === "text") setEditText(id);
                }}
              />
              {busy && (
                <div className="generating-overlay">
                  <div className="generating-orb">
                    <Sparkles size={26} />
                  </div>
                  <h3>Bringing your idea to life.</h3>
                  <p>
                    {status.data?.state === "generating"
                      ? "Z-Image is creating your background…"
                      : "Your image is in the generation queue…"}
                  </p>
                  <button
                    onClick={() => {
                      setGenerating(false);
                      notify(
                        "Stopped checking. The Kie.ai task may still finish and consume credits.",
                      );
                    }}
                  >
                    Stop checking
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="canvas-caption">
            <span>
              <MousePointer2 size={13} />
              {layer
                ? `Drag ${layer.name.toLowerCase()} to position it`
                : "Select any layer to get started"}
              <span className="caption-dot">·</span>
              <RotateCw size={13} />
              Rotate with the round handle
            </span>
            <span className="aspect-badge">16:9</span>
          </div>
          <div className="workspace-bottom">
            <div className="preview-tip">
              <span className="tip-icon">
                <Eye size={18} />
              </span>
              <div>
                <strong>Small screen. Big impact.</strong>
                <p>Check how your thumbnail looks before the world sees it.</p>
              </div>
              <button onClick={() => setModal("preview")}>
                Preview
                <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="scene-heading">
              <div>
                <h3>A little inspiration to get you started</h3>
                <p>Example backgrounds. Pick one and make it your own.</p>
              </div>
              <span>STARTER SCENES</span>
            </div>
            <div className="scene-grid">
              {scenes.map((s) => (
                <button
                  key={s.name}
                  className={project.background === s.src ? "selected" : ""}
                  onClick={() => chooseScene(s)}
                >
                  <img src={s.src} alt={s.name} />
                  <div>
                    <small>{s.tag}</small>
                    <strong>{s.name}</strong>
                  </div>
                  <span className="scene-arrow">
                    {project.background === s.src ? (
                      <Check size={15} />
                    ) : (
                      <ArrowUpRight size={15} />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <footer className="workspace-footer">
            <span>
              <Layers3 size={13} />
              {project.layers.filter((l) => l.visible).length} visible layers<span>·</span>PNG
              export, full quality
            </span>
            <button className="primary-button" onClick={exportPNG}>
              <ArrowDownToLine size={16} />
              Export thumbnail
              <ArrowUpRight size={15} />
            </button>
          </footer>
        </main>
        <LayerProperties
          layer={layer}
          onChange={(v) => layer && updateLayer(layer.id, v)}
          onReset={resetLayer}
          onCenter={() => layer && updateLayer(layer.id, { x: 640, y: 360 })}
          dim={project.dim}
          onDim={(dim) => change((p) => ({ ...p, dim }))}
        />
      </div>
      <input
        type="file"
        ref={upload}
        aria-label="Upload image"
        hidden
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadAsset(f);
          e.target.value = "";
        }}
      />
      <input
        type="file"
        ref={importProject}
        aria-label="Import project"
        hidden
        accept="application/json,.json"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            const p = JSON.parse(await f.text());
            if (
              !Array.isArray(p.layers) ||
              p.layers.filter((l: Layer) => l.kind === "text").length !== 3 ||
              p.layers.filter((l: Layer) => l.kind === "sticker").length > 5 ||
              typeof p.background !== "string"
            )
              throw new Error();
            change(() => p);
            setModal(null);
            notify("Project imported.");
          } catch {
            notify("This is not a valid Thumb Studio project.");
          }
          e.target.value = "";
        }}
      />
      {toast && (
        <output className="toast">
          <span className="toast-dot" />
          {toast}
          <button onClick={() => setToast("")} aria-label="Dismiss notification">
            <X size={14} />
          </button>
        </output>
      )}
      {editText && (
        <div className="modal-backdrop">
          <dialog open className="modal text-edit-modal" aria-label="Edit text">
            <button
              className="modal-close"
              aria-label="Close text editor"
              onClick={() => setEditText(null)}
            >
              <X size={18} />
            </button>
            <Type size={24} className="accent-icon" />
            <h2>Edit your text</h2>
            <input
              aria-label="Canvas text editor"
              value={project.layers.find((l) => l.id === editText)?.text || ""}
              maxLength={100}
              onChange={(e) => updateLayer(editText, { text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditText(null);
              }}
            />
            <button className="primary-button" onClick={() => setEditText(null)}>
              Done
              <Check size={16} />
            </button>
          </dialog>
        </div>
      )}
      {modal && (
        <div className={`modal-backdrop ${modal === "preview" ? "preview-backdrop" : ""}`}>
          <dialog
            open
            className={`modal ${modal === "preview" ? "preview-modal" : ""} ${modal === "projects" ? "projects-modal" : ""}`}
            aria-modal="true"
            aria-label={
              modal === "api"
                ? "API settings"
                : modal === "preview"
                  ? "Thumbnail preview"
                  : modal === "projects"
                    ? "My projects"
                    : "Help"
            }
          >
            <button
              className="modal-close"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={19} />
            </button>
            {modal === "api" && (
              <>
                <div className="modal-symbol">
                  <ShieldCheck size={25} />
                </div>
                <span className="eyebrow">PRIVATE CONNECTION</span>
                <h2>Connect your creative engine.</h2>
                <p>
                  Use your Kie.ai API key to generate backgrounds with Z-Image. Generation uses
                  credits from your Kie.ai account.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (keyDraft.trim().length < 8) {
                      notify("Enter a valid Kie.ai API key.");
                      return;
                    }
                    setKey(keyDraft.trim());
                    setKeyDraft("");
                    setModal(null);
                    notify("API key set for this session. It will be checked when you generate.");
                  }}
                >
                  <label className="field-label" htmlFor="api-key">
                    Kie.ai API key
                  </label>
                  <div className="secret-input">
                    <input
                      id="api-key"
                      aria-label="Kie.ai API key"
                      type={revealKey ? "text" : "password"}
                      autoComplete="off"
                      value={keyDraft}
                      onChange={(e) => setKeyDraft(e.target.value)}
                      placeholder="Paste your API key"
                    />
                    <button
                      type="button"
                      aria-label="Toggle API key visibility"
                      onClick={() => setRevealKey(!revealKey)}
                    >
                      {revealKey ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <div className="key-security">
                    <ShieldCheck size={16} />
                    <span>
                      Your key stays in memory for this session. It is sent only to this app's
                      server and Kie.ai, never saved in projects.
                    </span>
                  </div>
                  <button className="primary-button" type="submit">
                    Save connection
                    <ArrowRight size={16} />
                  </button>
                </form>
                {key && (
                  <button
                    className="disconnect-button"
                    onClick={() => {
                      setKey("");
                      setKeyDraft("");
                      setGenerating(false);
                      setTask("");
                      setModal(null);
                      notify("API key removed from this session.");
                    }}
                  >
                    Disconnect API key
                  </button>
                )}
                <a
                  className="external-link"
                  href="https://kie.ai/api-key"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get a key from Kie.ai
                  <ArrowUpRight size={14} />
                </a>
              </>
            )}
            {modal === "help" && (
              <>
                <div className="modal-symbol">
                  <CircleHelp size={25} />
                </div>
                <h2>A quick guide to big clicks.</h2>
                <div className="help-list">
                  <div>
                    <Sparkles size={20} />
                    <p>
                      <strong>Start with a background</strong>Write a prompt, upload an image, or
                      use a starter scene. Click the <b>thumbstudio</b> title seven times to enter
                      your Kie.ai API key.
                    </p>
                  </div>
                  <div>
                    <Type size={20} />
                    <p>
                      <strong>Add your headline</strong>Edit the three text fields or double-click
                      text on the canvas. Each layer has its own font, color, curve, slant and
                      spacing.
                    </p>
                  </div>
                  <div>
                    <MousePointer2 size={20} />
                    <p>
                      <strong>Make it yours</strong>Drag text and stickers anywhere. Drag the round
                      handle to rotate, or use the rotation slider for precision. Add up to five
                      stickers.
                    </p>
                  </div>
                  <div>
                    <ArrowDownToLine size={20} />
                    <p>
                      <strong>Ready for YouTube</strong>Preview at a small size and export a clean
                      1280 × 720 PNG. Projects save locally, without your API key. Ctrl+Z undoes
                      changes.
                    </p>
                  </div>
                </div>
                <button className="primary-button" onClick={() => setModal(null)}>
                  Let's create
                  <ArrowRight size={16} />
                </button>
              </>
            )}
            {modal === "projects" && (
              <>
                <div className="modal-symbol">
                  <FolderOpen size={25} />
                </div>
                <h2>Your creative collection.</h2>
                <p>
                  Projects are saved only in this browser. Download a backup to take your work with
                  you.
                </p>
                <div className="project-options">
                  <button
                    className="primary-button"
                    onClick={() => {
                      saveProject();
                    }}
                  >
                    <Save size={16} />
                    Save current project
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() =>
                      downloadFile(
                        `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(project))}`,
                        `${project.name || "thumbnail"}.json`,
                      )
                    }
                  >
                    <ArrowDownToLine size={16} />
                    Backup JSON
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => importProject.current?.click()}
                  >
                    <Upload size={16} />
                    Import
                  </button>
                </div>
                <div className="saved-project-list">
                  {saved.length ? (
                    saved.map((p, i) => (
                      <button
                        key={`${p.name}-${i}`}
                        onClick={() => {
                          change(() => clone(p));
                          setSelected("text-2");
                          setModal(null);
                          notify("Project opened.");
                        }}
                      >
                        <img src={p.background} alt="" />
                        <div>
                          <strong>{p.name}</strong>
                          <span>{p.layers.length} layers · 1280 × 720</span>
                        </div>
                        <ArrowRight size={17} />
                      </button>
                    ))
                  ) : (
                    <div className="empty-projects">
                      <FolderOpen size={30} />
                      <h3>Your next great thumbnail starts here.</h3>
                      <p>Save a project and it will appear in this collection.</p>
                    </div>
                  )}
                </div>
                <button
                  className="subtle-button"
                  onClick={() => {
                    change(() => clone(initialProject));
                    setSelected("text-2");
                    setModal(null);
                    notify("New project started. Previous edits are available with Undo.");
                  }}
                >
                  <Plus size={15} />
                  New project
                </button>
              </>
            )}
            {modal === "preview" && (
              <>
                <span className="eyebrow">THE SCROLL TEST</span>
                <h2>Does it make you stop?</h2>
                <p>Your thumbnail, without the editor. Check the headline at a glance.</p>
                <div className="full-preview">
                  <ThumbnailCanvas
                    project={project}
                    selected={null}
                    onSelect={() => {}}
                    onChange={() => {}}
                    onDragStart={() => {}}
                    guides={false}
                    preview
                    onEdit={() => {}}
                  />
                </div>
                <div className="youtube-preview">
                  <div className="mini-thumbnail">
                    <ThumbnailCanvas
                      project={project}
                      selected={null}
                      onSelect={() => {}}
                      onChange={() => {}}
                      onDragStart={() => {}}
                      guides={false}
                      preview
                      onEdit={() => {}}
                    />
                    <span>12:48</span>
                  </div>
                  <div>
                    <h3>{project.name || "Your video title"}</h3>
                    <p>Your channel · Thumbnail size preview</p>
                  </div>
                </div>
                <button className="primary-button" onClick={exportPNG}>
                  <ArrowDownToLine size={16} />
                  Export thumbnail
                </button>
              </>
            )}
          </dialog>
        </div>
      )}
    </div>
  );
}
