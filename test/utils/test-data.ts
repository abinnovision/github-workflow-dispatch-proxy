import type { IdTokenClaims } from "../../src/dispatch-handler/id-token";

/**
 * Test data for the OIDC token claims.
 *
 * @see https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#understanding-the-oidc-token
 */
export const testDataIdTokenClaims = {
	environment: "prod",
	ref: "refs/heads/main",
	sha: "example-sha",
	repository: "octo-org/octo-repo",
	repository_owner: "octo-org",
	actor_id: "12",
	repository_visibility: "private",
	repository_id: "74",
	repository_owner_id: "65",
	run_id: "example-run-id",
	run_number: "10",
	run_attempt: "2",
	runner_environment: "github-hosted",
	actor: "octocat",
	workflow: "example-workflow",
	head_ref: "",
	base_ref: "",
	event_name: "workflow_dispatch",
	ref_type: "branch",
	job_workflow_ref:
		"octo-org/octo-automation/.github/workflows/oidc.yml@refs/heads/main",
} satisfies IdTokenClaims;
