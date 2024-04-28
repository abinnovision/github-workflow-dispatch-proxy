import content from "../assets/openapi/openapi.yaml";

/**
 * Provides the OpenAPI specification as a string in YAML format.
 */
export async function getOpenApiSpec(): Promise<string> {
	return content;
}
