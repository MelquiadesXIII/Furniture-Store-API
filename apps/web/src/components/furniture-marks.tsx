type MarkProps = { className?: string };

const svgProps = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

export function ChairMark({ className }: MarkProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M12 6 L12 42" />
      <path d="M12 14 L19 14" />
      <path d="M12 26 L36 26" />
      <path d="M36 26 L34 42" />
    </svg>
  );
}

export function TableMark({ className }: MarkProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M8 16 L40 16" />
      <path d="M12 16 L10 40" />
      <path d="M36 16 L38 40" />
    </svg>
  );
}

export function ShelfMark({ className }: MarkProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M10 8 L38 8 L38 40 L10 40 Z" />
      <path d="M10 20 L38 20" />
      <path d="M10 30 L38 30" />
    </svg>
  );
}

export function LampMark({ className }: MarkProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M16 10 L32 10 L28 20 L20 20 Z" />
      <path d="M24 20 L24 42" />
      <path d="M15 42 L33 42" />
    </svg>
  );
}

export const FURNITURE_MARKS = [ChairMark, TableMark, ShelfMark, LampMark];
