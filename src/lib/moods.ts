export type Mood = { v: number; e: string; l: string; c: string };

export const MOODS: Mood[] = [
  { v: 1, e: '😞', l: 'Awful', c: '#F25757' },
  { v: 2, e: '😕', l: 'Low', c: '#FF9A3C' },
  { v: 3, e: '😐', l: 'Okay', c: '#F5C518' },
  { v: 4, e: '🙂', l: 'Good', c: '#3FC97A' },
  { v: 5, e: '😄', l: 'Great', c: '#2BB3E0' },
];

/** Display order: Great first, Awful last. */
export const MOODS_DISPLAY: Mood[] = [...MOODS].reverse();

export const moodOf = (v: number): Mood | undefined => MOODS.find((m) => m.v === v);

export const NO_MOOD_COLOR = '#9A7CF0';

export const PROMPTS = [
  'What made you smile today?',
  "What's one thing you learned today?",
  'What drained your energy, and what gave it back?',
  'Describe today in three words — then explain one of them.',
  'Who did you think about today, and why?',
  "What's something you're looking forward to?",
  'What would you tell yourself from this morning?',
  'What small win deserves credit today?',
  "What's been on your mind that you haven't said out loud?",
  'Where did you feel most like yourself today?',
  "What's one thing you'd do differently tomorrow?",
  'What are you worried about, and how likely is it really?',
  'What did you notice today that you usually miss?',
  "What's a conversation you keep replaying?",
  'What did your body need today?',
  'What are you proud of this week?',
  "What's a habit you want to start or stop?",
  'Describe a moment today you want to remember in 10 years.',
  "What's something kind someone did — or you did?",
  "What's taking up too much space in your head?",
  'If today were a chapter, what would its title be?',
  'What felt easy today? What felt hard?',
  "What are you avoiding, and what's the first tiny step?",
  'Who would you like to thank, and for what?',
];

export const DEFAULT_TAGS = ['work', 'family', 'friends', 'exercise', 'sleep', 'study', 'nature', 'health'];

/** Monday→Sunday rainbow used to tint empty calendar days. */
export const WEEKDAY_COLORS = ['#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#38D9A9', '#4DABF7', '#B197FC'];

/** One gradient per month (Jan→Dec) for the calendar header. */
export const MONTH_GRADIENTS: [string, string][] = [
  ['#4FACFE', '#00C6FB'], ['#F857A6', '#FF5858'], ['#43E97B', '#38C9A0'], ['#FA709A', '#FBB040'],
  ['#A18CD1', '#FBC2EB'], ['#F6D365', '#FD8064'], ['#FF9A44', '#FC6076'], ['#30CFD0', '#5B5FE0'],
  ['#F093FB', '#F5576C'], ['#F7971E', '#E85D3A'], ['#8E6CF0', '#D16BA5'], ['#36D1DC', '#5B86E5'],
];
