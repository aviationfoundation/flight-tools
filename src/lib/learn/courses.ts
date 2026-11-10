import { COURSE_ID as NOTAM_COURSE_ID, LESSONS as NOTAM_LESSONS } from './course.ts';
import { METAR_COURSE_ID, METAR_LESSONS } from './metar-course.ts';
import { PATHWAY_COURSE_ID, PATHWAY_LESSONS } from './pathway-course.ts';
import type { Lesson } from './types.ts';

export interface Course {
  // Stored with each score on aviation.foundation. Never change one once learners have progress.
  id: string;
  // The address: /learn/<slug>.
  slug: string;
  title: string;
  description: string;
  lead: string;
  who: string;
  note: string;
  showcaseLabel: string;
  tool: { href: string; label: string };
  // Which list on /learn the course sits in: for people deciding whether to train, or for pilots.
  audience: 'starting' | 'pilots';
  // What going through the last lesson again is called, once the course is finished.
  again: string;
  // What the course is on, to finish the certificate's sentence "a course on …".
  subject: string;
  // Lessons open without an account. Signing in is still what saves scores and issues the certificate.
  open?: boolean;
  lessons: Lesson[];
}

export const COURSES: Course[] = [
  {
    id: NOTAM_COURSE_ID,
    slug: 'notams',
    title: 'Reading NOTAMs',
    description: 'Eleven short lessons on reading NOTAMs: the header, the Q-line, times and schedules, the text, altitudes, the US domestic format, winter runway reports and briefing a flight.',
    lead: 'This is an eleven-lesson course on reading preflight NOTAMs (Notices to Air Missions). It covers line-by-line formatting, effective dates and daily schedules, common abbreviations, and how to identify notices that affect your flight.',
    who: 'The material is written for student and private pilots who know basic VFR terms and runway numbering. The entire course takes roughly an hour, and each lesson concludes with review questions and detailed explanations.',
    note: 'Every NOTAM in the course is made up for practice, though the airports are real. Before a real flight, get an official briefing.',
    showcaseLabel: 'From lesson 1: one NOTAM, taken apart',
    tool: { href: '/tools/notam', label: 'Decode a real briefing' },
    audience: 'pilots',
    again: 'Brief the practice flight again',
    subject: 'reading NOTAMs before a flight',
    lessons: NOTAM_LESSONS,
  },
  {
    id: METAR_COURSE_ID,
    slug: 'metar-taf',
    title: 'Reading METARs and TAFs',
    description: 'Nine short lessons on reading aviation weather reports: wind, visibility, weather codes, clouds and ceilings, pressure and remarks, TAF change groups and briefing a flight.',
    lead: 'This is a nine-lesson course on reading METARs, the hourly weather reports from airports, and TAFs, the airport forecasts. It goes group by group through wind, visibility, weather, cloud, temperature and pressure, then through the forecast and its change groups.',
    who: 'The material is written for student and private pilots who know basic VFR terms and runway numbering. The course takes just under an hour, and each lesson concludes with review questions and detailed explanations.',
    note: 'Every report in the course is made up for practice, though the airports are real. Before a real flight, get an official briefing.',
    showcaseLabel: 'From lesson 1: one METAR, taken apart',
    tool: { href: '/tools/metar', label: 'Decode a live report' },
    audience: 'pilots',
    again: 'Brief the practice flight again',
    subject: 'reading METAR weather reports and TAF forecasts',
    lessons: METAR_LESSONS,
  },
  {
    id: PATHWAY_COURSE_ID,
    slug: 'flight-plan',
    title: 'Flight Plan',
    description: 'Eight short lessons on getting into aviation from a Canadian high school: the careers, the pilot licences in order, the medical, reading a cost sheet, paying for training, comparing programs and a Grade 10 to 12 timeline.',
    lead: 'This is an eight-lesson course on getting into aviation from a Canadian high school. It covers the careers, the pilot licences in order, the medical, how to read what a program costs, how training is paid for, and what to do in each grade before your first application.',
    who: 'The material is written for students in Grades 10 to 12 and for the parents and counsellors helping them. It needs no flying experience and takes about 45 minutes. Each lesson ends with questions and the official sources.',
    note: 'Every person, school and price used as an example is made up. The requirements come from Transport Canada and other official sources, linked at the end of each lesson. Check the current version before you act on a date or a fee.',
    showcaseLabel: 'From lesson 1: the pilot route, in order',
    tool: { href: 'https://aviation.foundation/programs', label: 'Compare programs' },
    audience: 'starting',
    again: 'Go through the planning drill again',
    subject: 'getting into aviation from a Canadian high school',
    open: true,
    lessons: PATHWAY_LESSONS,
  },
];

// Addresses under /learn that are pages of their own, so no course may use them as a slug
// and no lesson may use them as an id.
export const RESERVED_SLUGS = ['certificate'];

export function courseBySlug(slug: string): Course | undefined {
  return COURSES.find((course) => course.slug === slug);
}

export function courseById(id: string): Course | undefined {
  return COURSES.find((course) => course.id === id);
}

export function lessonIn(course: Course, id: string): Lesson | undefined {
  return course.lessons.find((lesson) => lesson.id === id);
}

export function totalMinutes(course: Course): number {
  return course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
}
