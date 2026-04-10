import { encodeCursor } from './cursor.util';
import type { CursorPayload } from '../types/cursor-payload.type';

type BuildCursorPageResultParams<T> = {
  items: T[];
  limit: number;
  getCursorPayload: (item: T) => CursorPayload;
};

export function buildCursorPageResult<T>({
  items,
  limit,
  getCursorPayload,
}: BuildCursorPageResultParams<T>) {
  const hasNextPage = items.length > limit;
  const normalizedItems = hasNextPage ? items.slice(0, limit) : items;
  const lastItem = normalizedItems.at(-1);

  return {
    normalizedItems,
    hasNextPage,
    lastItem: lastItem ?? null,
    nextCursor:
      hasNextPage && lastItem ? encodeCursor(getCursorPayload(lastItem)) : null,
  };
}
