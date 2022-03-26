import { Command } from "https://deno.land/x/cliffy@v0.22.2/command/mod.ts";
import { globToRegExp } from "https://deno.land/std@0.130.0/path/glob.ts";
import { exec, OutputMode } from "https://deno.land/x/exec@0.0.5/mod.ts";
import { barChart } from "./bar-chart.ts";

const { options } = await new Command()
  .name("git-histogram")
  .description("Shows the frequenzy of file changes in a histogram")
  .option(
    "-r, --ref <ref>",
    "use this git ref to create a histogram for files that were change in the 'git diff HEAD <ref>' " +
      " this flag is ignored if --merge-base is also used",
  )
  .option(
    "-m, --merge-base <branch>",
    "create histogram from diff against the merge-base from branch",
  )
  .option(
    "-f, --filter <regex>",
    "filter the file names with a regular expersion",
  )
  .option(
    "-g, --glob <glob-pattern>",
    "filter the file names with a glob pattern",
  )
  .parse(Deno.args);

const mergeBaseSource = options.mergeBase;
let diffAgainst = options.ref;

if (mergeBaseSource) {
  const gitMergeBase = (await exec(
    "git merge-base HEAD " + mergeBaseSource,
    { output: OutputMode.Capture },
  )).output.trim();
  diffAgainst = gitMergeBase;
}

const filesInDiff = new Set<string>();
if (diffAgainst) {
  const gitDiffOutput = (await exec(
    "git diff --name-only " + diffAgainst,
    { output: OutputMode.Capture },
  )).output;
  for (const file of gitDiffOutput.split("\n")) {
    const trimmedFile = file.trim();
    if (trimmedFile) {
      filesInDiff.add(trimmedFile);
    }
  }
}

let gitFileChanges = (await exec(
  "git log --name-status",
  { output: OutputMode.Capture },
)).output.split("\n").map((change) => change.split("\t")[1]?.trim());

if (filesInDiff.size > 0) {
  gitFileChanges = gitFileChanges.filter((file) => filesInDiff.has(file));
}

const globPattern = options.glob;
if (globPattern) {
  const globRegex = globToRegExp(globPattern, {
    extended: true,
    globstar: true,
    caseInsensitive: false,
  });
  gitFileChanges = gitFileChanges.filter((fileName) =>
    fileName.match(globRegex)
  );
}

const externalFilter = options.filter;
if (externalFilter) {
  const regex = new RegExp(externalFilter);
  gitFileChanges = gitFileChanges.filter((fileName) => fileName.match(regex));
}

const histogram: Record<string, number> = {};
for (const fileName of gitFileChanges) {
  if (!fileName) {
    continue;
  }

  if (histogram[fileName]) {
    histogram[fileName] += 1;
  } else {
    histogram[fileName] = 1;
  }
}

const barChartData = Object.entries(histogram).map(([name, amount]) => ({
  name,
  amount,
}));

barChart(barChartData);
