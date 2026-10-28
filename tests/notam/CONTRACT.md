# NOTAM engine test contract

Engine: `src/lib/notam.ts`. Run tests with `npm test` (Node 24+ strips TS types natively; import with `../../src/lib/notam.ts`).

Use `node:test` and `node:assert/strict`. No comments in test code.

Suites:

- `fixtures.test.ts`: the 100 well-formed fixtures in `fixtures/notams.txt`
- `malformed.test.ts`: `fixtures/malformed.txt`, hostile input, timing limits and a seeded fuzz
- `formats.test.ts`: FAA domestic, FAA ICAO, NAV CANADA, EAD, mixed pastes
- `language.test.ts`: code tables, contractions and summary wording

## Existing API (keep)

`decodeNotam(input: string): DecodedNotam` with `series`, `number`, `type`, `replaces`, `qLine`, `fields`, `effectiveFrom`, `effectiveTo`, `estimatedEnd`, `permanent`, `plainSummary`, `unrecognisedTokens`, `unstructured`.

## Added API

```ts
splitNotams(text: string): string[]
decodeNotams(text: string): DecodedNotam[]

interface NotamIssue {
  severity: 'error' | 'warning';
  code: IssueCode;
  field: 'header' | 'Q' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | null;
  message: string;
}

DecodedNotam.format: 'icao' | 'faa-domestic' | 'short' | 'text'
DecodedNotam.issues: NotamIssue[]
DecodedNotam.qLine.center: { lat: number; lon: number } | null
DecodedNotam.qLine.lowerFl / upperFl: string | null   (unchanged, '000', '999')
DecodedNotam.textCoordinates: Array<{ raw: string; lat: number; lon: number }>
```

`splitNotams` splits a paste into one string per NOTAM: on a new header line (`A1234/26 NOTAMN`, `KSEA A1234/26 NOTAMN`, `10/123 NOTAMN`, `!SEA 10/123`, `(A1234/26 NOTAMN`) or a NAV CANADA short-form line once the previous NOTAM is complete. It ignores `#` comment lines, `1 of 3` lines and `CREATED:`/`SOURCE:` trailers, strips consecutive line numbers, and tolerates CRLF.

Before E), lettered items are recognised at the start of a line or inline after whitespace. Once E) starts, only F) and G) can end it (at a line start, or inline when followed by a limit), plus an item at a line start whose value has that item's shape (for out-of-order pastes). Text such as `SEE ITEM D)` or `B) AND C) FIELDS` inside E) stays in E).

Field `raw` keeps the pasted case and characters; parsing runs on an upper-cased copy.

## Issue codes

| code | when |
|---|---|
| `header-missing` | no series/number/type header |
| `header-malformed` | header present but number not `\d{4}/\d{2}` (e.g. `A910X/26`) |
| `ref-missing` | NOTAMR or NOTAMC without the referenced NOTAM number |
| `ref-unexpected` | NOTAMN carrying a reference |
| `q-malformed` | Q) missing, or not exactly 8 slash-separated parts |
| `q-code-unknown` | Q-code not `Q` plus four letters, or subject or condition not in the ICAO tables |
| `q-geo-malformed` | geo part not `DDMM[NS]DDDMM[EW]RRR` |
| `q-geo-out-of-range` | lat > 90, lon > 180, minutes > 59 |
| `q-limits-inverted` | Q) upper below lower (equal is allowed) |
| `q-limits-malformed` | Q) lower or upper not three digits |
| `field-missing` | A) or E) absent; B) absent (except NOTAMC may omit it); C) absent on NOTAMN/NOTAMR |
| `time-malformed` | B) not 10 digits; C) not 10 digits (plus optional EST) or PERM. `UFN` in C) is reported but read as "until further notice" |
| `time-invalid` | 10 digits but not a real date/time (month 13, day 32, hour 24+, minute 60+) |
| `time-order` | C) is at or before B) |
| `cancel-has-end` | NOTAMC carries a C) item |
| `schedule-invalid` | D) contains an hour outside 0000–2359 (2400 allowed only as an end) |
| `limits-inverted` | F) is above G) |
| `limits-malformed` | F) or G) not SFC, GND, UNL, FLnnn, or nnnnnFT/M with AMSL/AGL/SFC; also UNL in F) or SFC/GND in G) |
| `text-contradiction` | Q) says closed/unserviceable but E) only says open/available, or the reverse. Not checked on NOTAMC |
| `item-duplicated` | a lettered item appears again at a line start |
| `multiple-notams` | `decodeNotam` was given a paste holding more than one NOTAM |

Each code has one severity, except `field-missing`. `error`: `header-missing`, `header-malformed`, `q-malformed`, `q-geo-out-of-range`, `field-missing` for A/B/E, `time-malformed`, `time-invalid`, `time-order`. Everything else is `warning`, including `field-missing` for C. A NOTAMC may omit B) and C).

Text with no header and no lettered items (other than the FAA domestic and NAV CANADA short forms) is decoded as plain text and raises `header-missing`.

Invalid times must not roll over: `parseNotamTime('2610322500')` returns null, and `effectiveFrom` stays null with a `time-invalid` issue.

Out-of-range Q) coordinates must give `center: null` so nothing is drawn on the map.

A clean, valid NOTAM has `issues: []`.
