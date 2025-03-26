import { afterEach, describe, expect, it, vi } from "vitest";

describe("handler/policy", () => {
	afterEach(() => {
		vi.resetModules();
	});

	it("should use allow_all policy by default", async () => {
		vi.stubEnv("APP_GH_AUTH_TYPE", "token");
		vi.stubEnv("APP_GH_AUTH_TOKEN", "token");

		const { evaluatePolicyForRequest } = await import("./policy.js");

		const result = await evaluatePolicyForRequest({
			target: {
				owner: "abinnovison",
				repository: "github-workflow-dispatch-proxy",
				ref: "main",
				workflow: "update-version",

				inputs: {
					test: "test",
				},
			},
			caller: {
				owner: "abinnovison",
				repository: "github-workflow-dispatch-proxy",
				ref: "main",
				workflow: "build",
			},
		});

		expect(result).toBe(true);
	});

	describe("builtin/allow_org_wide", () => {
		it("should allow if organizations do match", async () => {
			vi.stubEnv("APP_GH_AUTH_TYPE", "token");
			vi.stubEnv("APP_GH_AUTH_TOKEN", "token");
			vi.stubEnv("APP_POLICY_TYPE", "allow_org_wide");
			vi.stubEnv("APP_POLICY_CONFIG", "organization=abinnovison");

			const { evaluatePolicyForRequest } = await import("./policy.js");

			const result = await evaluatePolicyForRequest({
				target: {
					owner: "abinnovison",
					repository: "github-workflow-dispatch-proxy",
					ref: "main",
					workflow: "update-version",

					inputs: {
						test: "test",
					},
				},
				caller: {
					owner: "abinnovison",
					repository: "github-workflow-dispatch-proxy",
					ref: "main",
					workflow: "build",
				},
			});

			expect(result).toBe(true);
		});

		it("should deny if organization from config does not match", async () => {
			vi.stubEnv("APP_GH_AUTH_TYPE", "token");
			vi.stubEnv("APP_GH_AUTH_TOKEN", "token");
			vi.stubEnv("APP_POLICY_TYPE", "allow_org_wide");
			vi.stubEnv("APP_POLICY_CONFIG", "organization=abinnovison-test");

			const { evaluatePolicyForRequest } = await import("./policy.js");

			const result = await evaluatePolicyForRequest({
				target: {
					owner: "abinnovison",
					repository: "github-workflow-dispatch-proxy",
					ref: "main",
					workflow: "update-version",

					inputs: {
						test: "test",
					},
				},
				caller: {
					owner: "abinnovison",
					repository: "github-workflow-dispatch-proxy",
					ref: "main",
					workflow: "build",
				},
			});

			expect(result).toBe(false);
		});

		it("should deny if organization from config is not available", async () => {
			vi.stubEnv("APP_GH_AUTH_TYPE", "token");
			vi.stubEnv("APP_GH_AUTH_TOKEN", "token");
			vi.stubEnv("APP_POLICY_TYPE", "allow_org_wide");

			const { evaluatePolicyForRequest } = await import("./policy.js");

			const result = await evaluatePolicyForRequest({
				target: {
					owner: "abinnovison",
					repository: "github-workflow-dispatch-proxy",
					ref: "main",
					workflow: "update-version",

					inputs: {
						test: "test",
					},
				},
				caller: {
					owner: "abinnovison",
					repository: "github-workflow-dispatch-proxy",
					ref: "main",
					workflow: "build",
				},
			});

			expect(result).toBe(false);
		});
	});

	describe("target/cel", () => {
		it("should throw exception on invalid expression", async () => {
			vi.stubEnv("APP_GH_AUTH_TYPE", "token");
			vi.stubEnv("APP_GH_AUTH_TOKEN", "token");
			vi.stubEnv("APP_POLICY", "cel");
			vi.stubEnv("APP_POLICY_EXPRESSION", "this is not a valid expression");

			const { evaluatePolicyForRequest } = await import("./policy.js");

			await expect(
				evaluatePolicyForRequest({
					target: {
						owner: "abinnovison",
						repository: "github-workflow-dispatch-proxy",
						ref: "main",
						workflow: "update-version",

						inputs: {
							test: "test",
						},
					},
					caller: {
						owner: "abinnovison",
						repository: "github-workflow-dispatch-proxy",
						ref: "main",
						workflow: "build",
					},
				}),
			).rejects.toThrow();
		});
	});
});
