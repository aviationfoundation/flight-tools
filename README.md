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

For production: `npm run build && npm start`. The METAR page fetches on the server, so it can't be a static export.

## Known gaps

Station search (`/api/wx/stations`) was backed by a Cloudflare D1 table. There's no database here, so it returns nothing. Typing an ICAO code directly still works. The seed data is in `migrations/0016_wx_stations.sql`.

## Disclaimer

These are planning aids, not approved sources of flight data. Check official publications and your aircraft's POH before flight.

## License

MIT
