import type { CSSProperties } from "react";
import { useCollectorContext } from "../context/CollectorContext";
import { DNA_ASSETS } from "../theme/assets";

export function PageBackdrop() {
  const { watermark } = useCollectorContext();

  return (
    <div className="backdrop" aria-hidden="true">
      <div
        className="backdrop__abyss"
        style={{ backgroundImage: `url(${DNA_ASSETS.abyssBackground})` }}
      />
      <div
        className="backdrop__glow"
        style={{ "--page-glow": watermark.glow } as CSSProperties}
      />
      <img
        src={watermark.portrait}
        alt=""
        className="backdrop__wm backdrop__wm--left"
      />
      <img
        src={watermark.portrait}
        alt=""
        className="backdrop__wm backdrop__wm--right backdrop__wm--zoom"
      />
    </div>
  );
}
