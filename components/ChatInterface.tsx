'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { useSwipeable } from 'react-swipeable'
import { Send, Mic } from 'lucide-react'
import JarvisAvatar from '@/components/JarvisAvatar'
import RelationshipBar from '@/components/RelationshipBar'
import SoundWave from '@/components/SoundWave'
import ToolCard from '@/components/ToolCard'
import TypewriterText from '@/components/TypewriterText'
import LiveStats from '@/components/LiveStats'
import CommandPalette from '@/components/CommandPalette'
import SmartStorageAlert from '@/components/SmartStorageAlert'
import SmartSettings from '@/components/SmartSettings'
import SmartHistory from '@/components/SmartHistory'
import { TOOLS } from '@/lib/links'
import {
  lsGet, lsSet, getChats, getActiveChat, newChat, saveChat,
  getRelationship, incrementInteraction, updateStreak, getLevelProgress,
  getPreferences, deleteAllData, exportAllData, extractProfileInfo,
  getProfile,
  type Message, type Chat, type Relationship,
} from '@/lib/memory'
import {
  detectMode, detectTone, detectEmotionSmart,
  getGreeting, getProactiveSuggestion, keywordFallback,
  getTonyStarkResponse, PERSONALITY_PROMPTS,
} from '@/lib/intelligence'

// ━━━ CHAT BUBBLE ━━━
function ChatBubble({ msg, isNew }: { msg: Message; isNew: boolean }) {
  const isJarvis = msg.role === 'jarvis'
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 16, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        display: 'flex', justifyContent: isJarvis ? 'flex-start' : 'flex-end',
        marginBottom: 8, padding: '0 12px',
      }}
    >
      <div style={{
        maxWidth: '85%', padding: '10px 14px', borderRadius: isJarvis ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
        background: isJarvis
          ? 'linear-gradient(135deg, rgba(255,26,136,0.12), rgba(124,58,237,0.08))'
          : 'linear-gradient(135deg, rgba(255,26,136,0.25), rgba(124,58,237,0.2))',
        border: `1px solid ${isJarvis ? 'rgba(255,26,136,0.2)' : 'rgba(255,26,136,0.35)'}`,
        backdropFilter: 'blur(20px)',
      }}>
        {msg.confidence !== undefined && isJarvis && (
          <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
            {msg.model ? `via ${msg.model}` : ''} · {Math.round((msg.confidence || 0) * 100)}% sure
            {msg.emotion && ` · ${msg.emotion}`}
          </div>
        )}
        <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
          {isNew && isJarvis ? <TypewriterText text={msg.content} /> : msg.content}
        </div>
        {msg.tools && msg.tools.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {msg.tools.map(t => (
              <motion.a key={t.id} href={t.url} target="_blank" rel="noopener noreferrer"
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: 'linear-gradient(135deg, rgba(255,26,136,0.2), rgba(124,58,237,0.15))',
                  border: '1px solid rgba(255,26,136,0.3)', color: 'var(--pink)',
                  textDecoration: 'none',
                }}>
                🔗 {t.name}
              </motion.a>
            ))}
          </div>
        )}
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, textAlign: isJarvis ? 'left' : 'right' }}>
          {new Date(msg.timestamp).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  )
}

// ━━━ TYPING INDICATOR ━━━
function TypingIndicator() {
  return (
    <div style={{ padding: '0 12px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4, padding: '10px 14px', background: 'rgba(255,26,136,0.1)', borderRadius: '4px 18px 18px 18px', border: '1px solid rgba(255,26,136,0.2)' }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pink)' }}
            animate={{ y: [0, -6, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </div>
    </div>
  )
}

// ━━━ TOOLS PANEL ━━━
function ToolsPanel({ show, onClose, category, onCategoryChange }: {
  show: boolean; onClose: () => void; category: string; onCategoryChange: (c: string) => void
}) {
  const cats = ['all', 'image', 'video', 'audio', 'code', 'design', 'writing', 'image-edit', 'upscale', 'tts', 'productivity', 'learning']
  const catEmojis: Record<string, string> = { all: '⭐', image: '🎨', video: '🎬', audio: '🎵', code: '💻', design: '✏️', writing: '✍️', 'image-edit': '✂️', upscale: '⬆️', tts: '🗣️', productivity: '📋', learning: '📚' }
  const filtered = category === 'all' ? TOOLS : category === 'trending' ? TOOLS.filter(t => t.trending) : TOOLS.filter(t => t.category === category)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: 'rgba(5,5,15,0.97)', backdropFilter: 'blur(24px)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <div style={{ padding: '16px 12px 8px', borderBottom: '1px solid rgba(255,26,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Courier New', color: 'var(--pink)', fontWeight: 700, fontSize: 16, letterSpacing: 2 }}>
              🛠️ {filtered.length} TOOLS
            </span>
            <motion.button onClick={onClose} whileTap={{ scale: 0.9 }}
              style={{ background: 'none', border: '1px solid rgba(255,26,136,0.3)', borderRadius: 8, padding: '4px 10px', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>
              ✕ Close
            </motion.button>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '8px 12px', overflowX: 'auto', flexShrink: 0 }}>
            {cats.map(c => (
              <motion.button key={c} whileTap={{ scale: 0.95 }}
                onClick={() => onCategoryChange(c)}
                style={{
                  padding: '5px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12,
                  background: category === c ? 'linear-gradient(135deg, var(--pink), var(--purple))' : 'rgba(255,255,255,0.07)',
                  color: category === c ? 'white' : 'var(--muted)',
                }}>
                {catEmojis[c] || '🔧'} {c}
              </motion.button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {filtered.map(tool => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ━━━ MAIN CHAT INTERFACE ━━━
export default function ChatInterface() {
  const [chat, setChat] = useState<Chat>(() => getActiveChat() || newChat())
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showCmdPalette, setShowCmdPalette] = useState(false)
  const [toolCategory, setToolCategory] = useState('all')
  const [activeTab, setActiveTab] = useState<'chat' | 'tools' | 'history' | 'settings'>('chat')
  const [relationship, setRelationship] = useState<Relationship>(getRelationship())
  const [justLeveledUp, setJustLeveledUp] = useState(false)
  const [newMsgIds, setNewMsgIds] = useState<Set<string>>(new Set())
  const [proactiveSuggestion, setProactiveSuggestion] = useState('')
  const [isAvatarThinking, setIsAvatarThinking] = useState(false)
  const [streak, setStreak] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recogRef = useRef<SpeechRecognition | null>(null)
  const profile = getProfile()

  useEffect(() => {
    const s = updateStreak()
    setStreak(s.currentStreak)
    setProactiveSuggestion(getProactiveSuggestion(profile))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages, isThinking])

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText || input).trim()
    if (!text || isThinking) return
    setInput('')
    setProactiveSuggestion('')
    setIsThinking(true)
    setIsAvatarThinking(true)

    // Extract profile info from message
    extractProfileInfo(text)

    const userMsg: Message = {
      id: `u_${Date.now()}`, role: 'user', content: text, timestamp: Date.now(),
    }
    const updatedChat = { ...chat, messages: [...chat.messages, userMsg], updatedAt: Date.now() }
    if (updatedChat.messages.length === 1) updatedChat.title = text.slice(0, 40)
    setChat(updatedChat)
    saveChat(updatedChat)
    setNewMsgIds(new Set([userMsg.id]))

    try {
      const prefs = getPreferences()
      const emotion = await detectEmotionSmart(text)
      const res = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: text,
          context: updatedChat.messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          level: relationship.level,
          personality: prefs.personalityMode,
        }),
      })

      let jarvisReply: string
      let tools: Message['tools'] = []
      let confidence = 0.85
      let detectedEmotion = emotion
      let model = 'keyword'

      if (res.ok) {
        const data = await res.json()
        if (data.useKeywordFallback) {
          const kw = keywordFallback(text)
          if (kw) {
            jarvisReply = `${kw.response}\n${kw.tools.join(', ')}`
            tools = kw.tools.map(t => ({ id: t.toLowerCase(), name: t, url: `https://www.google.com/search?q=${encodeURIComponent(t)}` }))
          } else {
            jarvisReply = getTonyStarkResponse(emotion, streak)
          }
        } else {
          jarvisReply = data.response || getTonyStarkResponse(emotion, streak)
          confidence = data.confidence || 0.85
          detectedEmotion = data.emotion || emotion
          model = data.model || 'ai'
          if (data.tools?.length) {
            tools = (data.tools as string[]).map((t: string) => ({ id: t.toLowerCase().replace(/\s/g, '-'), name: t, url: `https://www.google.com/search?q=${encodeURIComponent(t + ' free tool')}` }))
          }
          if (data.tonyStarkComment) jarvisReply += `\n\n_${data.tonyStarkComment}_`
        }
      } else {
        const kw = keywordFallback(text)
        jarvisReply = kw ? `${kw.response}\n${kw.tools.join(', ')}` : getTonyStarkResponse(emotion, streak)
        if (kw) tools = kw.tools.map(t => ({ id: t.toLowerCase(), name: t, url: `https://www.google.com/search?q=${encodeURIComponent(t)}` }))
      }

      const jarvisMsg: Message = {
        id: `j_${Date.now()}`, role: 'jarvis', content: jarvisReply,
        timestamp: Date.now(), confidence, emotion: detectedEmotion,
        tools: tools.length ? tools : undefined,
        intent: detectMode(text), model,
      }

      const finalChat = { ...updatedChat, messages: [...updatedChat.messages, jarvisMsg], updatedAt: Date.now() }
      setChat(finalChat)
      saveChat(finalChat)
      setNewMsgIds(new Set([jarvisMsg.id]))

      const { relationship: newRel, justLeveledUp: lvlUp } = incrementInteraction()
      setRelationship(newRel)
      if (lvlUp) { setJustLeveledUp(true); setTimeout(() => setJustLeveledUp(false), 3000) }

    } catch {
      const fallbackMsg: Message = {
        id: `j_${Date.now()}`, role: 'jarvis',
        content: 'Sir, thoda technical issue aa gaya. Retry karo? 🔄',
        timestamp: Date.now(), confidence: 0.5,
      }
      const fc = { ...updatedChat, messages: [...updatedChat.messages, fallbackMsg], updatedAt: Date.now() }
      setChat(fc); saveChat(fc); setNewMsgIds(new Set([fallbackMsg.id]))
    } finally {
      setIsThinking(false)
      setIsAvatarThinking(false)
    }
  }, [input, isThinking, chat, relationship, streak])

  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice not supported on this browser.'); return }
    if (isListening) { recogRef.current?.stop(); setIsListening(false); return }
    const recog = new SR()
    recog.lang = 'hi-IN'
    recog.interimResults = false
    recog.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0]?.[0]?.transcript || ''
      if (transcript) { setInput(transcript); setTimeout(() => sendMessage(transcript), 100) }
    }
    recog.onend = () => setIsListening(false)
    recog.onerror = () => setIsListening(false)
    recogRef.current = recog
    recog.start()
    setIsListening(true)
  }, [isListening, sendMessage])

  const handleCommand = useCallback((action: string) => {
    if (action.startsWith('filter:')) {
      const cat = action.split(':')[1]
      setToolCategory(cat)
      setShowTools(true)
    } else if (action === 'clear') {
      const fresh = newChat(); setChat(fresh)
    } else if (action === 'export') {
      exportAllData()
    } else if (action === 'level') {
      sendMessage(`Mera level ${relationship.level} hai aur ${relationship.totalInteractions} total interactions ho gaye hain.`)
    } else if (action === 'streak') {
      sendMessage(`Mera current streak ${streak} din ka hai!`)
    } else if (action === 'privacy') {
      window.open('/jarvis-knows', '_blank')
    }
    setShowCmdPalette(false)
  }, [relationship, streak, sendMessage])

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setShowTools(true),
    onSwipedRight: () => setShowTools(false),
    trackMouse: false,
    delta: 50,
  })

  const prefs = getPreferences()

  return (
    <div {...swipeHandlers} style={{
      position: 'fixed', inset: 0, zIndex: 10,
      display: 'flex', flexDirection: 'column',
      background: 'transparent', overflow: 'hidden',
    }}>
      {/* Smart Storage Alert — always on top */}
      <SmartStorageAlert />

      {/* Header */}
      <div className="glass" style={{
        padding: '10px 12px', flexShrink: 0, zIndex: 20,
        borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none',
        borderBottom: '1px solid rgba(255,26,136,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <JarvisAvatar isThinking={isAvatarThinking} isSpeaking={isListening} level={relationship.level} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'Courier New', fontWeight: 700, fontSize: 16, color: 'var(--pink)', letterSpacing: 1 }}>
                JARVIS
              </span>
              <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(255,26,136,0.15)', border: '1px solid rgba(255,26,136,0.3)', borderRadius: 20, color: 'var(--pink)' }}>
                v6.0
              </span>
              {prefs.personalityMode !== 'default' && (
                <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, color: 'var(--purple)' }}>
                  {prefs.personalityMode}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {isThinking ? '⚡ Thinking...' : isListening ? '🎤 Listening...' : `Level ${relationship.level} · ${streak > 0 ? `🔥 ${streak}d` : 'Free Forever'}`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {streak > 0 && (
              <span style={{ fontSize: 12, color: 'var(--pink)', fontWeight: 600 }}>🔥{streak}</span>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { const c = newChat(); setChat(c) }}
              style={{ background: 'none', border: '1px solid rgba(255,26,136,0.3)', borderRadius: 8, padding: '4px 8px', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>
              + New
            </motion.button>
          </div>
        </div>
        <RelationshipBar relationship={relationship} justLeveledUp={justLeveledUp} />
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 8 }}>
        <AnimatePresence>
          {proactiveSuggestion && (
            <motion.div
              key="proactive"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => sendMessage(proactiveSuggestion)}
              style={{
                margin: '8px 12px', padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                background: 'rgba(255,26,136,0.08)', border: '1px solid rgba(255,26,136,0.2)',
                fontSize: 13, color: 'var(--muted)',
              }}
            >
              💡 {proactiveSuggestion}
            </motion.div>
          )}
        </AnimatePresence>

        {chat.messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <LiveStats />
            <div style={{ textAlign: 'center', padding: '20px 24px', color: 'var(--muted)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
              <div>{getGreeting(relationship.level, profile, streak)}</div>
              <div style={{ marginTop: 8, fontSize: 11 }}>Type, speak, or swipe left for tools · / for commands</div>
            </div>
          </motion.div>
        )}

        {chat.messages.map(msg => <ChatBubble key={msg.id} msg={msg} isNew={newMsgIds.has(msg.id)} />)}
        {isThinking && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div style={{ padding: '8px 12px', flexShrink: 0, borderTop: '1px solid rgba(255,26,136,0.1)' }}>
        <div className="input-wrapper" style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <motion.button onClick={startVoice} whileTap={{ scale: 0.9 }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: isListening ? 'var(--pink)' : 'var(--muted)', flexShrink: 0 }}>
            {isListening
              ? <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mic size={18} color="var(--pink)" /><SoundWave isActive bars={12} height={20} /></div>
              : <Mic size={18} />
            }
          </motion.button>
          <textarea
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
              if (e.key === '/' && !input) setShowCmdPalette(true)
            }}
            placeholder="Message JARVIS... (/ for commands)"
            rows={1}
            style={{
              flex: 1, resize: 'none', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,26,136,0.2)', borderRadius: 12,
              padding: '10px 12px', color: 'var(--text)', fontSize: 14,
              outline: 'none', lineHeight: 1.5,
            }}
          />
          <motion.button
            onClick={() => sendMessage()} whileTap={{ scale: 0.9 }}
            disabled={!input.trim() || isThinking}
            className="jarvis-btn"
            style={{ padding: '10px 14px', opacity: input.trim() && !isThinking ? 1 : 0.4, flexShrink: 0, borderRadius: 12 }}>
            <Send size={16} />
          </motion.button>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav" style={{
        display: 'flex', borderTop: '1px solid rgba(255,26,136,0.1)',
        background: 'rgba(5,5,15,0.9)', backdropFilter: 'blur(20px)', flexShrink: 0,
      }}>
        {([
          { tab: 'chat', icon: '💬', label: 'Chat' },
          { tab: 'tools', icon: '🛠️', label: 'Tools' },
          { tab: 'history', icon: '📋', label: 'History' },
          { tab: 'settings', icon: '⚙️', label: 'Settings' },
        ] as const).map(({ tab, icon, label }) => (
          <button key={tab}
            style={{
              flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              color: activeTab === tab ? 'var(--pink)' : 'var(--muted)', fontSize: 10, fontWeight: 600,
              borderTop: activeTab === tab ? '2px solid var(--pink)' : '2px solid transparent',
            }}
            onClick={() => {
              setActiveTab(tab)
              if (tab === 'tools') setShowTools(true)
              if (tab === 'chat') setShowTools(false)
              if (tab === 'history') setShowHistory(true)
              if (tab === 'settings') setShowSettings(true)
            }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Panels */}
      <ToolsPanel show={showTools} onClose={() => { setShowTools(false); setActiveTab('chat') }} category={toolCategory} onCategoryChange={setToolCategory} />
      <CommandPalette isOpen={showCmdPalette} onClose={() => setShowCmdPalette(false)} onAction={handleCommand} />

      {/* v6.0 Smart Components */}
      <SmartSettings isOpen={showSettings} onClose={() => { setShowSettings(false); setActiveTab('chat') }} />
      <SmartHistory
        isOpen={showHistory}
        onClose={() => { setShowHistory(false); setActiveTab('chat') }}
        onSelectChat={(selectedChat) => {
          setChat(selectedChat)
          lsSet('jarvis_active_chat', selectedChat.id)
        }}
      />
    </div>
  )
}
