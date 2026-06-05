import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collectionKey,
  defaultTarget,
  entryIsComplete,
  entryCollectedCount,
  normalizeEntry,
  normalizeTarget,
  type CollectionEntry,
  type CollectionType,
} from "../types/collector";
import {
  groupQueue,
  parentInsertIndex,
  reorderBlocks,
  sanitizeQueue,
  topLevelParents,
} from "../utils/collectionQueue";
import { getWatermarkState } from "../utils/watermark";

const STORAGE_KEY = "dna-collector-queue";

function loadQueue(): CollectionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = (JSON.parse(raw) as CollectionEntry[]).map((entry) =>
        normalizeEntry(entry)
      );
      return sanitizeQueue(parsed);
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function useCollector() {
  const [queue, setQueue] = useState<CollectionEntry[]>(loadQueue);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  const groups = useMemo(() => groupQueue(queue), [queue]);
  const parents = useMemo(() => topLevelParents(queue), [queue]);
  const watermark = useMemo(() => getWatermarkState(queue), [queue]);

  const isCollected = useCallback(
    (type: CollectionType, itemId: string, parentId?: string) =>
      queue.some(
        (e) =>
          e.type === type &&
          e.itemId === itemId &&
          e.parentId === parentId &&
          entryIsComplete(e)
      ),
    [queue]
  );

  const isQueued = useCallback(
    (type: CollectionType, itemId: string, parentId?: string) =>
      queue.some(
        (e) =>
          e.type === type &&
          e.itemId === itemId &&
          (type !== "wedge" || e.parentId === parentId)
      ),
    [queue]
  );

  const add = useCallback(
    (
      type: CollectionType,
      itemId: string,
      target = defaultTarget(type),
      parentId?: string
    ) => {
      setQueue((q) => {
        const id = collectionKey(type, itemId, parentId);

        if (type === "wedge") {
          if (!parentId) return q;
          if (!q.some((e) => e.id === parentId)) return q;
          if (q.some((e) => e.id === id)) return q;

          const entry: CollectionEntry = {
            id,
            type,
            itemId,
            parentId,
            target: normalizeTarget(type, target),
            collected: false,
            addedAt: Date.now(),
          };
          const insertAt = parentInsertIndex(q, parentId);
          const next = [...q];
          next.splice(insertAt, 0, entry);
          return next;
        }

        if (q.some((e) => e.id === id)) return q;
        return [
          ...q,
          {
            id,
            type,
            itemId,
            target: normalizeTarget(type, target),
            collected: false,
            addedAt: Date.now(),
          },
        ];
      });
    },
    []
  );

  const setTarget = useCallback((id: string, target: number) => {
    setQueue((q) =>
      q.map((e) =>
        e.id === id ? normalizeEntry({ ...e, target: normalizeTarget(e.type, target) }) : e
      )
    );
  }, []);

  const remove = useCallback((id: string) => {
    setQueue((q) => q.filter((e) => e.id !== id && e.parentId !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    setQueue((q) =>
      q.map((e) => {
        if (e.id !== id) return e;
        const normalized = normalizeEntry(e);
        const target = normalized.target;
        const done = entryIsComplete(normalized);
        return normalizeEntry({
          ...normalized,
          collectedCount: done ? 0 : target,
        });
      })
    );
  }, []);

  const toggleCopy = useCallback((id: string, tickIndex: number) => {
    setQueue((q) =>
      q.map((e) => {
        if (e.id !== id) return e;
        const normalized = normalizeEntry(e);
        const target = normalized.target;
        const count = entryCollectedCount(normalized);
        let next = count;
        if (tickIndex < count) {
          next = tickIndex;
        } else if (tickIndex === count && count < target) {
          next = count + 1;
        } else {
          return normalized;
        }
        return normalizeEntry({ ...normalized, collectedCount: next });
      })
    );
  }, []);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((q) => reorderBlocks(q, fromIndex, toIndex));
  }, []);

  const addOrMerge = useCallback(
    (
      type: CollectionType,
      itemId: string,
      target = defaultTarget(type),
      parentId?: string
    ) => {
      setQueue((q) => {
        const id = collectionKey(type, itemId, parentId);
        const normalized = normalizeTarget(type, target);
        const existing = q.find((e) => e.id === id);

        if (existing) {
          return q.map((e) =>
            e.id === id
              ? normalizeEntry({ ...e, target: Math.max(e.target, normalized) })
              : e
          );
        }

        if (type === "wedge") {
          if (!parentId || !q.some((e) => e.id === parentId)) return q;
          const entry: CollectionEntry = {
            id,
            type,
            itemId,
            parentId,
            target: normalized,
            collected: false,
            addedAt: Date.now(),
          };
          const insertAt = parentInsertIndex(q, parentId);
          const next = [...q];
          next.splice(insertAt, 0, entry);
          return next;
        }

        if (q.some((e) => e.id === id)) return q;
        return [
          ...q,
          {
            id,
            type,
            itemId,
            target: normalized,
            collected: false,
            addedAt: Date.now(),
          },
        ];
      });
    },
    []
  );

  const total = queue.reduce(
    (sum, e) => sum + normalizeTarget(e.type, e.target),
    0
  );
  const collected = queue.reduce((sum, e) => sum + entryCollectedCount(e), 0);

  return {
    queue,
    groups,
    parents,
    stats: {
      total,
      collected,
      pending: total - collected,
      pct: total === 0 ? 0 : Math.round((collected / total) * 100),
    },
    watermark,
    add,
    setTarget,
    remove,
    toggle,
    toggleCopy,
    reorder,
    addOrMerge,
    isQueued,
    isCollected,
  };
}
