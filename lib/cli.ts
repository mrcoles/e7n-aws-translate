import { readFile as _readFile, writeFile as _writeFile } from "fs";
import { promisify } from "util";
import yargs from "yargs";

import { enterMissingTranslations } from "./index";
import { Messages } from "./types";

const readFile = promisify(_readFile);
const writeFile = promisify(_writeFile);

const main = async () => {
  yargs
    .usage("Usage: $0 <command> [options]")
    .command(
      "$0 <sourceFile> <sourceLang> <targetFile> <targetLang>",
      "Add missing translations to a target file",
      yargs =>
        yargs
          .positional("sourceFile", { type: "string" })
          .positional("sourceLang", { type: "string" })
          .positional("targetFile", { type: "string" })
          .positional("targetLang", { type: "string" })
          .demand("sourceFile")
          .demand("sourceLang")
          .demand("targetFile")
          .demand("targetLang")
          .option("verbose", { alias: "v", type: "boolean", default: false }),
      argv => {
        addTranslations(
          argv.sourceFile,
          argv.sourceLang,
          argv.targetFile,
          argv.targetLang,
          argv.verbose
        )
          .then(resp => {
            if (argv.verbose) {
              console.log(JSON.stringify(resp, null, 2));
            }
          })
          .catch(err => {
            console.error(err);
            process.exit(err.code || 1);
          });
      }
    )
    .demandCommand(1, 1)
    .alias("h", "help")
    .help().argv;
};

const addTranslations = async (
  sourceFile: string,
  sourceLang: string,
  targetFile: string,
  targetLang: string,
  verbose: boolean
) => {
  const sourceContent = await readFile(sourceFile, "utf8");

  let targetContent;
  try {
    targetContent = await readFile(targetFile, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      targetContent = "{}";
    } else {
      throw err;
    }
  }

  const sourceData = JSON.parse(sourceContent) as Messages;
  const targetData = JSON.parse(targetContent) as Messages;

  const newData = await enterMissingTranslations(
    sourceData,
    sourceLang,
    targetData,
    targetLang,
    verbose
  );

  await writeFile(targetFile, JSON.stringify(newData, null, 2), "utf8");

  const filteredNewData: Messages = {};
  Object.entries(newData).forEach(([key, data]) => {
    if (!targetData[key]) {
      filteredNewData[key] = data;
    }
  });

  return filteredNewData;
};

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(err.code || 1);
  });
}
