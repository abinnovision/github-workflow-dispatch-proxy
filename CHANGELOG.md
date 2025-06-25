# Changelog

## [1.1.1](https://github.com/abinnovision/github-workflow-dispatch-proxy/compare/v1.1.0...v1.1.1) (2025-06-25)


### Bug Fixes

* add authentication to repo.get request ([#98](https://github.com/abinnovision/github-workflow-dispatch-proxy/issues/98)) ([42ee1bb](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/42ee1bb3bd23732c52643e564c74d9c0b9ca9da1))

## [1.1.0](https://github.com/abinnovision/github-workflow-dispatch-proxy/compare/v1.0.1...v1.1.0) (2025-06-25)


### Features

* migrate to cross-policy ([#66](https://github.com/abinnovision/github-workflow-dispatch-proxy/issues/66)) ([8a14262](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/8a142624e28a8126690e737663e81301a8d7b6eb))
* set "ref" as optional and fetch the default branch if necessary ([#91](https://github.com/abinnovision/github-workflow-dispatch-proxy/issues/91)) ([4f9b66e](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/4f9b66eedb8063b3666c589b570d7914af8520c8))
* support CEL as policy ([#97](https://github.com/abinnovision/github-workflow-dispatch-proxy/issues/97)) ([976c065](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/976c065ae0f535d8263788cb15168576b54fe3ec))


### Bug Fixes

* add warning log when request body is invalid ([39749fc](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/39749fcc1870c3a230e0aee5308eb4149793a360))

## [1.0.1](https://github.com/abinnovision/github-workflow-dispatch-proxy/compare/v1.0.0...v1.0.1) (2024-10-18)


### Bug Fixes

* exclude /healthz requests from auto-logging ([#26](https://github.com/abinnovision/github-workflow-dispatch-proxy/issues/26)) ([b0eeba4](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/b0eeba4d3d9d21fa3926abb08f2d86b275f8b7d0))

## 1.0.0 (2024-10-03)


### Features

* add OpenAPI spec ([a11afb4](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/a11afb4ef5e87e466434362f9050309f6d23da5e))
* add OpenAPI spec ([d9c89e1](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/d9c89e1fb36d3fad5dba4d96083c57460d503f31))
* first implementation draft ([8e970a3](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/8e970a3e58e4f273f6cb961e12bff596a0097348))
* refactor modules to load external dependencies on startup ([763aacb](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/763aacb19220e9491fe5dcf71986be33fcddc100))
* use authorization header for github id token ([#11](https://github.com/abinnovision/github-workflow-dispatch-proxy/issues/11)) ([69d6ca5](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/69d6ca589666ea8dab003a727a681ce4f5d93f95))


### Bug Fixes

* add extended logging for errors ([865b558](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/865b5582097c31736e4765ed3adf5761ce77c8b1))
* add OpenAPI as json ([0ed7a2a](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/0ed7a2a6edb1fda1eab91cde56b9ba7f8904494b))
* add simple healthcheck endpoint ([000f046](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/000f046969b7fa93d4cf453c083cbb8bbb9efd19))
* add ts declarations for .yaml files ([79e66e9](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/79e66e92ca5bdaad805d5117b04e67710c7af31f))
* always use json as response ([fa5be62](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/fa5be626733ef77faf9099c7edf65dccef6efeb9))
* apply not found handler after mounting base router ([2b9d98f](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/2b9d98f90a33ea7ae1772c116fc107ec0a399276))
* apply POLICY_DIR const only for built-in policies ([362a8c1](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/362a8c150735f8533970ced40c37615ec0f0cfe3))
* catch and output bootstrap errors properly ([e587f17](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/e587f179c37dd1a9614fd85fcc7a9a06d4b54f75))
* import openapi.yaml instead of loading it through fs ([90ba115](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/90ba115d460c172025d34e6ff692b5bf04c82521))
* log when a workflow dispatch has been created successfully ([#10](https://github.com/abinnovision/github-workflow-dispatch-proxy/issues/10)) ([ddbd74f](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/ddbd74f07d415a3c2b03cef2d484d13992aadcd6))
* migrate to esm ([24dcd87](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/24dcd87bfc4fee59c2c1ea8f75c1891b136e0174))
* migrate to express ([9bc1b68](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/9bc1b68a35df21488690d77ec6841e25a5f87314))
* move dispatch-handler to dispatch directory ([ed3606a](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/ed3606aecb6db46b02796182a1e677db918cad77))
* redact secrets ([2d2fec5](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/2d2fec5015cd76cf2a6b1687c6577d4d54874301))
* refactor build to support loading built-in policies ([46dc152](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/46dc15281440b05c7f3590e343c681c1eff5dded))
* remove hyper-express from build step ([d410fe5](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/d410fe50d08762b1ae5ec5d318f8348b21bf8517))
* remove pino-pretty transport as default ([6f052ad](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/6f052adc5862ae0080bfc86243745ba10d192522))
* use 8080 as default port ([e36b6e4](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/e36b6e4b9bea0522fb252632aa1ceec7f820c816))
* use default import ([1ab0817](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/1ab08174aa36d56a997c0f01e2acb5a4383faa37))
* use pino-http for logging within controller ([#22](https://github.com/abinnovision/github-workflow-dispatch-proxy/issues/22)) ([aec54fa](https://github.com/abinnovision/github-workflow-dispatch-proxy/commit/aec54fabdd9e62d0b0f751140cf8b72dbcb9201e))
