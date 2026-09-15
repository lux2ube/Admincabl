---
name: Build environment requirements
description: Vite package builds in this workspace validate PORT and BASE_PATH even when they do not start a server.
---

Vite builds for the workspace artifacts require both `PORT` and `BASE_PATH` in the environment; the values only need to be valid for a build.

**Why:** The package configs validate these variables while loading, so a missing value can stop a workspace-wide build before the changed artifact is compiled.

**How to apply:** When running a production build manually, provide the artifact’s configured base path and any valid nonzero build port, then run the artifact-specific build and acceptance checks.