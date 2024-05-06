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

// Create a cache to store the access tokens for repositories.
// This is only applicable for the app authentication.
const _tokenCache = new LRUCache<string, string>({ max: 100 });

// Create an AsyncLocalStorage instance to store the token for the current
// execution context.
const _authCallbackAls = new AsyncLocalStorage<string>();

// Create a base Octokit instance that uses the callback auth strategy.
// Will use the token from the previously defined AsyncLocalStorage.
let _baseOctokit = new Octokit({
	authStrategy: createCallbackAuth,
	auth: {
		callback: () => _authCallbackAls.getStore(),
	},
});

/**
 * Provides an Octokit instance with the given token as authentication.
 *
 * @param token The token to use for authentication.
 * @param callback The callback to run with the Octokit instance.
 */
async function runOctokit<T>(
	token: string,
	callback: (octokit: Octokit) => Promise<T>
): Promise<T> {
	return await _authCallbackAls.run(
		token,
		async () => await callback(_baseOctokit)
	);
}

/**
 * Resolves the access token for the given repository.
 *
 * @param id Identification of the repository.
 */
async function resolveAccessToken(id: RepositoryIdentity): Promise<string> {
	const config = getConfig();

	if (config.GH_AUTH_TYPE === "token") {
		return config.GH_AUTH_TOKEN;
	} else {
		// The app authentication requires a bit more work.
		const key = `${id.owner}/${id.repo}`;

		// Check if the token is already cached.
		if (!_tokenCache.has(key)) {
			try {
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

				// Cache the token for half of the time it is valid.
				const cacheTtl =
					(new Date(installationAuth.expiresAt).getTime() - Date.now()) / 2;

				_tokenCache.set(key, installationAuth.token, { ttl: cacheTtl });
			} catch (e) {
				throw new GitHubAuthError(
					"Failed to resolve access token",
					e instanceof Error ? e : undefined
				);
			}
		}

		return _tokenCache.get(key)!;
	}
}

export async function sendWorkflowDispatch(opts: WorkflowDispatchOpts) {
	const token = await resolveAccessToken({
		owner: opts.owner,
		repo: opts.repo,
	});

	try {
		await runOctokit(token, async (octokit) => {
			await octokit.rest.actions.createWorkflowDispatch({
				owner: opts.owner,
				repo: opts.repo,
				ref: opts.ref,
				workflow_id: opts.workflow,
				inputs: opts.inputs,
			});
		});
	} catch (e) {
		throw new GitHubDispatchError(
			"Failed to dispatch workflow",
			e instanceof Error ? e : undefined
		);
	}
}

/**
 * Error thrown when something around the policy fails.
 */
export class GitHubAuthError extends Error {
	public constructor(message: string, cause?: Error) {
		super(message);
		this.name = "GitHubAuthError";
		this.cause = cause;
	}
}

/**
 * Error thrown when something around the policy fails.
 */
export class GitHubDispatchError extends Error {
	public constructor(message: string, cause?: Error) {
		super(message);
		this.name = "GitHubDispatchError";
		this.cause = cause;
	}
}
