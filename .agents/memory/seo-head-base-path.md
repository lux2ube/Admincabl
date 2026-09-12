---
name: SEO head base path
description: Client-side canonical URLs must normalize the artifact base path before adding it back.
---

When setting client-side canonical or Open Graph URLs in a path-mounted artifact, strip `import.meta.env.BASE_URL` from `window.location.pathname` before composing the URL.

**Why:** The proxied preview pathname already includes the artifact base path, so using it as a route path and prefixing the base again creates duplicated canonical URLs.

**How to apply:** Keep API canonical paths root-relative and let the shared head helper add the current artifact base exactly once.