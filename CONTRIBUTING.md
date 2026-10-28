# Contributing

Bug reports and fixes are welcome. Open an issue first for anything bigger than a small fix.

## Setup

```bash
npm install
npm run dev
npm run build
```

## Before opening a pull request

- `npm run build` passes.
- The calculation modules in `src/lib` stay free of framework imports, so they can be reused outside Astro.
- If you change a formula, say where the number comes from (FAA handbook, AC, POH) in the pull request description.
- Don't add anything that needs an account or an API key.

## Wrong results

If a decoder or calculator gives a result that disagrees with an official source, open an issue with the input and the source's value. Those are the most useful reports.
