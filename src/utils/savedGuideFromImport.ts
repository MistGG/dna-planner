import type { SavedBuildGuide, SavedGuideEntry } from "../types/savedGuide";
import type { ResolvedGuideItem } from "./guideResolve";
import { isGuideItemImportable } from "./guideResolve";

export function entriesFromResolved(
  resolved: ResolvedGuideItem[],
  excludedIds?: Set<string>
): SavedGuideEntry[] {
  const entries: SavedGuideEntry[] = [];

  for (const item of resolved) {
    if (!isGuideItemImportable(item, excludedIds)) continue;

    const option = item.options.find((o) => o.id === item.selectedId);
    entries.push({
      section: item.parsed.section,
      kind: item.parsed.kind,
      name: option?.name ?? item.parsed.label,
      quantity:
        item.parsed.kind === "character" || item.parsed.kind === "support"
          ? 1
          : item.parsed.quantity,
      portrait: option?.portrait,
      detail: option?.detail,
      parentLabel: item.parentLabel,
    });
  }

  return entries;
}

export function createSavedGuide(input: {
  title: string;
  mainCharacter: string;
  source: SavedBuildGuide["source"];
  sourceText?: string;
  boarhatUrl?: string;
  resolved: ResolvedGuideItem[];
  excludedIds?: Set<string>;
}): SavedBuildGuide {
  return {
    id: `guide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    mainCharacter: input.mainCharacter,
    source: input.source,
    sourceText: input.sourceText,
    boarhatUrl: input.boarhatUrl,
    importedAt: Date.now(),
    entries: entriesFromResolved(input.resolved, input.excludedIds),
  };
}
