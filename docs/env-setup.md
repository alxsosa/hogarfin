# Environment variables

HogarFin uses Supabase via the Vercel Marketplace integration. Once linked:

```bash
vercel link
vercel integration add supabase --yes
vercel env pull --yes
```

This creates `.env.local` (gitignored) with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to the client)

If provisioning Supabase manually instead, create `.env.local` yourself with
the same three keys from your Supabase project's API settings.

## Receipt scanning (`ANTHROPIC_API_KEY`)

The "Escanear ticket" feature (`/api/scan-receipt`) calls the Anthropic API
directly with `@anthropic-ai/sdk`, using `claude-haiku-4-5` — not through
Vercel AI Gateway, because this project's Vercel plan restricts every
Claude model behind the gateway to paid AI Gateway credits. Add your own
key from [console.anthropic.com](https://console.anthropic.com) to
`.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Never commit this key — `.env.local` is gitignored. If the Vercel project
later adds AI Gateway credits, the route could be switched back to
`generateObject` from the `ai` package to go through the gateway instead
(see git history on this file for the earlier version).
