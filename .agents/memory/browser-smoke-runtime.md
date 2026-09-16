---
name: Browser smoke runtime
description: Local browser verification in the Replit workspace.
---

Playwright may be installed without its managed browser download. Browser smoke checks can use the workspace-provided Chromium executable at `/repl/tools/bin/chromium` with sandboxing disabled.

**Why:** This keeps production-page interaction checks available without adding a project dependency or downloading a second browser runtime.

**How to apply:** Pass the executable path explicitly when launching Playwright in local verification scripts; treat failures from missing selectors separately from application failures.