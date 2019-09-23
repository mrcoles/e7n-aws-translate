# 🌍 e7n + AWS Translate

A script for loading Chrome extension messages.json files and generating translations. This may be used with [e7n ➡️ extension](https://github.com/mrcoles/e7n).

This uses the [AWS Translate API](https://docs.aws.amazon.com/en_pv/translate/latest/dg/API_TranslateText.html). Make sure you have your [AWS credentials set](https://blog.gruntwork.io/authenticating-to-aws-with-the-credentials-file-d16c0fbcbf9e), and if you’re using multiple profiles you have the proper value for your \$AWS_PROFILE environment variable.

Usage:

```bash
e7n-aws-translate [--verbose|-v] <sourceFile> <sourceLang> <targetFile> <targetPath>
```

For example:

```bash
e7n-aws-translate src/_locales/en/messages.json en src/_locales/es/messages.json es
```

### Misc

[Helpful aws translate example code](https://github.com/andre-araujo/aws-translate-json/blob/master/src/index.ts)
