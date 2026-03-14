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

    tabWidth: 2,
    useTabs: false,

    requirePragma: false,
    insertPragma: false,

    plugins: ["@trivago/prettier-plugin-sort-imports"],
    importOrder: ["<BUILTIN_MODULES>", "<THIRD_PARTY_MODULES>", "^@interfaces/(.*)$", "^@lib/(.*)$", "^@/(.*)$", "^[./]"],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true
};

module.exports = config;