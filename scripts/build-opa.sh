#/bin/sh

set -e

# Validate OPA is installed
if ! opa version >> /dev/null 2>&1; then
	echo "OPA is not installed. Please install OPA and try again."
	exit 1
fi

# Validate the CWD is the root directory of the project
if [ ! -f package.json ]; then
	echo "This script must be run from the root directory of the project."
	exit 1
fi

# For all OPA files in the policies directory, build them into a single WASM file.
for policy in $(find policies -name '*.rego'); do
	echo "Building $policy"
	opa build -t wasm -e main -o policies/bundle.tar.gz $policy
	# Extract the policy.wasm from the tarball
	tar -xzf policies/bundle.tar.gz -C policies/ /policy.wasm
	mv policies/policy.wasm policies/$(basename $policy .rego).wasm
	rm policies/bundle.tar.gz
done
