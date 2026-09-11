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
