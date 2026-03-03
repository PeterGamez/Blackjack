/**
 * @link https://prettier.io/docs/en/options
 */
const config = {
    arrowParens: "always",
    endOfLine: "lf",
    embeddedLanguageFormatting: "auto",
    htmlWhitespaceSensitivity: "ignore",
    jsxSingleQuote: false,
    // parser: "typescript",
    proseWrap: "preserve",
    printWidth: 200,
    trailingComma: "es5",
    semi: true,
    singleAttributePerLine: false,
    singleQuote: false,
    vueIndentScriptAndStyle: false,

    bracketSameLine: true,
    bracketSpacing: true,

    rangeStart: 0,
    rangeEnd: Infinity,

    tabWidth: 4,
    useTabs: false,

    requirePragma: false,
    insertPragma: false
};

module.exports = config;