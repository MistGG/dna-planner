import { ELEMENT_COLORS } from "../constants";

export function WedgeMeta({
  slot,
  element,
  compact,
}: {
  slot: string;
  element?: string;
  compact?: boolean;
}) {
  return (
    <span className={`wedge-meta${compact ? " wedge-meta--compact" : ""}`}>
      <span className="wedge-meta__slot">{slot}</span>
      {element && (
        <span
          className="wedge-meta__element"
          style={{ color: ELEMENT_COLORS[element] ?? "var(--text-soft)" }}
        >
          {element}
        </span>
      )}
    </span>
  );
}
