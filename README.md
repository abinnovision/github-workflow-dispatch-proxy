# github-workflow-dispatch-proxy

Proxy for GitHub Actions' `workflow_dispatch` event to allow authenticated
access.
This can be used to call a workflow dispatch from a GitHub Actions workflow.

It's based on
the [OIDC Connect implementation](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
of GitHub Actions and uses the provided ID token to authenticate the request.

## Installation

The proxy is distributed as
a [Docker image](https://github.com/abinnovision/github-workflow-dispatch-proxy/pkgs/container/github-workflow-dispatch-proxy):

[//]: # "x-release-please-start-version"

```bash
docker run -d \
  --name github-workflow-dispatch-proxy \
  -p 8080:8080 \
  ghcr.io/abinnovision/github-workflow-dispatch-proxy:sha-6bd5b3d
```

[//]: # "x-release-please-end"

## Configuration

The proxy is configured via environment variables.
The following environment variables are supported:

| Name                          | Description                                                                          | Default     | Note                                       |
| ----------------------------- | ------------------------------------------------------------------------------------ | ----------- | ------------------------------------------ |
| `APP_PORT`                    | Port to listen on.                                                                   | `8080`      |                                            |
| `APP_BASE_PATH`               | Base path fo the proxy.                                                              | `/`         |                                            |
| `APP_POLICY`                  | Policy to use, either `builtin` or `custom`.                                         | `builtin`   |                                            |
| `APP_POLICY_TYPE`             | Type of the builtin policy to use, either `allow_all` or `allow_org_wide`.           | `allow_all` |                                            |
| `APP_POLICY_CONFIG`           | Config to pass to the policy evaluation. Format: `key=value;key=value`               |             |                                            |
| `APP_POLICY_PATH`             | Path to the custom policy (_.wasm_).                                                 |             |                                            |
| `APP_GH_AUTH_TYPE`            | Type of the GitHub authentication to use, either `app` or `token`.                   |             | **Required**                               |
| `APP_GH_AUTH_APP_ID`          | ID of the GitHub App to use for authentication. (Only for `app` auth type.)          |             | Required if `APP_GH_AUTH_TYPE` is `app`.   |
| `APP_GH_AUTH_APP_PRIVATE_KEY` | Private key of the GitHub App to use for authentication. (Only for `app` auth type.) |             | Required if `APP_GH_AUTH_TYPE` is `app`.   |
| `APP_GH_AUTH_TOKEN`           | Token to use for authentication. (Only for `token` auth type.)                       |             | Required if `APP_GH_AUTH_TYPE` is `token`. |

## Policies

Policies are used to determine whether a request is allowed or not.
The implementation is based on
the [Open Policy Agent (OPA)](https://www.openpolicyagent.org/).

### Built-in Policies

#### `allow_all`

This policy allows all requests.

#### `allow_org_wide`

This policy allows all requests from within the configured organization.
It requires the `organization` configuration to be set on the
`APP_POLICY_CONFIG` environment variable.

### Custom Policies

Custom policies can be used by setting the `APP_POLICY` environment variable
to `custom` and providing the path to the policy file via `APP_POLICY_PATH`. The
policy file must be a valid WebAssembly file built with
[Open Policy Agent (OPA)](https://www.openpolicyagent.org/).

To get started,
you can use the [OPA Playground](https://play.openpolicyagent.org/) to write
your policy using Rego.
Also, see the
source [code of the built-in policies for examples](./policies).

[This script](./policies/build.sh) can be used to build the policy file. It can
be place in the folder with many .rego files and it will build a .wasm file in
the same folder for each .rego file.

#### Input schema for policies

The input schema for the policy is defined as follows:

```json5
{
	// Can be empty if not provided.
	config: {
		key: "value",
	},
	target: {
		owner: "owner",
		repository: "repository",
		ref: "ref",
		workflow: "workflow",
		// Can be empty if none are required.
		inputs: {
			key: "value",
		},
	},
	caller: {
		owner: "owner",
		repository: "repository",
		ref: "ref",
		workflow: "workflow",
	},
}
```

## Usage with GitHub Actions

The main idea of this proxy is to allow GitHub Actions to call a workflow
dispatch from a workflow by using policy evaluation.
That's why the proxy should easily be integrated into a GitHub Actions workflow.

### Example without an additional action

The proxy can easily be used by using curl.
First, you'd need to fetch the ID token from the GitHub Actions API.
Then, you can use curl to send the workflow dispatch request to the proxy.

```yaml
jobs:
  dispatch-workflow:
    name: Dispatch workflow
    runs-on: ubuntu-latest
    steps:
      - name: Dispatch workflow
        run: |
          ID_TOKEN_RESPONSE=$(curl -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=github-workflow-dispatch-proxy")
          ID_TOKEN=$(echo $ID_TOKEN_RESPONSE | jq -r ".value")

          curl --header "Content-Type: application/json" \
          --request POST \
          --header "Authorization: Bearer $ID_TOKEN" \
          --data '{"target":{"owner":"abinnovision","repo":"github-workflow-dispatch-proxy","ref":"master","workflow":"test.yaml"},"inputs":{}}' \
          https://<endpoint>/dispatch
```

### Example with abinnovision/actions/run-workflow-dispatch

This example uses the
[abinnovision/actions@run-workflow-dispatch](https://github.com/abinnovision/actions/blob/master/actions/run-workflow-dispatch/README.md)
action to run the workflow dispatch.

```yaml
jobs:
  dispatch-workflow:
    name: Dispatch workflow
    runs-on: ubuntu-latest
    steps:
      - name: Dispatch workflow
        uses: abinnovision/actions@run-workflow-dispatch-v1
        with:
          proxy: https://<endpoint> # The base URL of the proxy without a trailing slash.
          target: owner/repo # or just repo
          workflow: update.yaml # The workflow to dispatch.
          workflow-ref: master # Optional, defaults to "master".
          # Optional inputs for the workflow. Must be a valid JSON string.
          workflow-inputs: |
            {"key": "value"}
```

## Development

This project is based on a Node.js stack with TypeScript. It uses Yarn as the
package manager. Also, [asdf](https://asdf-vm.com/) is used to manage the
Node.js version.
