import { readDataFromDisk, checkReferences } from "../src/data/validate";

const problems = checkReferences(readDataFromDisk("data"));
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("data/ is valid");
