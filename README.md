# FishSence

FishSence / FishSense is a coastal fishing safety web app for Thai fishermen.
Phase 1 focuses on showing marine weather, tide/current context, and a
rule-based Safe Score before departure.

## Phase 1

- React + Vite + TypeScript frontend
- Supabase backend/BaaS
- Fixed pilot coastal zones such as Songkhla and Ranong
- Scheduled weather refresh every 3 hours
- Open-Meteo Marine + Forecast data
- TMD official warning integration planned through Supabase Edge Functions
- No login required for the first Phase 1 dashboard

See:

- [Project context](./PROJECT_CONTEXT.md)
- [System diagrams](./diagram/README.md)
- [Phase 1 docs](./Docs/README.md)

## License

This project is licensed under the Business Source License 1.1 (`BUSL-1.1`).

You may view, copy, modify, and redistribute the code for personal,
educational, research, evaluation, development, testing, and other
non-commercial purposes.

Commercial use, production use for commercial advantage, paid services, hosted
services, and client work require a separate commercial license from the
licensor.

See [LICENSE](./LICENSE) for the full terms.
