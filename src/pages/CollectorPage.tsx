import { useState } from "react";
import { Link } from "react-router-dom";
import { useCollectorContext } from "../context/CollectorContext";
import { wedges } from "../data";
import { resolveCollectionItem, typeLabel } from "../utils/collectionItems";
import { WedgeHoverDetail } from "../components/WedgeHoverDetail";
import { queueWedgeRarityClass } from "../utils/wedges";
import type { CollectionEntry } from "../types/collector";

export function CollectorPage() {
  const { groups, stats, toggle, remove, reorder } = useCollectorContext();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDrop(toIndex: number) {
    if (dragIndex === null || dragIndex === toIndex) return;
    reorder(dragIndex, toIndex);
    handleDragEnd();
  }

  return (
    <div className="collector">
      <header className="collector-top">
        <h1>My Collection</h1>
        <p className="collector-top__sub">
          Drag tiles to reorder — wedges stay nested under their character or weapon.{" "}
          <Link to="/board">View expedition board →</Link>
        </p>
        {stats.total > 0 && (
          <div className="collector-progress">
            <div className="collector-progress__bar">
              <div
                className="collector-progress__fill"
                style={{ width: `${stats.pct}%` }}
              />
            </div>
            <span className="collector-progress__text">
              {stats.collected} of {stats.total} collected
              {stats.pending > 0 && ` · ${stats.pending} left`}
            </span>
          </div>
        )}
      </header>

      {groups.length === 0 ? (
        <div className="collector-empty">
          <p>Nothing on your list yet.</p>
          <p className="collector-empty__hint">
            Browse and collect items, or <Link to="/import">import a build guide</Link>.
          </p>
          <div className="collector-empty__links">
            <Link to="/characters">Characters</Link>
            <Link to="/weapons">Weapons</Link>
            <Link to="/import">Import guide</Link>
          </div>
        </div>
      ) : (
        <ul className="queue queue--tiles">
          {groups.map((group, blockIndex) => (
            <li
              key={group.parent.id}
              className={`queue-tile${dragIndex === blockIndex ? " queue-tile--dragging" : ""}${overIndex === blockIndex ? " queue-tile--over" : ""}`}
              draggable
              onDragStart={() => handleDragStart(blockIndex)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(blockIndex);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(blockIndex);
              }}
            >
              <div className="queue-tile__handle" aria-hidden="true">
                ⠿
              </div>
              <div className="queue-group">
                <QueueRow
                  entry={group.parent}
                  index={blockIndex}
                  onToggle={() => toggle(group.parent.id)}
                  onRemove={() => remove(group.parent.id)}
                />
                {group.wedges.length > 0 && (
                  <ul className="queue-sub">
                    {group.wedges.map((wedge) => (
                      <QueueRow
                        key={wedge.id}
                        entry={wedge}
                        nested
                        onToggle={() => toggle(wedge.id)}
                        onRemove={() => remove(wedge.id)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QueueRow({
  entry,
  index,
  nested,
  onToggle,
  onRemove,
}: {
  entry: CollectionEntry;
  index?: number;
  nested?: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const item = resolveCollectionItem(entry);
  if (!item) return null;

  const wedgeRarity =
    entry.type === "wedge"
      ? wedges.find((w) => w.id === entry.itemId)?.rarity
      : undefined;

  const RowTag = nested ? "li" : "div";

  return (
    <RowTag
      className={`queue-row${entry.collected ? " queue-row--done" : ""}${nested ? " queue-row--nested" : ""}${entry.type === "wedge" ? ` queue-row--wedge ${queueWedgeRarityClass(wedgeRarity)}` : ""}`}
    >
      {!nested && (
        <span className="queue-row__num">{index !== undefined ? index + 1 : ""}</span>
      )}

      <label className="queue-row__check" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={entry.collected} onChange={onToggle} />
        <span className="queue-row__check-box" />
      </label>

      {entry.type === "wedge" ? (
        <WedgeHoverDetail wedgeId={entry.itemId} className="queue-row__img-wrap">
          <img src={item.portrait} alt="" className="queue-row__img" loading="lazy" draggable={false} />
        </WedgeHoverDetail>
      ) : (
        <img src={item.portrait} alt="" className="queue-row__img" loading="lazy" draggable={false} />
      )}

      <div className="queue-row__info">
        <span className="queue-row__name">{item.name}</span>
        <span className="queue-row__type">
          {typeLabel(entry.type)}
          {item.subtitle ? ` · ${item.subtitle}` : ""}
        </span>
      </div>

      <button
        type="button"
        className="queue-row__remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Remove"
      >
        ×
      </button>
    </RowTag>
  );
}
