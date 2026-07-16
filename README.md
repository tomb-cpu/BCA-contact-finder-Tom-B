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
3. Redeploy. No other configuration is required.

## Tuning who shows up

Edit `lib/targetTitles.ts` — `TARGET_TITLES` is the list of job titles Apollo
matches against (Apollo does substring/keyword matching, so thematic entries
like `"Fixed Income"` or `"Geo-Macro"` will match titles containing that
phrase). `MAX_CONTACTS` controls how many contacts are returned per search
(default 20).

## Same search, as a Claude agent (MCP)

The identical search — resolve a firm, find its decision-makers, unlock
emails — is also available as a Claude Code subagent, `contact-finder`
(`.claude/agents/contact-finder.md`), instead of the web UI.

- `mcp/apollo-server.ts` wraps `lib/apollo.ts`'s existing `searchContacts()`
  pipeline as a single MCP tool, `find_investment_contacts`, exposed over
  stdio and registered in `.mcp.json` under the `apollo-contacts` server. No
  logic is duplicated — it's the same Apollo pipeline the web app uses.
- Requires the same `APOLLO_API_KEY` env var (Claude Code passes through
  your shell's env per `.mcp.json`; run `npm run mcp:apollo` to run/test the
  server standalone).
- Dakota Marketplace is an optional supplementary source: connect it as a
  remote MCP connector in claude.ai (Settings → Connectors), enable it for
  the chat/session, and the `contact-finder` agent will use it automatically
  alongside Apollo if its tools are present — no repo changes needed for
  that half.
