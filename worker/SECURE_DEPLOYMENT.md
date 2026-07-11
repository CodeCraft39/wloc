# Secure Cloudflare Workers deployment

This hardened build protects `/api/parse` with an `X-WLOC-Key` header and limits outbound requests to a fixed list of HTTPS map hosts.

## 1. Install dependencies

```bash
npm install
```

## 2. Create a local development secret

```bash
cp .dev.vars.example .dev.vars
openssl rand -hex 32
```

Put the generated value in `.dev.vars`. Do not commit that file.

## 3. Test locally

```bash
npm run dev
```

A request without `X-WLOC-Key` must return HTTP 401.

## 4. Create the production secret

```bash
npx wrangler login
npx wrangler secret put WLOC_API_KEY
```

Paste the same random key when prompted.

## 5. Deploy

```bash
npm run deploy
```

## 6. Update the iOS Shortcut

Keep the URL in this form:

```text
https://YOUR-WORKER.workers.dev/api/parse?format=json&u=EncURL
```

In the Shortcut's "Get Contents of URL" action, add this request header:

```text
X-WLOC-Key: YOUR_RANDOM_KEY
```

Do not put the key in the URL and do not publish the modified Shortcut.

## Security notes

- Only HTTPS map URLs on the allowlist are fetched.
- Every redirect target is checked again.
- Requests time out after 5 seconds.
- Response bodies are limited to 128 KiB.
- The endpoint has no permissive CORS header.
- The key is stored as a Cloudflare secret, not in Git.
- Use the Workers configuration (`wrangler.jsonc`), not the old standalone `wloc-worker.js` file.
