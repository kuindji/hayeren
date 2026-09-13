import type { Word as WordEntity } from "@/model/Word";
import { ExpandableList, type ListChrome } from "./ExpandableList";
import { Word } from "./Word";

interface WordsProps extends ListChrome {
  words: WordEntity[];
}

export function Words({ words, ...rest }: WordsProps) {
  return <ExpandableList items={words} keyOf={(word) => word.id} renderItem={(word) => <Word word={word} />} {...rest} />;
}
