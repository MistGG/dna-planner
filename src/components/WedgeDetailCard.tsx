import type { DemonWedge } from "../types";
import { WedgeMeta } from "./WedgeMeta";
import {
  wedgeDisplayName,
  wedgeElementLabel,
  wedgeRarityClass,
  wedgeSlotLabel,
} from "../utils/wedges";

function sourceLabel(source: string): string {
  return /^\d+$/.test(source) ? `Lv. ${source}` : source;
}

export function WedgeDetailCard({
  wedge,
  className,
}: {
  wedge: DemonWedge;
  className?: string;
}) {
  return (
    <article
      className={`wedge-detail-card ${wedgeRarityClass(wedge.rarity)}${className ? ` ${className}` : ""}`}
    >
      <img src={wedge.portrait} alt="" className="wedge-detail-card__hero" />
      <div className="wedge-detail-card__head">
        <h2 className="wedge-detail-card__title">{wedgeDisplayName(wedge)}</h2>
        <WedgeMeta slot={wedgeSlotLabel(wedge)} element={wedgeElementLabel(wedge)} />
      </div>

      <div className="wedge-detail-card__facts">
        <span>Tolerance {wedge.tolerance}</span>
        <span>Track {wedge.track}</span>
        {wedge.polarity && <span>Polarity {wedge.polarity}</span>}
        {wedge.trammel && <span>Trammel</span>}
      </div>

      <p className="wedge-detail-card__restriction">{wedge.restriction.join(" · ")}</p>

      <section className="wedge-detail-card__section">
        <h3>Main Effect</h3>
        <ul>
          {wedge.mainEffect.map((effect, i) => (
            <li key={i}>{effect}</li>
          ))}
        </ul>
      </section>

      {wedge.subEffect.length > 0 && (
        <section className="wedge-detail-card__section">
          <h3>Sub Effect</h3>
          <p>{wedge.subEffect.join(" ")}</p>
        </section>
      )}

      <section className="wedge-detail-card__section">
        <h3>Source</h3>
        <p>{wedge.sourceLevel.map(sourceLabel).join(", ")}</p>
      </section>
    </article>
  );
}
