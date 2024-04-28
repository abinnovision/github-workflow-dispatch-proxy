import { createAppAuth } from "@octokit/auth-app";
import { createCallbackAuth } from "@octokit/auth-callback";
import { AsyncLocalStorage } from "async_hooks";
import { LRUCache } from "lru-cache";
import { Octokit } from "octokit";

import { getConfig } from "../utils/config";

interface RepositoryIdentity {
	owner: string;
	repo: string;
}

interface WorkflowDispatchOpts {
	owner: string;
	repo: string;
	ref: string;
	workflow: string;
	inputs?: Record<string, string>;
}

const _authCallbackAls = new AsyncLocalStorage<string>();

let _baseOctokit = new Octokit({
	authStrategy: createCallbackAuth,
	auth: {
		callback: () => _authCallbackAls.getStore(),
	},
});

async function runOctokit<T>(
	token: string,
	callback: (octokit: Octokit) => Promise<T>
): Promise<T> {
	return await _authCallbackAls.run(
		token,
		async () => await callback(_baseOctokit)
	);
}

const _tokenCache = new LRUCache<string, string>({ max: 100 });

/**
 * Resolves the access token for the given repository.
 *
 * @param id Identification of the repository.
 */
async function resolveAccessToken(id: RepositoryIdentity): Promise<string> {
	const config = getConfig();

	if (config.GH_AUTH_TYPE === "token") {
		return config.GH_AUTH_TOKEN;
	}

	// The app authentication requires a bit more work.
	if (config.GH_AUTH_TYPE === "app") {
		const key = `${id.owner}/${id.repo}`;

		// Check if the token is already cached.
		if (!_tokenCache.has(key)) {
			const appAuth = await createAppAuth({
				appId: config.GH_AUTH_APP_ID,
				privateKey: config.GH_AUTH_APP_PRIVATE_KEY,
			})({ type: "app" });

			const installationId = await runOctokit(
				appAuth.token,
				async (octokit) => {
					const { data } = await octokit.rest.apps.getRepoInstallation({
						owner: id.owner,
						repo: id.repo,
					});

					return data.id;
				}
			);

			const installationAuth = await createAppAuth({
				appId: config.GH_AUTH_APP_ID,
				privateKey: config.GH_AUTH_APP_PRIVATE_KEY,
			})({ type: "installation", installationId });

			_tokenCache.set(key, installationAuth.token, {
				ttl: (new Date(installationAuth.expiresAt).getTime() - Date.now()) / 2,
			});
		}

		return _tokenCache.get(key)!;
	}

	throw new Error("Invalid GH_AUTH_TYPE");
}

export async function sendWorkflowDispatch(opts: WorkflowDispatchOpts) {
	const token = await resolveAccessToken({
		owner: opts.owner,
		repo: opts.repo,
	});

	await runOctokit(token, async (octokit) => {
		await octokit.rest.actions.createWorkflowDispatch({
			owner: opts.owner,
			repo: opts.repo,
			ref: opts.ref,
			workflow_id: opts.workflow,
			inputs: opts.inputs,
		});
	});
}
