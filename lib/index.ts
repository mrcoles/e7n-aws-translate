import AWS from "aws-sdk";
import { readFile as _readFile } from "fs";
import { promisify } from "util";

const readFile = promisify(_readFile);

AWS.config.apiVersions = {
  translate: "2017-07-01"
};

const translate = new AWS.Translate();

type Placeholder = {
  content: string; // e.g., "$1"
  example: string; // e.g., "https://developer.mozilla.org"
};

type Message = {
  message: string;
  description: string;
  not_found?: boolean;
  placeholders?: {
    [placeholder_name: string]: Placeholder;
  };
};

type Messages = {
  [message_key: string]: Message;
};

const main = async (
  sourceFile: string,
  sourceLang: string,
  targetFile: string,
  targetLang: string
) => {
  const sourceContent = await readFile(sourceFile, "utf8");
  const targetContent = await readFile(targetFile, "utf8");

  const sourceData = JSON.parse(sourceContent) as Messages;
  const targetData = JSON.parse(targetContent) as Messages;

  const uniqueToSource = new Set<string>();

  Object.keys(sourceData).forEach(key => {
    // console.log(`${key} ?? ${targetData[key]}`); //REMM
    if (!targetData[key]) {
      uniqueToSource.add(key);
    }
  });

  console.log("CHECK?", Array.from(uniqueToSource).length); //REMM

  for (let key of uniqueToSource) {
    console.log("key", key); //REMMM
  }
};

// Helpers

const getTranslation = async (
  text: string,
  sourceLang: string,
  targetLang: string
) => {
  const params = {
    SourceLanguageCode: sourceLang,
    TargetLanguageCode: targetLang,
    Text: text
  };

  return translate.translateText(params).promise();
};

const sleep = <R extends any>(delay: number, ret: R): Promise<R> =>
  new Promise(resolve => {
    setTimeout(() => resolve(ret), delay);
  });

// Run

main(
  "../src/_locales/en/messages.json",
  "en",
  "../src/_locales/es/messages.json",
  "es"
).catch(console.error);
