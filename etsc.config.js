const fsp = require("fs/promises");
const path = require("path");

/**
 * @type {import("esbuild-node-tsc/dist/config").Config}
 */
module.exports = {
	tsConfigFile: "tsconfig.build.json",
	esbuild: {
		entryPoints: ["src/bootstrap.ts"],
		assetNames: "[dir]/[name]",
		bundle: true,
		platform: "node",
		target: "node20",
		loader: {
			".yaml": "text",
			".node": "copy",
		},
	},
	postbuild: async () => {
		// uWebSockets.js works with binary targets and it has a different binary for each platform.
		// The binary is named as `uws_${platform}_${arch}_${modules}.node`.
		// We only need the binary for the current platform, the rest can be removed.

		const filesToKeep = [
			`uws_${process.platform}_${process.arch}_${process.versions.modules}.node`,
		];

		const dirPath = path.resolve(`dist/_.._/node_modules/uWebSockets.js/`);

		// Get all the available .node files.
		const dirContent = await fsp.readdir(dirPath);

		// Remove all the files that are not needed.
		for (const file of dirContent) {
			if (!filesToKeep.includes(file)) {
				await fsp.rm(path.resolve(dirPath, file), { recursive: true });
			}
		}
	},
};
