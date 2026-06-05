import { useMemo, useState } from "react";
import { characters } from "../data";
import { CollectionControl } from "../components/CollectionControl";
import { ElementBadge } from "../components/ElementBadge";
import { useCollectorContext } from "../context/CollectorContext";
import { SearchFilters } from "../components/SearchFilters";
import { ELEMENTS, WEAPON_TYPES } from "../constants";
import { filterCharacters } from "../utils/filters";
import { getCharacterSplashUrl } from "../utils/characterAssets";

export function CharactersPage() {
  const { isQueued, isCollected } = useCollectorContext();
  const [search, setSearch] = useState("");
  const [element, setElement] = useState("");
  const [role, setRole] = useState("");
  const [proficiency, setProficiency] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterCharacters(characters, { search, element, role, proficiency }),
    [search, element, role, proficiency]
  );

  const selected = characters.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="database-page">
      <header className="page-head">
        <h1>Characters</h1>
        <p>{characters.length} total · tap + Collect to add to your list</p>
      </header>

      <SearchFilters
        search={search}
        onSearchChange={setSearch}
        placeholder="Search characters…"
        filters={[
          {
            key: "element",
            label: "Element",
            value: element,
            options: ELEMENTS.filter((e) => e !== "Neutral").map((e) => ({
              value: e,
              label: e,
            })),
          },
          {
            key: "role",
            label: "Role",
            value: role,
            options: [
              { value: "DPS", label: "DPS" },
              { value: "Support", label: "Support" },
            ],
          },
          {
            key: "proficiency",
            label: "Proficiency",
            value: proficiency,
            options: WEAPON_TYPES.map((t) => ({ value: t, label: t })),
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === "element") setElement(value);
          if (key === "role") setRole(value);
          if (key === "proficiency") setProficiency(value);
        }}
      />

      <div className="database-layout">
        <div className="database-grid">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`db-card${selected?.id === c.id ? " db-card--active" : ""}${isCollected("character", c.id) ? " db-card--owned" : isQueued("character", c.id) ? " db-card--queued" : ""}`}
              onClick={() => setSelectedId(c.id)}
            >
              {isCollected("character", c.id) && (
                <span className="db-card__owned">✓</span>
              )}
              <div className="db-card__media">
                <img
                  src={getCharacterSplashUrl(c.portrait, c.target)}
                  alt=""
                  className="db-card__img db-card__img--splash"
                  loading="lazy"
                />
              </div>
              <div className="db-card__body">
                <span className="db-card__name">{c.name}</span>
                <span className="db-card__field db-card__field--badge">
                  <ElementBadge element={c.element} small />
                </span>
                <span className="db-card__field">{c.role}</span>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <aside className="detail-panel">
            <img
              src={getCharacterSplashUrl(selected.portrait, selected.target)}
              alt=""
              className="detail-panel__hero"
            />
            <div className="detail-panel__head">
              <h2>{selected.name}</h2>
            </div>
            <CollectionControl type="character" itemId={selected.id} />
            <div className="detail-panel__facts">
              <div className="detail-panel__line">
                <ElementBadge element={selected.element} small />
              </div>
              <div className="detail-panel__line">{selected.role}</div>
              <div className="detail-panel__line">
                Farm {selected.tier.Farming || "—"}
              </div>
              <div className="detail-panel__line">
                Boss {selected.tier.Boss || "—"}
              </div>
            </div>
            <div className="detail-section">
              <h3>Proficiency</h3>
              <p>{selected.proficiency.join(", ")}</p>
            </div>
            <div className="detail-section">
              <h3>Features</h3>
              <p>{selected.feature.join(", ")}</p>
            </div>
            {selected.baseStats && (
              <div className="detail-section">
                <h3>Base Stats</h3>
                <dl className="stat-list">
                  <dt>ATK</dt>
                  <dd>{String(selected.baseStats.atk)}</dd>
                  <dt>HP</dt>
                  <dd>{String(selected.baseStats.hp)}</dd>
                  <dt>DEF</dt>
                  <dd>{String(selected.baseStats.def)}</dd>
                  <dt>Sanity</dt>
                  <dd>{String(selected.baseStats.sanity)}</dd>
                </dl>
              </div>
            )}
            {selected.baseWeapon && (
              <div className="detail-section">
                <h3>Signature Weapon — {selected.baseWeapon.name}</h3>
                <p>
                  {selected.baseWeapon.type} · {selected.baseWeapon.attackType}
                </p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
