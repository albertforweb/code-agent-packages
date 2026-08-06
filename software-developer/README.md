# CodeAgent Software Developer Package

This directory is the distributable source boundary for the paid `software-developer` feature package.

The current artifact contains the package-owned professional workspace catalog, desktop navigation hierarchy, distribution metadata, the package runtime built from `src/runtime.ts`, and CLI Project Studio/Automation handlers under `src/cli`. CodeAgent renders package navigation generically from these registrations, and agent-platform publishes this manifest directly from the signed artifact output.

Project Studio, Automation, Project Activity, Developer Tools, MCP management, and advanced developer-settings React implementations are still hosted by the monolithic desktop renderer. `scripts/verify-feature-package-boundaries.mjs --strict` intentionally remains the gate for moving those renderer modules and their host API behind the installed package boundary.

CodeAgent core is the operating environment: it owns chat, account, model and store settings, generic chat history, built-in execution APIs, path safety, and built-in tool permission enforcement. This package consumes those stable runtime services and owns the software-professional control surfaces for MCP, command execution, tool diagnostics, plugins and skills, advanced prompts/debug/session controls, projects, automation, and project activity. It intentionally does not register a duplicate Bridge Tools or generic Chats page.

Current and target package contents:

- `manifest.json`: public package manifest, entitlements, shell adapters, navigation, commands, and feature metadata.
- `src/runtime.ts`: SDK runtime entrypoint that registers manifest-declared extensions and exports package CLI handlers.
- `src/cli`: package-owned CLI Project Studio and Automation implementation.
- `dist/index.js`: built package runtime in the generated artifact.
- `dist/desktop`: future installed desktop renderer entrypoints; route and navigation registrations already live in `manifest.json`.
- `dist/cli`: future split CLI command registrations and handlers if the runtime bundle is decomposed.
- `dist/services`: future shared package services.
- `artifact.json`: build metadata, hashes, and signature metadata.

The base CodeAgent app should eventually ship without `dist/desktop`, `dist/cli`, or `dist/services` for this package.
