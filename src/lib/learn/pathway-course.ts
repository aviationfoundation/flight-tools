import type { Lesson, LinkItem } from './types.ts';

export const PATHWAY_COURSE_ID = 'pathway';

// Every regulatory figure in this course was read from the source named beside it:
//   Standard 421 (Transport Canada, page dated 2026-08-20): ages, exams, hours.
//   CAR 401.19, 401.26, 401.28, 401.30, 401.34: what each permit and licence allows.
//   CAR 404.04 and 404.10: medical categories and validity periods.
//   Income Tax Folio S1-F2-C2, paragraphs 2.38 and 2.39: flying school tuition.
// When one changes, change it here and in tests/learn/pathway-course.test.ts together.
export const MINIMUM_AGE = { studentPermit: 14, privateLicence: 17, commercialLicence: 18, airlineLicence: 21 } as const;
export const MINIMUM_HOURS = { privateLicence: 45, commercialLicence: 200, commercialInCommand: 100, airlineLicence: 1500, night: 20 } as const;
export const GROUND_SCHOOL_HOURS = { privateLicence: 40, commercialLicence: 80 } as const;
export const MEDICAL_MONTHS_UNDER_40 = { category1ForPay: 12, category2: 24, category3: 60, category4: 60 } as const;

// The fee sheet is invented. The figures live here so the sheet, the questions and the
// tests cannot drift apart.
export const FEES = { solo: 190, dual: 265, groundSchool: 500, books: 350, exams: 650 } as const;
export const PLAN_MINIMUM = { dual: 30, solo: 15 } as const;
export const PLAN_LONGER = { dual: 40, solo: 20 } as const;

export function flyingCost(plan: { dual: number; solo: number }): number {
  return plan.dual * FEES.dual + plan.solo * FEES.solo;
}

export const FIXED_FEES = FEES.groundSchool + FEES.books + FEES.exams;

const dollars = (n: number) => `$${n.toLocaleString('en-CA')}`;

export const FEE_SHEET = `NORTHFIELD FLYING CLUB (MADE UP)
PRIVATE PILOT LICENCE, FEE SHEET 2026
Aircraft, solo             $${FEES.solo} per hour
Aircraft with instructor   $${FEES.dual} per hour
Ground school, ${GROUND_SCHOOL_HOURS.privateLicence} hours    $${FEES.groundSchool}
Books and supplies         $${FEES.books}
Written exam, flight test  $${FEES.exams}
Medical exam               not included`;

const SITE = 'https://aviation.foundation';

const LINK = {
  licences: {
    label: 'Transport Canada: general information on pilot licences and permits',
    href: 'https://tc.canada.ca/en/aviation/licensing-pilots-personnel/flight-crew-licences-permits-ratings/general-information-pilot-licences-permits',
  },
  standard421: {
    label: 'Standard 421: flight crew permits, licences and ratings',
    href: 'https://tc.canada.ca/en/corporate-services/acts-regulations/list-regulations/canadian-aviation-regulations-sor-96-433/standards/standard-421-flight-crew-permits-licences-ratings-canadian-aviation-regulations-cars',
    note: 'Ages, exams and minimum hours for every permit, licence and rating.',
  },
  regulations: {
    label: 'Canadian Aviation Regulations',
    href: 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-96-433/index.html',
    note: 'Part IV covers licences. Sections 404.04 and 404.10 cover medical categories and how long they last.',
  },
  medical: {
    label: 'Transport Canada: medical fitness for aviation',
    href: 'https://tc.canada.ca/en/aviation/medical-fitness-aviation',
  },
  radio: {
    label: 'RIC-21: study guide for the aeronautical radio operator certificate',
    href: 'https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/licences-and-certificates/radiocom-information-circulars-ric/ric-21-study-guide-restricted-operator-certificate-aeronautical-qualification-roc',
  },
  cadets: {
    label: 'Cadet Program: summer courses, including glider and power pilot training',
    href: 'https://www.canada.ca/en/department-national-defence/services/cadets-junior-canadian-rangers/cadets/summer-training/courses.html',
  },
  designated: {
    label: 'Government of Canada: list of designated educational institutions',
    href: 'https://www.canada.ca/en/employment-social-development/programs/designated-schools.html',
    note: 'Schools where students can receive Canada Student Grants and Loans. Check the program as well as the school.',
  },
  tuition: {
    label: 'Canada Revenue Agency: Income Tax Folio S1-F2-C2, tuition tax credit',
    href: 'https://www.canada.ca/en/revenue-agency/services/tax/technical-information/income-tax/income-tax-folios-index/series-1-individuals/folio-2-students/income-tax-folio-s1-f2-c2-tuition-tax-credit.html',
    note: 'Paragraphs 2.38 and 2.39 cover flying schools and clubs.',
  },
  programs: {
    label: 'Compare Canadian aviation programs',
    href: `${SITE}/programs`,
    note: 'Published cost, requirements and deadlines for each program, with the source and the date it was checked.',
  },
  registry: {
    label: 'The scholarship registry',
    href: `${SITE}/registry`,
    note: 'Aviation scholarships and bursaries, with eligibility rules, closing dates and deadline alerts.',
  },
  guides: {
    label: 'Guides: the medical, the admissions timeline and what pilot school costs',
    href: `${SITE}/guides`,
  },
  financing: {
    label: 'Training loans, with their rates and terms',
    href: `${SITE}/financing`,
  },
  standards: {
    label: 'How aviation.foundation checks programs and scholarships',
    href: `${SITE}/standards`,
  },
  counsellors: {
    label: 'A one-page aviation guide for school counsellors',
    href: `${SITE}/counsellors`,
  },
} satisfies Record<string, LinkItem>;

export const PATHWAY_LESSONS: Lesson[] = [
  {
    id: 'routes',
    title: 'Where this can take you',
    summary: 'The careers in aviation, and the ways people train for them.',
    minutes: 5,
    blocks: [
      {
        kind: 'p',
        text: 'Every flight you have been on took more than two pilots. Someone inspected the aircraft and signed that it was fit to fly. Someone planned the route and the fuel. Someone in a tower or a control centre kept it apart from other traffic. All of those are aviation careers, and you can start toward any of them from a Canadian high school.',
      },
      {
        kind: 'p',
        text: 'This course covers the steps, their order, what they cost and how people pay for them. It takes about 45 minutes. Each lesson ends with questions and with the official sources, because rules and prices change and you should know where to check them.',
      },
      {
        kind: 'table',
        prose: true,
        head: ['Career', 'The work', 'How you train', 'Aviation medical'],
        rows: [
          ['Pilot', 'Fly for an airline, a charter or cargo operator, an air ambulance or a flight school', 'Flight training to a Commercial Pilot Licence, at a college or university program or at a flying school', 'Category 1'],
          ['Aircraft maintenance engineer', 'Inspect and repair aircraft, and certify the work', 'A college maintenance program and work experience, toward a Transport Canada licence', 'None for the licence'],
          ['Air traffic controller', 'Direct aircraft from a tower or a control centre', 'NAV CANADA hires and trains its own controllers', 'Category 1 or 2'],
          ['Operations and management', 'Flight dispatch, airport operations, airline and airport management', 'An aviation management diploma or degree, or training with an employer', 'None'],
        ],
      },
      {
        kind: 'p',
        text: 'For pilots there are two ways to train. A college or university aviation program runs on a fixed schedule, with an intake date and admission requirements, and you leave with a diploma or degree as well as your licences. A flying school or flying club (Transport Canada calls them flight training units) teaches you lesson by lesson, at your own pace, and you pay as you go. Transport Canada issues the licence either way, against the same standard.',
      },
      {
        kind: 'p',
        text: 'Two other routes exist. The Canadian Armed Forces train their own pilots through their own recruiting. The Cadet Program, open from age 12 until you turn 19, selects some Air Cadets each year for summer courses that lead to a Transport Canada glider or private pilot licence.',
      },
      {
        kind: 'route',
        caption: 'The pilot route, in order. Ages are Transport Canada minimums.',
        stops: [
          { code: 'MED', label: 'Medical', note: 'Category 1 if you want to fly for a living. Lesson 3 explains why it goes first.' },
          { code: 'SPP', label: 'Student Pilot Permit', note: `From age ${MINIMUM_AGE.studentPermit}. You can fly solo under your instructor's supervision, with no passengers.` },
          { code: 'PPL', label: 'Private Pilot Licence', note: `From age ${MINIMUM_AGE.privateLicence}. You can carry passengers, but not for pay.` },
          { code: 'CPL', label: 'Commercial Pilot Licence', note: `From age ${MINIMUM_AGE.commercialLicence}. The first licence you can be paid to fly on.` },
          { code: 'RTG', label: 'Ratings', note: 'Night, multi-engine, instrument and instructor ratings, added to a licence one at a time.' },
          { code: 'ATPL', label: 'Airline Transport Pilot Licence', note: `From age ${MINIMUM_AGE.airlineLicence}, with ${MINIMUM_HOURS.airlineLicence.toLocaleString('en-CA')} hours. Lets you command an aircraft that needs two pilots, such as an airliner.` },
        ],
      },
      {
        kind: 'choice',
        id: 'routes-issuer',
        prompt: 'Who issues a pilot licence in Canada?',
        options: [
          { text: 'Transport Canada', correct: true, why: 'Schools train you. The licence comes from Transport Canada, which is why it is the same licence wherever you trained.' },
          { text: 'The college or flying school you trained at', why: 'A college can give you a diploma. Only Transport Canada issues the licence.' },
          { text: 'The airline that hires you', why: 'An airline hires pilots who already hold the licence.' },
        ],
      },
      {
        kind: 'choice',
        id: 'routes-same',
        prompt: 'Ana trains in a college aviation program. Ben trains at a flying club. Both pass the commercial flight test. How do their licences differ?',
        options: [
          { text: 'They don\'t. Both hold the same Commercial Pilot Licence', correct: true, why: 'Ana also leaves with a diploma. The licences are identical.' },
          { text: 'Ana\'s is a higher class of licence because it came from a college', why: 'There is one Commercial Pilot Licence standard for aeroplanes, and both of them met it.' },
          { text: 'Ben\'s is only valid at his club', why: 'A Transport Canada licence is not tied to the school that trained you.' },
        ],
      },
      {
        kind: 'choice',
        id: 'routes-medical',
        prompt: 'Which of these careers can you start training for without an aviation medical?',
        options: [
          { text: 'Aircraft maintenance engineer', correct: true, why: 'The regulations list the licences that need a medical certificate, and the maintenance engineer licence is not on the list. A program or an employer can still set requirements of its own.' },
          { text: 'Airline pilot', why: 'Commercial and airline pilots need Category 1.' },
          { text: 'Air traffic controller with NAV CANADA', why: 'Controllers need Category 1 or 2.' },
        ],
      },
      {
        kind: 'links',
        title: 'Check it yourself',
        items: [LINK.licences, LINK.regulations, LINK.cadets, LINK.programs],
      },
    ],
  },
  {
    id: 'licences',
    title: 'Permits and licences, in order',
    summary: 'What each step of the pilot route requires, and what the minimum hours mean.',
    minutes: 7,
    blocks: [
      {
        kind: 'p',
        text: 'Pilot licences stack. You hold a Student Pilot Permit while you train, then earn a Private Pilot Licence, then a Commercial Pilot Licence. Each licence has five requirements: a minimum age, a medical category, a written exam, a minimum amount of flying, and a flight test with an examiner.',
      },
      {
        kind: 'p',
        text: 'The table gives Transport Canada\'s minimums for aeroplanes. They come from Standard 421, the document the regulations point to for licence requirements.',
      },
      {
        kind: 'table',
        prose: true,
        head: ['Step', 'Minimum age', 'Medical', 'Written exam', 'Minimum flying'],
        rows: [
          ['Student Pilot Permit', String(MINIMUM_AGE.studentPermit), 'Category 1, 3 or 4', 'PSTAR, pass mark 90%', 'None set. Your instructor decides when you are ready to fly solo'],
          ['Private Pilot Licence', String(MINIMUM_AGE.privateLicence), 'Category 3', 'PPAER, pass mark 60%', `${MINIMUM_HOURS.privateLicence} hours, and ${GROUND_SCHOOL_HOURS.privateLicence} hours of ground school`],
          ['Commercial Pilot Licence', String(MINIMUM_AGE.commercialLicence), 'Category 1', 'CPAER, pass mark 60%', `${MINIMUM_HOURS.commercialLicence} hours, ${MINIMUM_HOURS.commercialInCommand} of them as pilot-in-command, and ${GROUND_SCHOOL_HOURS.commercialLicence} hours of ground school`],
          ['Airline Transport Pilot Licence', String(MINIMUM_AGE.airlineLicence), 'Category 1', 'SAMRA, SARON and INRAT, 70% each', `${MINIMUM_HOURS.airlineLicence.toLocaleString('en-CA')} hours`],
        ],
      },
      {
        kind: 'p',
        text: `Ratings are added to a licence. A night rating needs ${MINIMUM_HOURS.night} hours of flying, 10 of them at night and 10 on instruments. A multi-engine rating has no set hours, only a flight test. An instrument rating, for flying in cloud, needs 40 hours of instrument time and 50 hours of cross-country flying as pilot-in-command. A flight instructor rating needs a commercial licence first, and it lets you teach.`,
      },
      {
        kind: 'p',
        text: 'One certificate comes from a different department. To use an aircraft radio you need a Restricted Operator Certificate with Aeronautical Qualification, from Innovation, Science and Economic Development Canada. It takes one exam with an accredited examiner, has no minimum age and is issued for life.',
      },
      {
        kind: 'rule',
        title: 'Minimums are floors',
        text: `Every number in the table is the least Transport Canada will accept. A quote built on ${MINIMUM_HOURS.privateLicence} hours assumes you need no more than the least. Ask a school how many hours its recent students needed, and budget for that number.`,
      },
      {
        kind: 'answer',
        id: 'licences-cpl-age',
        prompt: 'What is the minimum age to hold a Commercial Pilot Licence?',
        accept: [String(MINIMUM_AGE.commercialLicence)],
        placeholder: 'Age in years',
        why: `Eighteen. You can train toward it earlier: the Student Pilot Permit starts at ${MINIMUM_AGE.studentPermit} and the Private Pilot Licence at ${MINIMUM_AGE.privateLicence}.`,
      },
      {
        kind: 'choice',
        id: 'licences-45',
        prompt: `A school advertises "Private Pilot Licence in ${MINIMUM_HOURS.privateLicence} hours". What is that number?`,
        options: [
          { text: 'The minimum Transport Canada requires', correct: true, why: `Standard 421 sets ${MINIMUM_HOURS.privateLicence} hours as the least flight training for the licence. Whether you need more depends on you, the weather and how often you fly.` },
          { text: 'What the school\'s average student needs', why: 'The advert doesn\'t say that. Ask for the average, and get it in writing.' },
          { text: 'A guaranteed maximum', why: 'Nothing in the number is a guarantee. Extra hours are billed at the hourly rate.' },
        ],
      },
      {
        kind: 'choice',
        id: 'licences-upgrade',
        prompt: 'You hold a Student Pilot Permit on a Category 4 medical, and you are ready to apply for a Private Pilot Licence. What has to change?',
        options: [
          { text: 'You need a Category 3 medical first', correct: true, why: 'The private licence needs Category 3 or Category 1, so the Category 4 has to be upgraded before you apply.' },
          { text: 'Nothing. Category 4 covers private flying', why: 'Category 4 covers the student permit and the recreational permit, not the Private Pilot Licence.' },
          { text: 'You need a new student permit', why: 'The permit is fine. The medical category is what falls short.' },
        ],
      },
      {
        kind: 'choice',
        id: 'licences-paid',
        prompt: 'Which is the first licence that lets you be paid to fly?',
        options: [
          { text: 'Commercial Pilot Licence', correct: true, why: 'A private pilot may not fly for hire or reward. The commercial licence is the first that allows work for a commercial air service.' },
          { text: 'Private Pilot Licence', why: 'It lets you carry passengers. It doesn\'t let you charge for flying them.' },
          { text: 'Airline Transport Pilot Licence', why: `That one comes later. Commercial pilots are already working while they build toward its ${MINIMUM_HOURS.airlineLicence.toLocaleString('en-CA')} hours.` },
        ],
      },
      {
        kind: 'pick',
        id: 'licences-no-hours',
        prompt: 'Tap the item that Transport Canada sets no minimum hours for.',
        raw: `PRIVATE ${MINIMUM_HOURS.privateLicence} H   COMMERCIAL ${MINIMUM_HOURS.commercialLicence} H   NIGHT ${MINIMUM_HOURS.night} H   MULTI-ENGINE   AIRLINE TRANSPORT ${MINIMUM_HOURS.airlineLicence} H`,
        choices: [`PRIVATE ${MINIMUM_HOURS.privateLicence} H`, `COMMERCIAL ${MINIMUM_HOURS.commercialLicence} H`, `NIGHT ${MINIMUM_HOURS.night} H`, 'MULTI-ENGINE', `AIRLINE TRANSPORT ${MINIMUM_HOURS.airlineLicence} H`],
        answer: 'MULTI-ENGINE',
        why: 'The multi-engine rating is earned on a flight test alone. Schools quote a number of hours for it, and that number is theirs.',
      },
      {
        kind: 'links',
        title: 'Check it yourself',
        items: [LINK.standard421, LINK.licences, LINK.radio],
      },
    ],
  },
  {
    id: 'medical',
    title: 'The medical comes first',
    summary: 'Which medical category each career needs, how to get it, and why it goes before everything else.',
    minutes: 6,
    blocks: [
      {
        kind: 'p',
        text: 'A pilot or controller licence only works while you hold a valid medical certificate of the right category. Grades can be raised and money can be found. A medical category you can\'t hold has no workaround, so you find out first.',
      },
      {
        kind: 'table',
        head: ['Category', 'Who needs it', 'Valid for, if you are under 40'],
        rows: [
          ['1', 'Commercial and airline pilots', `${MEDICAL_MONTHS_UNDER_40.category1ForPay} months when flying for pay`],
          ['2', 'Air traffic controllers', `${MEDICAL_MONTHS_UNDER_40.category2} months`],
          ['3', 'Private pilots', `${MEDICAL_MONTHS_UNDER_40.category3} months`],
          ['4', 'Student pilots, recreational pilots and glider pilots', `${MEDICAL_MONTHS_UNDER_40.category4} months`],
        ],
      },
      {
        kind: 'p',
        text: 'Categories 1, 2 and 3 need an examination by a Civil Aviation Medical Examiner, a doctor appointed by Transport Canada. A family doctor can\'t do it without that appointment. The examiner sends a report and Transport Canada assesses it before issuing a first certificate, so the answer takes longer than the appointment.',
      },
      {
        kind: 'p',
        text: 'Category 4 is different. For a student permit in aeroplanes it is a declaration that you sign and a physician licensed in Canada countersigns. It is quick, and it tells you nothing about whether you would pass Category 1.',
      },
      {
        kind: 'rule',
        title: 'Medical, then application, then deposit',
        text: 'Book the medical for the category your career needs before you pay anything that can\'t be refunded. If the result is a surprise, it has cost you an appointment fee.',
      },
      {
        kind: 'p',
        text: 'Three things catch students. Colour vision is tested, and some people first learn at this exam that theirs is limited. On history, answer every question on the form fully: a condition or a medication does not automatically rule you out, and an answer left out and found later is a far bigger problem. On timing, a program that wants the medical by a fixed date will not wait for your file.',
      },
      {
        kind: 'choice',
        id: 'medical-which',
        prompt: 'You want to fly for an airline. Which medical do you book before applying to a program?',
        options: [
          { text: 'Category 1', correct: true, why: 'Commercial and airline licences need Category 1. Passing a lower category tells you nothing about this one.' },
          { text: 'Category 3, then upgrade later', why: 'Category 3 is enough to learn to fly privately. If you can\'t hold Category 1, you want to know before you choose a career program.' },
          { text: 'Category 4, because it is fastest', why: 'A Category 4 declaration is not an examination by a medical examiner.' },
        ],
      },
      {
        kind: 'answer',
        id: 'medical-valid',
        prompt: 'A 17-year-old holds a Category 3 medical for private flying. For how many months is it valid?',
        accept: [String(MEDICAL_MONTHS_UNDER_40.category3)],
        placeholder: 'Months',
        why: `Sixty months, which is five years, for a private pilot under 40. The same pilot flying for pay on a Category 1 would renew every ${MEDICAL_MONTHS_UNDER_40.category1ForPay} months.`,
      },
      {
        kind: 'choice',
        id: 'medical-cat4',
        prompt: 'Your family doctor countersigns your Category 4 declaration and you start lessons. What have you learned about Category 1?',
        options: [
          { text: 'Nothing yet', correct: true, why: 'Category 4 is a declaration. Category 1 is an examination by a Civil Aviation Medical Examiner against a stricter standard.' },
          { text: 'That you will pass it', why: 'The two are assessed differently. One does not predict the other.' },
          { text: 'That you can skip it', why: 'A commercial licence needs Category 1 whatever else you hold.' },
        ],
      },
      {
        kind: 'choice',
        id: 'medical-deposit',
        prompt: 'A program asks for a $1,000 non-refundable deposit by Friday. The amount is made up. You have no medical. What do you do?',
        options: [
          { text: 'Ask in writing whether the deposit comes back if you can\'t get the medical, and book the examiner today', correct: true, why: 'The deposit is the part you can\'t undo. Get the refund terms in writing, and get the exam booked so the answer arrives as early as it can.' },
          { text: 'Pay now and book the medical after', why: 'If the medical goes wrong, the deposit is gone.' },
          { text: 'Get a Category 4, since it is quicker', why: 'It doesn\'t answer the question the program is asking.' },
        ],
      },
      {
        kind: 'links',
        title: 'Check it yourself',
        items: [LINK.regulations, LINK.medical, LINK.guides],
      },
    ],
  },
  {
    id: 'cost',
    title: 'Reading a cost sheet',
    summary: 'How flight training is priced, and how to work out what a licence will cost you.',
    minutes: 7,
    blocks: [
      {
        kind: 'p',
        text: 'Flight training is sold by the hour. An hour with an instructor, called dual, costs the aircraft plus the instructor. An hour alone, called solo, costs the aircraft. On top come ground school, books, exam and flight test fees, and the medical.',
      },
      {
        kind: 'p',
        text: 'Programs publish this in three ways. Some give one figure that includes the flying. Some give academic tuition only and bill the flying separately through a flight centre. Some publish no total at all. A low headline number can mean the flying is on another page.',
      },
      {
        kind: 'notice',
        title: 'Made-up numbers',
        text: 'The club and every price in this lesson are invented for practice. Real program costs, with their sources and the dates they were checked, are on the program pages at aviation.foundation.',
      },
      {
        kind: 'report',
        raw: FEE_SHEET,
        marks: [
          { text: `Aircraft, solo             $${FEES.solo} per hour`, label: 'Solo rate', note: 'You alone in the aircraft. You pay for the aircraft only.' },
          { text: `Aircraft with instructor   $${FEES.dual} per hour`, label: 'Dual rate', note: 'The aircraft plus the instructor. Your early hours are billed at this rate.' },
          { text: `Ground school, ${GROUND_SCHOOL_HOURS.privateLicence} hours    $${FEES.groundSchool}`, label: 'Ground school', note: `Theory, in a classroom or online. Transport Canada requires ${GROUND_SCHOOL_HOURS.privateLicence} hours for the private licence.` },
          { text: `Written exam, flight test  $${FEES.exams}`, label: 'Exams', note: 'One-time fees. They stay the same however many hours you fly.' },
          { text: 'Medical exam               not included', label: 'Not included', note: 'A real cost that is missing from any total built from this sheet.' },
        ],
        caption: 'Tap or hover over a highlighted line to see what it means.',
      },
      {
        kind: 'p',
        text: `Suppose the club plans your private licence as ${PLAN_MINIMUM.dual} hours with an instructor and ${PLAN_MINIMUM.solo} hours solo. That is ${PLAN_MINIMUM.dual + PLAN_MINIMUM.solo} hours, the Transport Canada minimum.`,
      },
      {
        kind: 'answer',
        id: 'cost-flying',
        prompt: `What does that flying cost, in dollars? ${PLAN_MINIMUM.dual} hours at the dual rate plus ${PLAN_MINIMUM.solo} hours at the solo rate.`,
        raw: FEE_SHEET,
        accept: [String(flyingCost(PLAN_MINIMUM))],
        placeholder: 'Dollars',
        why: `${PLAN_MINIMUM.dual} × $${FEES.dual} is ${dollars(PLAN_MINIMUM.dual * FEES.dual)}. ${PLAN_MINIMUM.solo} × $${FEES.solo} is ${dollars(PLAN_MINIMUM.solo * FEES.solo)}. Together, ${dollars(flyingCost(PLAN_MINIMUM))}.`,
      },
      {
        kind: 'answer',
        id: 'cost-total',
        prompt: 'Add ground school, books, and the exam and flight test. What is the total?',
        accept: [String(flyingCost(PLAN_MINIMUM) + FIXED_FEES)],
        placeholder: 'Dollars',
        why: `${dollars(flyingCost(PLAN_MINIMUM))} plus $${FEES.groundSchool}, $${FEES.books} and $${FEES.exams} is ${dollars(flyingCost(PLAN_MINIMUM) + FIXED_FEES)}. The medical still isn't in it.`,
      },
      {
        kind: 'p',
        text: `Now suppose you need ${PLAN_LONGER.dual + PLAN_LONGER.solo} hours to reach the standard for the flight test: ${PLAN_LONGER.dual} with an instructor and ${PLAN_LONGER.solo} solo.`,
      },
      {
        kind: 'answer',
        id: 'cost-extra',
        prompt: `How much more does the ${PLAN_LONGER.dual + PLAN_LONGER.solo}-hour version cost than the ${PLAN_MINIMUM.dual + PLAN_MINIMUM.solo}-hour one?`,
        accept: [String(flyingCost(PLAN_LONGER) - flyingCost(PLAN_MINIMUM))],
        placeholder: 'Dollars',
        why: `The fixed fees don't change. The flying goes from ${dollars(flyingCost(PLAN_MINIMUM))} to ${dollars(flyingCost(PLAN_LONGER))}, which is ${PLAN_LONGER.dual} × $${FEES.dual} plus ${PLAN_LONGER.solo} × $${FEES.solo}. The difference is ${dollars(flyingCost(PLAN_LONGER) - flyingCost(PLAN_MINIMUM))}.`,
      },
      {
        kind: 'rule',
        title: 'Compare what is included',
        text: 'Two prices can be compared only when they cover the same things. Check that both include the flying, the exams, and the same licences and ratings.',
      },
      {
        kind: 'choice',
        id: 'cost-compare',
        prompt: 'College A publishes "Tuition: $18,000". College B publishes "Program cost: $95,000, all flight training included". Both figures are made up. Which program costs less?',
        options: [
          { text: 'You can\'t tell yet', correct: true, why: 'A\'s figure may not include any flying. Find A\'s flight training fees before you compare.' },
          { text: 'College A, because $18,000 is lower', why: 'Only if $18,000 includes the flying, and nothing says it does.' },
          { text: 'College B', why: 'B is the larger number. It could still be the smaller total once A\'s flying is added, and you need A\'s flight fees to know.' },
        ],
      },
      {
        kind: 'pick',
        id: 'cost-missing',
        prompt: 'Tap the part of the fee sheet that names a cost without giving a price.',
        raw: FEE_SHEET,
        choices: [`$${FEES.solo} per hour`, `$${FEES.dual} per hour`, `$${FEES.groundSchool}`, `$${FEES.books}`, `$${FEES.exams}`, 'not included'],
        answer: 'not included',
        why: 'The medical is a real cost, and this sheet leaves it out of every total. Look for "not included", "extra" and "from" on any fee sheet.',
      },
      {
        kind: 'p',
        text: 'A program\'s figure usually leaves out rent, food and transport for the length of the program, the medical, a headset and study materials, extra hours and re-tests, and a Private Pilot Licence where the program requires one before you start.',
      },
      {
        kind: 'links',
        title: 'Use real numbers',
        items: [LINK.programs, LINK.guides, LINK.standards],
      },
    ],
  },
  {
    id: 'money',
    title: 'Paying for it',
    summary: 'Student aid, scholarships, the tuition tax credit and loans, and the order to use them in.',
    minutes: 6,
    blocks: [
      {
        kind: 'p',
        text: 'Almost nobody pays for training from one source. Students combine four: money they or their family already have, government student aid, scholarships and bursaries, and loans.',
      },
      {
        kind: 'p',
        text: 'Government student aid comes as grants, which you keep, and loans, which you repay. It is available only at designated schools, and a school can be designated while one of its programs is not. Look the school up on the federal list, then ask its financial aid office about your exact program.',
      },
      {
        kind: 'p',
        text: 'Scholarships and bursaries are not repaid. Each has its own rules, and aviation awards share some patterns. Many are for one stage of training, such as a first licence or a commercial licence. Some require membership in the organisation that gives them. Some pay in stages as you reach milestones such as your first solo, so you spend first and are paid back after. Application windows often close months before the money arrives.',
      },
      {
        kind: 'p',
        text: 'Air Cadets can apply for the Cadet Program\'s summer pilot courses: the glider course from age 16 and the power course from age 17, each counted on September 1 of the course year. Selection is competitive. The courses lead to a Transport Canada glider or private pilot licence.',
      },
      {
        kind: 'p',
        text: 'Flight training fees can count for the federal tuition tax credit, but only when you are training to become a commercial pilot or a flight instructor, at a school certified for that purpose. Lessons taken for a private licence as a hobby don\'t count. Keep every receipt and ask the school for its tuition certificate.',
      },
      {
        kind: 'p',
        text: 'Loans come last. A private loan is repaid with interest, so the training ends up costing more than its price. Before signing, find the annual percentage rate, the date repayments start, whether someone must co-sign, and what you owe if you stop training.',
      },
      {
        kind: 'rule',
        title: 'The order of money',
        text: 'Use money you never repay first: grants, scholarships and bursaries. Then money you already have. Borrow last, and borrow the cheapest money first.',
      },
      {
        kind: 'triage',
        id: 'money-repay',
        prose: true,
        flight: [
          ['Student', 'Grade 12, accepted to a college aviation diploma'],
          ['Question', 'Which of these are paid back?'],
        ],
        labels: {
          title: 'Funding drill',
          yes: 'Repay it',
          no: 'Keep it',
          question: 'Is {name} repaid?',
          submit: 'Check my answers',
          noun: 'sources',
          verdictYes: 'This is repaid.',
          verdictNo: 'This is kept.',
        },
        items: [
          { raw: 'A $2,000 scholarship from a flying association', name: 'the scholarship', affects: false, why: 'A scholarship is an award. Read its conditions, because some are paid in stages.' },
          { raw: 'A Canada Student Grant', name: 'the grant', affects: false, why: 'A grant is the part of student aid you keep.' },
          { raw: 'A Canada Student Loan', name: 'the student loan', affects: true, why: 'A loan is the part of student aid you repay after your studies.' },
          { raw: 'A bursary from the college', name: 'the bursary', affects: false, why: 'A bursary is an award, usually based on financial need.' },
          { raw: 'A training loan from a private lender', name: 'the private loan', affects: true, why: 'Repaid, with interest. Check the annual percentage rate and when repayments start.' },
        ],
      },
      {
        kind: 'choice',
        id: 'money-designated',
        prompt: 'Your college is on the federal designated list. Is your aviation program eligible for student aid?',
        options: [
          { text: 'Maybe. Ask about the program itself', correct: true, why: 'The federal list says a school can be eligible while some of its programs are not. The financial aid office can confirm yours.' },
          { text: 'Yes, every program at a designated school is', why: 'The list itself warns against assuming that.' },
          { text: 'No, flight training never is', why: 'Programs at designated schools can be eligible. Check, and don\'t assume either way.' },
        ],
      },
      {
        kind: 'choice',
        id: 'money-tax',
        prompt: 'You take flying lessons at a club for fun, with no plan to fly for a living. Do the fees count for the tuition tax credit?',
        options: [
          { text: 'No', correct: true, why: 'The Canada Revenue Agency counts flying school fees only when the student is training to become a commercial pilot or a professional instructor.' },
          { text: 'Yes, all flight training counts', why: 'The purpose of the training decides it, and hobby flying is outside the rule.' },
          { text: 'Only the solo hours', why: 'Solo hours are the part least likely to count, even for commercial students.' },
        ],
      },
      {
        kind: 'choice',
        id: 'money-staged',
        prompt: 'An award pays $1,000 at first solo, $1,000 after the cross-country flight and $1,000 at the licence. The amounts are made up. What does that mean for your budget?',
        options: [
          { text: 'You pay for each stage first, and the award repays you after', correct: true, why: 'A staged award follows your progress. You still need the cash to reach each milestone.' },
          { text: 'You have $3,000 to spend on day one', why: 'Nothing is paid until the first solo.' },
          { text: 'The award covers ground school only', why: 'The stages are flight milestones. Nothing in the terms mentions ground school.' },
        ],
      },
      {
        kind: 'links',
        title: 'Check it yourself',
        items: [LINK.designated, LINK.tuition, LINK.cadets, LINK.registry, LINK.financing],
      },
    ],
  },
  {
    id: 'choosing',
    title: 'Comparing programs',
    summary: 'Six questions every program page should answer, and which answers you can rely on.',
    minutes: 6,
    blocks: [
      {
        kind: 'p',
        text: 'A program page should answer six questions. You compare programs on the answers.',
      },
      {
        kind: 'table',
        prose: true,
        head: ['Question', 'What to look for'],
        rows: [
          ['What do I leave with?', 'The licences and ratings by name, and whether there is a diploma or degree'],
          ['What does the cost cover?', 'Flying, simulator, exams and licence fees, and anything billed separately'],
          ['What do I need to get in?', 'Course names and minimum grades, the medical category and its deadline, tests or interviews, and whether a Private Pilot Licence is required first'],
          ['When?', 'The application window, the start date and the length of the program'],
          ['Can I get student aid?', 'Whether the school and the program are designated, and the refund terms for any deposit'],
          ['What happens after?', 'How many students finish, and where graduates work'],
        ],
      },
      {
        kind: 'p',
        text: 'Admission requirements are set by each program. Read the exact course names and minimum grades while you can still change your timetable, and keep a Grade 11 or 12 math and Grade 12 English until you have checked.',
      },
      {
        kind: 'rule',
        title: 'Go to the source',
        text: 'Take every answer from the institution\'s own page or from Transport Canada, and note the date. A brochure, a forum post or a summary site, this one included, can be out of date.',
      },
      {
        kind: 'triage',
        id: 'choosing-usable',
        prose: true,
        flight: [
          ['Source', 'A made up program brochure'],
          ['Question', 'Which lines can you compare programs with, as they stand?'],
        ],
        labels: {
          title: 'Brochure drill',
          yes: 'Usable',
          no: 'Ask first',
          question: 'Is {name} usable as it stands?',
          submit: 'Check my answers',
          noun: 'lines',
          verdictYes: 'You can compare with this.',
          verdictNo: 'Ask before you rely on this.',
        },
        items: [
          { raw: 'Tuition from $9,800 per year. Flight fees are listed separately.', name: 'the tuition line', affects: false, why: 'The flying is missing, and "from" makes the figure a minimum. Get the flight fees and add them.' },
          { raw: 'Total program cost $96,400 for 2026 entry, including 200 flight hours, exams and licence fees.', name: 'the total cost line', affects: true, why: 'It has a year, a total and a list of what the total covers.' },
          { raw: 'Our graduates are in high demand.', name: 'the graduates line', affects: false, why: 'No number and no source. Ask how many of last year\'s class finished and where they work.' },
          { raw: 'A Category 1 medical is required before the first flight in September.', name: 'the medical line', affects: true, why: 'Specific and checkable: a category and a deadline.' },
          { raw: 'Program cost: $88,000.', name: 'the undated cost line', affects: false, why: 'No year, and no list of what is included. Ask for both.' },
        ],
      },
      {
        kind: 'choice',
        id: 'choosing-ppl',
        prompt: 'A commercial pilot program requires a Private Pilot Licence before you start. What does that do to its cost?',
        options: [
          { text: 'Add the cost of the private licence to the program\'s figure', correct: true, why: 'The licence is part of what you pay to finish, even though the program doesn\'t bill it.' },
          { text: 'Nothing. Prerequisites cost nothing', why: 'A Private Pilot Licence takes at least 45 hours of flying, and someone pays for them.' },
          { text: 'It makes this program the cheapest', why: 'Its own figure may be lower because it starts later. Compare totals from zero.' },
        ],
      },
      {
        kind: 'choice',
        id: 'choosing-deadline',
        prompt: 'Where do you confirm a program\'s application deadline?',
        options: [
          { text: 'The institution\'s own admissions page', correct: true, why: 'Every other listing copies from it, and it is the only one the institution will honour.' },
          { text: 'A third-party directory or summary site', why: 'Good for finding programs. Confirm dates at the source before you plan around them.' },
          { text: 'Last year\'s brochure', why: 'Windows move from year to year.' },
        ],
      },
      {
        kind: 'links',
        title: 'Compare real programs',
        items: [LINK.programs, LINK.standards, LINK.designated],
      },
    ],
  },
  {
    id: 'timeline',
    title: 'Grade 10 to your first application',
    summary: 'What to do in each year of high school, working back from the application deadline.',
    minutes: 5,
    blocks: [
      {
        kind: 'p',
        text: 'Work backwards from the application deadline of the program you want most. Windows can close many months before a program starts, and missing one usually means waiting for the next intake.',
      },
      {
        kind: 'table',
        prose: true,
        head: ['When', 'What to do'],
        rows: [
          ['Grade 10', 'Keep math and English on your timetable. Visit a flying club, an airport open house or an Air Cadet squadron'],
          ['Grade 11', 'Shortlist programs and read their admission pages. Fix any missing course. Book the medical for your career. List scholarships with their closing dates'],
          ['Summer before Grade 12', 'Have the medical in hand. Take a discovery flight, which is a first lesson with an instructor, if you can. Note every application window'],
          ['Fall of Grade 12', 'Apply. Leave time for program tests and interviews, and ask for references early'],
          ['Winter and spring of Grade 12', 'Apply for scholarships. Compare offers on full cost before paying any deposit'],
          ['After you accept', 'Apply for student aid. Check that your medical is still valid on the start date'],
        ],
      },
      {
        kind: 'p',
        text: `You don't have to wait for graduation to start flying. The Student Pilot Permit starts at ${MINIMUM_AGE.studentPermit} and the Private Pilot Licence at ${MINIMUM_AGE.privateLicence}, so a Grade 11 or 12 student can train at a flying school on weekends.`,
      },
      {
        kind: 'p',
        text: 'Scholarships run on their own calendar, and many on the aviation.foundation registry close between January and April. Put each closing date in your calendar when you find the award. The registry can email you before a deadline.',
      },
      {
        kind: 'choice',
        id: 'timeline-first',
        prompt: 'Which comes first?',
        options: [
          { text: 'The medical', correct: true, why: 'It is the one result you can\'t change, so it goes before anything you pay for.' },
          { text: 'The application', why: 'An application made before the medical can leave you holding an offer you can\'t use.' },
          { text: 'The deposit', why: 'The deposit is the last of the three.' },
        ],
      },
      {
        kind: 'answer',
        id: 'timeline-cpl-year',
        prompt: 'You were born in June 2010. In which year can you first hold a Commercial Pilot Licence?',
        accept: [String(2010 + MINIMUM_AGE.commercialLicence)],
        placeholder: 'Year',
        why: `The minimum age is ${MINIMUM_AGE.commercialLicence}, and you turn ${MINIMUM_AGE.commercialLicence} in June ${2010 + MINIMUM_AGE.commercialLicence}.`,
      },
      {
        kind: 'choice',
        id: 'timeline-medical',
        prompt: 'It is September of Grade 12. Your first-choice program closes applications on December 15 and wants the medical with the application. The date is made up. You have no medical. What is the risk?',
        options: [
          { text: 'The certificate may not arrive in time', correct: true, why: 'Transport Canada assesses the examiner\'s report before issuing a first certificate, and that takes time you no longer control.' },
          { text: 'None. A medical is issued at the appointment', why: 'The examiner examines. Transport Canada issues a first certificate after assessing the report.' },
          { text: 'None. The program will extend the deadline', why: 'Don\'t plan on it. Ask the program, and book the examiner now.' },
        ],
      },
      {
        kind: 'choice',
        id: 'timeline-award',
        prompt: 'A scholarship closes March 1 and pays in June. Your first program fee is due in May. The dates are made up. Can the scholarship pay that fee?',
        options: [
          { text: 'No', correct: true, why: 'The money arrives after the fee is due, and you may not win it. Plan the May fee from another source.' },
          { text: 'Yes, if you win', why: 'Even if you win, June comes after May.' },
          { text: 'Yes, schools wait for scholarship money', why: 'Some may. Get that in writing from the school before relying on it.' },
        ],
      },
      {
        kind: 'links',
        title: 'Plan with real dates',
        items: [LINK.programs, LINK.registry, LINK.guides],
      },
    ],
  },
  {
    id: 'plan',
    title: 'File your flight plan',
    summary: 'Put the course together: what to do now, what can wait, and what your alternate is.',
    minutes: 6,
    blocks: [
      {
        kind: 'p',
        text: 'Before a trip a pilot files a flight plan: where the flight leaves from, the route, the destination, the fuel on board, and an alternate airport in case the destination closes. Your plan has the same parts.',
      },
      {
        kind: 'table',
        prose: true,
        head: ['On a flight plan', 'In yours'],
        rows: [
          ['Departure', 'Your grade, your courses and what you can spend'],
          ['Destination', 'The job you are aiming at'],
          ['Route', 'The program or flying school, with its dates and requirements'],
          ['Fuel', 'How you pay, source by source'],
          ['Alternate', 'A second program, or a related career, if the medical or an admission goes against you'],
        ],
      },
      {
        kind: 'triage',
        id: 'plan-now',
        prose: true,
        flight: [
          ['Student', 'Sam, spring of Grade 11'],
          ['Destination', 'Airline pilot'],
          ['First choice', 'A two-year college diploma that asks for a Category 1 medical'],
          ['Question', 'What does Sam do now, and what waits?'],
        ],
        labels: {
          title: 'Planning drill',
          yes: 'Do now',
          no: 'Later',
          question: 'Is {name} for now?',
          submit: 'Check the plan',
          noun: 'steps',
          verdictYes: 'This is for now.',
          verdictNo: 'This can wait.',
        },
        items: [
          { raw: 'Book a Category 1 medical with a Civil Aviation Medical Examiner', name: 'booking the medical', affects: true, why: 'It can end the plan, so it goes first.' },
          { raw: 'Check next year\'s timetable against the program\'s required courses', name: 'checking the timetable', affects: true, why: 'A missing course can\'t be added in June of Grade 12.' },
          { raw: 'Pay a deposit to hold a seat', name: 'paying a deposit', affects: false, why: 'Sam has no offer and no medical yet. A deposit comes after both.' },
          { raw: 'List the scholarships Sam qualifies for, with their closing dates', name: 'listing scholarships', affects: true, why: 'Windows close months ahead, and some awards need a membership that has to start first.' },
          { raw: 'Buy a headset', name: 'buying a headset', affects: false, why: 'It only costs money, and it can be bought the week training starts.' },
          { raw: 'Ask the program what its published cost leaves out', name: 'asking about the cost', affects: true, why: 'The answer decides whether the plan is affordable, and asking is free.' },
          { raw: 'Apply for student aid', name: 'applying for student aid', affects: false, why: 'A student aid application is for a specific school and year, so it follows the offer.' },
          { raw: 'Choose which airline to work for', name: 'choosing an airline', affects: false, why: 'That decision is years away, and it changes nothing Sam does this year.' },
        ],
        debrief: {
          title: 'The pattern',
          text: 'Steps that can stop the plan go first: the medical, the courses, the deadlines. Steps that only cost money wait until you know the plan works.',
        },
      },
      {
        kind: 'choice',
        id: 'plan-alternate',
        prompt: 'Sam is refused a Category 1 medical. Which is a real alternate?',
        options: [
          { text: 'A career with a different medical requirement or none, such as air traffic control, maintenance or operations', correct: true, why: 'Three of the four careers in lesson 1 are outside the cockpit. Controllers are assessed against Category 2, and maintenance and operations need no aviation medical.' },
          { text: 'Start a commercial pilot program anyway', why: 'A Commercial Pilot Licence can\'t be issued without Category 1, so the training would lead nowhere.' },
          { text: 'Leave aviation', why: 'Only one of the four careers in lesson 1 needs Category 1.' },
        ],
      },
      {
        kind: 'choice',
        id: 'plan-conflict',
        prompt: 'Two websites give different deadlines for the same program. Which do you use?',
        options: [
          { text: 'Neither. Check the institution\'s own page', correct: true, why: 'The institution sets the deadline. Every other page is a copy, and copies go stale.' },
          { text: 'The later one', why: 'If the earlier date is the real one, you have missed it.' },
          { text: 'The one that ranks higher in search', why: 'Search ranking says nothing about which page is current.' },
        ],
      },
      {
        kind: 'p',
        text: 'That is the course. When every lesson is done, the course page gives you a certificate of completion with a code your counsellor can check.',
      },
      {
        kind: 'links',
        title: 'Start your plan',
        items: [LINK.programs, LINK.registry, LINK.guides, LINK.counsellors],
      },
    ],
  },
];
