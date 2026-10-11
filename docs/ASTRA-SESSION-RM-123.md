# RM123 — Owner Royal likeness comparison

2026-10-11. Baseline main `0033f03900d9f62b32167099968f97371f19317e` (tree `350a830c997798f26cac5a0adbc9c17ac200fdd8`). Documentation-only assessment of three owner-supplied screenshots against the original puppy photograph visible in the conversation. No photos, private transcripts, or personal identifiers are included in this repository.

## Observed evidence

All screenshots show automatic subject handling and the same neutral Royal cape/crown/palace directions. This demonstrates that this particular test did not need a manual Pet selection. It does not establish universal recognition accuracy.

| Candidate | Displayed time | Displayed estimate | Visual observation |
| --- | --- | --- | --- |
| FLUX.2 dev current recipe | 28 seconds | about 3.6 cents | Changes tilted head to frontal; noticeably changes eyes, muzzle proportions and expression. |
| FLUX.2 dev edit recipe | 45 seconds | about 3.6 cents | Especially poor facial marking preservation: original white muzzle/blaze largely lost; muzzle and eyes differ. |
| Nano Banana original edit recipe | 24 seconds | 3.9 cents | Closest in this sample: retains characteristic head tilt, rounded eyes, short muzzle, expression and white/tan marking boundaries substantially better. Retains cropped supporting person and original collar/harness. |

Metadata identifies current recipe `identity-first-48-worlds-v1`, and experimental recipes `owner-identity-edit-v1`; Nano endpoint `fal-ai/nano-banana/edit`, FLUX edit endpoint `fal-ai/flux-2/edit`. The current-recipe screenshot's legacy model label uses the Cloudflare model identifier despite showing fal as provider; do not mistake that label for an independent verified Cloudflare render.

These are owner-generated real results, not mocked test outputs. The assistant made zero paid requests. Displayed estimates sum to approximately $0.111; invoice/billing totals have not been inspected. Single-run times are observations, not latency benchmarks. Comparison is qualitative, one pet and one scene; no quantitative similarity metric or general human-face claim.

## Decision and next gate

Nano Banana is the leading candidate for further likeness testing. No public engine switch, new service, source change or deployment made. Avoid rerunning both poorer FLUX variants merely to repeat this case.

Next proposed owner test: keep the same original photo, Nano choice and Royal scene; add only an instruction to remove the cropped supporting person and visible harness while preserving the original face, markings and head angle. This isolates composition cleanup from scene/model changes, estimated 3.9 cents for one deliberate render. Owner must judge whether cleanup preserves likeness. Then test a different scene and a consenting adult portrait before choosing a general customer engine. A model may redraw identity even with preservation instructions; selecting a model is not an exact-face guarantee.

Customers should continue Photos → Style with automatic subject interpretation. No extra classification service or subject-selection step is required by this finding. Any future public model change must be explicit, preserve moderation/private storage/budget accounting and the actual approved artwork, and receive normal code and live checks.

## Change, validation and rollback

Changed only this session record and the cumulative handoff. No runtime tests repeated for this documentation-only record; the relevant prior release evidence remains RM122. No runtime version change claimed. Resulting documentation commit is discoverable with `git log -- docs/ASTRA-SESSION-RM-123.md`. Rollback: revert that documentation commit; no customer data or configuration affected.
