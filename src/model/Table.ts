export type Query<Row> = null | undefined | ((row: Row) => boolean) | string[];
export type Sort<Entity> = string | ((a: Entity, b: Entity) => number) | undefined;

export class Table<Row extends { id: string }, Entity = Row> {
  private rows: Row[] = [];
  private index = new Map<string, Row>();
  private entities = new Map<string, Entity>();
  constructor(private readonly make: (row: Row) => Entity, rows: Row[] = []) {
    for (const r of rows) this.addRow(r);
  }
  addRow(row: Row): void {
    if (this.index.has(row.id)) return;
    this.rows.push(row);
    this.index.set(row.id, row);
  }
  get(id: string): Entity | null {
    const row = this.index.get(id);
    if (!row) return null;
    let e = this.entities.get(id);
    if (!e) { e = this.make(row); this.entities.set(id, e); }
    return e;
  }
  query(q?: Query<Row>, sort?: Sort<Entity>): Entity[] {
    let rows = this.rows;
    if (typeof q === "function") rows = rows.filter(q);
    else if (Array.isArray(q)) rows = rows.filter((r) => q.includes(r.id));
    const out = rows.map((r) => this.get(r.id)).filter((e): e is Entity => e !== null);
    if (typeof sort === "function") out.sort(sort);
    else if (typeof sort === "string") out.sort((a, b) => String((a as Record<string, unknown>)[sort]).localeCompare(String((b as Record<string, unknown>)[sort])));
    return out;
  }
  count(): number { return this.rows.length; }
}
