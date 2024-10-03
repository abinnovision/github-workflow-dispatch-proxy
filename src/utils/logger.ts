import { pino } from "pino";

import type { Request } from "express";
import type { Logger } from "pino";

const _logger = pino({
	level: process.env.APP_LOG_LEVEL || "info",
	redact: [
		"config.GH_AUTH_APP_PRIVATE_KEY",
		"config.GH_AUTH_TOKEN",
		"req.headers.authorization",
	],
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

/**
 * Provides the logger for the given request.
 *
 * @param req The request to get the logger for.
 */
export const getLoggerForRequest = (req: Request): Logger => {
	const logInterface = (req as any).log as pino.Logger;
	if (!logInterface) {
		throw new Error("Request does not have a logger");
	}

	return logInterface;
};
