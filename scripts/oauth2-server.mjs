import {OAuth2Server} from 'oauth2-mock-server';
import {getPort} from 'get-port-please';
import {z} from 'zod';
import * as fsp from 'fs/promises';
import * as path from 'path';

const claimsSchema = z.object({
	environment: z.string(),
	ref: z.string(),
	sha: z.string(),
	repository: z.string(),
	repository_owner: z.string(),
	actor_id: z.string(),
	repository_visibility: z.string(),
	repository_id: z.string(),
	repository_owner_id: z.string(),
	run_id: z.string(),
	run_number: z.string(),
	run_attempt: z.string(),
	runner_environment: z.string(),
	actor: z.string(),
	workflow: z.string(),
	head_ref: z.string(),
	base_ref: z.string(),
	event_name: z.string(),
	ref_type: z.string(),
	job_workflow_ref: z.string(),
}).partial();

/**
 * Provides the claims from an external source.
 * This will resolve the filename on the fist argument and return the claims.
 */
async function getClaims() {
	const filename = process.argv[2];
	const absoluteFilename = path.resolve(process.cwd(), filename);

	try {
		const content = await fsp.readFile(absoluteFilename, 'utf-8');

		return claimsSchema.parse(JSON.parse(content));
	} catch (error) {
		console.error('Unable to load claims', error);
		process.exit(1);
	}
}

let server = new OAuth2Server();

await server.issuer.keys.generate('RS256');

await server.start(await getPort(), 'localhost');

const tokenClaims = await getClaims();

const token = await server.issuer.buildToken({
	scopesOrTransform: (_, payload) => {
		payload['aud'] = 'github-workflow-dispatch-proxy';
		Object.entries(tokenClaims).forEach(([key, value]) => {
			payload[key] = value;
		});
	},
});

console.log('Issuer URL:', server.issuer.url);
console.log('Token:', token);
console.log('Claims:', JSON.stringify(tokenClaims));

process.on('SIGINT', async () => {
	await server.stop();
	console.log('Server stopped');
	process.exit(0);
});
