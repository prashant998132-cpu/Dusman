// lib/memory.ts — JARVIS v6.0
// ⚠️ Dexie (IndexedDB) is CLIENT-ONLY — never import db on server side

export const KEYS = {
  CHATS: 'jarvis_chats',
  ACTIVE: 'jarvis_active_chat',
  LINK_PREFS: 'jarvis_link_prefs',
  PREFS: 'jarvis_preferences',
  RELATIONSHIP: 'jarvis_relationship',
  ANALYTICS: 'jarvis_owner_analytics',
  PROFILE: 'jarvis_user_profile',
  WORKFLOWS: 'jarvis_workflows',
  DEAD_LINKS: 'jarvis_dead_links',
  STREAK: 'jarvis_streak',
}

// ━━━ TYPES — Single canonical schema ━━━
export interface Message {
  id: string
  role: 'user' | 'jarvis'
  content: string
  timestamp: number
  intent?: string
  confidence?: number
  tools?: { id: string; name: string; url: string }[]
  emotion?: string
  mode?: string
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface Relationship {
  totalInteractions: number
  level: 1 | 2 | 3 | 4 | 5
  firstMet: number
  lastSeen: number
  nicknamePref: string | null
  personalFacts: string[]
  xp: number
}

export interface UserProfile {
  name?: string
  language: 'hindi' | 'english' | 'hinglish'
  goals: string[]
  likes: string[]
  dislikes: string[]
  habits: string[]
  chatStyle: string
  lastUpdated: number
}

export interface Preferences {
  theme: 'dark' | 'light'
  language: 'en' | 'hi' | 'auto'
  voiceEnabled: boolean
  autoExecute: boolean
  showConfidence: boolean
  ttsEnabled: boolean
  showAvatar: boolean
  personalityMode: 'default' | 'motivation' | 'chill' | 'focus' | 'philosopher' | 'roast'
  hapticEnabled: boolean
  notificationsEnabled: boolean
  lowPowerMode: boolean
}

export interface Streak {
  currentStreak: number
  lastActiveDate: string
  longestStreak: number
}

export interface SmartStorageStatus {
  used: number
  total: number
  percent: number
  warning: boolean
  critical: boolean
}

// ━━━ LOCALSTORAGE HELPERS ━━━
export function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

export function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // If quota exceeded, clean oldest chats
    if (key === KEYS.CHATS) {
      const chats = lsGet<Chat[]>(KEYS.CHATS, [])
      if (chats.length > 5) {
        localStorage.setItem(key, JSON.stringify(chats.slice(-20)))
      }
    }
  }
}

// ━━━ SMART STORAGE MANAGER ━━━
export async function getStorageStatus(): Promise<SmartStorageStatus> {
  try {
    const estimate = await navigator.storage?.estimate()
    const used = estimate?.usage || 0
    const total = estimate?.quota || 50 * 1024 * 1024
    const percent = Math.round((used / total) * 100)
    return { used, total, percent, warning: percent >= 70, critical: percent >= 90 }
  } catch {
    let size = 0
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        size += (localStorage[key].length + key.length) * 2
      }
    }
    const percent = Math.round((size / (5 * 1024 * 1024)) * 100)
    return { used: size, total: 5 * 1024 * 1024, percent, warning: percent >= 70, critical: percent >= 90 }
  }
}

export function autoCleanStorage(): void {
  const chats = getChats()
  if (chats.length > 10) {
    const sorted = [...chats].sort((a, b) => a.updatedAt - b.updatedAt)
    const remaining = sorted.slice(Math.ceil(sorted.length / 3))
    lsSet(KEYS.CHATS, remaining)
  }
}

// ━━━ DEXIE — CLIENT ONLY (always use inside useEffect or dynamic import) ━━━
let _db: import('dexie').Dexie | null = null

export async function getDB() {
  if (typeof window === 'undefined') throw new Error('IndexedDB not available on server')
  if (_db) return _db
  const { default: Dexie } = await import('dexie')
  class JarvisDB extends Dexie {
    memories!: import('dexie').Table<MemoryEntry>
    voiceNotes!: import('dexie').Table<VoiceNote>
    journals!: import('dexie').Table<JournalEntry>
    constructor() {
      super('JarvisDB')
      this.version(1).stores({
        memories: '++id, type, timestamp, text',
        voiceNotes: '++id, timestamp',
        journals: '++id, date',
      })
    }
  }
  _db = new JarvisDB()
  return _db
}

export interface MemoryEntry {
  id?: number
  type: 'fact' | 'preference' | 'goal' | 'habit' | 'emotion'
  text: string
  timestamp: number
}

export interface VoiceNote {
  id?: number
  timestamp: number
  duration: number
  transcript: string
  mood: string
}

export interface JournalEntry {
  id?: number
  date: string
  mood: string
  summary: string
  highlights: string[]
  streakDay: number
}

// ━━━ SMART PROFILE ━━━
export function getProfile(): UserProfile {
  return lsGet<UserProfile>(KEYS.PROFILE, {
    language: 'hinglish', goals: [], likes: [],
    dislikes: [], habits: [], chatStyle: 'casual', lastUpdated: Date.now(),
  })
}

export function updateProfile(updates: Partial<UserProfile>): void {
  lsSet(KEYS.PROFILE, { ...getProfile(), ...updates, lastUpdated: Date.now() })
}

export function extractProfileInfo(message: string): void {
  const profile = getProfile()
  const nameMatch = message.match(/mera naam (.+?) hai|my name is (.+?)[\.\,\!]/i)
  if (nameMatch) updateProfile({ name: (nameMatch[1] || nameMatch[2]).trim() })
  const goalMatch = message.match(/mujhe (.+?) banana hai|i want to (.+?)[\.!]/i)
  if (goalMatch) {
    const goal = (goalMatch[1] || goalMatch[2]).trim()
    const existing = profile.goals || []
    if (!existing.includes(goal)) updateProfile({ goals: [...existing.slice(-4), goal] })
  }
}

// ━━━ CHATS ━━━
export function getChats(): Chat[] { return lsGet<Chat[]>(KEYS.CHATS, []) }

export function saveChat(chat: Chat): void {
  const chats = getChats()
  const idx = chats.findIndex(c => c.id === chat.id)
  if (idx >= 0) chats[idx] = chat; else chats.push(chat)
  lsSet(KEYS.CHATS, chats)
}

export function newChat(): Chat {
  const chat: Chat = {
    id: `chat_${Date.now()}`, title: 'New Chat',
    messages: [], createdAt: Date.now(), updatedAt: Date.now(),
  }
  saveChat(chat)
  lsSet(KEYS.ACTIVE, chat.id)
  return chat
}

export function getActiveChat(): Chat | null {
  const id = lsGet<string>(KEYS.ACTIVE, '')
  if (!id) return null
  return getChats().find(c => c.id === id) || null
}

export function deleteChat(chatId: string): void {
  lsSet(KEYS.CHATS, getChats().filter(c => c.id !== chatId))
}

// ━━━ RELATIONSHIP ━━━
export function getRelationship(): Relationship {
  return lsGet<Relationship>(KEYS.RELATIONSHIP, {
    totalInteractions: 0, level: 1,
    firstMet: Date.now(), lastSeen: Date.now(),
    nicknamePref: null, personalFacts: [], xp: 0,
  })
}

export function incrementInteraction(): { relationship: Relationship; justLeveledUp: boolean } {
  const r = getRelationship()
  r.totalInteractions++
  r.xp = (r.xp || 0) + 1
  r.lastSeen = Date.now()
  const oldLevel = r.level
  if (r.totalInteractions >= 500) r.level = 5
  else if (r.totalInteractions >= 100) r.level = 4
  else if (r.totalInteractions >= 25) r.level = 3
  else if (r.totalInteractions >= 5) r.level = 2
  else r.level = 1
  lsSet(KEYS.RELATIONSHIP, r)
  return { relationship: r, justLeveledUp: r.level > oldLevel }
}

export function getLevelProgress(r: Relationship): number {
  const thresholds = [0, 5, 25, 100, 500]
  const nextThresholds = [5, 25, 100, 500, 1000]
  const i = r.level - 1
  return Math.min(100, ((r.totalInteractions - thresholds[i]) / (nextThresholds[i] - thresholds[i])) * 100)
}

// ━━━ STREAK ━━━
export function updateStreak(): Streak {
  const today = new Date().toISOString().split('T')[0]
  const streak = lsGet<Streak>(KEYS.STREAK, { currentStreak: 0, lastActiveDate: '', longestStreak: 0 })
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (streak.lastActiveDate === today) return streak
  if (streak.lastActiveDate === yesterday) streak.currentStreak++
  else streak.currentStreak = 1
  streak.lastActiveDate = today
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak)
  lsSet(KEYS.STREAK, streak)
  return streak
}

// ━━━ PREFERENCES ━━━
export function getPreferences(): Preferences {
  return lsGet<Preferences>(KEYS.PREFS, {
    theme: 'dark', language: 'auto',
    voiceEnabled: true, autoExecute: false,
    showConfidence: true, ttsEnabled: false, showAvatar: true,
    personalityMode: 'default', hapticEnabled: true,
    notificationsEnabled: false, lowPowerMode: false,
  })
}

export function setPreferences(prefs: Partial<Preferences>): void {
  lsSet(KEYS.PREFS, { ...getPreferences(), ...prefs })
}

// ━━━ TOOL ANALYTICS ━━━
export function trackToolClick(toolId: string): void {
  const prefs = lsGet<Record<string, { usageCount: number; lastUsed: number; isFavorite: boolean; isHidden: boolean }>>(KEYS.LINK_PREFS, {})
  if (!prefs[toolId]) prefs[toolId] = { usageCount: 0, lastUsed: 0, isFavorite: false, isHidden: false }
  prefs[toolId].usageCount++
  prefs[toolId].lastUsed = Date.now()
  lsSet(KEYS.LINK_PREFS, prefs)
}

export function getToolUsage(toolId: string): number {
  const prefs = lsGet<Record<string, { usageCount: number }>>(KEYS.LINK_PREFS, {})
  return prefs[toolId]?.usageCount || 0
}

// ━━━ EXPORT / DELETE ━━━
export function exportAllData(): void {
  const data = {
    chats: lsGet(KEYS.CHATS, []),
    preferences: lsGet(KEYS.PREFS, {}),
    relationship: lsGet(KEYS.RELATIONSHIP, {}),
    streak: lsGet(KEYS.STREAK, {}),
    analytics: lsGet(KEYS.ANALYTICS, {}),
    profile: lsGet(KEYS.PROFILE, {}),
    exported: new Date().toISOString(),
    version: '6.0.0',
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `JARVIS-backup-${Date.now()}.json`
  a.click()
}

export function deleteAllData(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
