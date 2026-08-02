# CodeAgent Software Developer Package

This directory is the distributable source boundary for the paid `software-developer` feature package.

The current artifact contains the package manifest, SDK extension metadata, distribution metadata, the package runtime built from `src/runtime.ts`, and CLI Project Studio/Automation handlers under `src/cli`. Desktop renderer modules are still being extracted from the monolithic CodeAgent renderer; `scripts/verify-feature-package-boundaries.mjs --strict` is the gate that should fail until that extraction is complete.

Current and target package contents:

- `manifest.json`: public package manifest, entitlements, shell adapters, and feature metadata.
- `src/runtime.ts`: SDK runtime entrypoint that registers manifest-declared extensions and exports package CLI handlers.
- `src/cli`: package-owned CLI Project Studio and Automation implementation.
- `dist/index.js`: built package runtime in the generated artifact.
- `dist/desktop`: future desktop package entrypoints and route/view registrations.
- `dist/cli`: future split CLI command registrations and handlers if the runtime bundle is decomposed.
- `dist/services`: future shared package services.
- `artifact.json`: build metadata, hashes, and signature metadata.

The base CodeAgent app should eventually ship without `dist/desktop`, `dist/cli`, or `dist/services` for this package.
