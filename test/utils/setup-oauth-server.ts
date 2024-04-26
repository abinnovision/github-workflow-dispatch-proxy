import { getPort } from "get-port-please";
import { OAuth2Server } from "oauth2-mock-server";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";

import type { IdTokenClaims } from "../../src/dispatch-handler/id-token";

interface SetupOAuthServerOpts {
	setupEnvVars?: boolean;
}

interface SetupOAuthServerHolder {
	getUrl: () => string;
	buildToken: (claims?: Partial<IdTokenClaims>) => Promise<string>;
}

/**
 * Set up an OAuth server for testing.
 *
 * @param opts Options for the setup.
 * @returns The OAuth server holder.
 */
export const setupOAuthServer = (
	opts?: SetupOAuthServerOpts
): SetupOAuthServerHolder => {
	let oAuthServer: OAuth2Server | undefined;

	beforeAll(async () => {
		oAuthServer = new OAuth2Server();

		await oAuthServer.issuer.keys.generate("RS256");
		await oAuthServer.start(await getPort());
	});

	afterAll(async () => {
		await oAuthServer?.stop();
	});

	beforeEach(async () => {
		if ((opts?.setupEnvVars ?? true) && oAuthServer?.issuer.url) {
			vi.stubEnv("APP_GH_ISSUER", oAuthServer?.issuer.url);
		}
	});

	return {
		getUrl: () => oAuthServer?.issuer.url ?? "",
		buildToken: async (claims) => {
			if (!oAuthServer?.issuer) {
				throw new Error("Server not started");
			}

			return await oAuthServer.issuer.buildToken({
				scopesOrTransform: (_, payload) => {
					payload.aud = "github-workflow-dispatch-proxy";
					Object.entries(claims ?? {}).forEach(([key, value]) => {
						payload[key] = value;
					});
				},
			});
		},
	};
};
