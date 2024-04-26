import { pino } from "pino";

import type { Logger } from "pino";

const _logger = pino({
	level: process.env.APP_LOG_LEVEL || "info",
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
		},
	},
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
