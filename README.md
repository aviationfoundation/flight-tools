# flight-tools

Flight planning tools from [aviation.foundation](https://aviation.foundation), split out into their own repo.

- METAR & TAF decoder: `/tools/metar`
- NOTAM decoder: `/tools/notam`
- E6B: `/tools/e6b`
- Weight & balance: `/tools/weight-balance`
- Takeoff & landing distance: `/tools/takeoff-landing-distance`
- Reading NOTAMs, a course in eleven lessons: `/learn`

Weather data comes from [aviationweather.gov](https://aviationweather.gov).

## Running it

```bash
npm install
npm run dev
```

Deploys to Cloudflare Workers with `npm run deploy` (needs `wrangler login` first). The METAR page fetches on the server, so it can't be a static export.

## Data

The METAR page fetches live reports from aviationweather.gov. Everything else it shows, the station map, airport search and runway headings, comes from files built by `pipeline/build_data.py` and stored in Cloudflare R2:

- `categories.json` and `board.json`: every reporting station's flight category, rebuilt every 5 minutes from NOAA's METAR cache.
- `stations.json`: the airport search index, from NOAA's station list.
- `runways/*.json`: runway ends and true headings, from [OurAirports](https://ourairports.com/data/) (public domain).

```bash
python3 pipeline/build_data.py categories --out ./data
python3 pipeline/build_data.py reference --out ./data
```

With `--push`, the script uploads the files to `/api/internal/data`, which needs `FLIGHT_TOOLS_PUSH_TOKEN` to match the Worker's `DATA_PUSH_TOKEN` secret. Without the files the tools still work; the map, airport search and runway list just don't appear.

## Course and accounts

The course content lives in `src/lib/learn/course.ts`. `npm test` checks it against the NOTAM decoder: every annotated part must appear in its NOTAM, every course NOTAM must decode cleanly, and the codes, contractions, times and drill answers must agree with the engine.

Lessons need an aviation.foundation account. This Worker has no database. It reads the `af_session` cookie that aviation.foundation sets for the whole domain, asks the main site who the visitor is through the `ACCOUNTS` service binding, and saves lesson scores there through `/api/courses/progress`.

For local development, set one of these in `.env`:

- `DEV_ACCOUNT=1` signs you in as a local learner and keeps scores in memory.
- `ACCOUNTS_DEV_URL=http://127.0.0.1:4322` sends account calls to a local copy of the main site instead.

Both only work under `npm run dev`; a production build ignores them.

## Disclaimer

These are planning aids, not approved sources of flight data. Check official publications and your aircraft's POH before flight.

## License

MIT
