import type { ArticleFile } from "@/data/schema";
export interface ArticleRow { id: string; file: ArticleFile }
export class Article {
  readonly id: string; readonly title: string; readonly language: string; readonly text: string; readonly position: number;
  constructor(row: ArticleRow) {
    this.id = row.id; this.title = row.file.title.trim(); this.language = row.file.language; this.text = row.file.text; this.position = row.file.position;
  }
}
export const articleId = (caseId: string, slug: string): string => `/case/${caseId}/${slug}`;
