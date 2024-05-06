import contentJson from "../assets/openapi/openapi.json";
import contentYaml from "../assets/openapi/openapi.yaml";

/**
 * Provides the OpenAPI specification as a string in YAML format.
 */
export async function getOpenApiSpec(type: "yaml" | "json"): Promise<string> {
	if (type === "yaml") {
		return contentYaml;
	} else {
		return JSON.stringify(contentJson);
	}
}
