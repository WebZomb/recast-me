# Recast Me v1.0.1 — generation reliability fix

This patch fixes the preview that loaded and then disappeared.

## What was wrong
The frontend hid the entire preview section whenever generation failed. The form error element also had a CSS `display:none` rule but the JavaScript never added its required `.show` class, so the actual error became invisible.

## What changed
- Failed previews stay visible in the preview area.
- A branded error card shows the real friendly reason plus a support reference.
- Retry happens in place; Adjust Direction returns to the form.
- The preview title says `Creating your Recast…` during generation instead of `Your preview is ready.`
- Product purchase cards remain hidden until a preview actually succeeds.
- Cloudflare Workers AI error 3036 (daily free allocation exhausted) is detected separately.
- Only ONE premium Klein 9B attempt is allowed per request; recovery uses the much cheaper Klein 4B model.
- Premium preview output is 768×960 (4:5) for faster display; final paid physical art still uses the high-resolution finishing pipeline.
- Generation failures are logged privately to R2 without storing customer photos in the diagnostic record.
- Control Center now includes a Generation Errors tab showing provider code/reason/stage.

## Upload
This ZIP is a full project. Extract it first and replace the matching files in `WebZomb/recast-me`, preserving folders, then commit to `main`. Cloudflare should auto-deploy.

## Test
Use the same reference and exact direction:
`Make me and my dog super heros`

If the account has used its daily free Workers AI allocation, the site will now say so instead of disappearing. Cloudflare documents error 3036 for the 10,000-neuron daily free allocation.
