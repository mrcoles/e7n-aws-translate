import {
  readFile as _readFile,
  writeFile as _writeFile,
  readdir as _readdir
} from "fs";
import { join } from "path";
import { promisify } from "util";
import yargs from "yargs";

import { enterMissingTranslations } from "./index";
import { Messages } from "./types";

const readFile = promisify(_readFile);
const writeFile = promisify(_writeFile);
const readdir = promisify(_readdir);

// ## Main

const main = async () => {
  const _runCommand = <R extends any>(
    prom: Promise<R>,
    verbose?: boolean,
    json?: boolean
  ) => {
    Promise.resolve(prom)
      .then(resp => {
        if (verbose) {
          console.log(json ? JSON.stringify(resp, null, 2) : resp);
        }
      })
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  };

  yargs
    .usage("Usage: $0 <command> [options]")
    .command(
      ["translate <sourceFile> <sourceLang> <targetFile> <targetLang>", "$0"],
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
      argv =>
        _runCommand(
          addTranslations(
            argv.sourceFile,
            argv.sourceLang,
            argv.targetFile,
            argv.targetLang,
            argv.verbose
          )
        )
    )
    .command(
      "update-all root [defaultLang]",
      "Auto-populate all messages.json files in your project with any missing translations from the default locale.",
      yargs =>
        yargs
          .positional("root", {
            type: "string",
            description:
              "the root URL of your source, containing manifest.json and _locales/"
          })
          .positional("defaultLang", {
            type: "string",
            description:
              'The language code to use as the source language, defaults to the value of "default_locale" in [root]/manifest.json'
          })
          .demand("root")
          .option("verbose", { alias: "v", type: "boolean", default: false }),
      argv => _runCommand(updateAll(argv.root, argv.defaultLang, argv.verbose))
    )
    .demandCommand(1, 1)
    .alias("h", "help")
    .help().argv;
};

// ## Command Functions

// ### Add Translations

const addTranslations = async (
  sourceFile: string,
  sourceLang: string,
  targetFile: string,
  targetLang: string,
  verbose?: boolean
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

// ### Update All

const updateAll = async (
  root: string,
  defaultLang?: string,
  verbose?: boolean
) => {
  if (!defaultLang) {
    const manifestPath = join(root, "manifest.json");
    const manifestContents = await readFile(manifestPath, "utf8");
    const manifestData = JSON.parse(manifestContents);

    defaultLang = manifestData.default_locale;
    if (defaultLang === null || defaultLang === undefined) {
      throw new Error(`No 'default_lang' found in ${manifestPath}`);
    } else if (typeof defaultLang !== "string") {
      throw new Error(
        `Invalid 'default_locale' in ${manifestPath}: (${typeof defaultLang}) ${defaultLang}`
      );
    }
  }

  const defaultLangPath = join(root, "_locales", defaultLang, "messages.json");

  const localesPath = join(root, "_locales");

  const files = await readdir(localesPath);

  for (let targetLang of files) {
    if (targetLang === defaultLang) {
      continue;
    }
    const targetFile = join(localesPath, targetLang, "messages.json");
    if (verbose) {
      console.log(
        `## Translating ${defaultLang} -> ${targetLang} (${defaultLangPath} -> ${targetFile})`
      );
    }
    await addTranslations(
      defaultLangPath,
      defaultLang,
      targetFile,
      targetLang,
      verbose
    );
    if (verbose) {
      console.log("");
    }
  }
};

// ## Runner

main().catch(err => {
  console.error(err);
  process.exit(err.code || 1);
});
