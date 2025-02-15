import { z } from "zod";

import { getRepositoryDefaultBranch, sendWorkflowDispatch } from "./github.js";
import { decodeIdToken, getJwtVerifier } from "./id-token.js";
import { evaluatePolicyForRequest } from "./policy.js";
import { getLoggerForRequest } from "../utils/logger.js";

import type { PolicyInput } from "./policy.js";
import type { Request, RequestHandler } from "express";

const bodySchema = z.object({
	target: z.object({
		owner: z.string(),
		repo: z.string(),
		ref: z.string().optional(),
		workflow: z.string(),
	}),

	inputs: z.record(z.string(), z.string()).optional(),
});

const responseContentType = "application/json";
const authorizationHeaderPrefix = "Bearer ";

/**
 * Extracts the ID token from the request.
 *
 * @param req The request to extract the ID token from.
 * @returns The ID token or undefined if it could not be extracted.
 */
const extractIdToken = async (req: Request): Promise<string | undefined> => {
	if (!req.headers.authorization) {
		return undefined;
	}

	const value = req.headers.authorization!;
	if (!value.startsWith(authorizationHeaderPrefix)) {
		return undefined;
	}

	return value.slice(authorizationHeaderPrefix.length);
};

export const dispatchControllerFactory: () => Promise<RequestHandler> =
	async () => {
		const jwtVerifier = await getJwtVerifier();

		return async (req, res) => {
			const _reqLogger = getLoggerForRequest(req);
			_reqLogger.debug({ req }, "Processing request");

			// Validate the ID token.
			let idToken;
			try {
				const idTokenValue = await extractIdToken(req);
				if (!idTokenValue) {
					_reqLogger.warn("Missing ID token");
					return res
						.status(401)
						.header("content-type", responseContentType)
						.json({ error: "Missing authentication" });
				}

				idToken = await decodeIdToken(jwtVerifier, idTokenValue);
			} catch (e) {
				_reqLogger.warn({ error: e }, "Failed to decode ID token");
				return res
					.status(400)
					.header("content-type", responseContentType)
					.json({ error: "Failed to decode ID token" });
			}

			let body;
			try {
				body = await bodySchema.parseAsync(await req.body);
			} catch (e) {
				return res
					.status(400)
					.header("content-type", responseContentType)
					.json({ error: "Invalid request body" });
			}

			// The ref is optional, so we need to check if it is present.
			// If it's not present, we need to resolve the default branch.
			let enrichedTargetRef = body.target.ref;
			if (!enrichedTargetRef) {
				enrichedTargetRef = await getRepositoryDefaultBranch({
					owner: body.target.owner,
					repo: body.target.repo,
				});
			}

			// Map the body to the policy input.
			const policyInput: PolicyInput = {
				target: {
					owner: body.target.owner,
					repository: body.target.repo,
					ref: enrichedTargetRef,
					workflow: body.target.workflow,
					inputs: body.inputs,
				},
				caller: {
					owner: idToken.repository_owner,
					repository: idToken.repository.split("/")[1],
					ref: idToken.ref,
					workflow: idToken.workflow,
				},
			};

			// Evaluate the policy.
			try {
				const policyResult = await evaluatePolicyForRequest(policyInput);

				if (!policyResult) {
					return res
						.status(401)
						.header("content-type", responseContentType)
						.json({ error: "Request blocked by policy" });
				}
			} catch (e) {
				_reqLogger.warn({ error: e }, "Failed to evaluate policy");
				return res
					.status(401)
					.header("content-type", responseContentType)
					.json({ error: "Request blocked by policy" });
			}

			// Send the workflow dispatch.
			try {
				await sendWorkflowDispatch({
					...body.target,
					ref: enrichedTargetRef,
					inputs: body.inputs,
				});
			} catch (e) {
				_reqLogger.warn({ error: e }, "Failed to send workflow dispatch");
				return res
					.status(500)
					.header("content-type", responseContentType)
					.json({ error: "Failed to send workflow dispatch" });
			}

			_reqLogger.info(policyInput, "Workflow dispatch created");

			return res.status(200).json({
				message: "workflow dispatch created",
			});
		};
	};
