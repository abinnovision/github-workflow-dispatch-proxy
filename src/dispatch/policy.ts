import { createCrossPolicy } from "@cross-policy/core";
import { celPolicyTarget } from "@cross-policy/target-cel";
import { opaWasmPolicyTarget } from "@cross-policy/target-opa-wasm";
import z from "zod";

import { getConfig } from "../utils/config.js";

/**
 * Built-in expressions written in CEL.
 */
const builtinExpressions = {
	allow_all: `true`,
	allow_org_wide: `config.organization == caller.owner && config.organization == target.owner`,
};

/**
 * Creates the cross-policy compatible target based on the current config.
 */
function createCrossPolicyTarget() {
	const config = getConfig();

	if (config.POLICY === "opa-wasm") {
		return opaWasmPolicyTarget({
			policyPath: config.POLICY_PATH,
		});
	} else if (config.POLICY === "cel") {
		return celPolicyTarget({
			expression: config.POLICY_EXPRESSION,
		});
	} else if (config.POLICY === "builtin") {
		return celPolicyTarget({
			expression: builtinExpressions[config.POLICY_TYPE],
		});
	} else {
		// This should never happen.
		throw new Error(`Unsupported policy type`);
	}
}

const schema = z.object({
	config: z.record(z.string()),

	target: z.object({
		owner: z.string(),
		repository: z.string(),
		ref: z.string(),
		workflow: z.string(),

		inputs: z.record(z.string()).optional(),
	}),

	caller: z.object({
		owner: z.string(),
		repository: z.string(),
		ref: z.string(),
		workflow: z.string(),
	}),
});

const crossPolicy = createCrossPolicy({
	target: createCrossPolicyTarget(),
	schema,
});

/**
 * Parses the policy configuration.
 * @param value
 */
async function parsePolicyConfig(
	value: string,
): Promise<Record<string, string>> {
	const config: Record<string, string> = {};

	value.split(";").forEach((line) => {
		const [key, value] = line.split("=");
		config[key] = value;
	});

	return config;
}

export type PolicyInput = Pick<z.infer<typeof schema>, "caller" | "target">;

/**
 * Evaluates the given policy using the inputs provided.
 */
export async function evaluatePolicyForRequest(
	input: Pick<PolicyInput, "target" | "caller">,
): Promise<boolean> {
	const config = getConfig();

	// Parse the policy configuration from the config.
	const inputConfig = config.POLICY_CONFIG
		? await parsePolicyConfig(config.POLICY_CONFIG)
		: {};

	return await crossPolicy.evaluate({
		...input,
		config: inputConfig,
	});
}
