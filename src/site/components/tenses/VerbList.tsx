import type { Verb } from "@/model/Verb";
import { ExpandableList, type ListChrome } from "../ExpandableList";
import { VerbRow } from "./VerbRow";

interface VerbListProps extends ListChrome {
  verbs: Verb[];
}

export function VerbList({ verbs, ...rest }: VerbListProps) {
  return <ExpandableList items={verbs} keyOf={(verb) => verb.id} renderItem={(verb) => <VerbRow verb={verb} />} {...rest} />;
}
