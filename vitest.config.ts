import { defineConfig } from "vitest/config";

export default defineConfig({
	assetsInclude: ["**/*.yaml"],
	define: {
		"process.env.POLICY_DIR": `"./policies"`,
	},
	test: {
		environment: "node",
		coverage: {
			provider: "v8",
			all: true,
			include: ["src/**/*.{ts,tsx}"],
			reporter: [["lcovonly"], "text"],
		},
		workspace: [
			{
				extends: true,
				test: {
					name: "github-workflow-dispatch-proxy#unit",
					include: ["src/**/*.spec.ts"],
				},
			},
			{
				extends: true,
				test: {
					name: "github-workflow-dispatch-proxy#integration",
					include: ["test/integration/**/*.spec-integration.ts"],
					sequence: {
						hooks: "stack",
					},
				},
			},
		],
	},
});
