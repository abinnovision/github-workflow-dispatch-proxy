import { Server } from "hyper-express";

import { dispatchHandlerController } from "./dispatch-handler/controller";
import { getConfig } from "./utils/config";
import { getLogger } from "./utils/logger";
import { getOpenApiSpec } from "./utils/openapi";

/**
 * Describes the result of the bootstrap function.
 * This is mostly used for testing purposes.
 */
interface BootstrapResult {
	/**
	 * Running server instance.
	 */
	server: Server;
	/**
	 * Function to shut down the current server instance.
	 */
	shutdown: () => void;
}

// Main entrypoint to the application, where all the startup logic is defined.
// This function is immediately invoked when the file is imported.
// For testing purposes, the function is exported and provides some helpers.
export const bootstrap = (async (): Promise<BootstrapResult> => {
	// Load the configuration first to make sure it's valid.
	const config = getConfig();
	const logger = getLogger("bootstrap");

	const server = new Server();

	// Register the handler controller.
	server.post("/dispatch", dispatchHandlerController);

	// Serve the OpenAPI specification as a static file.
	server.get("/openapi.yaml", async (_, res) => {
		const content = await getOpenApiSpec();

		res
			.status(200)
			.header(
				"cache-control",
				"public, max-age 172800, stale-while-revalidate 172800"
			)
			.header("content-type", "application/yaml")
			.send(content);
	});

	// Set up a global not found handler
	server.set_not_found_handler((_, res) => {
		res.status(404).json({
			error: "Not found",
		});
	});

	await server.listen(config.PORT);
	logger.info({ port: config.PORT }, "Server started on port %d", config.PORT);

	return {
		server,
		shutdown: () => server?.close(),
	};
})();
