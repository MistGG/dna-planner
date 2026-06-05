import type { CollectionEntry } from "../types/collector";

export interface QueueGroup {
  parent: CollectionEntry;
  wedges: CollectionEntry[];
}

export function isTopLevelEntry(entry: CollectionEntry): boolean {
  return entry.type === "character" || entry.type === "weapon";
}

/** Walk the flat queue into parent groups (skips orphaned wedges). */
export function groupQueue(queue: CollectionEntry[]): QueueGroup[] {
  const groups: QueueGroup[] = [];
  let i = 0;

  while (i < queue.length) {
    const entry = queue[i];
    if (!isTopLevelEntry(entry)) {
      i++;
      continue;
    }

    const wedges: CollectionEntry[] = [];
    let j = i + 1;
    while (
      j < queue.length &&
      queue[j].type === "wedge" &&
      queue[j].parentId === entry.id
    ) {
      wedges.push(queue[j]);
      j++;
    }

    groups.push({ parent: entry, wedges });
    i = j;
  }

  return groups;
}

export function topLevelParents(queue: CollectionEntry[]): CollectionEntry[] {
  return groupQueue(queue).map((g) => g.parent);
}

export function parentInsertIndex(queue: CollectionEntry[], parentId: string): number {
  const groups = groupQueue(queue);
  const groupIndex = groups.findIndex((g) => g.parent.id === parentId);
  if (groupIndex === -1) return queue.length;

  let index = 0;
  for (let i = 0; i <= groupIndex; i++) {
    index += 1 + groups[i].wedges.length;
  }
  return index;
}

export function moveBlock(
  queue: CollectionEntry[],
  blockIndex: number,
  direction: -1 | 1
): CollectionEntry[] {
  return reorderBlocks(queue, blockIndex, blockIndex + direction);
}

export function reorderBlocks(
  queue: CollectionEntry[],
  fromIndex: number,
  toIndex: number
): CollectionEntry[] {
  if (fromIndex === toIndex) return queue;
  const groups = groupQueue(queue);
  if (
    fromIndex < 0 ||
    fromIndex >= groups.length ||
    toIndex < 0 ||
    toIndex >= groups.length
  ) {
    return queue;
  }

  const reordered = [...groups];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);

  return reordered.flatMap((group) => [group.parent, ...group.wedges]);
}

export function sanitizeQueue(queue: CollectionEntry[]): CollectionEntry[] {
  const parentIds = new Set(
    queue.filter(isTopLevelEntry).map((entry) => entry.id)
  );

  return queue.filter((entry) => {
    if (entry.type !== "wedge") return true;
    return Boolean(entry.parentId && parentIds.has(entry.parentId));
  });
}
