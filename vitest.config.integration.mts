import {defineConfig} from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/**/*.spec-integration.ts"],
		globals: true,
		environment: "node",
		coverage: {
			provider: "v8",
			all: true,
			include: ["src/**/*.{ts,tsx}"],
			reporter: [["lcovonly"], "text"],
		},
		sequence: {
			hooks: "stack",
		},
	},
});
