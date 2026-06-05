import type { ReactNode } from "react";
import type { SavedGuideEntry } from "../types/savedGuide";
import {
  groupEntriesBySection,
  parseGuideDisplayBlocks,
  sortSectionKeys,
  type GuideDisplayBlock,
} from "../utils/guideDisplay";

function DisplayBlock({ block }: { block: GuideDisplayBlock }) {
  switch (block.type) {
    case "title":
      return <h2 className="guide-doc__title">{block.text}</h2>;
    case "section":
      return <h3 className="guide-doc__section">{block.text}</h3>;
    case "subsection":
      return <h4 className="guide-doc__subsection">{block.text}</h4>;
    case "item":
      return <li className="guide-doc__item">{block.text}</li>;
    case "bold":
      return <p className="guide-doc__bold">{block.text}</p>;
    default:
      return <p className="guide-doc__text">{block.text}</p>;
  }
}

function ImportedEntry({ entry }: { entry: SavedGuideEntry }) {
  return (
    <li className="guide-doc__imported">
      {entry.portrait && (
        <img src={entry.portrait} alt="" className="guide-doc__imported-img" />
      )}
      <div className="guide-doc__imported-body">
        <span className="guide-doc__imported-name">
          {entry.name}
          {entry.quantity > 1 && (
            <span className="guide-doc__imported-qty"> ×{entry.quantity}</span>
          )}
        </span>
        {entry.detail && <span className="guide-doc__imported-detail">{entry.detail}</span>}
        {entry.parentLabel && (
          <span className="guide-doc__imported-parent">Equip on {entry.parentLabel}</span>
        )}
      </div>
    </li>
  );
}

function renderSourceBlocks(blocks: GuideDisplayBlock[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === "item") {
      const items: GuideDisplayBlock[] = [];
      let j = i;
      while (j < blocks.length && blocks[j].type === "item") {
        items.push(blocks[j]);
        j++;
      }
      nodes.push(
        <ul key={`list-${i}`} className="guide-doc__list">
          {items.map((item, k) => (
            <DisplayBlock key={k} block={item} />
          ))}
        </ul>
      );
      i = j - 1;
      continue;
    }
    if (block.type === "quote") {
      const paragraphs: GuideDisplayBlock[] = [];
      let j = i;
      while (j < blocks.length && blocks[j].type === "quote") {
        paragraphs.push(blocks[j]);
        j++;
      }
      nodes.push(
        <div key={`panel-${i}`} className="guide-doc__panel">
          {paragraphs.map((para, k) => (
            <p key={k} className="guide-doc__panel-p">
              {para.text}
            </p>
          ))}
        </div>
      );
      i = j - 1;
      continue;
    }
    nodes.push(<DisplayBlock key={`block-${i}`} block={block} />);
  }
  return nodes;
}

export function GuideDocument({
  sourceText,
  entries,
  showImported = true,
}: {
  sourceText?: string;
  entries: SavedGuideEntry[];
  showImported?: boolean;
}) {
  const blocks = sourceText ? parseGuideDisplayBlocks(sourceText) : [];
  const grouped = groupEntriesBySection(entries);
  const sectionKeys = sortSectionKeys([...grouped.keys()]);

  return (
    <div className="guide-doc">
      {sourceText && (
        <div className="guide-doc__source">
          <p className="guide-doc__source-label">Original guide</p>
          {renderSourceBlocks(blocks)}
        </div>
      )}

      {showImported && entries.length > 0 && (
        <div className="guide-doc__imported-wrap">
          <p className="guide-doc__source-label">Imported to collection</p>
          {sectionKeys.map((section) => (
            <section key={section} className="guide-doc__imported-section">
              <h4 className="guide-doc__subsection">{section}</h4>
              <ul className="guide-doc__imported-list">
                {grouped.get(section)!.map((entry, i) => (
                  <ImportedEntry key={`${entry.name}-${i}`} entry={entry} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
