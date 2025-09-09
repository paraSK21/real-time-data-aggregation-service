module.exports = {
	env: { node: true, es2022: true, jest: true },
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:import/recommended",
		"plugin:import/typescript",
		"plugin:prettier/recommended",
	],
	settings: {
		"import/parsers": {
			"@typescript-eslint/parser": [".ts", ".tsx"],
		},
		"import/resolver": {
			typescript: {
				project: ["tsconfig.json"],
			},
			node: {
				extensions: [".js", ".ts"],
			},
		},
	},
	parser: "@typescript-eslint/parser",
	parserOptions: { ecmaVersion: 2022, sourceType: "module", project: undefined },
	plugins: ["@typescript-eslint", "simple-import-sort", "import"],
	rules: {
		"simple-import-sort/imports": "error",
		"simple-import-sort/exports": "error",
		"import/order": "off",
		"import/no-unresolved": "off",
		"@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }],
	},
};
