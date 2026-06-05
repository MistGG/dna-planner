import { useMemo, useState } from "react";
import { weapons } from "../data";
import { CollectionControl } from "../components/CollectionControl";
import { ElementBadge } from "../components/ElementBadge";
import { useCollectorContext } from "../context/CollectorContext";
import { SearchFilters } from "../components/SearchFilters";
import { ATTACK_TYPES, ELEMENTS, WEAPON_TYPES } from "../constants";
import { filterWeapons } from "../utils/filters";

export function WeaponsPage() {
  const { isQueued, isCollected } = useCollectorContext();
  const [search, setSearch] = useState("");
  const [element, setElement] = useState("");
  const [type, setType] = useState("");
  const [attackType, setAttackType] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterWeapons(weapons, { search, element, type, attackType }),
    [search, element, type, attackType]
  );

  const selected = weapons.find((w) => w.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="database-page">
      <header className="page-head">
        <h1>Weapons</h1>
        <p>{weapons.length} total · tap + Collect to add to your list</p>
      </header>

      <SearchFilters
        search={search}
        onSearchChange={setSearch}
        placeholder="Search weapons…"
        filters={[
          {
            key: "element",
            label: "Element",
            value: element,
            options: ELEMENTS.map((e) => ({ value: e, label: e })),
          },
          {
            key: "type",
            label: "Type",
            value: type,
            options: WEAPON_TYPES.map((t) => ({ value: t, label: t })),
          },
          {
            key: "attackType",
            label: "Attack",
            value: attackType,
            options: ATTACK_TYPES.map((t) => ({ value: t, label: t })),
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === "element") setElement(value);
          if (key === "type") setType(value);
          if (key === "attackType") setAttackType(value);
        }}
      />

      <div className="database-layout">
        <div className="database-grid">
          {filtered.map((w) => (
            <button
              key={w.id}
              type="button"
              className={`db-card${selected?.id === w.id ? " db-card--active" : ""}${isCollected("weapon", w.id) ? " db-card--owned" : isQueued("weapon", w.id) ? " db-card--queued" : ""}`}
              onClick={() => setSelectedId(w.id)}
            >
              {isCollected("weapon", w.id) && (
                <span className="db-card__owned">✓</span>
              )}
              <div className="db-card__media">
                <img src={w.portrait} alt="" className="db-card__img" loading="lazy" />
              </div>
              <div className="db-card__body">
                <span className="db-card__name">{w.name}</span>
                <span className="db-card__field db-card__field--badge">
                  <ElementBadge element={w.element} small />
                </span>
                <span className="db-card__field">{w.type}</span>
                <span className="db-card__field">{w.attackType}</span>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <aside className="detail-panel">
            <img src={selected.portrait} alt="" className="detail-panel__hero" />
            <div className="detail-panel__head">
              <h2>{selected.name}</h2>
            </div>
            <CollectionControl type="weapon" itemId={selected.id} />
            <div className="detail-panel__facts">
              <div className="detail-panel__line">
                <ElementBadge element={selected.element} small />
              </div>
              <div className="detail-panel__line">{selected.type}</div>
              <div className="detail-panel__line">{selected.attackType}</div>
            </div>
            <div className="detail-section">
              <h3>Skill</h3>
              <p className="skill-text">{selected.skill}</p>
            </div>
            <div className="detail-section">
              <h3>Stats</h3>
              <dl className="stat-list">
                {Object.entries(selected.stats).map(([k, v]) => (
                  <span key={k} className="stat-pair">
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </span>
                ))}
              </dl>
            </div>
            {selected.attribute && (
              <div className="detail-section">
                <h3>Attributes</h3>
                <dl className="stat-list">
                  {Object.entries(selected.attribute).map(([k, v]) => (
                    <span key={k} className="stat-pair">
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </span>
                  ))}
                </dl>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
