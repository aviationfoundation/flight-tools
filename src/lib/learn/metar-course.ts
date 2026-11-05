import type { Lesson } from './types.ts';

export const METAR_COURSE_ID = 'metar';

// Every report here is made up for practice, though the airports are real. The tests in
// tests/learn/metar-course.test.ts decode each one and check the answers against the engine.

export const VANCOUVER = 'METAR CYVR 051800Z 27012G22KT 15SM -SHRA FEW020 BKN045 OVC080 11/07 A2987 RMK SC2SC4AC2 SLP115';
export const SEATTLE_FOG = 'METAR KSEA 051853Z 18006KT 1/2SM R16L/2200V3000FT FG OVC002 09/09 A3002 RMK AO2 SLP168 T00890089';
export const CHICAGO_STORM = 'METAR KORD 051851Z 25016G24KT 1 1/2SM +TSRA BR SCT015 BKN030CB OVC060 18/16 A2978 RMK AO2 SLP086';
export const LONDON = 'METAR EGLL 051820Z 23014KT 9999 SCT035 14/08 Q1012 NOSIG';
export const PARIS = 'METAR LFPG 051830Z 06005KT CAVOK 12/04 Q1021';
export const VICTORIA = 'METAR CYYJ 051800Z 25010KT 6SM -RA BKN025 OVC040 10/08 A2985 RMK SC6SC2 SLP108';
export const ABBOTSFORD = 'METAR CYXX 051800Z 22008KT 15SM FEW040 BKN070 12/06 A2990 RMK SC1AC5 SLP125';
export const NANAIMO = 'METAR CYCD 051800Z 30006KT 15SM FEW035 SCT080 11/04 A2988 RMK CU2AC2 SLP118';

export const VICTORIA_TAF = `TAF CYYJ 051740Z 0518/0618 24012KT P6SM BKN030
     TEMPO 0518/0522 5SM -SHRA BKN020
     FM060200 VRB03KT P6SM SCT010 BKN040
     BECMG 0608/0610 2SM BR OVC006
     PROB30 0610/0614 1/2SM FG VV002
     FM061500 27010KT P6SM FEW030
     RMK NXT FCST BY 00Z`;

export const ABBOTSFORD_TAF = `TAF CYXX 051740Z 0518/0618 22008KT P6SM FEW040 BKN070
     FM052100 24015G25KT P6SM SCT040 BKN080
     FM060600 VRB03KT P6SM FEW050
     RMK NXT FCST BY 00Z`;

export const NANAIMO_TAF = `TAF CYCD 051740Z 0518/0606 30008KT P6SM FEW035 SCT080
     BECMG 0600/0602 VRB03KT
     RMK NXT FCST BY 00Z`;

export const METAR_LESSONS: Lesson[] = [
  {
    id: 'parts',
    title: 'The parts of a METAR',
    summary: 'What a METAR is, and the groups it always gives in the same order.',
    minutes: 5,
    blocks: [
      {
        kind: 'p',
        text: 'A METAR is a weather observation from one airport, taken at one moment. Most stations send one every hour, and an extra report called a SPECI whenever the weather changes enough to matter between the routine ones. A METAR tells you what the weather is now. The forecast for later comes in a separate report, the TAF, which lessons 7 and 8 cover.',
      },
      {
        kind: 'p',
        text: 'Every METAR is written in the same order, so once you know the order you always know where to look. Here is a report from Vancouver International. Tap or hover over each highlighted group to see what it is.',
      },
      {
        kind: 'report',
        raw: VANCOUVER,
        marks: [
          { text: 'METAR', label: 'Type', note: 'A routine observation. SPECI would mean a special one, sent because the weather changed.' },
          { text: 'CYVR', label: 'Station', note: 'The four-letter ICAO code of the airport: Vancouver International.' },
          { text: '051800Z', label: 'Time', note: 'Day 05 of the month at 18:00 UTC. The Z means UTC.' },
          { text: '27012G22KT', label: 'Wind', note: 'From 270 degrees true at 12 knots, gusting to 22. Lesson 2.' },
          { text: '15SM', label: 'Visibility', note: '15 statute miles. Lesson 3.' },
          { text: '-SHRA', label: 'Weather', note: 'Light rain showers. Lesson 4.' },
          { text: 'FEW020 BKN045 OVC080', label: 'Sky', note: 'Cloud layers at 2,000, 4,500 and 8,000 ft above the ground. Lesson 5.' },
          { text: '11/07', label: 'Temperature and dew point', note: '11 °C, dew point 7 °C. Lesson 6.' },
          { text: 'A2987', label: 'Altimeter', note: 'Altimeter setting 29.87 inches of mercury. Lesson 6.' },
          { text: 'RMK SC2SC4AC2 SLP115', label: 'Remarks', note: 'Extra detail after RMK. Here, the cloud types and the sea-level pressure. Lesson 6.' },
        ],
      },
      {
        kind: 'table',
        head: ['Group', 'Example', 'Tells you'],
        rows: [
          ['Type', 'METAR or SPECI', 'Routine or special report'],
          ['Station', 'CYVR', 'Which airport'],
          ['Time', '051800Z', 'Day of the month and time in UTC'],
          ['Wind', '27012G22KT', 'Direction, speed and gusts'],
          ['Visibility', '15SM', 'How far you can see'],
          ['Weather', '-SHRA', 'Rain, snow, fog, storms and so on'],
          ['Sky', 'FEW020 BKN045', 'Cloud amount and height'],
          ['Temperature', '11/07', 'Temperature and dew point in °C'],
          ['Pressure', 'A2987', 'Altimeter setting'],
          ['Remarks', 'RMK ...', 'Extra detail, which varies by country'],
        ],
      },
      {
        kind: 'rule',
        title: 'Missing means nothing to report',
        text: 'A group that has nothing to say is left out. This report has a weather group because it is raining. On a dry day the weather group simply isn\'t there, and the visibility is followed straight by the sky.',
      },
      {
        kind: 'pick',
        id: 'parts-wind',
        prompt: 'Tap the group that gives the wind.',
        raw: VANCOUVER,
        choices: ['CYVR', '051800Z', '27012G22KT', '15SM', '11/07', 'A2987'],
        answer: '27012G22KT',
        why: 'The wind comes straight after the time. KT at the end means the speeds are in knots.',
      },
      {
        kind: 'choice',
        id: 'parts-time',
        prompt: 'What does 051800Z tell you?',
        options: [
          { text: 'The 5th of the month, at 18:00 UTC', correct: true, why: 'The first two digits are the day of the month, the next four the time, and Z means UTC.' },
          { text: 'The 18th of May, local time', why: 'METARs give the day of the month only, never the month, and always in UTC.' },
          { text: 'Five hours and eighteen minutes old', why: 'It is a time stamp, not an age. Work out the age yourself by comparing it with the time now in UTC.' },
        ],
      },
      {
        kind: 'answer',
        id: 'parts-dewpoint',
        prompt: 'What dew point does this report give, in °C?',
        accept: ['7', '07', '7c', '07c'],
        placeholder: 'Dew point',
        why: '11/07 is the temperature, 11 °C, then the dew point, 7 °C.',
      },
      {
        kind: 'choice',
        id: 'parts-speci',
        prompt: 'A report starts SPECI instead of METAR. What does that tell you?',
        options: [
          { text: 'It is a forecast for the next hour, sent between the routine reports', why: 'A SPECI is still an observation of the weather now. Forecasts come in TAFs.' },
          { text: 'The weather changed since the last hourly report', correct: true, why: 'A SPECI is issued when the weather crosses a set threshold, such as the ceiling dropping or a thunderstorm starting. Something changed, so read it closely.' },
          { text: 'It comes from an automated station', why: 'Automated reports carry AUTO after the time. SPECI is about why the report was sent, not who made it.' },
        ],
      },
    ],
  },
  {
    id: 'wind',
    title: 'Wind',
    summary: 'Direction, speed, gusts and variable winds, and why the direction is true and not magnetic.',
    minutes: 5,
    blocks: [
      {
        kind: 'p',
        text: 'The wind group gives the direction the wind blows from, in degrees, followed by its speed. 27012KT is a wind from 270 degrees, due west, at 12 knots. A G adds the gusts, the peaks the wind reaches: 27012G22KT gusts to 22 knots.',
      },
      {
        kind: 'table',
        head: ['Group', 'Means'],
        rows: [
          ['27012KT', 'From 270 degrees at 12 knots'],
          ['27012G22KT', 'From 270 degrees at 12 knots, gusting to 22'],
          ['VRB03KT', 'Light wind, direction too unsteady to give one number'],
          ['33018G28KT 290V360', 'From 330 at 18 gusting 28, the direction swinging between 290 and 360'],
          ['00000KT', 'Calm'],
          ['24008MPS', 'From 240 at 8 metres per second, used in Russia, China and some other countries'],
        ],
      },
      {
        kind: 'notice',
        title: 'True, not magnetic',
        text: 'The direction in a METAR or TAF is measured from true north. Runway numbers, and the winds that ATIS and the tower give you, are magnetic. Around Vancouver and Seattle the difference is about 15 degrees, so a METAR wind of 270 is a magnetic wind of about 255. The difference changes from place to place and is printed on your chart. It matters most when the crosswind is close to your limit.',
      },
      {
        kind: 'rule',
        title: 'Estimating the crosswind',
        text: 'Find the angle between the wind and the runway. At 30 degrees, about half the wind speed blows across the runway. At 45 degrees, about seven tenths. At 60 degrees or more, nearly all of it. Use the gust speed too, because that is what you will be holding off at the flare.',
      },
      {
        kind: 'choice',
        id: 'wind-gust',
        prompt: 'In 27012G22KT, what is the strongest the wind is reported to blow?',
        options: [
          { text: '12 knots', why: '12 knots is the steady speed. G22 says it peaks higher.' },
          { text: '22 knots', correct: true, why: 'The number after G is the gust speed: the peaks reach 22 knots.' },
          { text: '34 knots', why: 'The gust replaces the steady speed for a moment; the two aren\'t added together.' },
        ],
      },
      {
        kind: 'answer',
        id: 'wind-crosswind',
        prompt: 'You are landing on runway 25, which points 250 degrees magnetic. The tower gives the wind as 280 at 20 knots. About how many knots of crosswind is that?',
        accept: ['10', '10kt', '10kts', '10knots'],
        placeholder: 'Knots',
        why: 'The wind is 30 degrees off the runway, so about half of it blows across: 10 knots. The tower\'s wind is already magnetic, so there is nothing to convert.',
      },
      {
        kind: 'choice',
        id: 'wind-true',
        prompt: 'The Vancouver METAR gives 27012KT. Vancouver has runways 08 and 26. Which way does the wind favour, and why?',
        options: [
          { text: 'Runway 26: about 255 magnetic is close to its heading', correct: true, why: 'Take about 15 degrees off the true direction to get about 255 magnetic. Runway 26 points about 260, so the wind is almost straight down it.' },
          { text: 'Runway 08, because a wind from 270 blows towards the east end of the field', why: 'Wind is given as where it comes from. A wind from the west favours landing towards the west, on runway 26.' },
          { text: 'Neither, because a METAR wind can\'t be compared with a runway number', why: 'It can, once you allow for the difference between true and magnetic north.' },
        ],
      },
      {
        kind: 'choice',
        id: 'wind-vrb',
        prompt: 'What does VRB03KT mean for your takeoff?',
        options: [
          { text: 'A strong wind from no fixed direction, so expect turbulence', why: 'VRB is used mostly for light winds, as here at 3 knots.' },
          { text: 'The wind sensor has failed', why: 'A failed sensor would leave the wind group out or mark it with slashes. VRB is a real observation.' },
          { text: 'A light wind that keeps changing direction', correct: true, why: 'At 3 knots the direction wanders too much to give one number. Use the runway in use, or the one with the longest takeoff distance available.' },
        ],
      },
    ],
  },
  {
    id: 'visibility',
    title: 'Visibility and runway visual range',
    summary: 'Statute miles, metres, CAVOK and RVR.',
    minutes: 5,
    blocks: [
      {
        kind: 'p',
        text: 'Visibility is how far the observer, or the sensor, can see. In Canada and the US it is given in statute miles, with SM after the number, and fractions are written out: 1 1/2SM is one and a half miles. Most other countries give it in metres, as a four-digit number with no unit.',
      },
      {
        kind: 'table',
        head: ['Group', 'Means'],
        rows: [
          ['15SM', '15 statute miles'],
          ['1 1/2SM', 'One and a half statute miles'],
          ['M1/4SM', 'Less than a quarter of a mile'],
          ['P6SM', 'More than 6 miles, used in TAFs'],
          ['9999', '10 kilometres or more'],
          ['0800', '800 metres, about half a mile'],
          ['CAVOK', 'Ceiling and visibility OK: see below'],
        ],
      },
      {
        kind: 'p',
        text: 'CAVOK replaces the visibility, weather and sky groups when visibility is 10 km or more, there is no cloud below 5,000 ft (or the highest minimum sector altitude, if that is higher), no cumulonimbus or towering cumulus, and no significant weather. You will see it in Europe and much of the world, but not in Canadian or US reports.',
      },
      {
        kind: 'p',
        text: 'Runway visual range, RVR, is measured by instruments along a particular runway, and comes after the visibility when the visibility is low. It matters most to instrument pilots, whose approach minimums are often given as an RVR.',
      },
      {
        kind: 'report',
        raw: SEATTLE_FOG,
        marks: [
          { text: '1/2SM', label: 'Visibility', note: 'Half a statute mile.' },
          { text: 'R16L/2200V3000FT', label: 'RVR', note: 'Runway 16L: visual range varying between 2,200 and 3,000 ft.' },
          { text: 'FG', label: 'Weather', note: 'Fog.' },
          { text: 'OVC002', label: 'Sky', note: 'Overcast at 200 ft.' },
        ],
      },
      {
        kind: 'choice',
        id: 'visibility-9999',
        prompt: 'A London report gives 9999 for the visibility. What does that mean?',
        raw: LONDON,
        options: [
          { text: '9,999 metres exactly', why: '9999 is a code, not a measurement. It is the highest value the group can hold.' },
          { text: 'The visibility wasn\'t measured', why: 'A missing visibility is shown with slashes, ////. 9999 is a real, good observation.' },
          { text: '10 kilometres or more', correct: true, why: '9999 means 10 km or more, about 6 statute miles or better.' },
        ],
      },
      {
        kind: 'choice',
        id: 'visibility-minus',
        prompt: 'What does M1/4SM mean?',
        options: [
          { text: 'Less than a quarter of a mile', correct: true, why: 'M means less than. P, as in P6SM, means more than.' },
          { text: 'A quarter of a mile, measured by machine', why: 'Automated reports are marked AUTO. M is about the value, not the source.' },
          { text: 'Minus a quarter of a mile, so the sensor failed', why: 'Visibility can\'t be negative. M stands for less than.' },
        ],
      },
      {
        kind: 'pick',
        id: 'visibility-rvr',
        prompt: 'Tap the runway visual range in this Seattle report.',
        raw: SEATTLE_FOG,
        choices: ['18006KT', '1/2SM', 'R16L/2200V3000FT', 'OVC002', 'A3002'],
        answer: 'R16L/2200V3000FT',
        why: 'RVR groups start with R and the runway number. This one varies between 2,200 and 3,000 ft along runway 16L.',
      },
      {
        kind: 'choice',
        id: 'visibility-cavok',
        prompt: 'A Paris report gives CAVOK. Which of these can you be sure of?',
        raw: PARIS,
        options: [
          { text: 'The sky is completely clear of cloud at every height', why: 'CAVOK allows cloud, as long as none of it is below 5,000 ft or the highest minimum sector altitude.' },
          { text: 'No cloud below 5,000 ft, and 10 km visibility or more', correct: true, why: 'Those are two of the CAVOK conditions. There is also no cumulonimbus, no towering cumulus and no significant weather.' },
          { text: 'It is legal VFR all the way along your route to Paris', why: 'CAVOK describes one airport at one moment. It says nothing about the weather along your route.' },
        ],
      },
    ],
  },
  {
    id: 'weather',
    title: 'Weather codes',
    summary: 'Rain, snow, fog and storms, and how the two-letter codes combine.',
    minutes: 6,
    blocks: [
      {
        kind: 'p',
        text: 'The weather group uses two-letter codes, read left to right: how strong, what kind, then what is falling or hiding the view. -SHRA is light (-) showers (SH) of rain (RA). A plus sign means heavy, and no sign means moderate.',
      },
      {
        kind: 'table',
        head: ['Code', 'Means'],
        rows: [
          ['-, +', 'Light, heavy (no sign is moderate)'],
          ['VC', 'In the vicinity: near the airport but not at it'],
          ['SH', 'Showers'],
          ['TS', 'Thunderstorm'],
          ['FZ', 'Freezing'],
          ['BL', 'Blowing'],
          ['RA', 'Rain'],
          ['DZ', 'Drizzle'],
          ['SN', 'Snow'],
          ['PL', 'Ice pellets'],
          ['GR', 'Hail'],
          ['BR', 'Mist'],
          ['FG', 'Fog'],
          ['HZ', 'Haze'],
          ['FU', 'Smoke'],
        ],
      },
      {
        kind: 'p',
        text: 'Fog and mist are the same thing at different strengths. It is reported as fog, FG, when it brings the visibility below about 1 km, or 5/8 of a mile, and as mist, BR, when it is thinner. FZ in front of fog means the fog droplets are below freezing; in front of rain or drizzle, it means the drops freeze on whatever they hit, including your wings.',
      },
      {
        kind: 'report',
        raw: CHICAGO_STORM,
        marks: [
          { text: '+TSRA', label: 'Thunderstorm', note: 'A thunderstorm at the airport, with heavy rain. The plus sign describes the rain.' },
          { text: 'BR', label: 'Mist', note: 'Mist as well, which is why visibility is down to 1 1/2 miles.' },
          { text: 'BKN030CB', label: 'Cumulonimbus', note: 'The broken layer at 3,000 ft is cumulonimbus, the thunderstorm cloud.' },
        ],
      },
      {
        kind: 'choice',
        id: 'weather-fzdz',
        prompt: 'What does -FZDZ mean?',
        options: [
          { text: 'Light snow and drizzle together', why: 'Snow is SN. FZ is a descriptor meaning freezing.' },
          { text: 'Light freezing drizzle', correct: true, why: 'Light (-), freezing (FZ), drizzle (DZ). It freezes on contact, so it can coat an aircraft with ice in minutes.' },
          { text: 'Drizzle that has stopped', why: 'Weather that ended recently goes in the remarks, not in the weather group.' },
        ],
      },
      {
        kind: 'choice',
        id: 'weather-vcsh',
        prompt: 'A report gives VCSH. Is it raining at the airport?',
        options: [
          { text: 'Yes, light showers', why: 'Light showers at the airport would be -SHRA. VC says they are somewhere else.' },
          { text: 'Probably soon, because showers always move towards the airport', why: 'VC says nothing about which way the showers are moving.' },
          { text: 'No, there are showers nearby but not at the airport', correct: true, why: 'VC means in the vicinity, roughly 5 to 10 miles out. Look at the next reports or the radar to see where they go.' },
        ],
      },
      {
        kind: 'pick',
        id: 'weather-storm',
        prompt: 'Tap the group that says a thunderstorm is happening at the airport now.',
        raw: CHICAGO_STORM,
        choices: ['25016G24KT', '1 1/2SM', '+TSRA', 'BR', 'BKN030CB'],
        answer: '+TSRA',
        why: 'TS in the weather group means a thunderstorm at the station. CB in the sky group names the cloud type, and a CB can be reported without a storm overhead.',
      },
      {
        kind: 'choice',
        id: 'weather-br-fg',
        prompt: 'Two reports give 3SM BR and 1/4SM FG. What is the difference?',
        options: [
          { text: 'Only the thickness: fog is thicker mist', correct: true, why: 'Both are tiny water droplets in the air. Below about 5/8 of a mile it is called fog, above it mist.' },
          { text: 'BR is smoke from a fire and FG is water droplets', why: 'Smoke is FU. BR, from the French brume, is mist.' },
          { text: 'BR only forms over the sea, and FG only over land', why: 'Mist forms anywhere fog does; it is just thinner.' },
        ],
      },
    ],
  },
  {
    id: 'clouds',
    title: 'Clouds and ceilings',
    summary: 'Cloud amounts and heights, what counts as a ceiling, and the VFR, MVFR, IFR and LIFR categories.',
    minutes: 6,
    blocks: [
      {
        kind: 'p',
        text: 'Each cloud layer is a three-letter amount and a three-digit height in hundreds of feet above the airport. BKN045 is a broken layer at 4,500 ft. The heights are above the ground, not above sea level, which matters at any airport that isn\'t near the coast.',
      },
      {
        kind: 'table',
        head: ['Code', 'Means', 'Sky covered'],
        rows: [
          ['SKC, CLR, NSC', 'No cloud reported', 'None'],
          ['FEW', 'Few', '1 to 2 eighths'],
          ['SCT', 'Scattered', '3 to 4 eighths'],
          ['BKN', 'Broken', '5 to 7 eighths'],
          ['OVC', 'Overcast', 'All of it'],
          ['VV', 'Vertical visibility', 'Sky hidden by fog, snow or similar'],
        ],
      },
      {
        kind: 'rule',
        title: 'The ceiling',
        text: 'The ceiling is the lowest layer that is broken or overcast, or the vertical visibility if the sky is hidden. Few and scattered layers don\'t count, however low they are. In FEW008 SCT015 BKN040 the ceiling is 4,000 ft.',
      },
      {
        kind: 'p',
        text: 'CB after a layer marks cumulonimbus, the thunderstorm cloud, and TCU marks towering cumulus, which can grow into one. Both are worth avoiding by a wide margin.',
      },
      {
        kind: 'table',
        head: ['Category', 'Ceiling', 'Visibility'],
        rows: [
          ['VFR', 'Above 3,000 ft', 'and more than 5 miles'],
          ['MVFR', '1,000 to 3,000 ft', 'or 3 to 5 miles'],
          ['IFR', '500 to 999 ft', 'or 1 to under 3 miles'],
          ['LIFR', 'Below 500 ft', 'or under 1 mile'],
        ],
      },
      {
        kind: 'p',
        text: 'These categories come from the US National Weather Service, and the worse of the ceiling and the visibility decides. They are the colours on weather maps such as the one on the METAR tool, not legal limits. The VFR weather minimums you must follow are in your country\'s regulations and depend on the airspace. MVFR is a warning to look closely, not a rule.',
      },
      {
        kind: 'answer',
        id: 'clouds-ceiling',
        prompt: 'A report gives SCT006 BKN012 OVC025. What is the ceiling, in feet?',
        accept: ['1200', '1200ft', '1200feet'],
        placeholder: 'Feet',
        why: 'The scattered layer at 600 ft doesn\'t count. The lowest broken layer is at 1,200 ft, so that is the ceiling.',
      },
      {
        kind: 'choice',
        id: 'clouds-vv',
        prompt: 'The Seattle report earlier ended its sky group with OVC002. Another airport gives VV002 instead. What does VV002 mean?',
        options: [
          { text: 'Visibility along the ground is 200 metres', why: 'Visibility has its own group. VV is about how far up you can see.' },
          { text: 'The sky is hidden, and you can see about 200 ft up into it', correct: true, why: 'Vertical visibility is used when fog or snow hides the sky. It counts as a ceiling of 200 ft.' },
          { text: 'There are two very thin layers of cloud close to the ground', why: 'VV is not a cloud layer at all. It replaces the layers when the sky can\'t be seen.' },
        ],
      },
      {
        kind: 'choice',
        id: 'clouds-category',
        prompt: 'Which flight category is this Victoria report?',
        raw: VICTORIA,
        options: [
          { text: 'VFR, because the visibility is 6 miles', why: 'Visibility is fine, but the ceiling also counts and the worse of the two decides.' },
          { text: 'MVFR, because the ceiling is 2,500 ft', correct: true, why: 'BKN025 is a ceiling of 2,500 ft, in the 1,000 to 3,000 ft band. The worse of ceiling and visibility decides.' },
          { text: 'IFR, because it is raining', why: 'Rain alone doesn\'t set the category. Only the ceiling and the visibility do.' },
        ],
      },
      {
        kind: 'choice',
        id: 'clouds-msl',
        prompt: 'An airport 1,200 ft above sea level reports BKN035. You plan to cruise at 4,500 ft on your altimeter. Where is the cloud base compared with you?',
        options: [
          { text: 'At about 3,500 ft above sea level, so 1,000 ft below you', why: 'That reads the cloud height as above sea level. METAR cloud heights are above the airport.' },
          { text: 'At about 4,700 ft, only about 200 ft above you', correct: true, why: 'Add the elevation to the height: 1,200 plus 3,500 is about 4,700 ft above sea level. You would be far too close to the cloud.' },
          { text: 'You can\'t tell from a METAR', why: 'You can, by adding the airport\'s elevation to the reported height.' },
        ],
      },
    ],
  },
  {
    id: 'temperature-pressure',
    title: 'Temperature, pressure and remarks',
    summary: 'Temperature and dew point, the altimeter setting, density altitude and the remarks.',
    minutes: 6,
    blocks: [
      {
        kind: 'p',
        text: 'The temperature and dew point come as a pair in °C. M in front of a number means minus: M04/M06 is minus 4, dew point minus 6. The dew point is the temperature at which the air would be saturated, and the gap between the two, the spread, tells you how close the air is to forming cloud or fog.',
      },
      {
        kind: 'rule',
        title: 'Watch the spread',
        text: 'When the spread is down to 2 or 3 degrees and still shrinking, especially in the evening or on a calm night, expect fog or low cloud. The Seattle report earlier, 09/09, had no spread at all, and fog to go with it.',
      },
      {
        kind: 'p',
        text: 'The pressure group is the altimeter setting. Canada and the US give it in inches of mercury: A2987 is 29.87. Most other countries give it in hectopascals: Q1012 is 1012 hPa. Set it on your altimeter and the altimeter reads close to your height above sea level.',
      },
      {
        kind: 'p',
        text: 'Hot weather and low pressure make the air thinner, and the aircraft performs as if the airport were higher. That height is the density altitude. The METAR tool works it out for you from the temperature, the altimeter setting and the airport\'s elevation.',
      },
      {
        kind: 'table',
        head: ['Remark', 'Means'],
        rows: [
          ['AO2', 'US automated station that can tell rain from snow'],
          ['SLP115', 'Sea-level pressure 1011.5 hPa'],
          ['T00890089', 'Temperature 8.9 °C and dew point 8.9 °C, to a tenth of a degree'],
          ['SC2SC4AC2', 'Canada: the cloud type of each layer, and how many eighths of the sky it hides'],
        ],
      },
      {
        kind: 'p',
        text: 'For SLP, put a 10 or a 9 in front of the three digits, whichever gives a pressure closer to 1000 hPa, then add the decimal point: SLP115 is 1011.5 and SLP982 is 998.2. Canadian remarks give the type of each cloud layer and how many eighths of the sky that layer hides: SC2SC4AC2 is two eighths of stratocumulus, four more of stratocumulus, and two of altocumulus.',
      },
      {
        kind: 'choice',
        id: 'temperature-minus',
        prompt: 'What does M04/M06 mean?',
        options: [
          { text: 'Temperature 4 °C, dew point 6 °C', why: 'M means minus. Both values are below freezing.' },
          { text: 'Temperature minus 4 °C, dew point minus 6 °C', correct: true, why: 'M marks a negative number. A 2 degree spread below freezing means icing and low cloud are both worth checking.' },
          { text: 'Temperature and dew point measured by machine, not by an observer', why: 'Every METAR temperature is measured. M means minus.' },
        ],
      },
      {
        kind: 'answer',
        id: 'temperature-altimeter',
        prompt: 'A report gives A3012. What altimeter setting do you set, in inches of mercury?',
        accept: ['30.12', '30.12inhg', '30.12in'],
        placeholder: 'Inches',
        why: 'Put the decimal point after the first two digits: 30.12.',
      },
      {
        kind: 'choice',
        id: 'temperature-slp',
        prompt: 'What sea-level pressure does SLP982 give?',
        options: [
          { text: '1098.2 hPa', why: 'That would be higher than any sea-level pressure ever recorded. Use the 9 instead.' },
          { text: '982 hPa', why: 'The last digit is tenths, so the decimal point goes before it.' },
          { text: '998.2 hPa', correct: true, why: 'Put 9 in front, because 998.2 is closer to 1000 than 1098.2, then the last digit is tenths.' },
        ],
      },
      {
        kind: 'choice',
        id: 'temperature-fog',
        prompt: 'It is evening, the wind is calm, and three airports report these. Which is most likely to fog in tonight?',
        options: [
          { text: '18/04', why: 'A 14 degree spread is a long way from saturation.' },
          { text: '12/10', correct: true, why: 'A 2 degree spread, with the evening cooling still to come and no wind to stir the air, is the classic setup for fog.' },
          { text: '25/15', why: 'A 10 degree spread is dry air. Fog needs the spread to close.' },
        ],
      },
      {
        kind: 'choice',
        id: 'temperature-density',
        prompt: 'An airport 3,600 ft above sea level reports 30/04 A2992. About what is the density altitude?',
        options: [
          { text: 'About 3,600 ft', why: 'That is the elevation. At 30 °C the air is far warmer than standard, so the aircraft performs as if it were higher.' },
          { text: 'About 6,200 ft', correct: true, why: 'The standard temperature at 3,600 ft is about 8 °C. At 22 degrees warmer, the density altitude is about 2,600 ft higher than the airport.' },
          { text: 'About 9,000 ft', why: 'Too high. A common rule of thumb adds about 120 ft for each degree above standard: 22 degrees adds about 2,600 ft.' },
        ],
      },
    ],
  },
  {
    id: 'taf',
    title: 'Reading a TAF',
    summary: 'What a TAF is, when it is valid, and how its opening line works.',
    minutes: 5,
    blocks: [
      {
        kind: 'p',
        text: 'A TAF is a forecast for one airport and the few miles around it, covering anywhere from 12 to 30 hours. It uses the same wind, visibility, weather and cloud groups as a METAR, but usually no temperature or pressure. Most airports get a new TAF every six hours, and an amended one, marked TAF AMD, whenever the forecast turns out wrong.',
      },
      {
        kind: 'report',
        raw: VICTORIA_TAF,
        marks: [
          { text: 'TAF', label: 'Type', note: 'A terminal aerodrome forecast. TAF AMD would mean an amended one.' },
          { text: 'CYYJ', label: 'Station', note: 'Victoria International.' },
          { text: '051740Z', label: 'Issued', note: 'Issued on the 5th at 17:40 UTC.' },
          { text: '0518/0618', label: 'Valid', note: 'Valid from the 5th at 18:00 UTC to the 6th at 18:00 UTC.' },
          { text: '24012KT P6SM BKN030', label: 'Opening line', note: 'The forecast from the start, until the first FM group: wind 240 at 12, more than 6 miles, broken at 3,000 ft.' },
          { text: 'RMK NXT FCST BY 00Z', label: 'Remark', note: 'The next routine TAF will be out by 00:00 UTC.' },
        ],
      },
      {
        kind: 'p',
        text: 'The validity, 0518/0618, is two day-and-hour pairs: from the 5th at 18:00 UTC to the 6th at 18:00 UTC. After the opening line come change groups, which say how the weather will change through the period. The next lesson takes them one at a time.',
      },
      {
        kind: 'choice',
        id: 'taf-valid',
        prompt: 'What does 0518/0618 tell you?',
        options: [
          { text: 'The forecast runs from 05:18 to 06:18 UTC on the same day', why: 'Each half is a day and an hour, not hours and minutes.' },
          { text: 'From the 5th at 18:00 to the 6th at 18:00 UTC', correct: true, why: 'Day 05 hour 18, to day 06 hour 18: a 24-hour forecast.' },
          { text: 'It was issued on the 5th and expires 18 hours later', why: 'The issue time is the separate 051740Z group, and the forecast runs 24 hours.' },
        ],
      },
      {
        kind: 'answer',
        id: 'taf-issued',
        prompt: 'At what time UTC was this TAF issued? Give four digits.',
        accept: ['1740', '17:40'],
        placeholder: 'hhmm',
        why: '051740Z: the 5th at 17:40 UTC.',
      },
      {
        kind: 'choice',
        id: 'taf-amd',
        prompt: 'You printed this TAF at 17:45 UTC. At 19:00 the briefing shows TAF AMD CYYJ 051855Z. What should you do?',
        options: [
          { text: 'Keep using your printed copy until the next routine TAF', why: 'The amended TAF replaces the one you printed. Your copy is out of date.' },
          { text: 'Read the amended TAF and use it instead', correct: true, why: 'A TAF is amended when the forecast has gone wrong. It replaces the earlier one completely.' },
          { text: 'Use whichever of the two is more optimistic', why: 'Only the amended TAF is current. The older forecast has already been shown to be wrong.' },
        ],
      },
      {
        kind: 'choice',
        id: 'taf-heights',
        prompt: 'Are the cloud heights in a TAF above sea level or above the airport?',
        options: [
          { text: 'Above sea level, so they can be compared with your altimeter', why: 'TAF heights work the same way as METAR heights: above the airport.' },
          { text: 'Above the airport, the same as in a METAR', correct: true, why: 'BKN030 is 3,000 ft above the airport. Add the elevation to compare it with your altimeter.' },
          { text: 'It depends on the country', why: 'METAR and TAF cloud heights are above the airport everywhere.' },
        ],
      },
    ],
  },
  {
    id: 'taf-changes',
    title: 'Change groups: FM, BECMG, TEMPO and PROB',
    summary: 'How a TAF says the weather will change, and how to find the forecast for the hour you fly.',
    minutes: 7,
    blocks: [
      {
        kind: 'p',
        text: 'After the opening line, each change group starts on a new line. Some replace the forecast from a set time, some change it gradually, and some add weather that may come and go. Here is the full Victoria TAF from the last lesson.',
      },
      {
        kind: 'report',
        raw: VICTORIA_TAF,
        marks: [
          { text: 'TEMPO 0518/0522 5SM -SHRA BKN020', label: 'TEMPO', note: 'Between 18:00 and 22:00 on the 5th, spells of 5 miles in light rain showers, broken at 2,000 ft.' },
          { text: 'FM060200 VRB03KT P6SM SCT010 BKN040', label: 'FM', note: 'From the 6th at 02:00 UTC, a whole new forecast replaces everything before it.' },
          { text: 'BECMG 0608/0610 2SM BR OVC006', label: 'BECMG', note: 'Between 08:00 and 10:00, changing to 2 miles in mist, overcast at 600 ft. The wind stays VRB03KT.' },
          { text: 'PROB30 0610/0614 1/2SM FG VV002', label: 'PROB30', note: 'A 30 percent chance of fog with half a mile visibility, between 10:00 and 14:00.' },
          { text: 'FM061500 27010KT P6SM FEW030', label: 'FM', note: 'From 15:00 UTC on the 6th, clearing: west wind, more than 6 miles, few clouds at 3,000 ft.' },
        ],
      },
      {
        kind: 'table',
        head: ['Group', 'Means'],
        rows: [
          ['FM060200', 'From the 6th at 02:00 UTC, this forecast replaces everything before it'],
          ['BECMG 0608/0610', 'The weather changes some time between 08:00 and 10:00, and stays changed. Anything not mentioned stays as it was'],
          ['TEMPO 0518/0522', 'Temporary spells of this weather, each lasting under an hour, for less than half the period in all'],
          ['PROB30, PROB40', 'A 30 or 40 percent chance of this weather in the period'],
        ],
      },
      {
        kind: 'rule',
        title: 'Finding the forecast for your hour',
        text: 'Start from the opening line, or the last FM group before your time. Apply any BECMG that has started, and if it hasn\'t finished, plan for either the old or the new conditions. Then add any TEMPO or PROB that covers your time: that is the weather you might get, and you need a plan for it.',
      },
      {
        kind: 'choice',
        id: 'changes-2000',
        prompt: 'What does this TAF forecast for 20:00 UTC on the 5th?',
        options: [
          { text: 'Broken at 3,000 ft, with spells of broken at 2,000 ft in showers', correct: true, why: 'The opening line holds until 02:00 on the 6th, and the TEMPO adds showery spells from 18:00 to 22:00.' },
          { text: 'Broken at 2,000 ft in showers the whole time', why: 'TEMPO means spells, together less than half the period. In between, the opening line holds.' },
          { text: 'Scattered at 1,000 ft, broken at 4,000 ft', why: 'That is the FM060200 group, which only starts at 02:00 on the 6th.' },
        ],
      },
      {
        kind: 'choice',
        id: 'changes-0400',
        prompt: 'And for 04:00 UTC on the 6th?',
        options: [
          { text: 'Broken at 3,000 ft, the same as the opening line', why: 'FM060200 replaced the whole forecast from 02:00. The opening line no longer applies.' },
          { text: 'Light and variable wind, more than 6 miles, broken at 4,000 ft', correct: true, why: 'FM060200 gives VRB03KT P6SM SCT010 BKN040. The scattered layer at 1,000 ft isn\'t a ceiling, so the ceiling is 4,000 ft.' },
          { text: 'Overcast at 600 ft in mist', why: 'That is the BECMG group, which doesn\'t begin until 08:00.' },
        ],
      },
      {
        kind: 'choice',
        id: 'changes-1100',
        prompt: 'You plan to depart at 11:00 UTC on the 6th. What should you plan for?',
        options: [
          { text: '2 miles in mist and overcast at 600 ft, with a 30 percent chance of fog and half a mile', correct: true, why: 'The BECMG has finished by 10:00, so its conditions hold, and the PROB30 covers 10:00 to 14:00. That is IFR, with a chance of LIFR.' },
          { text: 'More than 6 miles, broken at 4,000 ft', why: 'That was the FM060200 forecast, but the BECMG group changed it between 08:00 and 10:00.' },
          { text: 'Fog with half a mile visibility, for certain', why: 'PROB30 is a 30 percent chance, not a certainty. The base forecast is mist and overcast at 600 ft.' },
        ],
      },
      {
        kind: 'answer',
        id: 'changes-clearing',
        prompt: 'From what time UTC on the 6th is Victoria forecast to clear? Give four digits.',
        accept: ['1500', '15:00'],
        placeholder: 'hhmm',
        why: 'FM061500: from the 6th at 15:00 UTC, more than 6 miles with few clouds at 3,000 ft.',
      },
      {
        kind: 'choice',
        id: 'changes-tempo',
        prompt: 'Why plan for a TEMPO group, if the weather it gives won\'t last?',
        options: [
          { text: 'You don\'t; TEMPO conditions are too short to matter', why: 'A spell of under an hour is plenty to close the field to you while you are trying to land.' },
          { text: 'Because a TEMPO group always turns into the main forecast later', why: 'It doesn\'t. A lasting change would be an FM or BECMG group.' },
          { text: 'Because it may be the weather when you arrive', correct: true, why: 'You can\'t know whether you will arrive in a spell or between them. Carry the fuel and the alternate to cope either way.' },
        ],
      },
    ],
  },
  {
    id: 'brief',
    title: 'Brief a flight',
    summary: 'Six reports, one flight and its return. Decide which ones change your plan.',
    minutes: 10,
    blocks: [
      {
        kind: 'p',
        text: 'A weather briefing comes down to three questions. What is the weather now, from the METARs? What will it be when you get there, from the TAFs? And if it goes wrong, where else can you go? Check the departure, the destination and the alternate, for the hour you will be at each.',
      },
      {
        kind: 'rule',
        title: 'Your minimums for this flight',
        text: 'Ceiling at least 3,000 ft. Visibility at least 5 miles. Wind no more than 20 knots, gusts included. No thunderstorms. These are an example of personal minimums for a low-time pilot, stricter than the legal limits on purpose. Yours are your own to set.',
      },
      {
        kind: 'p',
        text: 'Here is the plan and the six reports that came with it. Decide for each one whether it changes your plan: whether it shows weather outside your minimums at the place and time it applies to you.',
      },
      {
        kind: 'triage',
        id: 'brief-triage',
        flight: [
          ['Aircraft', 'Cessna 172, VFR'],
          ['Route', 'Abbotsford (CYXX) to Victoria (CYYJ)'],
          ['Date', '5 November 2026'],
          ['Depart', '18:15 UTC'],
          ['Arrive', 'About 18:55 UTC'],
          ['Alternate', 'Nanaimo (CYCD)'],
          ['Return', 'Leave Victoria 23:00, back at Abbotsford about 23:40 UTC'],
        ],
        labels: {
          yes: 'Changes the plan',
          no: 'Doesn\'t',
          question: 'Does {name} change your plan?',
          submit: 'Check my briefing',
          noun: 'reports',
          verdictYes: 'It changes the plan.',
          verdictNo: 'It doesn\'t change the plan.',
        },
        items: [
          {
            raw: ABBOTSFORD,
            name: 'the Abbotsford METAR',
            affects: false,
            why: 'Wind 8 knots, 15 miles, and the ceiling is the broken layer at 7,000 ft. The few clouds at 4,000 ft aren\'t a ceiling. All inside your minimums for an 18:15 departure.',
          },
          {
            raw: ABBOTSFORD_TAF,
            name: 'the Abbotsford TAF',
            affects: true,
            why: 'From 21:00 UTC the wind is forecast at 15 knots gusting 25, and you come back at about 23:40. The gusts are over your 20-knot limit, so the return as planned is out. Plan to come back earlier, or stay.',
          },
          {
            raw: VICTORIA,
            name: 'the Victoria METAR',
            affects: true,
            why: 'Broken at 2,500 ft is a ceiling below your 3,000 ft, right now, at the airport you are flying to.',
          },
          {
            raw: VICTORIA_TAF,
            name: 'the Victoria TAF',
            affects: true,
            why: 'You arrive at about 18:55, inside the TEMPO from 18:00 to 22:00: spells of broken at 2,000 ft and 5 miles in showers. The METAR shows those spells have already started. The opening line\'s broken at 3,000 ft is only just at your minimum.',
          },
          {
            raw: NANAIMO,
            name: 'the Nanaimo METAR',
            affects: false,
            why: 'Scattered at 8,000 ft is not a ceiling, the visibility is 15 miles and the wind 6 knots. Nanaimo is a good alternate right now.',
          },
          {
            raw: NANAIMO_TAF,
            name: 'the Nanaimo TAF',
            affects: false,
            why: 'The forecast holds more than 6 miles and no ceiling until 06:00 UTC on the 6th, which covers the time you might need it. The only change is the wind going light and variable.',
          },
        ],
        debrief: {
          title: 'Now, later, and a way out',
          text: 'Three of these six reports changed the plan. Victoria is below your ceiling minimum now and forecast to stay showery until 22:00 UTC, and the Abbotsford wind rules out the return as planned. The honest options are to wait, to go somewhere else, or to fly another day.',
        },
      },
    ],
  },
];

export function metarLessonById(id: string): Lesson | undefined {
  return METAR_LESSONS.find((lesson) => lesson.id === id);
}
