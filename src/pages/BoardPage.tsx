import { useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useCollectorContext } from "../context/CollectorContext";
import { characters } from "../data";
import { getCharacterSplashUrl } from "../utils/characterAssets";
import {
  boardFrontierIndex,
  buildBoardRegions,
  flatBoardSpaces,
  milestonePercents,
} from "../utils/boardGame";
import {
  entryCollectedCount,
  entryIsComplete,
  formatTarget,
} from "../types/collector";
import { boardWedgeRarityClass } from "../utils/wedges";
import type { BoardSpace } from "../utils/boardGame";

function typeGlyph(type: string, isParent: boolean): string {
  if (type === "character") return "✦";
  if (type === "weapon") return "⚔";
  return isParent ? "◆" : "◇";
}

function BoardSpaceCard({
  space,
  isFrontier,
  isDone,
  isFuture,
  pawnPortrait,
  onToggle,
  onToggleCopy,
}: {
  space: BoardSpace;
  isFrontier: boolean;
  isDone: boolean;
  isFuture: boolean;
  pawnPortrait: string | null;
  onToggle: () => void;
  onToggleCopy: (tickIndex: number) => void;
}) {
  const { entry } = space;
  const target = entry.target;
  const collectedCount = entryCollectedCount(entry);
  const multiCopy = target > 1;

  const cardClass = [
    "board-space",
    `board-space--${entry.type}`,
    entry.type === "wedge" ? boardWedgeRarityClass(space.wedgeRarity) : "",
    space.isParent ? "board-space--lead" : "",
    isDone ? "board-space--done" : "",
    isFrontier ? "board-space--frontier" : "",
    isFuture ? "board-space--future" : "",
    multiCopy ? "board-space--multi" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const cardBody = (
    <>
      {isFrontier && pawnPortrait && (
        <img src={pawnPortrait} alt="" className="board-pawn" />
      )}
      <span className="board-space__ring" aria-hidden="true" />
      <img src={space.portrait} alt="" className="board-space__portrait" />
      <span className="board-space__glyph">
        {typeGlyph(entry.type, space.isParent)}
      </span>
      {isDone && <span className="board-space__check">✓</span>}
      <span className="board-space__name">{space.name}</span>
    </>
  );

  return (
    <div className="board-space-stack">
      {multiCopy ? (
        <div
          className={cardClass}
          style={{ "--space-accent": space.accent } as CSSProperties}
          title={`${space.name} (${formatTarget(entry)})`}
        >
          {cardBody}
        </div>
      ) : (
        <button
          type="button"
          className={cardClass}
          style={{ "--space-accent": space.accent } as CSSProperties}
          onClick={onToggle}
          title={`${isDone ? "Collected" : "Mark collected"}: ${space.name}`}
        >
          {cardBody}
        </button>
      )}

      {multiCopy && (
        <div
          className="board-space__ticks"
          role="group"
          aria-label={`${space.name}: ${collectedCount} of ${target} ${entry.type === "character" ? "intron steps" : "copies"}`}
        >
          {Array.from({ length: target }, (_, ti) => {
            const filled = ti < collectedCount;
            const isNext = ti === collectedCount && isFrontier;
            return (
              <button
                key={ti}
                type="button"
                className={`board-space__tick${filled ? " board-space__tick--on" : ""}${isNext ? " board-space__tick--next" : ""}`}
                onClick={() => onToggleCopy(ti)}
                aria-pressed={filled}
                aria-label={
                  entry.type === "character"
                    ? `Intron I${ti + 1}${filled ? " obtained" : ""}`
                    : `Copy ${ti + 1} of ${target}${filled ? " collected" : ""}`
                }
              >
                {filled ? "✓" : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function BoardPage() {
  const { groups, stats, toggle, toggleCopy, watermark } = useCollectorContext();

  const regions = useMemo(() => buildBoardRegions(groups), [groups]);
  const spaces = useMemo(() => flatBoardSpaces(regions), [regions]);
  const frontier = boardFrontierIndex(spaces);
  const complete = stats.total > 0 && stats.collected === stats.total;

  const pawnPortrait = useMemo(() => {
    if (watermark.portrait) return watermark.portrait;
    const lead = groups.find((g) => g.parent.type === "character");
    if (lead) {
      const c = characters.find((x) => x.id === lead.parent.itemId);
      if (c) return getCharacterSplashUrl(c.portrait, c.target);
    }
    return null;
  }, [groups, watermark.portrait]);

  const reachedMilestones = milestonePercents().filter((m) => stats.pct >= m);

  return (
    <div className="board">
      <header className="board__head page-head">
        <h1>Covenant Expedition</h1>
        <p>
          Your collection as a journey through the abyss — conquer each space to advance your
          token toward the gate.
        </p>
      </header>

      {groups.length === 0 ? (
        <div className="board-empty">
          <div className="board-empty__frame">
            <span className="board-empty__start">Camp</span>
            <span className="board-empty__trail">· · · · ·</span>
            <span className="board-empty__gate">Abyss Gate</span>
          </div>
          <p>No expedition planned yet.</p>
          <p className="board-empty__hint">
            Add characters, weapons, and wedges to your list — each becomes a space on the board.
          </p>
          <div className="collector-empty__links">
            <Link to="/import">Import a build</Link>
            <Link to="/characters">Browse characters</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="board-hud">
            <div className="board-dice" aria-hidden="true">
              <span className="board-dice__cube board-dice__cube--a">
                {Math.min(9, Math.floor(stats.collected / 10))}
              </span>
              <span className="board-dice__cube board-dice__cube--b">
                {stats.collected % 10}
              </span>
            </div>
            <div className="board-hud__stats">
              <span className="board-hud__pct">{stats.pct}%</span>
              <span className="board-hud__label">
                {stats.collected} conquered · {stats.pending} ahead · {stats.total} total
              </span>
            </div>
            <div className="board-milestones" aria-label="Milestones">
              {milestonePercents().map((m) => (
                <span
                  key={m}
                  className={`board-milestone${reachedMilestones.includes(m) ? " board-milestone--on" : ""}`}
                >
                  {m}%
                </span>
              ))}
            </div>
          </div>

          <div className="board-frame">
            <div className="board-frame__corner board-frame__corner--tl" aria-hidden="true" />
            <div className="board-frame__corner board-frame__corner--tr" aria-hidden="true" />
            <div className="board-frame__corner board-frame__corner--bl" aria-hidden="true" />
            <div className="board-frame__corner board-frame__corner--br" aria-hidden="true" />

            <div className="board-trail">
              <div
                className={`board-node board-node--camp${frontier === 0 && !complete ? " board-node--frontier" : ""}${stats.collected > 0 ? " board-node--done" : ""}`}
              >
                <span className="board-node__icon">⛺</span>
                <span className="board-node__label">Camp</span>
                {frontier === 0 && !complete && pawnPortrait && (
                  <img src={pawnPortrait} alt="" className="board-pawn" />
                )}
              </div>

              {regions.map((region, ri) => (
                <div key={region.index} className="board-chapter">
                  {ri > 0 && <div className="board-bridge" aria-hidden="true" />}

                  <div className="board-chapter__banner">
                    <span className="board-chapter__num">Chapter {region.index}</span>
                    <h2 className="board-chapter__title">{region.parentName}</h2>
                    <span className="board-chapter__prog">
                      {region.collected}/{region.total}
                    </span>
                  </div>

                  <div className="board-chapter__path">
                    {region.spaces.map((space, si) => {
                      const isFrontier =
                        !complete && space.globalIndex === frontier;
                      const isDone = entryIsComplete(space.entry);
                      const isFuture = space.globalIndex > frontier && !isDone;

                      return (
                        <div key={space.entry.id} className="board-path-segment">
                          {si > 0 && (
                            <span
                              className={`board-connector${isDone ? " board-connector--lit" : ""}`}
                              aria-hidden="true"
                            />
                          )}
                          <BoardSpaceCard
                            space={space}
                            isFrontier={isFrontier}
                            isDone={isDone}
                            isFuture={isFuture}
                            pawnPortrait={pawnPortrait}
                            onToggle={() => toggle(space.entry.id)}
                            onToggleCopy={(ti) => toggleCopy(space.entry.id, ti)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="board-bridge board-bridge--final" aria-hidden="true" />

              <div
                className={`board-node board-node--gate${complete ? " board-node--done board-node--frontier" : ""}`}
              >
                {complete && pawnPortrait && (
                  <img src={pawnPortrait} alt="" className="board-pawn" />
                )}
                <span className="board-node__icon">⛩</span>
                <span className="board-node__label">Abyss Gate</span>
                {complete && <span className="board-node__victory">Victory</span>}
              </div>
            </div>
          </div>

          <p className="board-foot">
            Tap ticks under an item to track each copy — finish all ticks to conquer that space.
            Reorder your list on <Link to="/">Collection</Link> to reshape the expedition.
          </p>
        </>
      )}
    </div>
  );
}
