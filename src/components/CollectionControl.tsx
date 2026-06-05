import { useEffect, useState } from "react";
import { useCollectorContext } from "../context/CollectorContext";
import {
  MAX_INTRON,
  MAX_ITEM_COPIES,
  collectionKey,
  defaultTarget,
  normalizeTarget,
  type CollectionType,
} from "../types/collector";

interface Props {
  type: CollectionType;
  itemId: string;
  parentId?: string;
}

export function CollectionControl({ type, itemId, parentId }: Props) {
  const { queue, add, remove, setTarget } = useCollectorContext();
  const id = collectionKey(type, itemId, parentId);
  const entry = queue.find((e) => e.id === id);
  const queued = Boolean(entry);
  const wedgeBlocked = type === "wedge" && !parentId;

  const [target, setLocalTarget] = useState(
    entry?.target ?? defaultTarget(type)
  );

  useEffect(() => {
    setLocalTarget(entry?.target ?? defaultTarget(type));
  }, [entry?.target, type, itemId]);

  function applyTarget(next: number) {
    const value = normalizeTarget(type, next);
    setLocalTarget(value);
    if (queued) setTarget(id, value);
  }

  function handleCollect() {
    if (wedgeBlocked) return;
    add(type, itemId, target, parentId);
  }

  function handleRemove() {
    remove(id);
  }

  return (
    <div className="collect-control">
      {wedgeBlocked && (
        <p className="collect-control__hint">
          Add a character or weapon to your collection first, then pick who this wedge is for.
        </p>
      )}
      {type === "character" ? (
        <div className="collect-control__introns" role="group" aria-label="Intron target">
          {Array.from({ length: MAX_INTRON }, (_, i) => i + 1).map((level) => (
            <button
              key={level}
              type="button"
              className={`collect-control__intron${target === level ? " collect-control__intron--on" : ""}`}
              onClick={() => applyTarget(level)}
              aria-pressed={target === level}
            >
              I{level}
            </button>
          ))}
        </div>
      ) : (
        <div className="collect-control__qty" role="group" aria-label="Copy count">
          <button
            type="button"
            className="collect-control__qty-btn"
            onClick={() => applyTarget(target - 1)}
            disabled={target <= 1}
            aria-label="Fewer copies"
          >
            −
          </button>
          <span className="collect-control__qty-value">{target}</span>
          <button
            type="button"
            className="collect-control__qty-btn"
            onClick={() => applyTarget(target + 1)}
            disabled={target >= MAX_ITEM_COPIES}
            aria-label="More copies"
          >
            +
          </button>
        </div>
      )}

      {queued ? (
        <button
          type="button"
          className="collect-btn collect-btn--active"
          onClick={handleRemove}
          aria-pressed
        >
          On list
        </button>
      ) : (
        <button
          type="button"
          className="collect-btn"
          onClick={handleCollect}
          disabled={wedgeBlocked}
        >
          + Collect
        </button>
      )}
    </div>
  );
}
