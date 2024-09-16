import { getPort } from "get-port-please";
import nock from "nock";
import request from "supertest";
import { afterEach, beforeEach, describe, it, vi } from "vitest";

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
			await st.post("/dispatch").expect(400).send();
		});

		it("should forward the dispatch request if all checks pass", async () => {
			const idToken = await oAuthServer.buildToken(testDataIdTokenClaims);

			nock("https://api.github.com")
				.post(
					"/repos/octo-org/octo-repo/actions/workflows/example-workflow/dispatches"
				)
				.reply(200);

			await st
				.post("/dispatch")
				.send({
					idToken,
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
	});
});
