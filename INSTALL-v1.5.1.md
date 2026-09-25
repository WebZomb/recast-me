# Recast Me v1.5.1

Small update for an existing v1.5 installation.

Unzip and merge these files into the repository, preserving their folders. Replace matching files; do not replace the whole repository with this patch. Deploy through your existing Cloudflare deployment workflow.

Changes:
- Removed the pet promotion banner and duplicate subject shortcut buttons from the generation form. The Subject dropdown retains all choices.
- Updated asset versions so browsers load the revised form.
- Configured the X username as recastmeai and corrected documentation examples.

X automation remains disabled. The X Automation setting labels the account and connects its human manager; it does not connect the image-reply service. API credentials and X's prior written approval for AI replies are still required before enabling the bot. Do not put credentials in public repository files.

Verification: all 18 automated tests passed. No live X replies were sent.
