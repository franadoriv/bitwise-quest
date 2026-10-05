import { memo } from "react";
import { COLOR_VARS, spriteRuns, type SpriteName } from "./sprites";

/** SVG group for use inside a parent <svg>. */
export const SpriteG = memo(function SpriteG({ name, scale = 1, flip = false }: { name: SpriteName; scale?: number; flip?: boolean }) {
  const { runs, width } = spriteRuns(name);
  return (
    <g transform={flip ? `translate(${width * scale} 0) scale(${-scale} ${scale})` : `scale(${scale})`}>
      {runs.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={COLOR_VARS[r.c]} />
      ))}
    </g>
  );
});

/** Standalone inline sprite (its own <svg>), sized in CSS pixels. */
export function Sprite({ name, size = 32, flip = false, className, style }: { name: SpriteName; size?: number; flip?: boolean; className?: string; style?: React.CSSProperties }) {
  const { width, height } = spriteRuns(name);
  return (
    <svg
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
      width={size}
      height={(size * height) / width}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      <SpriteG name={name} flip={flip} />
    </svg>
  );
}
