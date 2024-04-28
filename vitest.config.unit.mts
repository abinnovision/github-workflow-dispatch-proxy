import {defineConfig} from "vitest/config";

export default defineConfig({
	assetsInclude: [
		"**/*.yaml",
	],
	define: {
		"process.env.POLICY_DIR": `"./policies"`,
	},
	test: {
		include: ["src/**/*.spec.ts"],
		globals: true,
		environment: "node",
		coverage: {
			provider: "v8",
			all: true,
			include: ["src/**/*.{ts,tsx}"],
			reporter: [["lcovonly"], "text"],
		},
	},
});
