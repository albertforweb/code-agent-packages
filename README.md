# CodeAgent Feature Packages

This repo owns CodeAgent feature package source trees and local artifact builds.

Current package:

- `software-developer`: paid package for Project Studio, optional fully autonomous delivery, virtual teams, automation, and developer-specific settings.

Build artifacts:

```sh
npm install --legacy-peer-deps
npm run build
```

The build writes installable local artifacts under `dist-feature-packages/`. The core `code-agent` repo reads package manifests from this repo to generate its local development catalog projection, but package source and built artifacts stay here.

The local build signs each artifact descriptor with a development Ed25519 key and records the archive SHA-256, signing key id, signed payload hash, descriptor signature, and per-file hashes. The generated tarball is served by local `agent-platform` through `/code-agent/packages/{package_id}/artifact` when the Docker compose artifact-store mount points at `dist-feature-packages/`:

```sh
code-agent platform install software-developer
```

For package development without platform download, pass `--archive-path` or set `CODEAGENT_FEATURE_PACKAGE_DIST_ROOT` to this repo's `dist-feature-packages/` directory.

Production publishing still needs managed signing keys and durable platform/vendor artifact storage instead of the checked-in development key.
