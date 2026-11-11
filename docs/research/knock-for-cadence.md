# What Knock offers Cadence

Research for [#2](https://github.com/klevente/cohort-005-project/issues/2), part of the map [#1 Notifications in Cadence](https://github.com/klevente/cohort-005-project/issues/1). Gathered 2026-11-11.

Sources are Knock's docs (docs.knock.app), its pricing page, and the published npm packages, which were downloaded and read: `@knocklabs/react` 0.15.1, `@knocklabs/react-core` 0.17.1, `@knocklabs/client` 0.23.1 and `@knocklabs/node` 1.41.1. Statements marked **(source)** come from reading package code. Statements marked **(unverified)** are inferred and were not run.

Note on the stack: Cadence's `package.json` pins `react-router` **8.3.0**, not 7. Nothing below depends on the major version, because Knock ships no React Router integration of any version.

## 1. Inbox / in-app feed components for React, and SSR

**What exists**

- `@knocklabs/react` ships pre-built feed components: `NotificationIconButton` (a bell with an unseen/unread badge), `NotificationFeedPopover`, `NotificationFeed` (full page), `NotificationCell` and `UnseenBadge`, among others. It also re-exports the headless hooks from `@knocklabs/react-core`: `useKnockFeed`, `useNotifications`, `useNotificationStore`, `useKnockClient`, `useFeedSettings`, `usePreferences` **(source: `dist/types/index.d.ts`)**. See also https://docs.knock.app/in-app-ui/react/overview.
- Setup is `<KnockProvider apiKey user={{ id }}>` wrapping `<KnockFeedProvider feedId>`, plus `import "@knocklabs/react/dist/index.css"`. The CSS is required unless you replace the styling (https://docs.knock.app/in-app-ui/react/feed).
- `@knocklabs/react-core` is the headless layer. It depends on `@knocklabs/client`, `swr` and `@tanstack/react-store`, and has no UI dependencies. `@knocklabs/react` adds Knock's "Telegraph" design-system packages, Radix and lucide-react (from `npm view`).
- The feed is real-time. `@knocklabs/client` opens a Phoenix websocket to Knock (dependency `phoenix`).

**React Router and SSR**

- Knock has no React Router integration. `@knocklabs/react` has optional peer deps on `next` and `@tanstack/react-router`, and subpath exports `./next` and `./tanstack`. Both subpaths export only `KnockGuideLocationSensor`, which is for in-app *Guides* (banners and modals) and has nothing to do with the feed **(source)**. Nothing here stops it running under React Router; there is just no router-specific glue.
- The ESM entry begins with `"use client"` **(source)**. That only matters under React Server Components; Cadence's React Router SSR does not use them.
- SSR safety, from reading the code **(source; not run under SSR)**:
  - `KnockProvider` builds the Knock client inside `useMemo`, so the client is built during the server render too. It then calls `authenticate()`. With the default `identificationStrategy: "inline"` and a `user` object, `authenticate()` fires `user.identify(...)`, a network call that runs during render. On the server, that means a request to Knock from inside Cadence's SSR pass. Passing `identificationStrategy="skip"` avoids it (it is a documented prop on `KnockProviderProps`). Cadence would identify users from the server via the Node SDK instead.
  - `KnockFeedProvider` → `useNotifications` initialises the feed in a `useState` initialiser, so this also runs on the server. The websocket itself is guarded: it opens only when `typeof window !== "undefined"`. The cross-tab `BroadcastChannel` is guarded by `typeof self`.
  - The feed renders no items on the server, because notifications are fetched on the client. The Inbox is client-rendered whatever approach Cadence takes.
  - `KnockProvider` has an `enabled` prop. When `enabled` is false it renders its children but stays idle: no identify, no requests, no websocket. This is a clean switch for "no Knock credentials".
- **Headless vs pre-built.** The pre-built components bring Knock's own look (Telegraph) and need its CSS. Cadence uses shadcn/Radix/Tailwind. Cadence can either use the pre-built components and restyle them, or build the Inbox on the hooks (`useKnockFeed` + `useNotificationStore`) with its own components. The Inbox UI ticket owns that choice.
- **REST alternative.** Knock also has a user-scoped feed API, which `@knocklabs/client` wraps. The Node SDK exposes `users.listMessages`, so Cadence could read a user's messages from the server in a loader **(unverified: whether a server loader can render the same feed and mark items read/seen through the secret-key API is not checked here)**.

**Security**

- The public key ships to the browser. "Without enhanced security mode, a request with your public key can act as any user." The docs say production should enable enhanced security mode and pass a signed `userToken` (https://docs.knock.app/in-app-ui/security-and-authentication).
- Tokens are RS256 JWTs signed server-side with `signUserToken(userId, { expiresInSeconds })` from `@knocklabs/node`. It reads `KNOCK_SIGNING_KEY` by default, and tokens last 3600 s unless set otherwise **(source: `lib/tokenSigner.d.ts`)**. Knock advises matching the token lifetime to the session, or refreshing it with `onUserTokenExpiring`.

## 2. Email Channel: Postmark, and Knock's built-in email

- **Postmark is a supported provider** (https://docs.knock.app/integrations/email/postmark). Settings per environment: the Postmark API (server) key, a from address and from name, and optional overrides. Knock sets no `MessageStream`, so Postmark uses its default transactional stream `outbound`. Payload overrides can pick another stream. Other options: open and link tracking (Knock's own or Postmark's), CSS inlining (on by default), and an incoming webhook from Postmark so delivered/bounced status flows back to Knock. Recipients need an `email` property.
- **Knock renders the email; Postmark only delivers it.** Templates live in Knock workflows (whether they could stay in code is a separate ticket's question).
- **Knock's built-in "Knock test" email channel** (https://docs.knock.app/integrations/email/knock-test) is on by default for new accounts in every environment. It sends at most 100 emails a month, and only to the email addresses of members of the Knock account (others fail with `knock_recipient_not_allowed`). It is "for testing only" and not for production.
- **Sandbox mode** is a per-channel, per-environment setting (under Advanced). Messages are processed and logged but never handed to the provider, and show status **Not sent** (https://docs.knock.app/send-notifications/message-statuses). It covers "all channel types (except for in-app)" (https://docs.knock.app/integrations/overview). A trigger can also force it per run with `settings.sandbox_mode: true` **(source: `WorkflowTriggerParams.Settings`)**.

## 3. Preferences

- **Model** (https://docs.knock.app/preferences/overview). Each user has a `PreferenceSet` with `workflows`, `categories`, `channel_types` and `channels` keys. A workflow or category entry is either a boolean or an object with `channel_types` (and `conditions`). That gives Cadence **per-workflow and per-workflow-per-Channel opt-out**, e.g. `workflows: { "refund-approved": { channel_types: { email: false } } }` **(source: `resources/recipients/preferences.d.ts`)**. Unset values default to opted-in. An environment-level default preference set sits underneath. A workflow can set "Override recipient preferences" so a message always goes out, for example a must-send transactional Notification. Preferences are checked at send time, and a message blocked by preferences is not billed (pricing page).
- **Email unsubscribe**
  - Knock provides a one-click link, `{{vars.commercial_unsubscribe_url}}`, and adds unsubscribe headers, but **only for workflows marked "Commercial"**. It flips `commercial_subscribed`. Transactional workflows keep sending (https://docs.knock.app/preferences/commercial-unsubscribe). The page does not name the headers it adds (presumably `List-Unsubscribe`, **unverified**).
  - **Hosted preference center**: a Knock-hosted page on `p.knock.app` (a custom domain is possible), linked from templates with `{{vars.manage_preferences_url}}`. The link is signed, needs no login, and **never expires**. Rows map to categories, workflows or channels, each with per-channel-type toggles. It covers only a user's default preferences, has no top-level channel-type preferences, and always shows the commercial row (https://docs.knock.app/preferences/hosted-preference-center). The page does not state plan availability. A 2026-06-12 changelog entry says it is available to all customers (https://knock.app/changelog/2026-06-12; **not opened directly, seen via search snippet**).
  - A signed link can also be minted outside an email: `POST /v1/users/{user_id}/preference_center/signed_url`.
- **Preferences UI in React**: there is **no pre-built preference-center component**. `@knocklabs/react` exports the `usePreferences` hook (`preferences`, `setPreferences`, `isLoading`), and Knock's guide shows building your own `PreferenceCenter` on `@knocklabs/client` (https://docs.knock.app/in-app-ui/react/preferences). From the server, the Node SDK has `users.getPreferences` and `users.setPreferences`, so preferences could also live behind an ordinary React Router action.
- **Free-tier caveat**: "Per-tenant branding and preferences" is a paid feature (pricing page). Per-user preferences are not listed as restricted.

## 4. Free-tier limits (https://knock.app/pricing)

| | Free | Starter |
| --- | --- | --- |
| Price | $0, no card | $250/month + usage |
| Messages | 10,000 / month | 50,000 included, then $0.005 each |
| Environments | Unlimited | |
| Seats | Unlimited team members | |
| Log retention | 30 days | |

- A message is "a single message delivered to a single user on a single channel". **One trigger that produces an Inbox item plus an email counts as 2.** Bounced or failed messages, and messages suppressed by preferences, are not billed.
- Not on Free: removing Knock branding (so emails and components may carry Knock branding), email client previews, translations (i18n), per-tenant branding and preferences, audit logs, SSO, custom roles.
- Environments: development and production by default, and more can be added. Each environment has its own public and secret keys. Users, messages and logs are never shared between environments. Workflows, layouts and templates are committed in one environment and promoted. Provider credentials (e.g. Postmark) are configured per environment (https://docs.knock.app/concepts/environments).

## 5. Identifying and syncing users from server code

- `@knocklabs/node` (v1.x, Stainless-generated): `new Knock({ apiKey })`, which defaults to `process.env.KNOCK_API_KEY`. **The constructor throws `KnockError` when no key is available** **(source: `client.js`)**, so code that runs without credentials must not build the client. `baseURL` can be overridden (`KNOCK_BASE_URL`).
- Identify: `knock.users.update(userId, { email, name, ... })` upserts the user and deep-merges properties (https://docs.knock.app/concepts/users). Reserved properties: `email`, `name`, `avatar`, `phone_number`, `timezone`. Other helpers include `users.merge`, `users.delete`, `users.get/setPreferences` and `users.listMessages`.
- **Recipient addressing**:
  - Recipients are addressed by a string user ID. Knock calls using your internal primary key "the best practice" and warns against emails or phone numbers, because **IDs can't be changed**. IDs are at most 256 characters, with no `/` or `#`, and a prefix (e.g. `user_123`) is suggested for multiple user types.
  - Recipients can be identified ahead of time, or **inline in the trigger** by passing `{ id, email, name }` objects in `recipients`.
  - Objects (`{ collection, id }`) and subscriptions exist for non-user recipients (https://docs.knock.app/concepts/recipients).
  - Email delivery needs `email` on the user.
- Cadence's four roles are all rows in `users`, so `String(users.id)` (optionally prefixed) maps directly onto Knock user IDs.

## 6. Triggering workflows from the server, and idempotency

- `knock.workflows.trigger(workflowKey, { recipients, actor?, data?, tenant?, cancellation_key?, settings? })` returns `{ workflow_run_id }`. Runs are **asynchronous**, so the call returning does not mean delivery (https://docs.knock.app/api-reference/workflows/trigger).
  - `recipients`: at most **1,000** per call.
  - `data`: at most 10 MB.
  - `settings`: `sandbox_mode` and `skip_delay`.
  - `cancellation_key`: lets a later `workflows.cancel` call stop a delayed run.

  All of these are in `resources/workflows.d.ts` **(source)**.
- **Idempotency** (https://docs.knock.app/api-reference/overview/idempotent-requests):
  - Knock supports an `Idempotency-Key` header (up to 255 chars), on the trigger endpoint only.
  - A repeat request with the same key within **24 hours** replays the original response, marked `idempotent-replayed: true`. A repeat with different parameters is an error.
  - Only 2xx responses are cached.
- The Node SDK sends an `Idempotency-Key` on every non-GET request. If you don't pass one, it generates a random `stainless-node-retry-<uuid>` per call, so its automatic retries (2 by default, on connection errors, 408, 409, 429 and 5xx) are safe. For **application-level** dedup (e.g. a form resubmitted), pass `{ idempotencyKey: "refund-approved:<refundId>" }` as the request option **(source: `client.js` `buildHeaders`)**. Note the 24-hour window.
- Workflow trigger frequency can also be set to "once per recipient" (optionally per tenant) in the workflow (https://docs.knock.app/send-notifications/triggering-workflows/overview).

## 7. Running locally and in tests with no Knock credentials

- **Knock offers no offline mode, local emulator or fake.** None of the docs consulted mention one. Every option Knock does offer needs credentials and network access:
  - a development environment
  - sandbox mode (which excludes in-app)
  - the Knock test email channel
- `new Knock()` throws without a key, and `KnockProvider` with `enabled={false}` stays fully idle **(source)**.
- So Cadence would need its own seam if it wants Notifications to work offline the way `mailer.server.ts` does: a `Transport`-style interface, a Knock implementation used when `KNOCK_API_KEY` is set, and a local implementation otherwise (`.outbox/` files, an in-memory list for tests, or Cadence's own SQLite table for the Inbox). This is a fact about what Knock offers, not a design. The integration-shape ticket decides it.
- Consequence for the Inbox: Knock's React components read straight from Knock's API and websocket. Without credentials they have no data source, and there is no documented way to feed them local data. **(unverified)** Pointing `KnockProvider`'s `host` prop (or the Node SDK's `baseURL`) at a local stub server is technically possible, but Knock doesn't document or support it, and the stub would have to imitate Knock's feed API and websocket protocol.

## Open points / uncertainties

- The SSR behaviour in section 1 comes from reading the code, not from a running app. It needs a quick spike under React Router SSR.
- Which unsubscribe headers Knock adds for commercial workflows is not stated.
- Plan availability of the hosted preference center was seen only in a changelog search snippet.
- Whether Knock branding appears in the in-app feed components on the Free plan, or only in emails, is not stated on the pricing page.
- API rate limits were not researched.
