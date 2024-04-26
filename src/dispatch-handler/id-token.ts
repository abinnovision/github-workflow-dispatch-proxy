import { createRemoteJWKSet, jwtVerify } from "jose";
import { Issuer } from "openid-client";

import { getConfig } from "../utils/config";

import type { JWTPayload } from "jose";

/**
 * All possible claims that can be found in the ID token.
 */
export interface IdTokenClaims extends JWTPayload {
	environment: string;
	ref: string;
	sha: string;
	repository: string;
	repository_owner: string;
	actor_id: string;
	repository_visibility: string;
	repository_id: string;
	repository_owner_id: string;
	run_id: string;
	run_number: string;
	run_attempt: string;
	runner_environment: string;
	actor: string;
	workflow: string;
	head_ref: string;
	base_ref: string;
	event_name: string;
	ref_type: string;
	job_workflow_ref: string;
}

export class IdTokenError extends Error {
	public constructor(message: string, cause?: Error) {
		super(message);
		this.name = "IdTokenError";
		this.cause = cause;
	}
}

/**
 * Validates the ID token from GitHub.
 *
 * @param token The ID token to validate.
 * @throws IdTokenError If the IdToken could not be decoded or verified.
 */
export const decodeIdToken = async (token: string): Promise<IdTokenClaims> => {
	const config = getConfig();

	let issuer: Issuer;
	try {
		issuer = await Issuer.discover(config.GH_ISSUER);
	} catch (e) {
		throw new IdTokenError(
			"Failed to discover GitHub issuer",
			e instanceof Error ? e : undefined
		);
	}

	try {
		const jwks = createRemoteJWKSet(new URL(issuer.metadata.jwks_uri ?? ""));

		const decoded = await jwtVerify<IdTokenClaims>(token, jwks, {
			issuer: issuer.metadata.issuer,
			audience: "github-workflow-dispatch-proxy",
		});

		return decoded.payload;
	} catch (e) {
		throw new IdTokenError(
			"Failed to decode/verify IdToken",
			e instanceof Error ? e : undefined
		);
	}
};
