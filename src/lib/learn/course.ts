export { normaliseAnswer } from './answer.ts';

export interface Mark {
  text: string;
  label: string;
  note: string;
}

export interface Option {
  text: string;
  correct?: boolean;
  why: string;
}

export interface TriageItem {
  raw: string;
  affects: boolean;
  why: string;
}

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'notam'; raw: string; marks?: Mark[]; caption?: string }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'rule'; title: string; text: string }
  | { kind: 'choice'; id: string; prompt: string; raw?: string; options: Option[] }
  | { kind: 'answer'; id: string; prompt: string; raw?: string; accept: string[]; placeholder: string; why: string }
  | { kind: 'pick'; id: string; prompt: string; raw: string; choices: string[]; answer: string; why: string }
  | { kind: 'triage'; id: string; flight: Array<[string, string]>; items: TriageItem[]; debrief?: { title: string; text: string } };

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  blocks: Block[];
}

export const COURSE_ID = 'notam';

const RUNWAY = `A1287/26 NOTAMN
Q) CZVR/QMRLC/IV/NBO/A/000/999/4911N12311W005
A) CYVR B) 2610300400 C) 2611072359
D) DAILY 0400-1400
E) RWY 08L/26R CLSD DUE TO REHABILITATION WORK.`;

const TAXIWAY_R = `A0420/26 NOTAMR A0399/26
Q) KZSE/QMXLC/IV/NBO/A/000/999/4727N12218W005
A) KSEA B) 2610281400 C) 2610302200
E) TWY B BTN TWY B5 AND TWY B7 CLSD.`;

const DRONES = `A2214/26 NOTAMN
Q) CZVR/QWULW/IV/BO/W/000/014/4902N12230W001
A) CYXX B) 2610291530 C) 2610291730
E) UAS ACTIVITY WI 1NM RADIUS OF 490200N 1223000W.
F) SFC G) 1200FT AGL`;

export const LESSONS: Lesson[] = [
  {
    id: 'parts',
    title: 'The parts of a NOTAM',
    summary: 'What a NOTAM is for, and the three parts every one of them has.',
    minutes: 5,
    blocks: [
      {
        kind: 'p',
        text: 'Charts and the AIP, the official book of a country\'s airports, airspace and procedures, are reissued on fixed cycles weeks apart. A runway closed for paving tomorrow, a crane put up this morning or a drone survey on Thursday can\'t wait for the next cycle, so the authority sends a NOTAM instead. Your preflight briefing collects the ones for your departure, destination and route.',
      },
      {
        kind: 'p',
        text: 'Most countries write NOTAMs in the ICAO format, and that is where this course starts. Lesson 8 covers the format the FAA uses inside the US. Here is a runway closure at Vancouver. Tap or hover over each part.',
      },
      {
        kind: 'notam',
        raw: RUNWAY,
        marks: [
          { text: 'A1287/26 NOTAMN', label: 'Header', note: 'The NOTAM\'s name, A1287/26, and its type. N means new.' },
          { text: 'Q) CZVR/QMRLC/IV/NBO/A/000/999/4911N12311W005', label: 'Q-line', note: 'The whole NOTAM in code, for the computers that sort briefings.' },
          { text: 'A) CYVR', label: 'Where', note: 'Vancouver International, by its ICAO code.' },
          { text: 'B) 2610300400', label: 'From', note: '30 October 2026, 04:00 UTC.' },
          { text: 'C) 2611072359', label: 'Until', note: '7 November 2026, 23:59 UTC.' },
          { text: 'D) DAILY 0400-1400', label: 'Schedule', note: 'Only between 04:00 and 14:00 UTC each day.' },
          { text: 'E) RWY 08L/26R CLSD DUE TO REHABILITATION WORK.', label: 'What', note: 'The message: runway 08L/26R is closed for rebuilding.' },
        ],
      },
      {
        kind: 'table',
        head: ['Item', 'What it tells you', 'Present'],
        rows: [
          ['A)', 'Where: an aerodrome, or a whole flight information region (FIR)', 'Always'],
          ['B)', 'When it starts, in UTC', 'Always'],
          ['C)', 'When it ends, in UTC', 'Except on cancellations'],
          ['D)', 'A schedule, when it isn\'t in force the whole time', 'When needed'],
          ['E)', 'What: the message, in abbreviated English', 'Always'],
          ['F) and G)', 'The lowest and highest altitude it covers', 'Mostly on airspace warnings'],
        ],
      },
      {
        kind: 'rule',
        title: 'Four questions',
        text: 'A NOTAM matters to you only if it touches your flight on all four: where it is, when it is, how high it reaches, and whether it applies to your kind of flying. A) answers the first, B), C) and D) the second, F) and G) the third, and E) the fourth. The last lesson puts them together.',
      },
      {
        kind: 'pick',
        id: 'parts-where',
        prompt: 'Tap the part that tells you which airport this NOTAM is about.',
        raw: RUNWAY,
        choices: ['A1287/26', 'CZVR', 'CYVR', '2610300400', 'RWY 08L/26R'],
        answer: 'CYVR',
        why: 'A) holds the location: CYVR is Vancouver International. CZVR, in the Q-line, is the Vancouver FIR, the much larger region the airport sits in.',
      },
      {
        kind: 'choice',
        id: 'parts-what',
        prompt: 'Which item names the runway that is closed?',
        options: [
          { text: 'The Q-line', why: 'QMRLC says a runway is closed, but not which one. Vancouver has three.' },
          { text: 'A)', why: 'A) gives the airport, not the runway.' },
          { text: 'E)', correct: true, why: 'E) is the message itself: RWY 08L/26R CLSD.' },
        ],
      },
      {
        kind: 'choice',
        id: 'parts-no-fg',
        prompt: 'This NOTAM has no F) or G). Why?',
        options: [
          { text: 'It is about something on the ground at the airport, so there is no block of airspace to describe', correct: true, why: 'F) and G) describe airspace. Aerodrome NOTAMs about runways, taxiways or lights usually leave them out.' },
          { text: 'The altitudes were left out by mistake', why: 'F) and G) are only required when the NOTAM covers a block of airspace, such as a drone area or a restricted area.' },
          { text: 'You have to look the altitudes up in the AIP', why: 'There is nothing to look up. A closed runway has no altitude.' },
        ],
      },
    ],
  },
  {
    id: 'number',
    title: 'Number, type and replacements',
    summary: 'How to tell a new NOTAM from one that replaces or cancels another.',
    minutes: 4,
    blocks: [
      {
        kind: 'p',
        text: 'The first line names the NOTAM and says whether it is new, replaces an earlier one, or cancels one.',
      },
      {
        kind: 'notam',
        raw: TAXIWAY_R,
        marks: [
          { text: 'A0420/26', label: 'Name', note: 'Series A, number 0420, issued in 2026.' },
          { text: 'NOTAMR', label: 'Type', note: 'R: this NOTAM replaces another.' },
          { text: 'A0399/26', label: 'Replaces', note: 'The NOTAM that no longer applies.' },
          { text: 'E) TWY B BTN TWY B5 AND TWY B7 CLSD.', label: 'What', note: 'Taxiway B is closed between B5 and B7.' },
        ],
      },
      {
        kind: 'table',
        head: ['Header', 'Means', 'What you do'],
        rows: [
          ['A0420/26 NOTAMN', 'A new NOTAM', 'Read it'],
          ['A0420/26 NOTAMR A0399/26', 'Replaces A0399/26', 'Use this one. A0399/26 is dead.'],
          ['A0433/26 NOTAMC A0420/26', 'Cancels A0420/26', 'The condition in A0420/26 is over'],
        ],
      },
      {
        kind: 'p',
        text: 'The number counts up through the year, and the two digits after the slash are the year. The series letter groups NOTAMs, often by subject or by who issued them; what each letter means varies by country, and you rarely need it.',
      },
      {
        kind: 'p',
        text: 'A replacement is a whole new NOTAM with new times and new text, not a correction slip. If you printed your briefing yesterday, a NOTAMR issued since then has made your copy wrong. Get a fresh briefing before you go.',
      },
      {
        kind: 'choice',
        id: 'number-replaced',
        prompt: 'A0399/26 closes taxiway B until 30 October at 18:00 UTC. A0420/26 NOTAMR A0399/26 closes it until 22:00 UTC the same day. Until when is taxiway B closed?',
        options: [
          { text: '18:00 UTC', why: 'That end time belongs to A0399/26, which A0420/26 replaced.' },
          { text: '22:00 UTC', correct: true, why: 'A0420/26 replaces A0399/26, so its times are the ones that count.' },
          { text: 'Whichever is earlier, to be safe', why: 'A replaced NOTAM no longer applies at all. Ending your plan at 18:00 would put you on a closed taxiway.' },
        ],
      },
      {
        kind: 'choice',
        id: 'number-cancel',
        prompt: 'Then A0433/26 NOTAMC A0420/26 arrives. What does it tell you?',
        options: [
          { text: 'The taxiway B closure is over', correct: true, why: 'A NOTAMC cancels the NOTAM it names. Taxiway B is back in normal use.' },
          { text: 'There is a new closure with different times', why: 'A new closure with different times would be a NOTAMR.' },
          { text: 'A0433/26 replaces A0420/26 with new text', why: 'C means cancel. Nothing replaces A0420/26; it simply ends.' },
        ],
      },
      {
        kind: 'answer',
        id: 'number-year',
        prompt: 'In C0187/25 NOTAMN, which year was the NOTAM issued? Give all four digits.',
        accept: ['2025'],
        placeholder: 'Year',
        why: 'The two digits after the slash are the year, so 25 is 2025. C is the series and 0187 the number.',
      },
    ],
  },
  {
    id: 'q-line',
    title: 'The Q-line',
    summary: 'The coded summary line, field by field, and how its codes are built.',
    minutes: 6,
    blocks: [
      {
        kind: 'p',
        text: 'The Q-line packs the NOTAM into eight fields separated by slashes. Briefing systems sort on it and drop NOTAMs that miss your route or altitude. It is worth reading as a check that you understood E).',
      },
      {
        kind: 'notam',
        raw: 'Q) CZVR/QMRLC/IV/NBO/A/000/999/4911N12311W005',
        marks: [
          { text: 'CZVR', label: 'FIR', note: 'The flight information region: Vancouver.' },
          { text: 'QMRLC', label: 'Q-code', note: 'Subject MR, runway. Condition LC, closed.' },
          { text: 'IV', label: 'Traffic', note: 'Matters to IFR and VFR flights. I alone means IFR only.' },
          { text: 'NBO', label: 'Purpose', note: 'For immediate attention, for the briefing, and significant to operations.' },
          { text: 'A', label: 'Scope', note: 'A for aerodrome. E is en route, W a navigation warning.' },
          { text: '000', label: 'Lower', note: 'Lowest flight level: the surface.' },
          { text: '999', label: 'Upper', note: 'Highest flight level: 999 means no upper limit.' },
          { text: '4911N12311W', label: 'Position', note: '49°11′ north, 123°11′ west.' },
          { text: '005', label: 'Radius', note: '5 nautical miles around that point.' },
        ],
      },
      {
        kind: 'p',
        text: 'The Q-code is always five letters. The first is Q. Letters two and three are the subject, letters four and five the condition. You don\'t need to memorise the tables: the decoder spells every code out. Knowing that it splits two and two is enough to check it.',
      },
      {
        kind: 'table',
        head: ['Code', 'Subject', 'Condition'],
        rows: [
          ['QMRLC', 'MR: runway', 'LC: closed'],
          ['QMXLC', 'MX: taxiway', 'LC: closed'],
          ['QICAS', 'IC: instrument landing system', 'AS: unserviceable'],
          ['QOBCE', 'OB: obstacle', 'CE: erected'],
          ['QWULW', 'WU: unmanned aircraft', 'LW: will take place'],
          ['QFAXX', 'FA: aerodrome', 'XX: read the text'],
        ],
      },
      {
        kind: 'p',
        text: 'Lower and upper are flight levels, in hundreds of feet: 050 is 5,000 ft. Aerodrome NOTAMs use 000 and 999, which means no limit at all. When F) and G) give exact heights, use those; the Q-line rounds them out to whole flight levels.',
      },
      {
        kind: 'p',
        text: 'The position is degrees and minutes, then a three-digit radius in nautical miles. It is the circle the NOTAM is filed against, and the decoder draws it on a map. A radius of 999 means the NOTAM covers the whole FIR.',
      },
      {
        kind: 'choice',
        id: 'q-falc',
        prompt: 'What does QFALC mean?',
        options: [
          { text: 'Aerodrome closed', correct: true, why: 'FA is the aerodrome and LC is closed. The whole airport is shut.' },
          { text: 'Fuel not available', why: 'Fuel is subject FU, and not available is condition AU: QFUAU.' },
          { text: 'Approach lights closed', why: 'Approach lighting is subject LA. FA is the aerodrome itself.' },
        ],
      },
      {
        kind: 'pick',
        id: 'q-subject',
        prompt: 'Tap the code that says what this NOTAM is about.',
        raw: 'Q) KZSE/QICAS/IV/NBO/A/000/999/4727N12218W005',
        choices: ['KZSE', 'QICAS', 'IV', 'NBO', '4727N12218W'],
        answer: 'QICAS',
        why: 'QICAS: IC is the instrument landing system, AS is unserviceable. KZSE is the Seattle FIR, and the rest is traffic, purpose and position.',
      },
      {
        kind: 'answer',
        id: 'q-radius',
        prompt: 'A Q-line ends 4806N05245W010. What is the radius, in nautical miles?',
        accept: ['10', '010'],
        placeholder: 'Nautical miles',
        why: 'The last three digits are the radius: 010 is 10 NM. The rest is the position, 48°06′N 52°45′W.',
      },
      {
        kind: 'choice',
        id: 'q-limits',
        prompt: 'A Q-line reads …/A/000/999/… . Which altitudes does it cover?',
        options: [
          { text: 'From the surface up, with no upper limit', correct: true, why: '000 is the surface and 999 means no upper limit. It is the standard pair for an aerodrome NOTAM.' },
          { text: 'From 0 to 999 feet', why: 'The limits are flight levels, in hundreds of feet. 999 would be 99,900 ft, which is why it is used to mean no limit.' },
          { text: 'Flight levels 0 to 99', why: 'Each field is a full three-digit flight level: 999, not 99.' },
        ],
      },
    ],
  },
  {
    id: 'when',
    title: 'Where and when: A), B) and C)',
    summary: 'Reading NOTAM times, and converting them without losing a day.',
    minutes: 6,
    blocks: [
      {
        kind: 'p',
        text: 'A) is the ICAO location indicator: four letters for an aerodrome, such as CYVR or KSEA, or the code of a FIR for en-route NOTAMs. Some NOTAMs list several.',
      },
      {
        kind: 'p',
        text: 'B) and C) are ten-digit date-times, read in pairs: year, month, day, hour, minute. They are always UTC.',
      },
      {
        kind: 'notam',
        raw: 'B) 2610300400',
        marks: [
          { text: '26', label: 'Year', note: '2026' },
          { text: '10', label: 'Month', note: 'October' },
          { text: '30', label: 'Day', note: 'The 30th' },
          { text: '04', label: 'Hour', note: '04, UTC' },
          { text: '00', label: 'Minute', note: ':00' },
        ],
      },
      {
        kind: 'p',
        text: 'UTC is the same everywhere, so do your thinking in UTC and convert to local time last, watching the date. In October, Vancouver is UTC−7, so 04:00 UTC on 30 October is 21:00 on 29 October in Vancouver. This closure starts the evening before the date printed in B).',
      },
      {
        kind: 'p',
        text: 'C) can carry two other things. EST after the time means the end is an estimate: expect a replacement or a cancellation, and don\'t count on it ending on time. PERM in place of a time means the change is permanent and will be written into the AIP and charts.',
      },
      {
        kind: 'rule',
        title: 'EST is not a time zone',
        text: 'NOTAM times are always UTC. EST after a time in C) means estimated. It never means Eastern Standard Time.',
      },
      {
        kind: 'choice',
        id: 'when-read',
        prompt: 'B) 2611051930. When does the NOTAM start?',
        options: [
          { text: '5 November 2026, 19:30 UTC', correct: true, why: '26 11 05 19 30: year, month, day, hour, minute.' },
          { text: '26 November 2005, 19:30 UTC', why: 'The year comes first. 26 is 2026.' },
          { text: '5 November 2026, 19:30 local time', why: 'NOTAM times are UTC. Convert to local yourself.' },
        ],
      },
      {
        kind: 'choice',
        id: 'when-est',
        prompt: 'C) 2611072359 EST. What should you plan on?',
        options: [
          { text: 'It may end earlier or later than 23:59 UTC on 7 November, so check for a replacement', correct: true, why: 'EST marks an estimate. The issuer must replace or cancel the NOTAM, so look for that before you rely on the end time.' },
          { text: 'It ends at 23:59 UTC on 7 November', why: 'EST means the end time is only an estimate.' },
          { text: 'It ends at 23:59 Eastern Standard Time', why: 'EST in a NOTAM means estimated. NOTAM times are always UTC.' },
        ],
      },
      {
        kind: 'answer',
        id: 'when-convert',
        prompt: 'You plan to depart Vancouver at 20:30 local time on 29 October, when Vancouver is UTC−7. What is that in UTC? Answer with four digits.',
        accept: ['0330'],
        placeholder: 'hhmm',
        why: '20:30 plus 7 hours is 03:30 UTC, and the date rolls over to 30 October. The runway closure that starts at 04:00 UTC on 30 October begins half an hour after you leave.',
      },
    ],
  },
  {
    id: 'schedule',
    title: 'Schedules in D)',
    summary: 'When a NOTAM is only in force part of the time between B) and C).',
    minutes: 5,
    blocks: [
      {
        kind: 'p',
        text: 'B) and C) bracket the whole period. When the thing only happens part of that time, D) gives the schedule, also in UTC.',
      },
      {
        kind: 'notam',
        raw: RUNWAY,
        marks: [
          { text: 'B) 2610300400', label: 'From', note: 'The first day: 30 October.' },
          { text: 'C) 2611072359', label: 'Until', note: 'The last day: 7 November.' },
          { text: 'D) DAILY 0400-1400', label: 'Schedule', note: 'Every day, 04:00 to 14:00 UTC.' },
        ],
      },
      {
        kind: 'p',
        text: 'So runway 08L/26R isn\'t closed for nine days straight. It is closed for ten hours a day, and open from 14:00 until 04:00 UTC.',
      },
      {
        kind: 'table',
        head: ['D) says', 'Means'],
        rows: [
          ['DAILY 0400-1400', 'Every day, 04:00 to 14:00 UTC'],
          ['MON-FRI 0700-1500', 'Monday to Friday, 07:00 to 15:00 UTC'],
          ['DAILY 2200-0500', 'Overnight, crossing midnight UTC'],
          ['SR-SS', 'Sunrise to sunset'],
          ['H24', 'All day'],
        ],
      },
      {
        kind: 'p',
        text: 'Days of the week are UTC days too. In Vancouver or Seattle, Monday in UTC begins at 16:00 or 17:00 on Sunday, local time, depending on daylight saving.',
      },
      {
        kind: 'choice',
        id: 'schedule-1500',
        prompt: 'With B) 2610300400, C) 2611072359 and D) DAILY 0400-1400, is the runway closed at 15:00 UTC on 31 October?',
        options: [
          { text: 'No', correct: true, why: '31 October is inside B) to C), but 15:00 is after the daily window ends at 14:00.' },
          { text: 'Yes', why: 'The date is inside B) to C), but D) limits the closure to 04:00 to 14:00 UTC each day.' },
        ],
      },
      {
        kind: 'choice',
        id: 'schedule-after-c',
        prompt: 'Same NOTAM. Is the runway closed at 05:00 UTC on 8 November?',
        options: [
          { text: 'No', correct: true, why: '05:00 is inside the daily window, but C) ended the NOTAM at 23:59 UTC on 7 November.' },
          { text: 'Yes', why: 'D) only applies between B) and C). After C) the NOTAM is over.' },
        ],
      },
      {
        kind: 'choice',
        id: 'schedule-utc-day',
        prompt: 'A NOTAM at Vancouver says D) MON-FRI 0100-0500. You land at 19:00 local time on Sunday 25 October, when Vancouver is UTC−7. Is the NOTAM in force?',
        options: [
          { text: 'Yes: 19:00 Sunday local is 02:00 Monday UTC, inside the window', correct: true, why: 'Add 7 hours: 02:00 UTC on Monday 26 October. MON-FRI counts UTC days.' },
          { text: 'No: it is Sunday', why: 'It is Sunday in Vancouver, but Monday in UTC, and D) uses UTC.' },
        ],
      },
    ],
  },
  {
    id: 'text',
    title: 'Reading the E) text',
    summary: 'The contractions that come up again and again, and how to take a sentence apart.',
    minutes: 6,
    blocks: [
      {
        kind: 'p',
        text: 'E) is the message, in English cut down with ICAO abbreviations. Most sentences have three parts: the thing, its state, and a reason or condition.',
      },
      {
        kind: 'notam',
        raw: 'E) TWY A BTN TWY D AND TWY H CLSD DUE WIP.',
        marks: [
          { text: 'TWY A BTN TWY D AND TWY H', label: 'Thing', note: 'Taxiway A, between taxiways D and H.' },
          { text: 'CLSD', label: 'State', note: 'Closed.' },
          { text: 'DUE WIP', label: 'Reason', note: 'Because of work in progress.' },
        ],
      },
      {
        kind: 'table',
        head: ['Contraction', 'Meaning'],
        rows: [
          ['RWY, TWY, APN', 'Runway, taxiway, apron'],
          ['AD', 'Aerodrome'],
          ['CLSD', 'Closed'],
          ['U/S', 'Unserviceable'],
          ['AVBL', 'Available'],
          ['BTN', 'Between'],
          ['EXC', 'Except'],
          ['WI', 'Within'],
          ['WIP', 'Work in progress'],
          ['MAINT', 'Maintenance'],
          ['ACFT', 'Aircraft'],
          ['OBST', 'Obstacle'],
          ['HGT', 'Height'],
          ['ELEV', 'Elevation'],
          ['AGL', 'Above ground level'],
          ['AMSL', 'Above mean sea level'],
          ['PPR', 'Prior permission required'],
          ['PN', 'Prior notice'],
          ['REQ', 'Request'],
          ['UFN', 'Until further notice'],
          ['THR', 'Threshold'],
          ['FREQ', 'Frequency'],
        ],
      },
      {
        kind: 'p',
        text: 'Runway designators keep their letters: 08L is runway 08 left, 26R is 26 right. A strip of pavement has a number for each direction, so 08L/26R is one runway.',
      },
      {
        kind: 'p',
        text: 'Positions in E) are usually degrees, minutes and seconds: 491230N 1231020W is 49°12′30″N 123°10′20″W. Obstacle NOTAMs often give two numbers: the height above the ground (AGL) and the elevation of the top above sea level (AMSL). Your altimeter, set to the local pressure, reads above sea level, so compare it with the AMSL number.',
      },
      {
        kind: 'choice',
        id: 'text-papi',
        prompt: 'What does PAPI RWY 26R U/S mean?',
        options: [
          { text: 'The approach slope lights for runway 26R are out of service', correct: true, why: 'PAPI is the row of lights beside the runway that shows whether you are on the glide path. U/S is unserviceable.' },
          { text: 'Runway 26R is closed', why: 'Only the PAPI is out. The runway itself is open.' },
          { text: 'Runway 26R is only usable with prior permission', why: 'Prior permission would be PPR. U/S means unserviceable.' },
        ],
      },
      {
        kind: 'pick',
        id: 'text-weight',
        prompt: 'Tap the part that says who can\'t use the runway.',
        raw: 'E) RWY 16/34 CLSD TO ACFT OVER 5700 KG DUE SFC DAMAGE.',
        choices: ['RWY 16/34', 'CLSD', 'ACFT OVER 5700 KG', 'SFC DAMAGE'],
        answer: 'ACFT OVER 5700 KG',
        why: 'Only aircraft heavier than 5,700 kg are kept off. A Cessna 172, at about 1,100 kg fully loaded, can still use it. SFC DAMAGE is the reason: the surface is damaged.',
      },
      {
        kind: 'choice',
        id: 'text-ppr',
        prompt: 'AD CLSD TO ACFT WITHOUT PPR. Can you land there?',
        options: [
          { text: 'Yes, if you arrange it with the airport first', correct: true, why: 'PPR is prior permission required. Call ahead and get permission before you go.' },
          { text: 'No, the aerodrome is closed to everyone', why: 'It is closed only to aircraft without prior permission.' },
          { text: 'Yes, as long as you call on the radio when you arrive', why: 'Prior permission means arranged before the flight, not on arrival.' },
        ],
      },
      {
        kind: 'choice',
        id: 'text-crane',
        prompt: 'CRANE 285FT AGL, ELEV 512FT AMSL sits under your route. You cross it with 1,000 ft on your altimeter, set to the local pressure. How far above the top of the crane are you?',
        options: [
          { text: '488 ft', correct: true, why: 'The top of the crane is at 512 ft above sea level and you are at 1,000 ft above sea level: 1,000 − 512 = 488 ft.' },
          { text: '715 ft', why: '285 ft is the crane\'s height above the ground. Your altimeter reads above sea level, so compare it with the 512 ft elevation.' },
          { text: 'It depends on the ground below', why: 'ELEV already includes the ground: 512 ft AMSL is the top of the crane above sea level.' },
        ],
      },
    ],
  },
  {
    id: 'heights',
    title: 'Heights in F) and G)',
    summary: 'The block of airspace an activity fills, and whether your altitude is inside it.',
    minutes: 5,
    blocks: [
      {
        kind: 'p',
        text: 'NOTAMs about activity in the air, such as drones, parachuting, aerobatics or a temporary restricted area, carry F) and G): the lowest and highest altitude affected. You are inside if your altitude is between them, at the place and time the NOTAM covers.',
      },
      {
        kind: 'notam',
        raw: DRONES,
        marks: [
          { text: '014', label: 'Q-line upper', note: 'Flight level 014: the block, rounded up to hundreds of feet.' },
          { text: 'F) SFC', label: 'Lowest', note: 'From the surface.' },
          { text: 'G) 1200FT AGL', label: 'Highest', note: '1,200 ft above the ground.' },
        ],
      },
      {
        kind: 'table',
        head: ['You will see', 'Means'],
        rows: [
          ['SFC or GND', 'The ground'],
          ['1200FT AGL', '1,200 ft above the ground below'],
          ['8000FT AMSL', '8,000 ft above sea level, which your altimeter shows on the local pressure setting'],
          ['FL120', 'Flight level 120: 12,000 ft on the standard setting, 1013 hPa or 29.92 inHg'],
          ['UNL', 'No upper limit'],
        ],
      },
      {
        kind: 'p',
        text: 'AGL is measured from the ground under the activity, so add the ground elevation before comparing it with your altimeter. The ground around Abbotsford is about 200 ft above sea level, so 1,200 ft AGL there is about 1,400 ft on your altimeter.',
      },
      {
        kind: 'choice',
        id: 'heights-cruise',
        prompt: 'An area with F) SFC and G) 2500FT AMSL surrounds your departure airport. You will cruise at 3,500 ft. Does it affect you?',
        options: [
          { text: 'Not in the cruise, but it does while you climb out through it', correct: true, why: 'You start on the ground inside it and climb through 2,500 ft before you are above it.' },
          { text: 'No, because you cruise above it', why: 'You still take off and climb inside the block.' },
          { text: 'Yes, for the whole flight', why: 'Once you are above 2,500 ft, or outside the area, you are clear of it.' },
        ],
      },
      {
        kind: 'choice',
        id: 'heights-agl',
        prompt: 'Drones operate with F) SFC and G) 1200FT AGL over ground 400 ft above sea level. What is the highest altimeter reading at which you could meet them?',
        options: [
          { text: '1,600 ft', correct: true, why: '1,200 ft above ground that is 400 ft above sea level reaches 1,600 ft above sea level.' },
          { text: '1,200 ft', why: '1,200 ft is measured from the ground. Add the 400 ft ground elevation.' },
          { text: '800 ft', why: 'The ground elevation is added, not subtracted.' },
        ],
      },
      {
        kind: 'choice',
        id: 'heights-which',
        prompt: 'A NOTAM\'s Q-line says 000/999, but F) says SFC and G) says 3000FT AGL. Which limits do you plan with?',
        options: [
          { text: 'F) and G)', correct: true, why: 'F) and G) give the actual block. The Q-line limits are for sorting, and 000/999 is often just the default.' },
          { text: 'The Q-line, since it is wider', why: 'The Q-line is a coarse filter. F) and G) are the limits the NOTAM sets.' },
        ],
      },
    ],
  },
  {
    id: 'us-format',
    title: 'The US domestic format',
    summary: 'The one-line NOTAMs the FAA issues, and the FDC NOTAMs that carry TFRs.',
    minutes: 5,
    blocks: [
      {
        kind: 'p',
        text: 'Inside the US, many NOTAMs come in the FAA\'s domestic format: one line, with no Q-line and no lettered items. The same information is there in a fixed order.',
      },
      {
        kind: 'notam',
        raw: '!SEA 10/123 SEA RWY 16L/34R CLSD 2610281200-2610290600',
        marks: [
          { text: '!SEA', label: 'Issued by', note: 'The facility accountable for the NOTAM: Seattle.' },
          { text: '10/123', label: 'Number', note: 'Month 10, number 123.' },
          { text: 'SEA', label: 'Where', note: 'The airport affected, by its FAA identifier.' },
          { text: 'RWY', label: 'Keyword', note: 'The kind of NOTAM: a runway.' },
          { text: '16L/34R CLSD', label: 'What', note: 'Runway 16L/34R is closed.' },
          { text: '2610281200', label: 'From', note: '28 October 2026, 12:00 UTC, the same digits as B).' },
          { text: '2610290600', label: 'Until', note: '29 October 2026, 06:00 UTC, the same digits as C).' },
        ],
      },
      {
        kind: 'p',
        text: 'Locations are usually three characters, SEA, where ICAO uses four, KSEA. The keyword sorts the NOTAM: RWY, TWY, APRON, AD for the aerodrome, NAV for navigation aids, COM for communications, SVC for services such as fuel, OBST for obstacles and AIRSPACE. Times work as in the ICAO format, including EST and PERM.',
      },
      {
        kind: 'p',
        text: 'FDC NOTAMs come from the FAA\'s Flight Data Center and carry rules: temporary flight restrictions (TFRs), changes to instrument procedures and chart corrections. They start !FDC, and their number uses one digit for the year: 6/4321 is number 4321 of 2026. TFRs don\'t always sit under an airport, so check for them along your whole route.',
      },
      {
        kind: 'pick',
        id: 'us-end',
        prompt: 'Tap the time this NOTAM ends.',
        raw: '!BFI 10/045 BFI TWY B CLSD 2610291500-2610292300',
        choices: ['!BFI', '10/045', 'TWY B CLSD', '2610291500', '2610292300'],
        answer: '2610292300',
        why: 'The range at the end is start, then end: 29 October from 15:00 to 23:00 UTC.',
      },
      {
        kind: 'choice',
        id: 'us-fdc',
        prompt: '!FDC 6/1234 ZSE WA..AIRSPACE SEATTLE, WA..TEMPORARY FLIGHT RESTRICTIONS… What kind of NOTAM is this?',
        options: [
          { text: 'A temporary flight restriction from the FAA\'s Flight Data Center', correct: true, why: '!FDC marks a Flight Data Center NOTAM, and the text says TEMPORARY FLIGHT RESTRICTIONS. Plan around the area or get the clearance it describes.' },
          { text: 'A closure at Seattle-Tacoma airport', why: 'ZSE is Seattle Center, the en-route facility, not the airport. The NOTAM restricts airspace.' },
          { text: 'A frequency change at Seattle Center', why: 'The keyword is AIRSPACE and the text is a TFR.' },
        ],
      },
      {
        kind: 'choice',
        id: 'us-icao',
        prompt: 'What is the ICAO location indicator for SEA?',
        options: [
          { text: 'KSEA', correct: true, why: 'In the contiguous US, the ICAO code is usually K followed by the three-letter FAA identifier.' },
          { text: 'ZSE', why: 'ZSE is Seattle Center, the en-route control facility.' },
          { text: 'CSEA', why: 'C starts Canadian codes, such as CYVR.' },
        ],
      },
    ],
  },
  {
    id: 'traps',
    title: 'Where NOTAMs trip people up',
    summary: 'Contradictions, stale briefings and NOTAMs that aren\'t filed under an airport.',
    minutes: 5,
    blocks: [
      {
        kind: 'p',
        text: 'Most NOTAM mistakes come from a handful of situations. Each one below has caught pilots who could read every item.',
      },
      {
        kind: 'notam',
        raw: `A9114/26 NOTAMN
Q) CZVR/QMRLC/IV/NBO/A/000/999/4911N12311W005
A) CYVR B) 2610290600 C) 2610291200
E) RWY 08L/26R OPEN.`,
        marks: [
          { text: 'QMRLC', label: 'Q-code', note: 'Runway closed.' },
          { text: 'E) RWY 08L/26R OPEN.', label: 'Text', note: 'Runway open.' },
        ],
        caption: 'The code and the text disagree.',
      },
      {
        kind: 'p',
        text: 'When the Q-code and E) disagree, one of them is wrong, and the NOTAM can\'t tell you which. E) is the sentence the issuer wrote, so it is the likelier reading. A closed runway is the worse surprise, though, so plan for it and call to find out.',
      },
      {
        kind: 'choice',
        id: 'traps-conflict',
        prompt: 'You find the NOTAM above in your briefing. What do you do?',
        options: [
          { text: 'Plan as if the runway is closed, and call flight services or the airport to confirm', correct: true, why: 'Planning for the worse reading costs little. One call settles which part is wrong.' },
          { text: 'Trust the Q-code', why: 'The Q-code is typed or generated like everything else, and here it is probably the error: the text is specific.' },
          { text: 'Trust E) and plan to use the runway', why: 'E) is the likelier reading, but if it is the wrong one you find a closed runway on final. Confirm first.' },
        ],
      },
      {
        kind: 'p',
        text: 'NOTAMs change by the hour. A crane goes up, a TFR is issued, a closure is replaced with new times. A briefing printed the night before is out of date by morning, so get a fresh one as close to departure as you can.',
      },
      {
        kind: 'p',
        text: 'Not everything is filed under an airport. Restricted areas, drone and parachute activity, TFRs and obstacles along your route sit under the FIR or a nearby location. A briefing that only asks for your departure and destination misses them, so ask for a route briefing.',
      },
      {
        kind: 'choice',
        id: 'traps-route',
        prompt: 'You request NOTAMs for CYXX and CYYJ only. What can you miss?',
        options: [
          { text: 'Airspace and activity NOTAMs along the route between them', correct: true, why: 'En-route NOTAMs are filed under the FIR, here CZVR, or other locations. A route briefing includes them.' },
          { text: 'Nothing: a NOTAM always names the nearest airport', why: 'En-route NOTAMs often name a FIR in A), like CZVR, not an airport.' },
          { text: 'Only NOTAMs older than a week', why: 'Age has nothing to do with it. Where the NOTAM is filed decides whether an airport-only request returns it.' },
        ],
      },
      {
        kind: 'choice',
        id: 'traps-fresh',
        prompt: 'You printed your briefing at 21:00 last night and depart at 07:00. What should you do?',
        options: [
          { text: 'Get a new briefing before you leave', correct: true, why: 'Ten hours is plenty of time for a new NOTAM, a replacement or a cancellation.' },
          { text: 'Nothing, unless the weather has changed', why: 'NOTAMs change independently of the weather. A crane or a TFR doesn\'t care about the forecast.' },
          { text: 'Only check NOTAMs marked EST', why: 'EST ones may change, but new NOTAMs can appear for anything.' },
        ],
      },
    ],
  },
  {
    id: 'brief',
    title: 'Brief a flight',
    summary: 'Nine NOTAMs, one flight. Decide which ones change your plan.',
    minutes: 10,
    blocks: [
      {
        kind: 'p',
        text: 'Here is a short VFR flight across the Strait of Georgia and the briefing that came with it. For each NOTAM, decide whether it affects this flight. Use the four questions: where, when, how high, and does it apply to your kind of flight.',
      },
      {
        kind: 'triage',
        id: 'brief-triage',
        flight: [
          ['Aircraft', 'Cessna 172, VFR'],
          ['Route', 'Abbotsford (CYXX) direct to Victoria (CYYJ), 48 NM'],
          ['Date', '29 October 2026'],
          ['Depart', '16:00 UTC'],
          ['Cruise', '4,500 ft'],
          ['Arrive', 'About 16:40 UTC'],
          ['Fuel', 'You plan to refuel at Victoria'],
        ],
        items: [
          {
            raw: `A2201/26 NOTAMN
Q) CZVR/QMXLC/IV/NBO/A/000/999/4901N12222W005
A) CYXX B) 2610291500 C) 2610292000
E) TWY B CLSD BTN TWY C AND APN.`,
            affects: true,
            why: 'You taxi at Abbotsford around 15:50 UTC, inside the 15:00 to 20:00 window. Plan a taxi route that avoids taxiway B.',
          },
          {
            raw: `A2202/26 NOTAMN
Q) CZVR/QMRLC/IV/NBO/A/000/999/4901N12222W005
A) CYXX B) 2610280000 C) 2610310600
D) DAILY 0200-0600
E) RWY 07/25 CLSD DUE MAINT.`,
            affects: false,
            why: 'On its own, the daily 02:00 to 06:00 window misses a 16:00 departure. It has also been replaced: look for A2208/26.',
          },
          {
            raw: `A2203/26 NOTAMN
Q) CZVR/QICAS/I/NBO/A/000/999/4838N12325W005
A) CYYJ B) 2610281200 C) 2611042359 EST
E) ILS RWY 09 U/S.`,
            affects: false,
            why: 'An ILS only serves instrument approaches, and the Q-line traffic is I, for IFR. Flying VFR you won\'t use it. If the weather pushed you onto an IFR plan, it would matter.',
          },
          {
            raw: `A2204/26 NOTAMN
Q) CZVR/QFUAU/IV/NBO/A/000/999/4838N12325W005
A) CYYJ B) 2610290900 C) 2610300300
E) AVGAS NOT AVBL.`,
            affects: true,
            why: 'You planned to buy fuel at Victoria, and avgas is unavailable there until 03:00 UTC tomorrow. Carry fuel for the return or plan another fuel stop.',
          },
          {
            raw: `A2205/26 NOTAMN
Q) CZVR/QWULW/IV/BO/W/000/014/4838N12321W001
A) CYYJ B) 2610291530 C) 2610291730
E) UAS ACTIVITY WI 1NM RADIUS OF 483800N 1232100W.
F) SFC G) 1200FT AGL`,
            affects: true,
            why: 'The drones are about 3 NM east of Victoria, under your arrival, from 15:30 to 17:30 UTC and up to about 1,300 ft on your altimeter. You arrive at about 16:40, descending through exactly those heights. Plan an arrival that keeps clear and ask the tower where they are working.',
          },
          {
            raw: `A2206/26 NOTAMN
Q) CZVR/QWPLW/IV/BO/W/000/120/4910N12354W002
A) CYCD B) 2610291400 C) 2610292200
E) PJE WI 2NM RADIUS OF 491000N 1235400W.
F) SFC G) FL120`,
            affects: false,
            why: 'The parachute drop zone is near Nanaimo, about 35 NM northwest of Victoria and well off your route. It is the right time and height, but the wrong place.',
          },
          {
            raw: `A2207/26 NOTAMN
Q) CZVR/QRTCA/IV/BO/W/000/060/4848N12300W005
A) CZVR B) 2610291600 C) 2610291800
E) TEMPO RESTRICTED AREA ACTIVATED WI 5NM RADIUS OF 484800N 1230000W FOR FIREFIGHTING OPS. ENTRY PROHIBITED EXC AUTH ACFT.
F) SFC G) 6000FT AMSL`,
            affects: true,
            why: 'The centre sits on your direct track, the area reaches 6,000 ft and it is active while you fly through. Plan a route around the 5 NM circle. A) gives the FIR, CZVR, so a briefing for your two airports alone would not have shown it.',
          },
          {
            raw: `A2208/26 NOTAMR A2202/26
Q) CZVR/QMRLC/IV/NBO/A/000/999/4901N12222W005
A) CYXX B) 2610280000 C) 2610310600
D) DAILY 1500-1700
E) RWY 07/25 CLSD DUE MAINT.`,
            affects: true,
            why: 'This replaces A2202/26 and moves the daily closure to 15:00 to 17:00 UTC, so runway 07/25 is closed when you depart. Expect to use runway 01/19.',
          },
          {
            raw: `A2209/26 NOTAMN
Q) CZVR/QMRLC/IV/NBO/A/000/999/4911N12311W005
A) CYVR B) 2610291200 C) 2610292000
E) RWY 08R/26L CLSD.`,
            affects: false,
            why: 'Vancouver International isn\'t your departure, destination or alternate, and a runway closure there changes nothing for a flight passing to the south.',
          },
        ],
        debrief: {
          title: 'Where, when, how high, and whether it applies to you',
          text: 'Five of these nine NOTAMs changed the plan, and each one passed all four questions. The four that didn\'t each failed at least one: the wrong time, the wrong kind of flight, or the wrong place.',
        },
      },
    ],
  },
];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

export function checkCount(lesson: Lesson): number {
  let n = 0;
  for (const block of lesson.blocks) {
    if (block.kind === 'triage') n += block.items.length;
    else if (block.kind === 'choice' || block.kind === 'answer' || block.kind === 'pick') n += 1;
  }
  return n;
}
