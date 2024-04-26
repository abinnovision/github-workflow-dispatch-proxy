import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { evaluatePolicyForRequest } from "./policy";

describe("handler/policy", () => {
	let fn: typeof evaluatePolicyForRequest;

	beforeEach(async () => {
		fn = (await import("./policy.js")).evaluatePolicyForRequest;
	});

	afterEach(() => {
		vi.resetModules();
	});

	it("should use allow_all policy by default", async () => {
		vi.stubEnv("APP_GH_AUTH_TYPE", "token");
		vi.stubEnv("APP_GH_AUTH_TOKEN", "token");

		const result = await fn({
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

			const result = await fn({
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

			const result = await fn({
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

			const result = await fn({
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
});
