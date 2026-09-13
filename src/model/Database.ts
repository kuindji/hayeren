import type { DataFiles, WordFile, CaseFile, Declension, WordType, Conjugation, VerbFile, TenseFile } from "@/data/schema";
import { Table } from "./Table";
import { Word } from "./Word";
import { Case } from "./Case";
import { Article, articleId, type ArticleRow } from "./Article";
import { Verb } from "./Verb";
import { Tense } from "./Tense";

export class Database {
  readonly noun: Table<WordFile, Word>; readonly pronoun: Table<WordFile, Word>; readonly numeral: Table<WordFile, Word>;
  readonly question: Table<WordFile, Word>; readonly prepostposition: Table<WordFile, Word>;
  readonly declension: Table<Declension, Declension>;
  readonly conjugation: Table<Conjugation, Conjugation>;
  readonly verb: Table<VerbFile, Verb>;
  readonly article: Table<ArticleRow, Article>;
  readonly case: Table<CaseFile, Case>;
  readonly tense: Table<TenseFile, Tense>;
  constructor(files: DataFiles) {
    const wordTable = (type: WordType) => new Table<WordFile, Word>((f) => new Word(type, f), files.words[type]);
    this.noun = wordTable("noun"); this.pronoun = wordTable("pronoun"); this.numeral = wordTable("numeral");
    this.question = wordTable("question"); this.prepostposition = wordTable("prepostposition");
    this.declension = new Table<Declension, Declension>((d) => d, files.declensions);
    this.conjugation = new Table<Conjugation, Conjugation>((c) => c, files.conjugations);
    this.verb = new Table<VerbFile, Verb>((f) => new Verb(f), files.verbs);
    this.article = new Table<ArticleRow, Article>((r) => new Article(r), files.articles.map((a) => ({ id: articleId(a.owner, a.ownerId, a.slug), file: a })));
    this.case = new Table<CaseFile, Case>((c) => new Case(c, this), [...files.cases].sort((a, b) => a.position - b.position));
    this.tense = new Table<TenseFile, Tense>((t) => new Tense(t, this), [...files.tenses].sort((a, b) => a.position - b.position));
  }
  findWord(id: string): Word | null {
    return this.noun.get(id) ?? this.pronoun.get(id) ?? this.question.get(id) ?? this.numeral.get(id) ?? this.prepostposition.get(id);
  }
}
