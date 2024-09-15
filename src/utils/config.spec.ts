import { describe, it, vi } from "vitest";

import { getConfig } from "./config.js";

describe("utils/config", () => {
	it("should parse bare minimum configuration", () => {
		vi.stubEnv("APP_GH_AUTH_TYPE", "token");
		vi.stubEnv("APP_GH_AUTH_TOKEN", "token");

		getConfig();
	});
});
