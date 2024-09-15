const fsp = require("fs/promises");
const path = require("path");

/**
 * @type {import("esbuild-node-tsc/dist/config").Config}
 */
module.exports = {
	tsConfigFile: "tsconfig.build.json",
	esbuild: {
		outbase: "./",
		entryPoints: ["src/bootstrap.ts"],
		assetNames: "[dir]/[name]",
		bundle: true,
		platform: "node",
		target: "node20",
		loader: {
			".yaml": "text",
		},
		define: {
			"process.env.POLICY_DIR": `"./policies"`,
		},
	},
	postbuild: async () => {
		await (await import("cpy")).default("policies/*.wasm", "dist/policies/");
	},
};
