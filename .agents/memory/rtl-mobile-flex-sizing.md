---
name: RTL mobile flex sizing
description: A layout quirk to check when desktop grids become vertical on Arabic mobile screens.
---

When a desktop grid is changed to a vertical flex layout in RTL, set `align-items: stretch` explicitly and give the panels `width: 100%`. Retaining `align-items: start` can shrink-to-content and leave a large empty gutter on the opposite side.

**Why:** In the purchase flow, the inherited desktop alignment made the cart panel narrower than the viewport while the summary panel still appeared full width.

**How to apply:** Check mobile overrides for every `display: flex; flex-direction: column` conversion, especially for RTL page shells and checkout layouts.