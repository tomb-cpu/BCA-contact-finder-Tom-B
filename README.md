# BCA Contact Finder

Internal sales tool: type a company name, get up to 20 investment
decision-makers at that firm — portfolio managers, CIOs, allocators, and
related titles — with title, LinkedIn profile, and email, sourced live from
Apollo.io.

Built with Next.js (App Router) + TypeScript + Tailwind CSS.

## How it works

1. Sales rep types a firm name (asset manager, hedge fund, PE firm, family
   office, etc.) into the search box.
2. `app/api/search-contacts/route.ts` calls Apollo.io:
   - resolves the company name to an Apollo organization (`mixed_companies/search`)
   - searches people at that organization matching the target titles in
     `lib/targetTitles.ts` (`mixed_people/search`)
   - bulk-enriches the top candidates to unlock work emails (`people/bulk_match`)
3. Results are ranked (contacts with LinkedIn + email first) and the top 20
   are returned to the UI as cards, with a CSV export button.

Phone numbers are **not** included: Apollo only reveals phone numbers
asynchronously via a webhook (and at a higher credit cost), which doesn't fit
a synchronous "search and get results" flow. Each card links out to reveal
phone in Apollo directly if needed.

## Setup

```bash
npm install
cp .env.example .env.local
# then put your Apollo API key in .env.local
npm run dev
```

Get an Apollo API key from **Apollo → Settings → Integrations → API**. A
plan with API access and enough email-reveal credits is required for emails
to unlock (LinkedIn/title/company data works on any plan with API access).

## Deploying to Vercel

1. Import this repo into Vercel (or redeploy the existing project connected
   to it).
2. In **Project Settings → Environment Variables**, add:
   - `APOLLO_API_KEY` = your Apollo API key
   - `MCP_ACCESS_TOKEN` = a random shared secret (only needed if you're
     using the hosted MCP connector at `/api/mcp` — see below; the web UI
     itself doesn't need it)
3. Redeploy. No other configuration is required.

## Tuning who shows up

Edit `lib/targetTitles.ts` — `TARGET_TITLES` is the list of job titles Apollo
matches against (Apollo does substring/keyword matching, so thematic entries
like `"Fixed Income"` or `"Geo-Macro"` will match titles containing that
phrase). `MAX_CONTACTS` controls how many contacts are returned per search
(default 20).

## Same search, as an MCP connector

The identical search — resolve a firm, find its decision-makers, unlock
emails — is also exposed as an MCP tool, `find_investment_contacts`, so any
salesperson can use it from regular claude.ai chat, not just this web app.
Both entrypoints below share one implementation (`mcp/createServer.ts`,
which just calls `lib/apollo.ts`'s existing `searchContacts()`) — no logic
duplicated, and neither one can create/update/sequence anything in Apollo:
the only Apollo calls made are search + enrich (read-only by construction).

- **`mcp/apollo-server.ts`** — stdio entrypoint for local use inside a
  Claude Code session on this repo (registered in `.mcp.json` under
  `apollo-contacts`; run `npm run mcp:apollo` to run/test it standalone).
  Requires `APOLLO_API_KEY` in whatever environment runs Claude Code.
- **`app/api/mcp/route.ts`** — hosted HTTP entrypoint, deployed alongside
  the web app (e.g. on Vercel). This is the one to add as a **custom
  connector in claude.ai** (Settings → Connectors) so it's available to
  the whole sales team in ordinary chat, without anyone needing Claude
  Code or repo access. It requires an `Authorization: Bearer <token>`
  header matching `MCP_ACCESS_TOKEN` — requests without it are rejected
  (fails closed if the env var isn't set). Generate a random token
  (`openssl rand -hex 32`), set it in Vercel, and use the same value when
  configuring the connector's auth in claude.ai.

Dakota Marketplace is an optional supplementary source: connect it as its
own remote MCP connector in claude.ai the same way, and the `contact-finder`
agent (`.claude/agents/contact-finder.md`) will use it automatically
alongside Apollo if its tools are present in the session — no repo changes
needed for that half.
