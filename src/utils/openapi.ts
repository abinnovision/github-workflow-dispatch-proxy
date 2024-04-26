import fsp from "fs/promises";
import path from "path";

let _cache: string | null = null;

/**
 * Provides the OpenAPI specification as a string in YAML format.
 */
export async function getOpenApiSpec(): Promise<string> {
	if (!_cache) {
		const specPath = path.join(__dirname, "../assets/openapi/openapi.yaml");

		try {
			_cache = await fsp.readFile(specPath, "utf-8");
		} catch (err) {
			console.error("Failed to read OpenAPI spec file", err);

			throw err;
		}
	}

	return _cache;
}
