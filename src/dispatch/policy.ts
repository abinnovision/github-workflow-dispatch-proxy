import { loadPolicy } from "@open-policy-agent/opa-wasm";
import * as fsp from "fs/promises";
import * as path from "path";
import z from "zod";

import { getConfig } from "../utils/config.js";

import type opa from "@open-policy-agent/opa-wasm";

/**
 * Full schema which will be passed to the policy as context.
 */
const policyContextSchema = z.object({
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

// The built-in policies.
const builtInPolicyMapping = {
	allow_all: "allow_all.wasm",
	allow_org_wide: "allow_org_wide.wasm",
};

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

/**
 * Evaluates the given policy with the provided context.
 * The context must be a valid object, according to the schema.
 *
 * @param policy The policy to evaluate.
 * @param context The context to evaluate the policy with.
 */
async function evaluatePolicy(
	policy: opa.LoadedPolicy,
	context: z.infer<typeof policyContextSchema>
): Promise<boolean> {
	// Validate whether the context is valid.
	try {
		await policyContextSchema.parseAsync(context);
	} catch (error) {
		throw new PolicyError(
			"Invalid context provided",
			error instanceof Error ? error : undefined
		);
	}

	let evaluationResult;
	try {
		evaluationResult = policy.evaluate(context);
	} catch (error) {
		throw new PolicyError(
			"Failed to evaluate policy",
			error instanceof Error ? error : undefined
		);
	}

	const result = evaluationResult[0]?.result?.allow ?? undefined;

	// The result must be a boolean. Undefined indicates an invalid policy.
	if (result === undefined) {
		throw new PolicyError("Policy did not return a result");
	}

	return result;
}

/**
 * Error thrown when something around the policy fails.
 */
export class PolicyError extends Error {
	public constructor(message: string, cause?: Error) {
		super(message);
		this.name = "PolicyError";
		this.cause = cause;
	}
}

/**
 * Provides the policy to use based on the current config.
 */
export async function getPolicy(): Promise<opa.LoadedPolicy> {
	const config = getConfig();

	// Decide which policy to use.
	try {
		let policyFile: ArrayBuffer;
		if (config.POLICY === "custom") {
			policyFile = await fsp.readFile(config.POLICY_PATH);
		} else {
			policyFile = await fsp.readFile(
				path.join(
					process.env.POLICY_DIR as string,
					builtInPolicyMapping[config.POLICY_TYPE]
				)
			);
		}

		return loadPolicy(policyFile);
	} catch (e) {
		throw new PolicyError(
			"Failed to load policy file",
			e instanceof Error ? e : undefined
		);
	}
}

/**
 * Evaluates the given policy using the inputs provided.
 */
export async function evaluatePolicyForRequest(
	policy: opa.LoadedPolicy,
	input: Pick<PolicyInput, "target" | "caller">
): Promise<boolean> {
	const config = getConfig();

	// Parse the policy configuration from the config.
	const inputConfig = config.POLICY_CONFIG
		? await parsePolicyConfig(config.POLICY_CONFIG)
		: {};

	return await evaluatePolicy(policy, {
		...input,
		config: inputConfig,
	});
}

export type PolicyInput = Pick<
	z.infer<typeof policyContextSchema>,
	"caller" | "target"
>;
