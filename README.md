# flight-tools

Flight planning tools from [aviation.foundation](https://aviation.foundation), split out into their own repo.

- METAR & TAF decoder: `/tools/metar`
- NOTAM decoder: `/tools/notam`
- E6B: `/tools/e6b`
- Weight & balance: `/tools/weight-balance`
- Takeoff & landing distance: `/tools/takeoff-landing-distance`

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

## Disclaimer

These are planning aids, not approved sources of flight data. Check official publications and your aircraft's POH before flight.

## License

MIT
