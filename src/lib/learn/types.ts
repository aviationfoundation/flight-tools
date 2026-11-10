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
  // Short name for screen readers, such as "the Victoria TAF". Defaults to the first word of raw.
  name?: string;
  affects: boolean;
  why: string;
}

export interface TriageLabels {
  // What the drill is called for screen readers. Defaults to "Briefing drill".
  title?: string;
  yes: string;
  no: string;
  question: string;
  submit: string;
  noun: string;
  // Shown after checking, for an item that does and one that doesn't.
  verdictYes: string;
  verdictNo: string;
}

export interface RouteStop {
  // Short code in capitals, like a waypoint on a flight plan.
  code: string;
  label: string;
  note: string;
}

export interface LinkItem {
  label: string;
  href: string;
  note?: string;
}

export interface DrillMap {
  route: Array<[number, number]>;
  places: Array<{ label: string; lat: number; lon: number }>;
  areas: Array<{ label: string; lat: number; lon: number; radiusNm: number }>;
  // What the map shows, for screen readers.
  description?: string;
}

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'notice'; title?: string; text: string }
  | { kind: 'notam'; raw: string; marks?: Mark[]; caption?: string }
  | { kind: 'report'; raw: string; marks?: Mark[]; caption?: string }
  // prose: the first column holds words, so it is set in the text face and may wrap.
  | { kind: 'table'; head: string[]; rows: string[][]; prose?: boolean }
  | { kind: 'rule'; title: string; text: string }
  | { kind: 'choice'; id: string; prompt: string; raw?: string; options: Option[] }
  | { kind: 'answer'; id: string; prompt: string; raw?: string; accept: string[]; placeholder: string; why: string }
  | { kind: 'pick'; id: string; prompt: string; raw: string; choices: string[]; answer: string; why: string }
  // prose: the items are sentences, not reports, so they are set in the text face.
  | { kind: 'triage'; id: string; flight: Array<[string, string]>; items: TriageItem[]; labels?: TriageLabels; map?: DrillMap; debrief?: { title: string; text: string }; prose?: boolean }
  | { kind: 'timeline'; caption: string; window: [number, number]; offsetHours: number; localLabel: string }
  | { kind: 'route'; caption?: string; stops: RouteStop[] }
  | { kind: 'links'; title: string; items: LinkItem[] };

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  blocks: Block[];
}

export function checkCount(lesson: Lesson): number {
  let n = 0;
  for (const block of lesson.blocks) {
    if (block.kind === 'triage') n += block.items.length;
    else if (block.kind === 'choice' || block.kind === 'answer' || block.kind === 'pick') n += 1;
  }
  return n;
}
