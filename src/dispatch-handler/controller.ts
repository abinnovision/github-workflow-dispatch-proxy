import { z } from "zod";

import { sendWorkflowDispatch } from "./github";
import { decodeIdToken } from "./id-token";
import { evaluatePolicyForRequest } from "./policy";
import { getLogger } from "../utils/logger";

import type { IdTokenClaims } from "./id-token";
import type { PolicyInput } from "./policy";
import type { UserRouteHandler } from "hyper-express/types/components/router/Router";

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
 * Parse the request body and return it.
 *
 * @param req
 */
const parseBody = async (
	req: Parameters<UserRouteHandler>[0]
): Promise<z.infer<typeof bodySchema> | undefined> => {
	try {
		return await bodySchema.parseAsync(await req.json());
	} catch (e) {
		_logger.debug({ error: e }, "Invalid request body");
		return undefined;
	}
};

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

export const dispatchHandlerController: UserRouteHandler = async (req, res) => {
	const body = await parseBody(req);

	// If the body is not valid, return an error.
	if (body === undefined) {
		return res
			.status(400)
			.header("content-type", responseContentType)
			.json({ error: "Invalid request body" });
	}

	// Validate the ID token.
	let idToken;
	try {
		idToken = await decodeIdToken(body.idToken);
	} catch (e) {
		_logger.debug({ error: e }, "Failed to decode ID token");
		return res
			.status(400)
			.header("content-type", responseContentType)
			.json({ error: "Failed to decode ID token" });
	}

	// Evaluate the policy.
	try {
		const input = mapPolicyInput(body, idToken);

		const policyResult = await evaluatePolicyForRequest(input);
		if (!policyResult) {
			return res
				.status(401)
				.header("content-type", responseContentType)
				.json({ error: "Request blocked by policy" });
		}
	} catch (e) {
		_logger.debug({ error: e }, "Failed to evaluate policy");
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
		return res
			.status(500)
			.header("content-type", responseContentType)
			.json({ error: "Failed to send workflow dispatch" });
	}

	return res.status(200).send();
};
