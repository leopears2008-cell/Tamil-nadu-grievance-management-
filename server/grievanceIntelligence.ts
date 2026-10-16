export type IntelligenceInput = {
  text: string;
  category?: string;
  district?: string;
  priority?: 'Critical' | 'High' | 'Medium' | 'Low';
};

export type IntelligenceResult = {
  departmentId: string;
  departmentReason: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  severityReason: string;
  slaDays: number;
  duplicateScore: number;
  tokens: string[];
};

const STOP_WORDS = new Set(['the','and','with','this','that','from','have','been','near','there','issue','please','need','கள்','ஒரு','இந்த','அது','மற்றும்']);

const DEPARTMENT_RULES: Array<{ id: string; words: string[]; label: string }> = [
  { id: 'dept-electric', words: ['wire','spark','transformer','electric','power','current','shock','min','min kambi','மின்சாரம்','மின்கம்பி','மின்மாற்றி'], label: 'Electrical safety/infrastructure terms detected.' },
  { id: 'dept-water', words: ['water','pipe','leak','burst','sewage','drainage','thanni','kuzhai','kuzhaai','குடிநீர்','தண்ணீர்','குழாய்','கழிவுநீர்'], label: 'Water/drainage infrastructure terms detected.' },
  { id: 'dept-streetlight', words: ['streetlight','lamp','dark','light','pole','vilakku','விளக்கு','இருட்டு'], label: 'Street-lighting terms detected.' },
  { id: 'dept-roads', words: ['road','pothole','pothol','tar','footpath','pavement','saalai','சாலை','பள்ளம்'], label: 'Road/public-works terms detected.' },
  { id: 'dept-health', words: ['mosquito','dengue','malaria','fogging','stagnant','fever','kosu','கொசு','டெங்கு'], label: 'Public-health/vector-control terms detected.' },
  { id: 'dept-sanitation', words: ['garbage','waste','bin','toilet','smell','kuppai','குப்பை','நாற்றம்'], label: 'Sanitation/waste terms detected.' },
  { id: 'dept-transport', words: ['bus','traffic','signal','parking','transport','pokkuvarathu','பேருந்து','போக்குவரத்து'], label: 'Transport/traffic terms detected.' },
];

function normalize(text: string) {
  return text.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu, ' ');
}

export function tokenize(text: string): string[] {
  return [...new Set(normalize(text).split(/\s+/).filter((word) => word.length >= 3 && !STOP_WORDS.has(word)))];
}

export function jaccardSimilarity(a: string, b: string): number {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection++;
  return intersection / (left.size + right.size - intersection);
}

export function routeDepartment(text: string, category?: string) {
  const haystack = normalize(`${text} ${category || ''}`);
  let best = { id: 'dept-sanitation', score: 0, label: 'No stronger service-area signal was detected; staff verification is required.' };
  for (const rule of DEPARTMENT_RULES) {
    const score = rule.words.reduce((count, word) => count + (haystack.includes(normalize(word)) ? 1 : 0), 0);
    if (score > best.score) best = { id: rule.id, score, label: rule.label };
  }
  return { departmentId: best.id, departmentReason: best.label };
}

export function severityAndSla(text: string, suppliedPriority?: IntelligenceInput['priority']) {
  const haystack = normalize(text);
  const critical = ['live wire','exposed wire','electric shock','transformer spark','electric wire','power wire','sparking electric','major burst','life hazard','உயிர் ஆபத்து','மின்கம்பி','மின்மாற்றி'].some((x) => haystack.includes(normalize(x)));
  const high = ['sewage overflow','dengue','blocked road','mosquito','mosquito breeding','flooding','கழிவுநீர்','டெங்கு','கொசு'].some((x) => haystack.includes(normalize(x)));
  let severity: IntelligenceResult['severity'] = suppliedPriority || 'Medium';
  let reason = 'Routine operational impact; staff verification is required.';
  if (critical) { severity = 'Critical'; reason = 'Potential immediate safety hazard detected.'; }
  else if (high && severity !== 'Critical') { severity = 'High'; reason = 'Potential public-health or significant service disruption detected.'; }
  const slaDays = severity === 'Critical' ? 1 : severity === 'High' ? 3 : severity === 'Medium' ? 7 : 14;
  return { severity, severityReason: reason, slaDays };
}

export function analyzeGrievance(input: IntelligenceInput): IntelligenceResult {
  const tokens = tokenize(input.text);
  const route = routeDepartment(input.text, input.category);
  const sla = severityAndSla(input.text, input.priority);
  return {
    ...route,
    ...sla,
    duplicateScore: 0,
    tokens,
  };
}

export function scoreDuplicate(input: string, candidate: string): number {
  return Number(jaccardSimilarity(input, candidate).toFixed(4));
}
