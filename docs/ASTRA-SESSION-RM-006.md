# RM-006 — capacity handling after controlled Preview test

Date: 2026-09-29
Parent: `9b4b61f8f147d38170f02e77d155f5b23c5bf128`

## Observed real Preview result

The owner attempted the same-dog Halloween High-Quality test after Preview Images/R2 configuration. The request reached the generator but returned the site's temporary capacity message with diagnostic `GEN-MUN2W8Y9-A1E7`. No completed image was produced, so this test gives no new likeness evidence.

Cloudflare's current Workers AI error documentation identifies internal code 3040 / HTTP 429 as "Out of capacity" / temporary capacity exceeded. Cloudflare also documents `rejectIfBusy: true` for the Workers binding so a synchronous inference can be rejected immediately instead of waiting in a capacity queue.

## Code change

- All Workers AI image calls now pass the documented third-argument option `{rejectIfBusy:true}`.
- High-Quality 3040/busy handling no longer automatically makes a second same-model provider submission. It returns a capacity result and preserves the user's last successful preview/settings. A later user action is the next deliberate attempt.
- Moderation retry behavior is unchanged; that is a prompt-safety recovery path, not a capacity retry.
- Ambiguous timeout handling remains no-auto-retry.
- Existing model choices are unchanged.

Rationale: an automatic second 3040 retry can add unnecessary provider attempts and makes spend/call accounting harder to reason about. Immediate rejection plus one deliberate later retry is more predictable for this low-cost product.

## Verification

Complete repository CI must pass before the owner retries. The generator regression test was updated to expect one provider call on busy rather than two, and a new test asserts that the binding receives `rejectIfBusy:true`. This does not prove provider capacity has returned and does not prove the next render's likeness.

No paid render was intentionally started while making this change. No engine/provider switch, purchase, Printful action or X post was performed.

## CI correction

At commit `4dc8fcecc6263d6f112fb2805cd26e28089cb44b`, CI failed one newly edited test because the test still asserted HTTP 200 after a mocked 3040 capacity rejection. The implementation correctly returned HTTP 503/capacity after exactly one provider call. The follow-up changes only the test expectation to 503 + reason=capacity and keeps the one-call assertion. No application code is changed by this correction. Rerun complete CI before the next owner render.
