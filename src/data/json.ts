function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value), null, 2) + "\n";
}

const nonNull = <T>(v: T | undefined | null): v is T => v !== undefined && v !== null;

/**
 * Keys whose value may be undefined become optional in the result. Without this, under
 * exactOptionalPropertyTypes `{ description: Localized | undefined }` is not assignable to
 * `{ description?: Localized }` (TS2375), which is exactly the shape every importer object has.
 */
export type Compact<T extends object> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

/** Drops undefined values and empty arrays. Never pass a required array through it (see `WordFile.cases`). */
export function compact<T extends object>(o: T): Compact<T> {
  return Object.fromEntries(
    Object.entries(o).filter(([, v]) => nonNull(v) && !(Array.isArray(v) && v.length === 0)),
  ) as Compact<T>;
}
