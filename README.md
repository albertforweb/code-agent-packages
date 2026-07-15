# CodeAgent Feature Packages

This repo owns CodeAgent feature package source trees and local artifact builds.

Current package:

- `software-developer`: paid package for Project Studio, automation, developer tools, MCP, developer history, and developer settings.

Build artifacts:

```sh
npm install --legacy-peer-deps
npm run build
```

The build writes installable local artifacts under `dist-feature-packages/`. The core `code-agent` repo reads package manifests from this repo to generate its local development catalog projection, but package source and built artifacts stay here.
