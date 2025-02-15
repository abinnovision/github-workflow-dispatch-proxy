import { createRemoteJWKSet, jwtVerify } from "jose";
import { Issuer } from "openid-client";

import { getConfig } from "../utils/config.js";

import type { JWTPayload, JWTVerifyGetKey } from "jose";

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
 * Provides the function to fetch the public key to verify the JWT.
 * Intended to be used with {@link decodeIdToken}.
 *
 * @returns The function to get the public key.
 */
export const getJwtVerifier = async (): Promise<JWTVerifyGetKey> => {
	const config = getConfig();

	let issuer: Issuer;
	try {
		issuer = await Issuer.discover(config.GH_ISSUER);
	} catch (e) {
		throw new IdTokenError(
			"Failed to discover issuer",
			e instanceof Error ? e : undefined,
		);
	}

	const jwksUri = issuer.metadata.jwks_uri;
	if (!jwksUri) {
		throw new IdTokenError("Issuer does not provide JWKS URI");
	}

	return createRemoteJWKSet(new URL(jwksUri));
};

/**
 * Validates the ID token from GitHub.
 *
 * @param jwtVerifier Function to get the public key to verify the token.
 * @param token The ID token to validate.
 * @throws IdTokenError If the IdToken could not be decoded or verified.
 */
export const decodeIdToken = async (
	jwtVerifier: JWTVerifyGetKey,
	token: string,
): Promise<IdTokenClaims> => {
	const config = getConfig();

	try {
		const decoded = await jwtVerify<IdTokenClaims>(token, jwtVerifier, {
			issuer: config.GH_ISSUER,
			audience: "github-workflow-dispatch-proxy",
		});

		return decoded.payload;
	} catch (e) {
		throw new IdTokenError(
			"Failed to decode/verify IdToken",
			e instanceof Error ? e : undefined,
		);
	}
};
