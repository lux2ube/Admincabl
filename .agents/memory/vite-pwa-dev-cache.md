---
name: PWA cache in Vite development
description: Why the storefront unregisters its service worker and clears CABL caches during Vite development.
---

The production PWA service worker must not control the storefront during Vite development.

**Why:** Its same-origin cache-first strategy cached both `/src` modules and Vite's optimized dependency chunks. After an edit, the browser mixed React modules from different optimization generations, causing recurring invalid-hook-call and `useContext` errors that temporarily disappeared after clearing Vite's cache.

**How to apply:** Keep service-worker registration production-only. In development, unregister existing workers and delete CABL-owned Cache Storage entries. Do not remove that cleanup merely because a fresh browser session appears healthy.