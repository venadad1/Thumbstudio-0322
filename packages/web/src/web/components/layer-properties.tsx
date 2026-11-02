import {
  AlignCenter,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  Type,
  Image as ImageIcon,
} from "lucide-react";
import { fonts, type Layer } from "../lib/editor";

export function RangeControl({
  label,
  value,
  min,
  max,
  unit = "",
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="range-control">
      <span>
        {label}
        <output>
          {Math.round(value * 10) / 10}
          {unit}
        </output>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ "--progress": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties}
      />
    </label>
  );
}
export function LayerProperties({
  layer,
  onChange,
  onReset,
  onCenter,
  dim,
  onDim,
}: {
  layer: Layer | undefined;
  onChange: (v: Partial<Layer>) => void;
  onReset: () => void;
  onCenter: () => void;
  dim: number;
  onDim: (n: number) => void;
}) {
  return (
    <aside className="properties-panel">
      <div className="panel-heading">
        <SlidersHorizontal size={16} />
        <h2>Properties</h2>
        <span className="small-chip">
          {layer?.kind === "text" ? "TEXT" : layer ? "STICKER" : "CANVAS"}
        </span>
      </div>
      {!layer ? (
        <div className="properties-content">
          <div className="empty-properties">
            <ImageIcon size={30} />
            <h3>Your canvas, your rules.</h3>
            <p>Click a text or sticker on the canvas to make it your own.</p>
          </div>
          <RangeControl
            label="Background darkness"
            value={dim}
            min={0}
            max={80}
            unit="%"
            onChange={onDim}
          />
        </div>
      ) : (
        <div className="properties-content">
          <div className="selected-layer">
            <span className="layer-icon">
              {layer.kind === "text" ? <Type size={18} /> : <ImageIcon size={18} />}
            </span>
            <div>
              <strong>{layer.name}</strong>
              <small>{layer.kind === "text" ? "Text layer" : "Sticker layer"} selected</small>
            </div>
            <button title="Reset layer style" onClick={onReset}>
              <RotateCcw size={15} />
            </button>
          </div>
          {layer.kind === "text" && (
            <>
              <label className="field-label" htmlFor="layer-font">
                Font family <span>25 fonts</span>
              </label>
              <div className="select-wrap">
                <select
                  id="layer-font"
                  aria-label="Font family"
                  value={layer.font}
                  onChange={(e) => onChange({ font: e.target.value })}
                  style={{ fontFamily: layer.font }}
                >
                  {fonts.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </div>
              <RangeControl
                label="Font size"
                value={layer.size}
                min={12}
                max={300}
                unit=" px"
                onChange={(size) => onChange({ size })}
              />
              <label className="field-label" htmlFor="layer-color">
                Text color
              </label>
              <div className="color-row">
                <label className="color-picker" title="Choose any color">
                  <input
                    id="layer-color"
                    aria-label="Text color"
                    type="color"
                    value={layer.color}
                    onChange={(e) => onChange({ color: e.target.value })}
                  />
                </label>
                <input
                  className="hex-input"
                  aria-label="Hex color"
                  key={layer.id + layer.color}
                  defaultValue={layer.color.toUpperCase()}
                  onBlur={(e) => {
                    if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange({ color: e.target.value });
                    else e.target.value = layer.color.toUpperCase();
                  }}
                />
                <span className="opacity-label">100%</span>
              </div>
              <div className="swatches">
                {[
                  "#ffffff",
                  "#ff8649",
                  "#ffd447",
                  "#f14f59",
                  "#b6e87b",
                  "#7eb5ff",
                  "#c9a0f6",
                  "#121212",
                ].map((color) => (
                  <button
                    key={color}
                    aria-label={`Use ${color} color`}
                    title={color}
                    style={{ background: color }}
                    className={layer.color.toLowerCase() === color ? "active" : ""}
                    onClick={() => onChange({ color })}
                  />
                ))}
              </div>
              <div className="property-divider" />
              <div className="section-label">TEXT SHAPE</div>
              <RangeControl
                label="Curve"
                value={layer.curve}
                min={-180}
                max={180}
                unit="°"
                onChange={(curve) => onChange({ curve })}
              />
              <div className="shape-presets">
                <button onClick={() => onChange({ curve: -180 })} title="Downward semicircle">
                  ⌢
                </button>
                <button onClick={() => onChange({ curve: 0 })} title="Straight text">
                  Aa
                </button>
                <button onClick={() => onChange({ curve: 180 })} title="Upward semicircle">
                  ⌣
                </button>
              </div>
              <RangeControl
                label="Skew / slant"
                value={layer.skew}
                min={-45}
                max={45}
                unit="°"
                onChange={(skew) => onChange({ skew })}
              />
              <RangeControl
                label="Letter spacing"
                value={layer.spacing}
                min={-5}
                max={35}
                unit=" px"
                onChange={(spacing) => onChange({ spacing })}
              />
            </>
          )}
          {layer.kind === "sticker" && (
            <RangeControl
              label="Sticker size"
              value={layer.size}
              min={30}
              max={500}
              unit=" px"
              onChange={(size) => onChange({ size })}
            />
          )}
          <div className="property-divider" />
          <div className="section-label">TRANSFORM</div>
          <RangeControl
            label="Rotation"
            value={layer.rotation}
            min={-360}
            max={360}
            unit="°"
            onChange={(rotation) => onChange({ rotation })}
          />
          <div className="position-controls">
            <label>
              X
              <input
                aria-label="X position"
                type="number"
                min={0}
                max={1280}
                value={Math.round(layer.x)}
                onChange={(e) => onChange({ x: Math.max(0, Math.min(1280, +e.target.value)) })}
              />
            </label>
            <label>
              Y
              <input
                aria-label="Y position"
                type="number"
                min={0}
                max={720}
                value={Math.round(layer.y)}
                onChange={(e) => onChange({ y: Math.max(0, Math.min(720, +e.target.value)) })}
              />
            </label>
            <button title="Center layer" onClick={onCenter}>
              <AlignCenter size={16} />
            </button>
          </div>
          {layer.kind === "text" && (
            <>
              <div className="property-divider" />
              <div className="section-label">FINISHING TOUCHES</div>
              <RangeControl
                label="Outline"
                value={layer.stroke}
                min={0}
                max={16}
                unit=" px"
                onChange={(stroke) => onChange({ stroke })}
              />
              <label className="toggle-label">
                Drop shadow
                <input
                  aria-label="Drop shadow"
                  type="checkbox"
                  checked={layer.shadow}
                  onChange={(e) => onChange({ shadow: e.target.checked })}
                />
                <span className="toggle" />
              </label>
            </>
          )}
          <p className="properties-tip">Drag to move. Use the round handle to rotate freely.</p>
        </div>
      )}
    </aside>
  );
}
