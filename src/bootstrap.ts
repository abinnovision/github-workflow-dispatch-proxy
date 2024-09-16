import bodyParser from "body-parser";
import expressApp, { Router } from "express";

import { dispatchControllerFactory } from "./dispatch/controller.js";
import { getConfig } from "./utils/config.js";
import { getLogger } from "./utils/logger.js";
import { getOpenApiSpec } from "./utils/openapi.js";

import type { Express } from "express";
import type { Server } from "http";

/**
 * Describes the result of the bootstrap function.
 * This is mostly used for testing purposes.
 */
interface BootstrapResult {
	/**
	 * Running application instance.
	 */
	app: Express;

	/**
	 * Running server instance.
	 */
	server: Server;

	/**
	 * Function to shut down the current server instance.
	 */
	shutdown: () => void;
}

const logger = getLogger("bootstrap");

// Main entrypoint to the application, where all the startup logic is defined.
// This function is immediately invoked when the file is imported.
// For testing purposes, the function is exported and provides some helpers.
export const bootstrap = (async (): Promise<BootstrapResult> => {
	// Load the configuration first to make sure it's valid.
	const config = getConfig();

	logger.debug({ config }, "Loaded configuration");

	const app = expressApp();
	app.use(bodyParser.json());

	const baseRouter = Router();

	// Register the handler controller.
	baseRouter.post("/dispatch", await dispatchControllerFactory());

	// Serve the OpenAPI in YAML format.
	baseRouter.get("/openapi.yaml", async (_, res) => {
		const content = await getOpenApiSpec("yaml");

		res
			.status(200)
			.header(
				"cache-control",
				"public, max-age 172800, stale-while-revalidate 172800"
			)
			.header("content-type", "application/yaml")
			.send(content);
	});

	// Serve the OpenAPI in JSON format.
	baseRouter.get("/openapi.json", async (_, res) => {
		const content = await getOpenApiSpec("json");

		res
			.status(200)
			.header(
				"cache-control",
				"public, max-age 172800, stale-while-revalidate 172800"
			)
			.header("content-type", "application/json")
			.send(content);
	});

	// Simple health check endpoint to verify the server is running.
	baseRouter.get("/healthz", (_, res) => {
		res.status(200).json({
			message: "ok",
		});
	});

	// Set up a global not found handler
	app.use((_, res) => {
		res.status(404).json({
			error: "Not found",
		});
	});

	app.use(config.BASE_PATH, baseRouter);

	const server = await new Promise<Server>((resolve, reject) => {
		try {
			const _server = app.listen(config.PORT, () => {
				resolve(_server);
			});
		} catch (e) {
			reject(e);
		}
	});

	logger.info({ port: config.PORT }, "Server started on port %d", config.PORT);

	return {
		app: app,
		server,
		shutdown: () => server?.close(),
	};
})().catch((err) => {
	logger.error({ err }, "Failed to start server");
	process.exit(1);
});
