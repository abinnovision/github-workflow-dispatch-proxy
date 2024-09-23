import { z } from "zod";

import { sendWorkflowDispatch } from "./github.js";
import { decodeIdToken, getJwtVerifier } from "./id-token.js";
import { evaluatePolicyForRequest, getPolicy } from "./policy.js";
import { getLogger } from "../utils/logger.js";

import type { IdTokenClaims } from "./id-token.js";
import type { PolicyInput } from "./policy.js";
import type { RequestHandler } from "express";

const _logger = getLogger("handler/controller");

const bodySchema = z.object({
	idToken: z.string(),

	target: z.object({
		owner: z.string(),
		repo: z.string(),
		ref: z.string(),
		workflow: z.string(),
	}),

	inputs: z.record(z.string(), z.string()).optional(),
});

const responseContentType = "application/json";

/**
 * Map the request body to a policy input.
 *
 * @param body
 * @param idToken
 */
const mapPolicyInput = (
	body: z.infer<typeof bodySchema>,
	idToken: IdTokenClaims
): Pick<PolicyInput, "target" | "caller"> => ({
	target: {
		owner: body.target.owner,
		repository: body.target.repo,
		ref: body.target.ref,
		workflow: body.target.workflow,
		inputs: body.inputs,
	},
	caller: {
		owner: idToken.repository_owner,
		repository: idToken.repository.split("/")[1],
		ref: idToken.ref,
		workflow: idToken.workflow,
	},
});

export const dispatchControllerFactory: () => Promise<RequestHandler> =
	async () => {
		const jwtVerifier = await getJwtVerifier();
		const policy = await getPolicy();

		return async (req, res) => {
			_logger.debug({ req }, "Processing request");

			let body;
			try {
				body = await bodySchema.parseAsync(await req.body);
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (e) {
				return res
					.status(400)
					.header("content-type", responseContentType)
					.json({ error: "Invalid request body" });
			}

			// Validate the ID token.
			let idToken;
			try {
				idToken = await decodeIdToken(jwtVerifier, body.idToken);
			} catch (e) {
				_logger.warn({ error: e }, "Failed to decode ID token");
				return res
					.status(400)
					.header("content-type", responseContentType)
					.json({ error: "Failed to decode ID token" });
			}

			// Map the body to the policy input.
			const policyInput = mapPolicyInput(body, idToken);

			// Evaluate the policy.
			try {
				const policyResult = await evaluatePolicyForRequest(
					policy,
					policyInput
				);

				if (!policyResult) {
					return res
						.status(401)
						.header("content-type", responseContentType)
						.json({ error: "Request blocked by policy" });
				}
			} catch (e) {
				_logger.warn({ error: e }, "Failed to evaluate policy");
				return res
					.status(401)
					.header("content-type", responseContentType)
					.json({ error: "Request blocked by policy" });
			}

			// Send the workflow dispatch.
			try {
				await sendWorkflowDispatch({
					...body.target,
					inputs: body.inputs,
				});
			} catch (e) {
				_logger.warn({ error: e }, "Failed to send workflow dispatch");
				return res
					.status(500)
					.header("content-type", responseContentType)
					.json({ error: "Failed to send workflow dispatch" });
			}

			_logger.info(policyInput, "Workflow dispatch created");

			return res.status(200).json({
				message: "workflow dispatch created",
			});
		};
	};
