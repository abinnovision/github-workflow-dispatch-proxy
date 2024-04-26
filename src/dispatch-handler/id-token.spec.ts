import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setupOAuthServer } from "../../test/utils/setup-oauth-server";
import { testDataIdTokenClaims } from "../../test/utils/test-data";

import type { decodeIdToken } from "./id-token";

describe("handler/id-token", () => {
	let fn: typeof decodeIdToken;

	const oAuthServer = setupOAuthServer();

	beforeEach(async () => {
		fn = (await import("./id-token.js")).decodeIdToken;
	});

	afterEach(() => {
		vi.resetModules();
	});

	it("should accept valid id-token", async () => {
		vi.stubEnv("APP_GH_AUTH_TYPE", "token");
		vi.stubEnv("APP_GH_AUTH_TOKEN", "token");

		const token = await oAuthServer.buildToken();

		const claims = await fn(token);

		expect(claims).toMatchObject({
			aud: "github-workflow-dispatch-proxy",
		});
	});

	it("should provide all claims from the token", async () => {
		vi.stubEnv("APP_GH_AUTH_TYPE", "token");
		vi.stubEnv("APP_GH_AUTH_TOKEN", "token");

		const token = await oAuthServer.buildToken(testDataIdTokenClaims);

		const claims = await fn(token);

		expect(claims).toMatchObject(testDataIdTokenClaims);
	});
});
