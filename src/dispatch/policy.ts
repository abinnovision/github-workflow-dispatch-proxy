import { createCrossPolicy } from "@cross-policy/core";
import { opaWasmPolicyTarget } from "@cross-policy/target-opa-wasm";
import * as path from "path";
import z from "zod";

import { getConfig } from "../utils/config.js";

// The built-in policies.
const builtInPolicyMapping = {
	allow_all: "allow_all.wasm",
	allow_org_wide: "allow_org_wide.wasm",
};

/**
 * Provides the policy to use based on the current config.
 */
function getPolicyPath(): string {
	const config = getConfig();

	let policyPath: string;
	if (config.POLICY === "custom") {
		policyPath = config.POLICY_PATH;
	} else {
		policyPath = path.join(
			process.env.POLICY_DIR as string,
			builtInPolicyMapping[config.POLICY_TYPE]
		);
	}

	return policyPath;
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
	target: opaWasmPolicyTarget({ policyPath: getPolicyPath() }),
	schema,
});

/**
 * Parses the policy configuration.
 * @param value
 */
async function parsePolicyConfig(
	value: string
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
	input: Pick<PolicyInput, "target" | "caller">
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
