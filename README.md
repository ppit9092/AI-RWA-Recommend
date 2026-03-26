# AI RWA Recommendation Engine V2

Minimal executable MVP for end-to-end flow testing:
- preference input
- open model recommendation API
- on-chain summary submission (real tx when contract env configured)
- buy mint action (real tx when contract env configured)
- Playwright flow test

## Quick start

1. Install dependencies:
   - root: `npm install`
   - web: `npm install --workspace apps/web`
2. Copy env:
   - `copy .env.example .env`
   - `copy .env.example apps/web/.env.local`
   - set `NEXT_PUBLIC_RECOMMENDER_ADDRESS` and `NEXT_PUBLIC_RWA1155_ADDRESS` to enable real on-chain tx
3. Start app:
   - `npm run dev`
4. Run e2e:
   - `npm run test:e2e`

## Contracts (Foundry)

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge test
```

## Notes

- API uses an open model endpoint if `OPENMODEL_API_KEY` is configured.
- If no API key is present, API returns deterministic fallback recommendations for testing.
- If wallet or contract addresses are not available, UI falls back to simulated chain status so E2E can still run.
