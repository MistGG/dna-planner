import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { wedges } from "../data";
import { WedgeDetailCard } from "./WedgeDetailCard";

type Placement = "above" | "below";

function placePopup(rect: DOMRect): { top: number; left: number; placement: Placement } {
  const popupW = 280;
  const popupH = 320;
  let left = rect.left + rect.width / 2;
  left = Math.max(popupW / 2 + 12, Math.min(window.innerWidth - popupW / 2 - 12, left));

  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  const placement: Placement =
    spaceAbove >= popupH + 12 || spaceAbove >= spaceBelow ? "above" : "below";
  const top = placement === "above" ? rect.top - 8 : rect.bottom + 8;

  return { top, left, placement };
}

export function WedgeHoverDetail({
  wedgeId,
  children,
  className,
}: {
  wedgeId: string;
  children: ReactNode;
  className?: string;
}) {
  const wedge = wedges.find((w) => w.id === wedgeId);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: "above" as Placement });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const next = placePopup(el.getBoundingClientRect());
    setCoords(next);
  }, []);

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    updatePosition();
    setOpen(true);
  }, [updatePosition]);

  const scheduleHide = useCallback(() => {
    hideTimer.current = setTimeout(() => setOpen(false), 150);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updatePosition]);

  if (!wedge) {
    return <>{children}</>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={`wedge-hover-trigger${className ? ` ${className}` : ""}`}
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        onFocus={show}
        onBlur={scheduleHide}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <div
            className={`wedge-hover-popup wedge-hover-popup--${coords.placement}`}
            style={{ top: coords.top, left: coords.left }}
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
            role="tooltip"
          >
            <WedgeDetailCard wedge={wedge} />
          </div>,
          document.body
        )}
    </>
  );
}
