import { useState } from "react";
import { Link } from "react-router-dom";
import { GuideDocument } from "../components/GuideDocument";
import { useSavedGuidesContext } from "../context/SavedGuidesContext";

export function GuidesPage() {
  const { guides, removeGuide } = useSavedGuidesContext();
  const [expandedId, setExpandedId] = useState<string | null>(
    guides[0]?.id ?? null
  );

  return (
    <div className="guides-page">
      <header className="page-head">
        <h1>Build Guides</h1>
        <p>
          Saved guides from your imports — original text and what was added to your collection.
        </p>
      </header>

      {guides.length === 0 ? (
        <div className="guides-empty">
          <p>No saved guides yet.</p>
          <p className="guides-empty__hint">
            Import a build and items will be saved here automatically.
          </p>
          <Link to="/import" className="collect-btn">
            Import a build
          </Link>
        </div>
      ) : (
        <div className="guides-layout">
          <ul className="guides-list">
            {guides.map((guide) => {
              const expanded = expandedId === guide.id;
              const date = new Date(guide.importedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <li
                  key={guide.id}
                  className={`guides-card${expanded ? " guides-card--open" : ""}`}
                >
                  <button
                    type="button"
                    className="guides-card__head"
                    onClick={() => setExpandedId(expanded ? null : guide.id)}
                  >
                    <div>
                      <strong className="guides-card__title">{guide.title}</strong>
                      <span className="guides-card__meta">
                        {guide.mainCharacter} · {guide.entries.length} items · {date}
                      </span>
                    </div>
                    <span className="guides-card__chevron">{expanded ? "▾" : "▸"}</span>
                  </button>

                  {expanded && (
                    <div className="guides-card__body">
                      <GuideDocument
                        sourceText={guide.sourceText}
                        entries={guide.entries}
                      />
                      {guide.boarhatUrl && (
                        <p className="guides-card__link">
                          <a href={guide.boarhatUrl} target="_blank" rel="noreferrer">
                            Open Boarhat build
                          </a>
                        </p>
                      )}
                      <button
                        type="button"
                        className="guides-card__delete"
                        onClick={() => {
                          removeGuide(guide.id);
                          if (expandedId === guide.id) setExpandedId(null);
                        }}
                      >
                        Remove saved guide
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
