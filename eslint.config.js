/** @type {import("@types/eslint").Linter.FlatConfig[]} */
module.exports = [
	...require("@abinnovision/eslint-config-base").default,
	...require("@abinnovision/eslint-config-typescript").default,
	{ files: ["**/*.js"], languageOptions: { globals: require("globals").node } },
];
