import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCollectorContext } from "../context/CollectorContext";
import { MAX_INTRON } from "../types/collector";
import { parseBoarhatBuildUrl } from "../utils/boarhatBuild";
import { parseBuildGuide } from "../utils/parseBuildGuide";
import { GuideWedgeManualSearch } from "../components/GuideWedgeManualSearch";
import {
  canImportGuide,
  guideItemCanUndoChoice,
  guideItemNeedsManualWedgeSearch,
  guideWedgeOption,
  importableGuideCount,
  isGuideItemImportable,
  mergeGuideItemSelection,
  resolveGuideItems,
  type ResolvedGuideItem,
} from "../utils/guideResolve";
import type { ParsedGuide } from "../utils/parseBuildGuide";
import { useSavedGuidesContext } from "../context/SavedGuidesContext";
import { enrichGuideParents } from "../utils/guideWedgeParent";
import { createSavedGuide } from "../utils/savedGuideFromImport";
import { WedgeHoverDetail } from "../components/WedgeHoverDetail";
import { WedgeMeta } from "../components/WedgeMeta";
import { wedgeRarityClass } from "../utils/wedges";

const EXAMPLE = `\`Suyi Guide 1.4\`
\`Weapons:\`
\`Melee - Perpetual Strife/Wanewraith\`
\`Range - Fledgling's Gleam/Embla Inflorescence\`

\`Wedges:\`
\`Character\`
\`3x - Scorch\`
\`1x - Duel\`
\`1x - Prime Morale\`

\`Supports\`
> Best supports are Fina + Fushu. Truffle is an alright substitute for Fina.`;

const BOARHAT_EXAMPLE =
  "https://boarhat.gg/games/duet-night-abyss/tools/build-planner/?build=eJydUrsOwjAM_BfPGeo0aZP-CmJAQSCkwsBDHar-Oz4LIYbGSF3i0118li-ZqdBAPpOjx1VQVHQX1HnlJhp2M12OwoQ-CPUU1Eg9aV3cV4x10adkiDqpJkbLNjeWaHauzNxjc-x7e42j-3_g_m88yRoYjCW5641OzhtFTmy8V263imu2yKJUsoN2RqNcP2he-HMtuifQXr2LBvHhWByXNz5XoLQ";

type ImportMode = "text" | "boarhat";

function withParents(
  items: ResolvedGuideItem[],
  parentOverrides: Map<string, string>
): ResolvedGuideItem[] {
  return enrichGuideParents(items, parentOverrides);
}

export function GuideImportPage() {
  const { addOrMerge } = useCollectorContext();
  const { saveGuide } = useSavedGuidesContext();
  const [mode, setMode] = useState<ImportMode>("text");
  const [text, setText] = useState("");
  const [boarhatUrl, setBoarhatUrl] = useState("");
  const [parsed, setParsed] = useState<ParsedGuide | null>(null);
  const [resolved, setResolved] = useState<ResolvedGuideItem[] | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => new Set());
  const [parentOverrides, setParentOverrides] = useState<Map<string, string>>(
    () => new Map()
  );
  const [imported, setImported] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [manualPickIds, setManualPickIds] = useState<Set<string>>(() => new Set());

  const textPreview = useMemo(
    () => (mode === "text" && text.trim() ? parseBuildGuide(text) : null),
    [mode, text]
  );

  function resetResults() {
    setParsed(null);
    setResolved(null);
    setExcludedIds(new Set());
    setParentOverrides(new Map());
    setImported(false);
    setParseError(null);
    setManualPickIds(new Set());
  }

  function setResolvedWithParents(
    items: ResolvedGuideItem[],
    overrides = parentOverrides
  ) {
    setResolved(withParents(items, overrides));
  }

  function handleParseText() {
    if (!textPreview) return;
    resetResults();
    const charParsed = textPreview.items.find((i) => i.kind === "character");
    let mainId: string | undefined;
    if (charParsed) {
      const charResolved = resolveGuideItems([charParsed])[0];
      mainId = charResolved.selectedId ?? charResolved.options[0]?.id;
    }
    const overrides = new Map<string, string>();
    setParentOverrides(overrides);
    setParsed(textPreview);
    setResolvedWithParents(resolveGuideItems(textPreview.items, mainId), overrides);
  }

  function handleParseBoarhat() {
    resetResults();
    const result = parseBoarhatBuildUrl(boarhatUrl);
    if (!result) {
      setParseError("Could not decode that Boarhat link. Paste the full build-planner URL.");
      return;
    }
    const overrides = new Map<string, string>();
    setParentOverrides(overrides);
    setParsed(result.guide);
    setResolvedWithParents(result.resolved, overrides);
  }

  function toggleExcluded(itemId: string) {
    setExcludedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function applySelection(itemId: string, selectedId: string, fromManual = false) {
    const overrides = new Map(parentOverrides);
    overrides.delete(itemId);
    setParentOverrides(overrides);

    if (fromManual) {
      setManualPickIds((current) => new Set(current).add(itemId));
    } else {
      setManualPickIds((current) => {
        const next = new Set(current);
        next.delete(itemId);
        return next;
      });
    }

    setResolved((current) => {
      if (!current) return current;
      const target = current.find((item) => item.parsed.id === itemId);
      if (!target) return current;

      const option =
        target.options.find((o) => o.id === selectedId) ?? guideWedgeOption(selectedId);
      if (!option) return current;

      const next = current.map((item) =>
        item.parsed.id === itemId ? mergeGuideItemSelection(item, option) : item
      );
      const mainId = next.find((r) => r.parsed.kind === "character")?.selectedId;
      const refreshed = next.map((item) => {
        if (item.parsed.kind !== "wedge") return item;
        if (item.parsed.id === itemId) return item;
        if (item.parsed.wedgeParent !== "main") return item;
        const fresh = resolveGuideItems([item.parsed], mainId)[0];
        if (
          item.selectedId &&
          fresh.options.some((opt) => opt.id === item.selectedId)
        ) {
          return { ...fresh, selectedId: item.selectedId, status: "resolved" as const };
        }
        return fresh;
      });
      return withParents(refreshed, overrides);
    });
  }

  function updateChoice(itemId: string, selectedId: string) {
    applySelection(itemId, selectedId, false);
  }

  function undoChoice(itemId: string) {
    const overrides = new Map(parentOverrides);
    overrides.delete(itemId);
    setParentOverrides(overrides);
    setManualPickIds((current) => {
      const next = new Set(current);
      next.delete(itemId);
      return next;
    });

    setResolved((current) => {
      if (!current) return current;
      const item = current.find((i) => i.parsed.id === itemId);
      if (!item) return current;

      const mainId = current.find((r) => r.parsed.kind === "character")?.selectedId;
      const fresh = resolveGuideItems([item.parsed], mainId)[0];
      const reset: ResolvedGuideItem =
        fresh.options.length > 1
          ? { ...fresh, selectedId: undefined, status: "choice" }
          : fresh.options.length === 1
            ? fresh
            : { ...fresh, selectedId: undefined, status: "unresolved" };

      const next = current.map((i) => (i.parsed.id === itemId ? reset : i));
      return withParents(next, overrides);
    });
  }

  function updateWedgeParent(itemId: string, parentId: string) {
    setParentOverrides((current) => {
      const overrides = new Map(current);
      overrides.set(itemId, parentId);
      setResolved((resolvedCurrent) =>
        resolvedCurrent ? withParents(resolvedCurrent, overrides) : resolvedCurrent
      );
      return overrides;
    });
  }

  function handleImport() {
    if (!resolved || !parsed || !canImportGuide(resolved, excludedIds)) return;

    for (const item of resolved) {
      if (!isGuideItemImportable(item, excludedIds)) continue;

      if (item.parsed.kind === "character" || item.parsed.kind === "support") {
        addOrMerge("character", item.selectedId!, item.parsed.intronTarget);
        continue;
      }

      if (item.parsed.kind === "weapon") {
        addOrMerge("weapon", item.selectedId!, item.parsed.quantity);
        continue;
      }

      if (item.parsed.kind === "wedge" && item.parentId) {
        addOrMerge("wedge", item.selectedId!, item.parsed.quantity, item.parentId);
      }
    }

    saveGuide(
      createSavedGuide({
        title: parsed.title,
        mainCharacter: parsed.mainCharacter,
        source: mode,
        sourceText: mode === "text" ? text : undefined,
        boarhatUrl: mode === "boarhat" ? boarhatUrl : undefined,
        resolved,
        excludedIds,
      })
    );

    setImported(true);
  }

  const ready = resolved ? canImportGuide(resolved, excludedIds) : false;
  const importCount = resolved ? importableGuideCount(resolved, excludedIds) : 0;
  const pendingChoices = resolved?.filter((r) => r.status === "choice").length ?? 0;

  return (
    <div className="guide-import">
      <header className="page-head">
        <h1>Import Build</h1>
        <p>
          Paste a text build guide or import a shared{" "}
          <a
            href="https://boarhat.gg/games/duet-night-abyss/tools/build-planner/"
            target="_blank"
            rel="noreferrer"
          >
            Boarhat.gg build link
          </a>
          . Uncheck anything you do not want before adding to your collection.
        </p>
      </header>

      <div className="guide-import__tabs">
        <button
          type="button"
          className={`guide-import__tab${mode === "text" ? " guide-import__tab--on" : ""}`}
          onClick={() => {
            setMode("text");
            resetResults();
          }}
        >
          Text guide
        </button>
        <button
          type="button"
          className={`guide-import__tab${mode === "boarhat" ? " guide-import__tab--on" : ""}`}
          onClick={() => {
            setMode("boarhat");
            resetResults();
          }}
        >
          Boarhat link
        </button>
      </div>

      {mode === "text" ? (
        <>
          <textarea
            className="guide-import__textarea"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              resetResults();
            }}
            placeholder="Paste your build guide here…"
            rows={14}
          />
          <div className="guide-import__actions">
            <button type="button" className="collect-btn" onClick={() => setText(EXAMPLE)}>
              Load example
            </button>
            <button
              type="button"
              className="collect-btn"
              onClick={handleParseText}
              disabled={!text.trim()}
            >
              Parse guide
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            type="url"
            className="guide-import__url"
            value={boarhatUrl}
            onChange={(e) => {
              setBoarhatUrl(e.target.value);
              resetResults();
            }}
            placeholder="https://boarhat.gg/games/duet-night-abyss/tools/build-planner/?build=…"
          />
          <div className="guide-import__actions">
            <button
              type="button"
              className="collect-btn"
              onClick={() => setBoarhatUrl(BOARHAT_EXAMPLE)}
            >
              Load example
            </button>
            <button
              type="button"
              className="collect-btn"
              onClick={handleParseBoarhat}
              disabled={!boarhatUrl.trim()}
            >
              Import from Boarhat
            </button>
          </div>
        </>
      )}

      {parseError && <p className="guide-import__error">{parseError}</p>}

      {parsed && resolved && (
        <section className="guide-import__results">
          <h2>{parsed.title}</h2>
          {parsed.warnings.length > 0 && (
            <ul className="guide-import__warnings">
              {parsed.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          {pendingChoices > 0 && (
            <p className="guide-import__hint">
              {pendingChoices} choice{pendingChoices === 1 ? "" : "s"} needed before import.
            </p>
          )}

          <ul className="guide-import__list">
            {resolved.map((item) => {
              const excluded = excludedIds.has(item.parsed.id);
              const importable = isGuideItemImportable(item, excludedIds);
              const selectedOpt = item.options.find((o) => o.id === item.selectedId);
              const isWedge = item.parsed.kind === "wedge";
              const wedgeRarity = isWedge ? selectedOpt?.rarity : undefined;

              return (
                <li
                  key={item.parsed.id}
                  className={`guide-import__item guide-import__item--${item.status}${isWedge ? ` guide-import__item--wedge ${wedgeRarityClass(wedgeRarity)}` : ""}${excluded ? " guide-import__item--excluded" : ""}`}
                >
                  <div className="guide-import__item-head">
                    <label className="guide-import__include">
                      <input
                        type="checkbox"
                        checked={!excluded}
                        onChange={() => toggleExcluded(item.parsed.id)}
                        aria-label={`Include ${item.parsed.label}`}
                      />
                    </label>
                    {isWedge && selectedOpt?.portrait && selectedOpt.id && (
                      <WedgeHoverDetail wedgeId={selectedOpt.id} className="guide-import__wedge-img-wrap">
                        <img
                          src={selectedOpt.portrait}
                          alt=""
                          className="guide-import__wedge-img"
                        />
                      </WedgeHoverDetail>
                    )}
                    <div className="guide-import__item-main">
                      <strong className="guide-import__item-name">
                        {selectedOpt?.name ?? item.parsed.label}
                      </strong>
                      <div className="guide-import__item-sub">
                        <span className="guide-import__section">{item.parsed.section}</span>
                        {item.parsed.kind === "character" || item.parsed.kind === "support" ? (
                          <span className="guide-import__meta">Intron I{MAX_INTRON}</span>
                        ) : (
                          <span className="guide-import__meta">Qty ×{item.parsed.quantity}</span>
                        )}
                        {selectedOpt?.slotLabel && (
                          <WedgeMeta
                            slot={selectedOpt.slotLabel}
                            element={selectedOpt.element}
                            compact
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {item.message && <p className="guide-import__message">{item.message}</p>}
                  {item.parsed.note && (
                    <p className="guide-import__message">{item.parsed.note}</p>
                  )}

                  {item.status === "choice" && (
                    <div className="guide-import__choices">
                      {item.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`guide-import__choice${item.parsed.kind === "wedge" ? ` guide-import__choice--wedge ${wedgeRarityClass(opt.rarity)}` : ""}${item.selectedId === opt.id ? " guide-import__choice--on" : ""}`}
                          onClick={() => updateChoice(item.parsed.id, opt.id)}
                        >
                          {item.parsed.kind === "wedge" ? (
                            <WedgeHoverDetail wedgeId={opt.id} className="guide-import__choice-img-wrap">
                              <img src={opt.portrait} alt="" />
                            </WedgeHoverDetail>
                          ) : (
                            <img src={opt.portrait} alt="" />
                          )}
                          <span>{opt.name}</span>
                          {opt.slotLabel ? (
                            <WedgeMeta
                              slot={opt.slotLabel}
                              element={opt.element}
                              compact
                            />
                          ) : (
                            opt.detail && <small>{opt.detail}</small>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {item.status === "resolved" && item.selectedId && (
                    <div className="guide-import__resolved-row">
                      <p className="guide-import__resolved">
                        ✓ {item.options.find((o) => o.id === item.selectedId)?.name ?? "Selected"}
                        {item.options.find((o) => o.id === item.selectedId)?.detail && (
                          <span className="guide-import__meta">
                            {" "}
                            · {item.options.find((o) => o.id === item.selectedId)?.detail}
                          </span>
                        )}
                      </p>
                      {(guideItemCanUndoChoice(item) || manualPickIds.has(item.parsed.id)) && (
                        <button
                          type="button"
                          className="guide-import__undo"
                          onClick={() => undoChoice(item.parsed.id)}
                        >
                          Change choice
                        </button>
                      )}
                    </div>
                  )}

                  {item.parsed.kind === "wedge" && item.parentLabel && item.parentId && (
                    <p className="guide-import__parent">
                      Equip on <strong>{item.parentLabel}</strong>
                    </p>
                  )}

                  {item.parentMessage && (
                    <p className="guide-import__message guide-import__message--warn">
                      {item.parentMessage}
                    </p>
                  )}

                  {item.parentChoices && item.parentChoices.length > 1 && (
                    <div className="guide-import__choices guide-import__choices--parents">
                      <span className="guide-import__parent-label">Assign to:</span>
                      {item.parentChoices.map((parent) => (
                        <button
                          key={parent.id}
                          type="button"
                          className={`guide-import__choice${item.parentId === parent.id ? " guide-import__choice--on" : ""}`}
                          onClick={() => updateWedgeParent(item.parsed.id, parent.id)}
                        >
                          <img src={parent.portrait} alt="" />
                          <span>{parent.name}</span>
                          <small>{parent.element}</small>
                        </button>
                      ))}
                    </div>
                  )}

                  {excluded && (
                    <p className="guide-import__message">Excluded from import</p>
                  )}
                  {!excluded && guideItemNeedsManualWedgeSearch(item, importable, excluded) && (
                    <GuideWedgeManualSearch
                      defaultOpen={item.status === "unresolved"}
                      label={
                        item.status === "unresolved"
                          ? "Search wedges manually"
                          : item.status === "choice"
                            ? "Or search all wedges"
                            : "Search for a different wedge"
                      }
                      onSelect={(wedgeId) => applySelection(item.parsed.id, wedgeId, true)}
                    />
                  )}

                  {!excluded && !importable && item.status !== "choice" && (
                    <p className="guide-import__message guide-import__message--warn">
                      Cannot import — pick a wedge above, uncheck to skip, or assign a parent
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="guide-import__actions">
            <button
              type="button"
              className="collect-btn collect-btn--active"
              onClick={handleImport}
              disabled={!ready}
            >
              Add {importCount} item{importCount === 1 ? "" : "s"} to collection
            </button>
            {imported && (
              <>
                <Link to="/" className="guide-import__done">
                  View collection →
                </Link>
                <Link to="/guides" className="guide-import__done">
                  Saved guide →
                </Link>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
