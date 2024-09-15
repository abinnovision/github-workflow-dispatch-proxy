import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setupOAuthServer } from "../../test/utils/setup-oauth-server.js";
import { testDataIdTokenClaims } from "../../test/utils/test-data.js";

import type { decodeIdToken, getJwtVerifier } from "./id-token.js";

describe("handler/id-token", () => {
	let decodeIdTokenFn: typeof decodeIdToken;
	let getJwtVerifierFn: typeof getJwtVerifier;

	const oAuthServer = setupOAuthServer();

	beforeEach(async () => {
		const imported = await import("./id-token.js");
		decodeIdTokenFn = imported.decodeIdToken;
		getJwtVerifierFn = imported.getJwtVerifier;
	});

	afterEach(() => {
		vi.resetModules();
	});

	it("should accept valid id-token", async () => {
		vi.stubEnv("APP_GH_AUTH_TYPE", "token");
		vi.stubEnv("APP_GH_AUTH_TOKEN", "token");

		const token = await oAuthServer.buildToken();

		const claims = await decodeIdTokenFn(await getJwtVerifierFn(), token);

		expect(claims).toMatchObject({
			aud: "github-workflow-dispatch-proxy",
		});
	});

	it("should provide all claims from the token", async () => {
		vi.stubEnv("APP_GH_AUTH_TYPE", "token");
		vi.stubEnv("APP_GH_AUTH_TOKEN", "token");

		const token = await oAuthServer.buildToken(testDataIdTokenClaims);

		const claims = await decodeIdTokenFn(await getJwtVerifierFn(), token);

		expect(claims).toMatchObject(testDataIdTokenClaims);
	});
});
