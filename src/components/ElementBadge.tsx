import type { CSSProperties } from "react";
import { ELEMENT_COLORS } from "../constants";

interface Props {
  element: string;
  small?: boolean;
}

export function ElementBadge({ element, small }: Props) {
  const color = ELEMENT_COLORS[element] ?? "#9ca3af";
  return (
    <span
      className={`element-badge${small ? " element-badge--sm" : ""}`}
      style={{ "--el-color": color } as CSSProperties}
    >
      {element}
    </span>
  );
}
