import {defineConfig} from "vitest/config";

export default defineConfig({
	assetsInclude: [
		"**/*.yaml"
	],
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
