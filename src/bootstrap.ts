import { Server } from "hyper-express";

import { dispatchHandlerController } from "./dispatch-handler/controller";
import { getConfig } from "./utils/config";
import { getLogger } from "./utils/logger";

export const bootstrap = (async () => {
	// Load the configuration first to make sure it's valid.
	const config = getConfig();
	const logger = getLogger("bootstrap");

	const server = new Server();

	// Register the handler controller.
	server.post("/dispatch", dispatchHandlerController);

	server.set_not_found_handler((req, res) => {
		res.status(404).send("Not found");
	});

	await server.listen(config.PORT);
	logger.info({ port: config.PORT }, "Server started on port %d", config.PORT);

	return {
		server,
		shutdown: () => server?.close(),
	};
})();
