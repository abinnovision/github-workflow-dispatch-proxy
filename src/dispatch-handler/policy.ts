// @ts-ignore
import { loadPolicy } from "@open-policy-agent/opa-wasm";
import * as fsp from "fs/promises";
import * as path from "path";
import z from "zod";

import { getConfig } from "../utils/config";
import { getLogger } from "../utils/logger";

// @ts-ignore
import type { LoadedPolicy } from "@open-policy-agent/opa-wasm/dist/types/opa";

const policyInputSchemas = z.object({
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

const _logger = getLogger("handler/policy");

// The built-in policies.
const builtInPolicyMapping = {
	allow_all: path.join(__dirname, "../../policies/allow_all.wasm"),
	allow_org_wide: path.join(__dirname, "../../policies/allow_org_wide.wasm"),
};

/**
 * Reads the policy file from the given path.
 *
 * @param policyPath The path to the policy file.
 * @returns The policy file as an ArrayBuffer.
 */
async function readPolicyFile(policyPath: string): Promise<ArrayBuffer> {
	try {
		return await fsp.readFile(policyPath);
	} catch (error) {
		_logger.error({ error }, "Failed to read policy file");

		throw error;
	}
}

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

async function evaluatePolicy(
	policy: LoadedPolicy,
	opts: PolicyInput
): Promise<boolean> {
	try {
		await policyInputSchemas.parseAsync(opts);
	} catch (error) {
		_logger.error({ error }, "Policy input is not valid");
	}

	const evaluationResult = policy.evaluate(opts);

	const result = evaluationResult[0]?.result?.allow ?? undefined;

	if (result === undefined) {
		_logger.error({ result }, "Policy evaluation result is undefined");
		return false;
	}

	return result;
}

/**
 * Evaluates the policy.
 */
export async function evaluatePolicyForRequest(
	opts: Pick<PolicyInput, "target" | "caller">
): Promise<boolean> {
	const config = getConfig();

	// Decide which policy to use.
	let policyFile: ArrayBuffer;
	if (config.POLICY === "custom") {
		policyFile = await readPolicyFile(config.POLICY_PATH);
	} else {
		policyFile = await readPolicyFile(builtInPolicyMapping[config.POLICY_TYPE]);
	}

	const policy = await loadPolicy(policyFile);

	const inputConfig = config.POLICY_CONFIG
		? await parsePolicyConfig(config.POLICY_CONFIG)
		: {};

	return await evaluatePolicy(policy, {
		...opts,
		config: inputConfig,
	});
}

export type PolicyInput = z.infer<typeof policyInputSchemas>;
