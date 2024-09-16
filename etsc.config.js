/**
 * @type {import("esbuild-node-tsc/dist/config").Config}
 */
export default {
	tsConfigFile: "tsconfig.build.json",
	esbuild: {
		outbase: "./",
		entryPoints: ["src/bootstrap.ts"],
		assetNames: "[dir]/[name]",
		bundle: true,
		platform: "node",
		target: "node20",
		format: "esm",
		packages: "external",
		loader: {
			".yaml": "text",
		},
		define: {
			"process.env.POLICY_DIR": `"./policies"`,
		},
	},
	postbuild: async () => {
		await (await import("cpy")).default("policies/*.wasm", "dist/policies/");

		// Create a package.json with {type: "module"} to allow importing the package.
		const fsp = await import("node:fs/promises");
		await fsp.writeFile(
			"dist/package.json",
			JSON.stringify({ type: "module" })
		);
	},
};
