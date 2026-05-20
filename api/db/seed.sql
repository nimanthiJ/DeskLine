-- Agents
insert into users (name, email) values
  ('Priya Raman',     'priya@deskline.local'),
  ('Marcus Webb',     'marcus@deskline.local'),
  ('Elena Petrova',   'elena@deskline.local'),
  ('Tom Okafor',      'tom@deskline.local'),
  ('Sofia Lindqvist', 'sofia@deskline.local'),
  ('Dan Mercer',      'dan@deskline.local');

-- Tickets
insert into tickets (subject, description, status, priority, assignee_id, sla_hours, created_at, updated_at, resolved_at) values
  ('Cannot log in after password reset',
   'Customer reset their password via the email link but now gets "invalid credentials" on every attempt. Cleared cache, tried two browsers.',
   'open', 'urgent', 1, 4, now() - interval '3 days', now() - interval '3 days', null),

  ('Invoice PDF download returns 500',
   'Downloading the March invoice from the billing page fails with a server error. Other months download fine.',
   'open', 'high', 2, 8, now() - interval '2 days', now() - interval '2 days', null),

  ('Exported CSV missing header row',
   'The contacts export omits the header row, which breaks the customer''s import script downstream.',
   'open', 'medium', null, 4, now() - interval '26 hours', now() - interval '26 hours', null),

  ('Question about seat licensing',
   'Customer asks whether deactivated agents still count toward the seat limit on the annual plan.',
   'open', 'low', 3, 24, now() - interval '5 days', now() - interval '5 days', null),

  ('Two-factor codes arriving late',
   'SMS codes are taking 2-3 minutes to arrive, long enough that they expire before the customer can enter them.',
   'open', 'high', 4, 8, now() - interval '30 minutes', now() - interval '30 minutes', null),

  ('Add SSO domain for new subsidiary',
   'Customer acquired a company and wants logins from the new domain routed through their existing SAML config.',
   'open', 'medium', null, 24, now() - interval '2 hours', now() - interval '2 hours', null),

  ('Typo on billing settings page',
   'The word "recieve" appears in the invoice email description under billing settings.',
   'open', 'low', 5, 8, now() - interval '1 hour', now() - interval '1 hour', null),

  ('Webhook retries flooding endpoint',
   'A failing webhook is being retried very aggressively and the customer''s endpoint is getting hammered. They ask for backoff.',
   'open', 'urgent', 6, 8, now() - interval '7 hours 30 minutes', now() - interval '7 hours 30 minutes', null),

  ('Mobile app crashes on attachment upload',
   'Uploading a photo from the iOS app crashes it immediately. Started after the latest app update.',
   'open', 'high', 1, 4, now() - interval '3 hours 45 minutes', now() - interval '3 hours 45 minutes', null),

  ('Data export stuck at 90%',
   'The full workspace export has been sitting at 90% for a day. Customer needs it for a compliance request.',
   'open', 'medium', 2, 24, now() - interval '22 hours', now() - interval '22 hours', null),

  ('Emails going to spam again',
   'Outbound notification emails are landing in spam for several recipients on outlook.com. This was reported and dealt with a few weeks ago.',
   'open', 'high', 3, 8, now() - interval '6 days', now() - interval '2 days', now() - interval '2 days'),

  ('Migrate workspace to EU region',
   'Customer requests migration of their workspace and stored attachments to the EU region for compliance.',
   'in_progress', 'high', 4, 24, now() - interval '4 days', now() - interval '1 day', null),

  ('API rate limits too aggressive for batch jobs',
   'Nightly sync job hits 429s halfway through. Customer asks about a higher limit or a bulk endpoint.',
   'in_progress', 'medium', 5, 24, now() - interval '3 days', now() - interval '2 days', null),

  ('Dashboard widgets render blank in Safari',
   'All chart widgets on the reporting dashboard show empty boxes in Safari 17. Works in Chrome and Firefox.',
   'in_progress', 'medium', 6, 8, now() - interval '2 days', now() - interval '1 day', null),

  ('Duplicate contacts after CRM sync',
   'Since enabling the CRM integration, contacts with a plus-address are being duplicated on every sync run.',
   'in_progress', 'high', 1, 8, now() - interval '5 days', now() - interval '3 days', null),

  ('Custom fields not saving on bulk edit',
   'Editing a custom dropdown field via bulk edit silently discards the change. Single-ticket edit works.',
   'in_progress', 'medium', null, 8, now() - interval '2 days', now() - interval '2 days', null),

  ('Slow search on large ticket archives',
   'Search takes 10+ seconds for customers with very large archives. Not new, but getting worse.',
   'in_progress', 'low', 2, 24, now() - interval '8 days', now() - interval '4 days', null),

  ('Audit log missing user agent info',
   'Security team wants the audit log to include user agent and IP for login events. Partial data was shipped, then pulled back for rework.',
   'in_progress', 'low', 3, 24, now() - interval '6 days', now() - interval '6 days', now() - interval '5 days'),

  ('Password reset email had broken link',
   'The reset link pointed at the staging domain for about an hour after the last deploy. Affected customers received corrected emails.',
   'resolved', 'urgent', 4, 4, now() - interval '10 days', now() - interval '9 days', now() - interval '9 days'),

  ('Billing charged twice for March',
   'Customer was invoiced twice for the same period. Duplicate charge refunded and the retry logic corrected.',
   'resolved', 'high', 5, 8, now() - interval '12 days', now() - interval '11 days', now() - interval '11 days'),

  ('Attachment previews not loading',
   'Image previews in the ticket view showed a broken icon. Traced to an expired CDN token, now rotated.',
   'resolved', 'medium', 6, 8, now() - interval '9 days', now() - interval '8 days', now() - interval '8 days'),

  ('Add CC field to outgoing replies',
   'Agents want to CC an external address on replies. Shipped behind the workspace setting.',
   'resolved', 'low', 1, 24, now() - interval '15 days', now() - interval '13 days', now() - interval '13 days'),

  ('Notification preferences reset randomly',
   'A handful of users had their notification preferences revert to defaults. Root cause was a race in the settings save.',
   'resolved', 'medium', 2, 8, now() - interval '7 days', now() - interval '5 days', now() - interval '5 days'),

  ('Wrong timezone on scheduled reports',
   'Weekly reports were generated using UTC instead of the workspace timezone. Fixed in the scheduler.',
   'resolved', 'medium', null, 24, now() - interval '11 days', now() - interval '10 days', now() - interval '10 days'),

  ('Trial extension request',
   'Customer asked for two more weeks of trial to finish their evaluation. Granted.',
   'closed', 'low', 3, 24, now() - interval '20 days', now() - interval '18 days', now() - interval '19 days'),

  ('Cannot remove deactivated agent from routing',
   'A deactivated agent still appeared in the round-robin routing pool. Removed manually and the cleanup job fixed.',
   'closed', 'medium', 4, 8, now() - interval '16 days', now() - interval '14 days', now() - interval '15 days'),

  ('Import from legacy helpdesk failed',
   'Initial import from the customer''s previous helpdesk aborted on malformed HTML in old tickets. Re-run with sanitisation completed.',
   'closed', 'high', 5, 8, now() - interval '25 days', now() - interval '22 days', null),

  ('Feature request: dark mode',
   'Customer would like a dark theme for the agent workspace. Logged for the product backlog.',
   'closed', 'low', 6, 24, now() - interval '30 days', now() - interval '28 days', null),

  ('Spam tickets from contact form',
   'Burst of spam submissions through the public contact form. CAPTCHA enabled and offending IPs blocked.',
   'closed', 'medium', 1, 8, now() - interval '14 days', now() - interval '12 days', now() - interval '13 days'),

  ('Onboarding call scheduling issue',
   'Customer could not find a slot in the onboarding calendar. Session booked manually.',
   'closed', 'low', 2, 24, now() - interval '18 days', now() - interval '17 days', now() - interval '17 days');

-- Comments
insert into comments (ticket_id, author_id, body, created_at) values
  (1, 1, 'Reproduced with a test account — reset flow completes but the new password is rejected.', now() - interval '2 days 22 hours'),
  (1, 2, 'Could this be related to the session invalidation change that went out Tuesday?', now() - interval '2 days 20 hours'),
  (1, 1, 'Checking. The reset token is consumed correctly, so it is something after that.', now() - interval '2 days 19 hours'),
  (1, 4, 'Customer called in again, flagging priority.', now() - interval '2 days 4 hours'),
  (1, 1, 'Narrowed it down to the password hash comparison for accounts created before 2023.', now() - interval '1 day 6 hours'),
  (1, 2, 'That matches — the reporter''s account is from 2021.', now() - interval '1 day 5 hours'),
  (1, 1, 'Working on a fix, will update here.', now() - interval '20 hours'),

  (2, 2, 'Confirmed 500 on the March invoice for this account. Stack trace points at the PDF renderer.', now() - interval '1 day 20 hours'),
  (2, 5, 'March is when they switched currency — maybe the renderer chokes on the mixed-currency line items?', now() - interval '1 day 16 hours'),
  (2, 2, 'Good call, testing that theory with a copy of the invoice data.', now() - interval '1 day 2 hours'),

  (4, 3, 'Checked with billing: deactivated agents do not count toward the seat limit. Drafting a reply.', now() - interval '4 days'),

  (5, 4, 'Asked the SMS provider for delivery logs covering the reported window.', now() - interval '15 minutes'),

  (8, 6, 'Paused the webhook subscription for now so their endpoint gets some air.', now() - interval '7 hours'),
  (8, 5, 'Retry policy is fixed 10s intervals, 100 attempts. No backoff at all.', now() - interval '6 hours 30 minutes'),
  (8, 6, 'Customer confirms traffic has stopped. Keeping the ticket on me for the backoff change.', now() - interval '6 hours'),
  (8, 2, 'We had a similar report last quarter — see ticket about the CRM webhook storm.', now() - interval '5 hours'),
  (8, 6, 'Thanks, reading that thread now.', now() - interval '4 hours 30 minutes'),
  (8, 6, 'Plan: exponential backoff capped at 15 min, max 20 attempts, then auto-disable with an email.', now() - interval '2 hours'),

  (9, 1, 'Got a crash log from the customer. NSInvalidArgumentException in the upload handler.', now() - interval '3 hours'),
  (9, 3, 'App team says a fix is already in review for the next release.', now() - interval '1 hour'),

  (10, 2, 'Export worker logs show the job is still running, just very slowly on the attachments step.', now() - interval '20 hours'),
  (10, 2, 'Bumped the worker priority for this job. ETA a few hours.', now() - interval '18 hours'),

  (11, 3, 'Same symptoms as three weeks ago. DKIM checks pass, so it is likely reputation again.', now() - interval '5 days 20 hours'),
  (11, 3, 'Warmed up the secondary sending domain and moved outlook.com recipients over. Looks clean.', now() - interval '2 days 2 hours'),
  (11, 5, 'Customer reports spam placement again as of this morning. Reopening.', now() - interval '6 hours'),

  (12, 4, 'Export of workspace data started. Attachments bucket copy will take the longest.', now() - interval '2 days'),
  (12, 4, 'Data copy complete, verifying checksums before the cutover window.', now() - interval '1 day'),

  (13, 5, 'Their batch job does one request per record. A bulk endpoint would cut it by 99%.', now() - interval '2 days 12 hours'),
  (13, 5, 'Offered a temporary limit bump while the bulk endpoint is discussed with product.', now() - interval '2 days'),

  (14, 6, 'Reproduced in Safari 17.1. Console shows a ResizeObserver error before the charts mount.', now() - interval '1 day 12 hours'),
  (14, 6, 'Chart library issue, fixed upstream in 4.2.0. Testing the upgrade.', now() - interval '1 day'),

  (15, 1, 'The CRM API normalises plus-addresses but our matcher does not, so every sync sees a "new" contact.', now() - interval '4 days'),
  (15, 2, 'Do we dedupe on email alone or email+name?', now() - interval '3 days 20 hours'),
  (15, 1, 'Email alone. I will normalise before matching and add a cleanup script for the existing dupes.', now() - interval '3 days 12 hours'),
  (15, 1, 'Matcher fix is up for review.', now() - interval '3 days 2 hours'),
  (15, 4, 'Customer asked for an ETA on the cleanup of the ~1,400 existing duplicates.', now() - interval '3 days'),
  (15, 1, 'Cleanup script drafted, running it against a staging copy first.', now() - interval '3 days'),
  (15, 2, 'Staging run looked good, no false merges in the sample I checked.', now() - interval '3 days'),
  (15, 1, 'Scheduling the production run for the weekend window.', now() - interval '3 days'),

  (17, 2, 'Query plan shows a sequential scan on the comments table for archive searches.', now() - interval '5 days'),
  (17, 2, 'Prototyping a trigram index on a staging snapshot.', now() - interval '4 days'),

  (18, 3, 'First pass shipped but captured the proxy IP instead of the client IP. Reverting that part.', now() - interval '5 days'),

  (19, 4, 'Root cause: deploy script rewrote the email template base URL. Guard added to CI.', now() - interval '9 days 6 hours'),
  (19, 4, 'Corrected emails sent to everyone who requested a reset in the affected window.', now() - interval '9 days'),

  (20, 5, 'Refund issued. The payment retry fired even though the first attempt had succeeded.', now() - interval '11 days 4 hours'),
  (20, 5, 'Retry now checks the charge status first. Confirmed with a test charge.', now() - interval '11 days'),

  (21, 6, 'CDN token had expired — previews were 403ing. Rotated and added expiry monitoring.', now() - interval '8 days'),

  (22, 1, 'Shipped behind the workspace setting "Allow CC on replies", off by default.', now() - interval '13 days'),

  (23, 2, 'Two concurrent saves could clobber each other. Added optimistic locking on the settings row.', now() - interval '5 days 6 hours'),
  (23, 2, 'Affected users notified, preferences restored from the audit trail.', now() - interval '5 days'),

  (24, 3, 'Scheduler now resolves the workspace timezone at generation time. Verified against three workspaces.', now() - interval '10 days'),

  (26, 4, 'Removed the agent from the routing pool manually; the nightly cleanup job now handles deactivations.', now() - interval '15 days'),

  (27, 5, 'Import aborted at 60% on unclosed tags in tickets from 2014. Added HTML sanitisation and re-ran.', now() - interval '23 days'),
  (27, 5, 'Re-run completed, customer confirmed the ticket history looks right.', now() - interval '22 days'),

  (29, 1, 'Enabled CAPTCHA on the public form and blocked the submitting IP range.', now() - interval '13 days'),
  (29, 3, 'No new spam since. Closing.', now() - interval '12 days');
