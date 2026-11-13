# flight-tools

Flight planning tools from [aviation.foundation](https://aviation.foundation), split out into their own repo.

- METAR & TAF decoder: `/tools/metar`
- NOTAM decoder: `/tools/notam`
- E6B: `/tools/e6b`
- Weight & balance: `/tools/weight-balance`
- Takeoff & landing distance: `/tools/takeoff-landing-distance`
- Courses: `/learn`
  - Reading NOTAMs, eleven lessons: `/learn/notams`
  - Reading METARs and TAFs, nine lessons: `/learn/metar-taf`

Weather data comes from [aviationweather.gov](https://aviationweather.gov).

## Running it

```bash
npm install
npm run dev
```

Deploys to Cloudflare Workers with `npm run deploy` (needs `wrangler login` first). The METAR page fetches on the server, so it can't be a static export.

## Data

The METAR page fetches live reports from aviationweather.gov. Everything else it shows, the station map, airport search and runway headings, comes from files built by `pipeline/build_data.py` and stored in Cloudflare R2:

- `categories.json` and `board.json`: every reporting station's flight category, rebuilt every 5 minutes from NOAA's METAR cache by the `categories` job below, run on a timer from a server. The Worker also has a scheduled handler that does the same job (`src/worker.ts`, `src/lib/refresh-data.ts`), unused until the account has cron slots to spare.
- `stations.json`: the airport search index, from NOAA's station list.
- `runways/*.json`: runway ends and true headings, from [OurAirports](https://ourairports.com/data/) (public domain).

```bash
python3 pipeline/build_data.py categories --out ./data
python3 pipeline/build_data.py reference --out ./data
```

With `--push`, the script uploads the files to `/api/internal/data`, which needs `FLIGHT_TOOLS_PUSH_TOKEN` to match the Worker's `DATA_PUSH_TOKEN` secret. Without the files the tools still work; the map, airport search and runway list just don't appear.

## Course and accounts

Courses are listed in `src/lib/learn/courses.ts`. The NOTAM lessons live in `src/lib/learn/course.ts` and the METAR and TAF lessons in `src/lib/learn/metar-course.ts`. `npm test` checks each against its decoder: every annotated part must appear in its report, every course report must decode cleanly, and the codes, ceilings, flight categories, crosswinds, pressures, forecast periods and drill answers must agree with the engine.

A course's `id` is stored with each score on aviation.foundation, and the main site only accepts the ids it knows, so a new course needs its id added to `COURSES` in the main site's `/api/courses/progress` first.

Lessons need an aviation.foundation account. This Worker has no database. It reads the `af_session` cookie that aviation.foundation sets for the whole domain, asks the main site who the visitor is through the `ACCOUNTS` service binding, and saves lesson scores there through `/api/courses/progress`.

For local development, set one of these in `.env`:

- `DEV_ACCOUNT=1` signs you in as a local learner and keeps scores in memory.
- `ACCOUNTS_DEV_URL=http://127.0.0.1:4322` sends account calls to a local copy of the main site instead.

Both only work under `npm run dev`; a production build ignores them.

## Disclaimer

These are planning aids, not approved sources of flight data. Check official publications and your aircraft's POH before flight.

## License

MIT
