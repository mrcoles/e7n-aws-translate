import AWS from "aws-sdk";

import clonedeep from "lodash.clonedeep";
import moment from "moment";
import { Messages } from "./types";

AWS.config.apiVersions = {
  translate: "2017-07-01"
};

AWS.config.update({ region: "us-east-1" });

const translate = new AWS.Translate();

export const enterMissingTranslations = async (
  sourceData: Messages,
  sourceLang: string,
  targetData: Messages,
  targetLang: string
) => {
  const newTargetData = clonedeep(targetData);

  // identify missing keys in target
  const uniqueToSource = new Set<string>();

  Object.entries(sourceData).forEach(([key, data]) => {
    if (!data.message) {
      throw new Error(`Bad source data for ${key}: ${JSON.stringify(data)}`);
    }
    if (!targetData[key] || !targetData[key].message) {
      uniqueToSource.add(key);
    }
  });

  // perform translations
  console.log("CHECK?", Array.from(uniqueToSource).length); //REMM

  for (let key of uniqueToSource) {
    console.log("key", key); //REMM

    const { message, placeholders } = sourceData[key];

    const resp = await getTranslation(message, sourceLang, targetLang);
    const text = resp.TranslatedText;

    newTargetData[key] = {
      message: text,
      description: `[aws:${timestamp()}] ${message}`,
      placeholders
    };

    await sleep(500);
  }

  return newTargetData;
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

const sleep = <R extends any>(delay: number, ret?: R): Promise<R> =>
  new Promise(resolve => {
    setTimeout(() => resolve(ret), delay);
  });

const timestamp = () => moment.utc().format("YYYY-MM-DD kk:mm:ss");
