// Owner-only configuration guidance. Presence is never presented as live acceptance.
import {moderationReadiness} from './content-safety.js';
export function launchSetup(env, social) {
 const moderation=moderationReadiness(env);
 const site=Boolean(env.TURNSTILE_SITE_KEY),secret=Boolean(env.TURNSTILE_SECRET_KEY);
 return [
  {name:'Photo screening',state:moderation.ready?'Configured — live test needed':'Setup required',
   steps:[...(!moderation.configured?['Add MODERATION_OPENAI_API_KEY as a Cloudflare production Secret.']:[]),...(!moderation.enabled?['Set CONTENT_MODERATION_ENABLED to true after adding the key.']:[]),'Verify a clean photo is allowed, prohibited content is blocked, and a screening outage stops the upload. This uses the free moderation endpoint only; no paid visual classifier. Baseline image checks cover sexual content, violence and self-harm. They do not comprehensively detect nonsexual nudity, vulgar words in photos, hateful symbols or image-rights violations. Keep questionable content under review.']},
  {name:'Bot protection',state:site&&secret?'Configured — live challenge needed':site||secret?'Incomplete — uploads may be blocked':'Setup required',
   steps:[...(!site||!secret?['Create a Cloudflare Turnstile widget for recastmeai.com. Add TURNSTILE_SITE_KEY as Text and TURNSTILE_SECRET_KEY as Secret in production.']:[]),'Test both AI creation and Use my original photo on the live site.',...(String(env.TURNSTILE_REQUIRED)!=='true'?['After a successful test, set TURNSTILE_REQUIRED to true so missing configuration cannot silently disable protection.']:[])]},
  {name:'X bot',state:!social.credentials?'Account connection required':!social.contentModeration?'Waiting for photo screening':!social.approved?'Approval required':!social.enabled?'Automation off':'Enabled — verify live behavior',
   steps:[...(!social.credentials?['Connect the @recastmeai developer app: X_USER_ID, X_USERNAME, and a user token or refresh token plus client ID. Store tokens and client secret as Secrets.']:[]),...(!social.tokenRefresh?['For unattended operation, configure X_REFRESH_TOKEN and X_CLIENT_ID with offline access; a temporary user token can expire.']:[]),...(!social.contentModeration?['Enable and test photo screening first.']:[]),'Confirm current X API access and automated-reply requirements before setting X_BOT_APPROVED and X_BOT_ENABLED to true.','Run one controlled, owner-requested mention test and confirm exactly one correct reply before promoting the bot. Turning it on can incur X API and image-generation charges.']}
 ];
}
