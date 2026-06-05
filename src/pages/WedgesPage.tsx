import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { wedges } from "../data";
import { CollectionControl } from "../components/CollectionControl";
import { WedgeMeta } from "../components/WedgeMeta";
import { useCollectorContext } from "../context/CollectorContext";
import { SearchFilters } from "../components/SearchFilters";
import { WEDGE_POLARITIES, WEDGE_RARITIES, WEDGE_RARITY_LABELS } from "../constants";
import { filterWedgeList } from "../utils/filters";
import { resolveParentById, wedgeCompatibleWithParent } from "../utils/wedgeCompat";
import {
  wedgeDisplayName,
  wedgeElementLabel,
  wedgeRarityClass,
  wedgeSlotLabel,
} from "../utils/wedges";

const RESTRICTIONS = [
  "Characters",
  "Melee Weapon",
  "Ranged Weapon",
  "Melee Consonance Weapon",
  "Ranged Consonance Weapon",
  "Lumino",
  "Umbro",
  "Hydro",
  "Pyro",
  "Electro",
  "Anemo",
];

function sourceLabel(source: string): string {
  return /^\d+$/.test(source) ? `Lv. ${source}` : source;
}

export function WedgesPage() {
  const { parents, isQueued, isCollected } = useCollectorContext();
  const [parentId, setParentId] = useState(parents[0]?.id ?? "");
  const [compatibleOnly, setCompatibleOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState("");
  const [polarity, setPolarity] = useState("");
  const [restriction, setRestriction] = useState("");
  const [source, setSource] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!parentId && parents[0]) setParentId(parents[0].id);
    if (parentId && !parents.some((p) => p.id === parentId)) {
      setParentId(parents[0]?.id ?? "");
    }
  }, [parents, parentId]);

  const parent = parents.find((p) => p.id === parentId) ?? null;
  const parentInfo = parentId ? resolveParentById(parentId) : null;

  const catalog = useMemo(
    () =>
      filterWedgeList(wedges, {
        search,
        rarity,
        polarity,
        restriction,
        source,
      }),
    [search, rarity, polarity, restriction, source]
  );

  const filtered = useMemo(() => {
    if (!compatibleOnly || !parent) return catalog;
    return catalog.filter((wedge) => wedgeCompatibleWithParent(wedge, parent));
  }, [catalog, compatibleOnly, parent]);

  const selected =
    wedges.find((w) => w.id === selectedId) ??
    filtered.find((w) => w.id === selectedId) ??
    filtered[0] ??
    null;

  const selectedCompatible =
    selected && parent ? wedgeCompatibleWithParent(selected, parent) : false;

  const sources = useMemo(() => {
    const set = new Set<string>();
    wedges.forEach((w) => w.sourceLevel.forEach((s) => set.add(s)));
    return [...set].sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, []);

  return (
    <div className="database-page">
      <header className="page-head">
        <h1>Demon Wedges</h1>
        <p>
          {wedges.length} wedges from Boarhat — browse the full list or filter to what fits
          your selected character or weapon.
        </p>
        <ul className="wedge-rarity-legend" aria-label="Wedge rarity colors">
          {WEDGE_RARITIES.map((r) => (
            <li key={r} className={`wedge-rarity-legend__item wedge-rarity-legend__item--${r.charAt(0)}`}>
              <span className="wedge-rarity-legend__swatch" />
              {WEDGE_RARITY_LABELS[r]}
            </li>
          ))}
        </ul>
      </header>

      {parents.length === 0 ? (
        <div className="collector-empty collector-empty--inline">
          <p>
            Add a character or weapon to collect wedges. You can still browse all{" "}
            {wedges.length} wedges below.
          </p>
          <div className="collector-empty__links">
            <Link to="/characters">Characters</Link>
            <Link to="/weapons">Weapons</Link>
          </div>
        </div>
      ) : (
        <>
          <label className="wedge-parent-picker">
            <span className="wedge-parent-picker__label">Attach to</span>
            <select
              className="wedge-parent-picker__select"
              value={parentId}
              onChange={(e) => {
                setParentId(e.target.value);
                setSelectedId(null);
              }}
            >
              {parents.map((entry) => {
                const info = resolveParentById(entry.id);
                return (
                  <option key={entry.id} value={entry.id}>
                    {info?.kind}: {info?.name}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="wedge-filter-toggle">
            <input
              type="checkbox"
              checked={compatibleOnly}
              onChange={(e) => setCompatibleOnly(e.target.checked)}
            />
            <span>Compatible only{parentInfo ? ` for ${parentInfo.name}` : ""}</span>
          </label>
        </>
      )}

      <p className="wedge-catalog-count">
        Showing {filtered.length} of {wedges.length}
        {compatibleOnly && parentInfo ? ` compatible with ${parentInfo.name}` : ""}
      </p>

      <SearchFilters
        search={search}
        onSearchChange={setSearch}
        placeholder="Search wedges (e.g. Siren Wings Inspo Morale)…"
        filters={[
          {
            key: "rarity",
            label: "Rarity",
            value: rarity,
            options: WEDGE_RARITIES.map((r) => ({ value: r, label: r })),
          },
          {
            key: "polarity",
            label: "Polarity",
            value: polarity,
            options: WEDGE_POLARITIES.map((p) => ({ value: p, label: p })),
          },
          {
            key: "restriction",
            label: "Restriction",
            value: restriction,
            options: RESTRICTIONS.map((r) => ({ value: r, label: r })),
          },
          {
            key: "source",
            label: "Source",
            value: source,
            options: sources.map((s) => ({ value: s, label: sourceLabel(s) })),
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === "rarity") setRarity(value);
          if (key === "polarity") setPolarity(value);
          if (key === "restriction") setRestriction(value);
          if (key === "source") setSource(value);
        }}
      />

      <div className="database-layout">
        <div className="database-grid database-grid--compact">
          {filtered.map((w) => {
            const compatible = parent
              ? wedgeCompatibleWithParent(w, parent)
              : false;
            return (
              <button
                key={w.id}
                type="button"
                className={`db-card db-card--compact db-card--wedge ${wedgeRarityClass(w.rarity)}${selected?.id === w.id ? " db-card--active" : ""}${compatible ? "" : " db-card--muted"}${isCollected("wedge", w.id, parentId) ? " db-card--owned" : isQueued("wedge", w.id, parentId) ? " db-card--queued" : ""}`}
                onClick={() => setSelectedId(w.id)}
              >
                {isCollected("wedge", w.id, parentId) && (
                  <span className="db-card__owned">✓</span>
                )}
                <div className="db-card__media db-card__media--wedge">
                  <img src={w.portrait} alt="" className="db-card__img" loading="lazy" />
                </div>
                <div className="db-card__body">
                  <span className="db-card__name">{wedgeDisplayName(w)}</span>
                  <WedgeMeta
                    slot={wedgeSlotLabel(w)}
                    element={wedgeElementLabel(w)}
                    compact
                  />
                  <span className="db-card__field">T{w.tolerance}</span>
                </div>
              </button>
            );
          })}
        </div>

        {selected && (
          <aside className={`detail-panel detail-panel--wedge ${wedgeRarityClass(selected.rarity)}`}>
            <img src={selected.portrait} alt="" className="detail-panel__hero" />
            <div className="detail-panel__head">
              <h2>{wedgeDisplayName(selected)}</h2>
            </div>
            {parentId ? (
              <>
                {!selectedCompatible && (
                  <p className="collect-control__hint">
                    Not compatible with {parentInfo?.name}. Requires:{" "}
                    {selected.restriction.join(", ")}.
                  </p>
                )}
                <CollectionControl
                  type="wedge"
                  itemId={selected.id}
                  parentId={selectedCompatible ? parentId : undefined}
                />
              </>
            ) : (
              <p className="collect-control__hint">
                Add a character or weapon to your collection before attaching wedges.
              </p>
            )}
            <div className="detail-panel__facts">
              <div className="detail-panel__line">{wedgeSlotLabel(selected)}</div>
              {wedgeElementLabel(selected) && (
                <div className="detail-panel__line">{wedgeElementLabel(selected)}</div>
              )}
              <div className="detail-panel__line">Tolerance {selected.tolerance}</div>
              <div className="detail-panel__line">Track {selected.track}</div>
              {selected.polarity && (
                <div className="detail-panel__line">Polarity {selected.polarity}</div>
              )}
              <div className="detail-panel__line">
                {selected.restriction.join(" · ")}
              </div>
            </div>
            <div className="detail-section">
              <h3>Main Effect</h3>
              <ul>
                {selected.mainEffect.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
            {selected.subEffect.length > 0 && (
              <div className="detail-section">
                <h3>Sub Effect</h3>
                <p>{selected.subEffect.join(" ")}</p>
              </div>
            )}
            <div className="detail-section">
              <h3>Source</h3>
              <p>{selected.sourceLevel.join(", ")}</p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
