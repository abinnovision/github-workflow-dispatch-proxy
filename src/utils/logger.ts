import { pino } from "pino";

import type { Logger } from "pino";

const _logger = pino({
	level: process.env.APP_LOG_LEVEL || "info",
	redact: ["config.GH_AUTH_APP_PRIVATE_KEY", "config.GH_AUTH_TOKEN"],
});

/**
 * Provides a logger with the given module name.
 *
 * @param module Name of the module to include in the logger.
 */
export const getLogger = (module?: string): Logger => {
	if (!module) {
		return _logger;
	}

	return _logger.child({ module });
};
