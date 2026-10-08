See the Spire

Intro
An interactive personal dashboard for Slay the Spire 2. Built with Nuxt on top of Cloudflare's Edge Network.
Upload a .run file to see your run stats, map and relics, and get AI coaching on your decisions.

Tech Stack

Nuxt

Vue.js

Typescript

Nitro

Cloudflare\
-DNS\
-Workers\
-Workers AI for run analysis (AI Coach page)\
-AI Gateway for AI logging, analytics and player feedback\
-R2 Storage for image/asset storage and an archive of analysed runs\
-D1 for relic and card information and AI analysis history\
-KV for caching AI analyses\
-Analytics Engine for AI Coach usage and latency metrics\
-Rate Limiting to cap AI usage per visitor

AI Coach setup (one time)
1. Create an AI Gateway named `see-the-spire` (Cloudflare dashboard > AI > AI Gateway). Turn on logging.
2. Create the tables: `npm run db:migrate`, then load card data: `npm run db:seed:cards`
3. Deploy: `npm run deploy`. Wrangler creates the KV namespace on first deploy and writes its id into
   wrangler.jsonc (commit that change). If your Wrangler version doesn't, run
   `npx wrangler kv namespace create ANALYSIS_CACHE` and paste the id in.
   Create the R2 bucket if it doesn't exist: `npx wrangler r2 bucket create see-the-spire-runs`

Working on the AI prompt
`npm run digest -- public/data/1788790424.run --prompt` prints exactly what the model receives.
Bump PROMPT_VERSION in server/utils/coachPrompt.ts on every prompt change, then compare player feedback per
version in D1 (`run_analyses`) or in the AI Gateway logs.

URL
https://www.seethespire.com

Author
Brian Lee
