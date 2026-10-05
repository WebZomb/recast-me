# RM-004 — likeness regression and universal preview watermark

Date: 2026-09-29
Parent before change: `63995965ba1faccc2ab82b6b086380148bc183b6`
Branch: `recast/secure-previews-2026-09-29`

## Player/customer evidence

The owner tested a High-Quality Halloween pet render with one clear reference photo. The result changed the dog's identity substantially: the generated head/muzzle/eye character and proportions no longer matched the narrow-faced brown-and-white terrier reference closely enough. Treat that result as a failed likeness result, not a successful quality example.

The owner also observed that the large selected preview carried the old `RECAST ME • PREVIEW` browser overlay while the Recent Versions cards appeared without that extra overlay. This creates an avoidable theft path because a user could save/enlarge the smaller image.

Requested public mark: **`@RecastMeAi • PREVIEW`**.

## Changes

- Pet detection now recognizes pet/dog/cat/puppy/kitten wording.
- Prompt priority is reordered: exact real-subject identity outranks costume, pose, drama, cuteness and world styling.
- Pet identity lock explicitly preserves head/muzzle geometry, ear proportions/angle, eye placement/color, body proportions and exact coat-marking boundaries; it explicitly forbids generic/cuter breed substitution and muzzle/eye/skull reshaping.
- Server watermark version advances to `rm-preview-3` and uses `@RecastMeAi • PREVIEW` in both a repeated tile and footer, flattened into the JPEG by the server.
- The browser no longer draws a second canvas-only watermark. Large preview and Recent Versions use the same already-protected server pixels. Clean originals remain private for authorized fulfillment/download.
- Existing protected derivative cache is versioned, so saved older versions regenerate with the new watermark when fetched rather than reusing rm-preview-2 derivatives.

## Verification required

Tests are being rerun after this commit. Prompt tests can prove the identity instructions reach the model, but cannot prove the model will preserve this specific dog's likeness. The next controlled render should use the same owner-provided reference and Halloween setup for an A/B quality check. Record that render as billable if applicable; do not claim likeness fixed until visually reviewed.

Also inspect the large preview and all four Recent Versions on mobile: every delivered artwork image should visibly contain `@RecastMeAi • PREVIEW`. Attempt saving/opening a history thumbnail to confirm the pixels themselves remain marked.

No engine/provider switch, purchase, production order, X post or automatic model change is part of RM-004.

## CI follow-up

GitHub Actions at RM-004 commit `b7cf42fa2fabe39052d3c002d1790ccea7686652` ran 74 tests: 73 passed and 1 failed. The failure was the existing generator assertion requiring the phrase/behavior that a transformed pet must not be an unchanged photo cutout. The new stricter identity wording had accidentally removed that sentence while replacing the older pet paragraph. This was a test-detected prompt regression, not a provider call or clean-image leak. The next commit restores that transformation constraint alongside the stricter identity lock; rerun the complete suite before any live A/B render.
