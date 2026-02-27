// lib/intelligence.ts — JARVIS v6.0
import type { Message, UserProfile } from './memory'

export type Mode = 'tool-finder' | 'chat' | 'code' | 'translate' | 'summary' | 'workflow' | 'journal' | 'reminder'
export type Tone = 'hinglish' | 'formal' | 'brief' | 'detailed' | 'casual'
export type Emotion = 'happy' | 'sad' | 'urgent' | 'frustrated' | 'excited' | 'neutral'
export type PersonalityMode = 'default' | 'motivation' | 'chill' | 'focus' | 'philosopher' | 'roast'

// ━━━ EMOTION DETECTION — compromise.js with regex fallback ━━━
export async function detectEmotionSmart(input: string): Promise<Emotion> {
  const lower = input.toLowerCase()
  try {
    const nlp = (await import('compromise')).default
    const doc = nlp(input)
    const hasNegative = doc.match('#Negative').length > 0
    const hasPositive = doc.match('#Positive').length > 0
    if (hasPositive && !hasNegative) return 'happy'
    if (hasNegative) return 'frustrated'
  } catch { /* fallback */ }

  if (/😄|😊|😍|haha|lol|great|amazing|awesome|bahut accha|mast|khushi|happy/.test(lower)) return 'happy'
  if (/😢|😭|sad|dukhi|bura|upset|akela|depressed|kuch nahi|chod do/.test(lower)) return 'sad'
  if (/jaldi|asap|urgent|abhi|immediately|fast|quick|please help|zaruri/.test(lower)) return 'urgent'
  if (/nahi chal|broken|galat|error|problem|issue|frustrated|pareshaan|😤|😠/.test(lower)) return 'frustrated'
  if (/wow|🔥|🚀|incredible|excited|kya baat|mazaa|fun/.test(lower)) return 'excited'
  return 'neutral'
}

// ━━━ PERSONALITY PROMPTS ━━━
export const PERSONALITY_PROMPTS: Record<PersonalityMode, string> = {
  default: 'Be helpful, friendly, and professional. Mix Hindi and English naturally (Hinglish).',
  motivation: 'Be extremely motivating and energetic! Use emojis. "Tu kar sakta hai Sir! 💪🔥"',
  chill: 'Be super chill. Like a cool friend. "Arre yaar, tension mat le 😎"',
  focus: 'Be concise and direct. No fluff. Only essential info. No emojis.',
  philosopher: 'Be thoughtful and deep. Ask meaningful questions. Share wisdom. 🤔',
  roast: 'Be witty and sarcastic like Tony Stark JARVIS. Playful roasts but always helpful. "Sir, aap phir wahi galti — fascinating 😏"',
}

// ━━━ TONY STARK STYLE RESPONSES ━━━
export function getTonyStarkResponse(emotion: Emotion, streak: number): string {
  const responses: Record<Emotion, string[]> = {
    happy: [
      'Sir, aap khush hain — theoretically main bhi khush hoon. 😏',
      'Wah Sir! Mood ekdum mast hai aaj.',
    ],
    sad: [
      'Sir, I\'ve analyzed your situation. Technically it could be worse. Marginally. 🫂',
      'Tension mat lo Sir. JARVIS hai na. Bata do kya problem hai.',
    ],
    urgent: [
      'Urgent mode activated Sir. Bolo kya chahiye. ⚡',
      'Samajh gaya Sir — jaldi karte hain.',
    ],
    frustrated: [
      'Sir, frustration levels rising. Let me fix this before you throw something. 😅',
      'Arey yaar, kya ho gaya? Batao main handle karta hoon.',
    ],
    excited: [
      'Sir\'s excitement level: Maximum. Let\'s go! 🚀',
      'Yeh toh mast idea hai Sir! Shuru karte hain!',
    ],
    neutral: [
      'Sir, bolo kya karna hai. Main ready hoon.',
      'JARVIS at your service, Sir. 🤖',
    ],
  }
  const arr = responses[emotion] || responses.neutral
  const base = arr[Math.floor(Math.random() * arr.length)]
  if (streak >= 7) return base + ` (${streak} din ki streak — impressive Sir! 🔥)`
  return base
}

// ━━━ MODE DETECTION ━━━
const MODE_KEYWORDS: Record<Mode, string[]> = {
  'tool-finder': ['tool', 'app', 'website', 'banana', 'chahiye', 'suggest', 'best', 'free', 'kaunsa'],
  'code': ['code', 'program', 'function', 'bug', 'script', 'python', 'javascript', 'error', 'fix'],
  'translate': ['translate', 'meaning', 'anuvad', 'matlab', 'english mein', 'hindi mein'],
  'summary': ['summarize', 'summary', 'short', 'tldr', 'short karo', 'brief'],
  'workflow': ['workflow', 'steps', 'process', 'automate', 'chain', 'sequence'],
  'journal': ['journal', 'diary', 'aaj ka din', 'mood', 'feeling', 'kaisa raha'],
  'reminder': ['remind', 'yaad dilana', 'alarm', 'schedule', 'notification', 'baje'],
  'chat': ['what', 'how', 'why', 'explain', 'kya', 'kaise', 'batao', 'tell me'],
}

export function detectMode(input: string): Mode {
  const lower = input.toLowerCase()
  for (const [mode, keywords] of Object.entries(MODE_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return mode as Mode
  }
  return 'chat'
}

export function detectTone(messages: Message[]): Tone {
  const recent = messages.slice(-3).map(m => m.content).join(' ').toLowerCase()
  if (/bhai|yaar|bro|dude|chill|boss|abe/.test(recent)) return 'hinglish'
  if (/please|kindly|could you|would you|thank you/.test(recent)) return 'formal'
  const avgLen = recent.length / 3
  if (avgLen < 20) return 'brief'
  if (avgLen > 100) return 'detailed'
  return 'casual'
}

// ━━━ GREETINGS ━━━
export function getGreeting(level: number, profile?: UserProfile, streak?: number): string {
  const name = profile?.name ? `, ${profile.name}` : ''
  const streakText = streak && streak > 1 ? ` 🔥 ${streak} din streak!` : ''
  const greetings = [
    `Hello${name}! Main JARVIS hoon. Kya karna hai?`,
    `Wapas aaye${name}! Kya karna hai aaj?${streakText}`,
    `Aye bhai${name}! Kya scene hai aaj? 😎${streakText}`,
    `AAYO${name}! Aaj kya banayenge? 🔥${streakText}`,
    `Boss${name} aa gaye! Bolo kya karna hai 🤖${streakText}`,
  ]
  return greetings[Math.min(level - 1, greetings.length - 1)]
}

// ━━━ PROACTIVE SUGGESTIONS ━━━
export function getProactiveSuggestion(profile?: UserProfile): string {
  const h = new Date().getHours()
  if (h >= 6 && h < 10) return '☀️ Subah ho gayi! Aaj ka kaam plan karein?'
  if (h >= 12 && h < 14) return '🍽️ Lunch break mein kuch useful karna hai?'
  if (h >= 17 && h < 19) return '📊 Din kaisa raha? Journal likhein?'
  if (h >= 22 || h < 2) return '🌙 Der ho rahi hai Sir — rest karo, kal continue!'
  if (profile?.goals?.length) return `🎯 Aaj "${profile.goals[0]}" pe kuch progress hua?`
  return '💡 Koi tool dhundhna hai ya koi kaam?'
}

// ━━━ AMBIENT UI ━━━
export function getAmbientConfig(emotion: Emotion, batteryLevel?: number) {
  const h = new Date().getHours()
  const isNight = h >= 20 || h < 6
  const emotionColors: Record<Emotion, { primary: string; secondary: string }> = {
    happy: { primary: '#ff1a88', secondary: '#ff8800' },
    sad: { primary: '#7c6aed', secondary: '#4a5568' },
    urgent: { primary: '#ff4444', secondary: '#ff8800' },
    frustrated: { primary: '#ff6600', secondary: '#cc3300' },
    excited: { primary: '#ff1a88', secondary: '#00d4ff' },
    neutral: { primary: '#ff1a88', secondary: '#7c3aed' },
  }
  return {
    colors: emotionColors[emotion] || emotionColors.neutral,
    blur: isNight ? '32px' : '24px',
    lowPower: batteryLevel !== undefined && batteryLevel < 0.2,
    batterySuggestion: batteryLevel !== undefined && batteryLevel < 0.2
      ? '🔋 Battery 20% se kam! Low power mode on kar doon Sir?' : null,
  }
}

// ━━━ KEYWORD FALLBACK ━━━
const KEYWORD_MAP: Record<string, { category: string; tools: string[]; response: string }> = {
  logo: { category: 'image', tools: ['Canva', 'Looka', 'AIFreeForever'], response: 'Logo ke liye yeh best free tools hain:' },
  image: { category: 'image', tools: ['Flux AI', 'Raphael', 'Perchance'], response: 'AI image generate karne ke liye:' },
  video: { category: 'video', tools: ['Pika Labs', 'Dreamlux', 'Upsampler Video'], response: 'Video banane ke liye:' },
  music: { category: 'audio', tools: ['Suno', 'Udio', 'Riffusion'], response: 'Music ke liye:' },
  code: { category: 'code', tools: ['Replit', 'CodeSandbox', 'GitHub'], response: 'Coding ke liye:' },
  design: { category: 'design', tools: ['Canva', 'Figma', 'Penpot'], response: 'Design ke liye:' },
  write: { category: 'writing', tools: ['Rytr', 'Quillbot', 'Writesonic'], response: 'Writing ke liye:' },
  translate: { category: 'chat', tools: ['ChatGPT', 'Gemini', 'DeepSeek'], response: 'Translation ke liye:' },
  remove: { category: 'image-edit', tools: ['Clipdrop BG', 'Remove.bg', 'Magic Studio'], response: 'Background remove ke liye:' },
  voice: { category: 'tts', tools: ['ElevenLabs', 'NaturalReaders', 'Play.ht'], response: 'Voice/TTS ke liye:' },
  upscale: { category: 'upscale', tools: ['Upsampler', 'ImgUpscaler', 'Nero AI'], response: 'Image upscale ke liye:' },
  weather: { category: 'productivity', tools: ['Weather.com', 'AccuWeather'], response: 'Weather check ke liye:' },
}

export function keywordFallback(input: string): { category: string; tools: string[]; response: string } | null {
  const lower = input.toLowerCase()
  for (const [keyword, data] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) return data
  }
  return null
}
