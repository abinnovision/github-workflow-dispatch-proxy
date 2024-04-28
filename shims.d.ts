declare module "@open-policy-agent/opa-wasm" {
	import type { loadPolicy as _loadPolicy } from "@open-policy-agent/opa-wasm/dist/types";
	import type * as opa from "@open-policy-agent/opa-wasm/dist/types/opa";

	export const loadPolicy: typeof _loadPolicy;
	export default opa;
}
