import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBoard, buildCategories, flightCategory, formatAge, formatMiles, namesFromIndex, parseCsv } from '../../src/lib/categories.ts';

const HEADER = 'raw_text,station_id,observation_time,latitude,longitude,visibility_statute_mi,sky_cover,cloud_base_ft_agl,sky_cover,cloud_base_ft_agl,vert_vis_ft';
const csv = (rows: string[]) => [HEADER, ...rows].join('\n') + '\n';

test('parseCsv keeps quoted commas, doubled quotes and CRLF', () => {
  assert.deepEqual(parseCsv('a,"b,c","d ""e"""\r\n1,2,3'), [['a', 'b,c', 'd "e"'], ['1', '2', '3']]);
});

test('flightCategory takes the worse of visibility and ceiling', () => {
  assert.equal(flightCategory(10, null, false), 'VFR');
  assert.equal(flightCategory(10, 2500, true), 'MVFR');
  assert.equal(flightCategory(2, 4000, true), 'IFR');
  assert.equal(flightCategory(0.5, 800, true), 'LIFR');
  assert.equal(flightCategory(5, null, true), 'MVFR');
  assert.equal(flightCategory(null, null, false), null);
});

test('formatMiles uses the nearest eighth', () => {
  assert.equal(formatMiles(10), '10');
  assert.equal(formatMiles(0.25), '1/4');
  assert.equal(formatMiles(1.5), '1 1/2');
  assert.equal(formatMiles(null), null);
});

test('buildCategories reads ceilings from broken, overcast and vertical visibility only', () => {
  const out = buildCategories(
    csv([
      'CYVR 130500Z,CYVR,2026-11-13T05:00:00Z,49.1947,-123.1839,10+,FEW,2000,BKN,2800,',
      'CYYJ 130500Z,CYYJ,2026-11-13T05:00:00Z,48.647,-123.426,0.5,,,,,2',
      'KSEA 130500Z,KSEA,2026-11-13T05:00:00Z,47.444,-122.314,6,SCT,900,,,',
      'NOPOS,NOPOS,2026-11-13T05:00:00Z,,,10,,,,,',
      'SHORT,SHORT',
    ]),
    new Date('2026-11-13T05:05:00.123Z'),
  );
  assert.equal(out.generated, '2026-11-13T05:05:00Z');
  assert.deepEqual(out.stations.map((s) => [s[0], s[3], s[4], s[5], s[6]]), [
    ['CYVR', 'MVFR', 10, 1, 2800],
    ['CYYJ', 'LIFR', 0.5, 0, 200],
    ['KSEA', 'VFR', 6, 0, null],
  ]);
  assert.deepEqual(out.stations[0].slice(1, 3), [49.195, -123.184]);
});

test('vertical visibility is read in hundreds of feet, matching an OVX layer', () => {
  const out = buildCategories(csv(['METAR CYWL 130500Z 1/2SM FG VV002,CYWL,t,52.18,-122.05,0.5,OVX,200,,,2']));
  assert.equal(out.stations[0][6], 200);
});

test('buildCategories finds the header below NOAA preamble lines', () => {
  const out = buildCategories('No errors\n1 results\n' + csv(['X,CYVR,t,49,-123,10,,,,,']));
  assert.equal(out.stations.length, 1);
});

test('buildCategories rejects a file with no header', () => {
  assert.throws(() => buildCategories('<html>maintenance</html>'), /header/);
});

test('buildBoard groups wanted stations by category with names and reasons', () => {
  const cats = buildCategories(csv([
    'a,CYVR,t,49,-123,10+,BKN,2800,,,',
    'b,CYYJ,t,48,-123,0.5,OVX,200,,,2',
  ]));
  const names = namesFromIndex([['CYVR', 'YVR', 'Vancouver Intl', 'BC', 'CA', 49, -123, 14], ['CYYJ', null, 'Victoria Intl', null, 'CA', 48, -123, 19]]);
  assert.equal(names.CYYJ, 'Victoria Intl, CA');
  const board = buildBoard(cats, names, ['CYVR', 'CYYJ', 'ZZZZ']);
  assert.equal(board.count, 2);
  assert.deepEqual(board.columns.map((c) => c.category), ['VFR', 'MVFR', 'IFR', 'LIFR']);
  assert.deepEqual(board.columns[1].items, [{ icao: 'CYVR', place: 'Vancouver Intl, BC', why: '10+ sm, ceiling 2,800 ft' }]);
  assert.deepEqual(board.columns[3].items, [{ icao: 'CYYJ', place: 'Victoria Intl', why: '1/2 sm, ceiling 200 ft' }]);
});

test('formatAge switches to hours and days instead of thousands of minutes', () => {
  const min = 60_000;
  assert.equal(formatAge(20_000), 'just now');
  assert.equal(formatAge(12 * min), '12 min ago');
  assert.equal(formatAge(5 * 60 * min), '5 h ago');
  assert.equal(formatAge(47 * 60 * min), '47 h ago');
  assert.equal(formatAge(5007 * min), '3 days ago');
  assert.equal(formatAge(-5 * min), 'just now');
});
