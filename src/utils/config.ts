import { z } from "zod";

import { getLogger } from "./logger.js";

// The prefix to use for environment variables.
const PREFIX = "APP_";

// Cache for the configuration object.
let _cachedConfig: z.infer<typeof configSchema> | null = null;

const _logger = getLogger("utils/config");

const baseSchema = z.object({
	PORT: z.coerce.number().default(8080),
	ORGANIZATION: z.string().optional(),
	BASE_PATH: z.string().default("/"),

	GH_ISSUER: z.string().default("https://token.actions.githubusercontent.com"),
});

const policySchema = z.discriminatedUnion("POLICY", [
	z.object({
		POLICY: z.literal("builtin").default("builtin"),
		POLICY_TYPE: z.enum(["allow_all", "allow_org_wide"]).default("allow_all"),
		POLICY_CONFIG: z.string().optional(),
	}),
	z.object({
		POLICY: z.literal("custom"),
		POLICY_PATH: z.string(),
		POLICY_CONFIG: z.string().optional(),
	}),
]);

const githubAuthSchema = z.discriminatedUnion("GH_AUTH_TYPE", [
	z.object({
		GH_AUTH_TYPE: z.literal("app"),
		GH_AUTH_APP_ID: z.string(),
		GH_AUTH_APP_PRIVATE_KEY: z.string(),
	}),
	z.object({
		GH_AUTH_TYPE: z.literal("token"),
		GH_AUTH_TOKEN: z.string(),
	}),
]);

const configSchema = z.intersection(
	baseSchema,
	z.intersection(policySchema, githubAuthSchema)
);

/**
 * Applies the default values to the environment variables.
 * This must be done before parsing the object with Zod as the
 * discriminated unions do not properly handle defaults.
 *
 * @param raw Raw environment variables.
 */
function applyDefaults(raw: Record<string, string>): void {
	if (!raw.POLICY) {
		raw.POLICY = "builtin";
	}

	if (!raw.POLICY_TYPE) {
		raw.POLICY_TYPE = "allow_all";
	}
}

/**
 * Parses the environment variables and returns the configuration object.
 */
function parseConfig(): z.infer<typeof configSchema> {
	const filteredEnvVars = Object.fromEntries(
		Object.entries(process.env)
			.filter(([key]) => key.startsWith(PREFIX))
			.filter((it): it is [string, string] => it[1] !== undefined)
			.map(([key, value]) => [key.slice(PREFIX.length), value])
	);

	// Apply the defaults to the environment variables.
	applyDefaults(filteredEnvVars);

	try {
		return configSchema.parse(filteredEnvVars);
	} catch (error) {
		if (error instanceof z.ZodError) {
			_logger.error({ issues: error.issues }, "Invalid configuration");
		}

		throw error;
	}
}

/**
 * Returns the configuration object.
 */
export function getConfig(): z.infer<typeof configSchema> {
	if (_cachedConfig === null) {
		_cachedConfig = parseConfig();
	}

	return _cachedConfig;
}
