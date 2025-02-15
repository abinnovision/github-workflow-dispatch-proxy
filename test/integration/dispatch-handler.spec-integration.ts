/* eslint-disable max-nested-callbacks */
import { getPort } from "get-port-please";
import nock from "nock";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setupOAuthServer } from "../utils/setup-oauth-server.js";
import { testDataIdTokenClaims } from "../utils/test-data.js";

import type { Agent } from "supertest";

describe("dispatch-handler", () => {
	let shutdownHandler: () => void;
	let st: Agent;

	const oAuthServer = setupOAuthServer();

	beforeEach(async () => {
		const port = await getPort();

		vi.stubEnv("APP_PORT", String(port));
		vi.stubEnv("APP_GH_AUTH_TYPE", "token");
		vi.stubEnv("APP_GH_AUTH_TOKEN", "token");

		st = request(`http://127.0.0.1:${port}`);
	});

	afterEach(async () => {
		shutdownHandler?.();
		vi.resetModules();
		nock.cleanAll();
	});

	describe("default config", () => {
		beforeEach(async () => {
			const bootstrap = await import("../../src/bootstrap.js");

			// Save the shutdown handler for later.
			shutdownHandler = (await bootstrap.bootstrap).shutdown;
		});

		it("should return 400 if the body is invalid", async () => {
			// 401 is returned because the Authorization header is missing.
			await st.post("/dispatch").expect(401).send();
		});

		it("should forward the dispatch request if all checks pass", async () => {
			const idToken = await oAuthServer.buildToken(testDataIdTokenClaims);

			nock("https://api.github.com")
				.post(
					"/repos/octo-org/octo-repo/actions/workflows/example-workflow/dispatches",
				)
				.reply(200);

			await st
				.post("/dispatch")
				.auth(idToken, { type: "bearer" })
				.send({
					target: {
						owner: "octo-org",
						repo: "octo-repo",
						ref: "refs/heads/main",
						workflow: "example-workflow",
					},
					inputs: {
						type: "production",
					},
				})
				.expect(200);
		});

		it("should resolve the default branch if no ref is given", async () => {
			const _testDefaultBranch = "main-default";

			const idToken = await oAuthServer.buildToken(testDataIdTokenClaims);

			const dispatchScope = nock("https://api.github.com")
				.post(
					"/repos/octo-org/octo-repo/actions/workflows/example-workflow/dispatches",
				)
				.reply((uri, body) => {
					if ((body as any).ref !== _testDefaultBranch) {
						return [400];
					}

					return [200];
				});

			const getScope = nock("https://api.github.com")
				.get("/repos/octo-org/octo-repo")
				.reply(200, () => ({
					default_branch: _testDefaultBranch,
				}));

			await st
				.post("/dispatch")
				.auth(idToken, { type: "bearer" })
				.send({
					target: {
						owner: "octo-org",
						repo: "octo-repo",
						workflow: "example-workflow",
					},
					inputs: {
						type: "production",
					},
				})
				.expect(200);

			dispatchScope.done();
			getScope.done();
		});

		it("should not load default branch if ref is given", async () => {
			const idToken = await oAuthServer.buildToken(testDataIdTokenClaims);

			const dispatchScope = nock("https://api.github.com")
				.post(
					"/repos/octo-org/octo-repo/actions/workflows/example-workflow/dispatches",
				)
				.reply(200);

			const getScope = nock("https://api.github.com")
				.get("/repos/octo-org/octo-repo")
				.reply(200, () => ({ default_branch: "main" }));

			await st
				.post("/dispatch")
				.auth(idToken, { type: "bearer" })
				.send({
					target: {
						owner: "octo-org",
						repo: "octo-repo",
						workflow: "example-workflow",
						ref: "master",
					},
					inputs: {
						type: "production",
					},
				})
				.expect(200);

			dispatchScope.done();

			// Expect that the request to load the default branch was not made.
			expect(getScope.isDone()).toBe(false);
		});
	});
});
