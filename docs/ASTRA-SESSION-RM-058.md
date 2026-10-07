# RM058 — desktop hero composition

Owner requested the PC start page match the quality of the approved phone layout, specifically correcting the oversized/misaligned mug. Baseline main7c177638013aa7f52ddc69f5c3b71fbd737669c6.

Live desktop screenshot confirmed the mug dominated the stage above much smaller photo/Recast cards. Added a min-width761px grid composition to public/hero-target-v51.css: shared bottom alignment, relative positioning, approximately43% stage width for the mug instead of60%, a separate full-width tagline row, and desktop hero height620px. Existing phone media rules remain untouched. Cache key bumped to5 in public/index.html. No artwork, generation, checkout, prices, supplier mapping or fulfillment changes.

Validation: live pre-change desktop screenshot inspected. Post-deploy visual verification and existing read-only browser audit pending. No new tests for this reversible CSS-only correction. No paid actions.

Rollback: remove only the appended RM058 media rules and restore the stylesheet cache key on top of current main. RM057 image review and unpublished Shopify draft remain pending owner choice; this desktop correction does not approve/publish those assets.

## Deployment and verification
Application7d17558d60e06989bea25b5d6091ff11e950f9ab deployed successfully. Live1363px screenshot confirms the smaller mug and shared label baseline. First automated job113066454799 failed because existing tests allowed only stylesheet query versions3/4; broadened just that numeric cache-key assertion without altering mobile geometry assertions. All6 targeted mobile hero tests passed. Follow-up full browser CI pending; no claims of physical or commerce changes.
