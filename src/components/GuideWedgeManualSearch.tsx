import { useMemo, useState } from "react";
import { searchGuideWedgeOptions } from "../utils/guideResolve";
import { WedgeHoverDetail } from "./WedgeHoverDetail";
import { WedgeMeta } from "./WedgeMeta";
import { wedgeRarityClass } from "../utils/wedges";

export function GuideWedgeManualSearch({
  label,
  defaultOpen = false,
  onSelect,
}: {
  label?: string;
  defaultOpen?: boolean;
  onSelect: (wedgeId: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchGuideWedgeOptions(query), [query]);

  if (!open) {
    return (
      <button
        type="button"
        className="guide-import__manual-toggle"
        onClick={() => setOpen(true)}
      >
        {label ?? "Search wedges manually"}
      </button>
    );
  }

  return (
    <div className="guide-import__manual">
      <div className="guide-import__manual-head">
        <span className="guide-import__manual-label">{label ?? "Search wedges"}</span>
        <button
          type="button"
          className="guide-import__manual-close"
          onClick={() => {
            setOpen(false);
            setQuery("");
          }}
        >
          Close
        </button>
      </div>
      <input
        type="search"
        className="guide-import__manual-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name (e.g. Frosty Torrent, Blaze Morale)…"
        autoFocus
      />
      {query.trim() && results.length === 0 && (
        <p className="guide-import__message">No wedges match that search.</p>
      )}
      {results.length > 0 && (
        <div className="guide-import__choices guide-import__choices--manual">
          {results.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`guide-import__choice guide-import__choice--wedge ${wedgeRarityClass(opt.rarity)}`}
              onClick={() => {
                onSelect(opt.id);
                setOpen(false);
                setQuery("");
              }}
            >
              <WedgeHoverDetail wedgeId={opt.id} className="guide-import__choice-img-wrap">
                <img src={opt.portrait} alt="" />
              </WedgeHoverDetail>
              <span>{opt.name}</span>
              {opt.slotLabel && (
                <WedgeMeta slot={opt.slotLabel} element={opt.element} compact />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
