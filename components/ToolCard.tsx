'use client'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { Tool } from '@/lib/links'
import { trackToolClick, getToolUsage } from '@/lib/memory'

interface Props { tool: Tool }
const catEmoji: Record<string, string> = { image: '🎨', video: '🎬', audio: '🎵', code: '💻', design: '✏️', writing: '✍️', productivity: '📋', learning: '📚', chat: '🤖', 'image-edit': '✂️', upscale: '⬆️', visual: '🎭', tts: '🗣️' }

export default function ToolCard({ tool }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const usage = getToolUsage(tool.id)

  useEffect(() => {
    if (!ref.current) return
    import('vanilla-tilt').then(({ default: VanillaTilt }) => {
      if (!ref.current) return
      VanillaTilt.init(ref.current, { max: 12, speed: 400, glare: true, 'max-glare': 0.15, scale: 1.03 })
    })
  }, [])

  return (
    <motion.div ref={ref} className="glass-card"
      onClick={() => { trackToolClick(tool.id); window.open(tool.url, '_blank', 'noopener,noreferrer') }}
      whileTap={{ scale: 0.97 }}
      style={{ cursor: 'pointer', userSelect: 'none', padding: 12 }}
    >
      <div style={{ width: '100%', height: 70, background: 'linear-gradient(135deg, rgba(255,26,136,0.1), rgba(124,58,237,0.1))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 6 }}>
        {catEmoji[tool.category] || '🛠️'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{tool.name}</span>
        {tool.trending && <motion.span animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}>🔥</motion.span>}
      </div>
      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{tool.tag}</span>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <span style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(0,212,255,0.15)', color: 'var(--cyan)', borderRadius: 10, border: '1px solid rgba(0,212,255,0.3)' }}>{tool.free}</span>
        {usage > 0 && <span style={{ fontSize: 10, color: 'var(--muted)' }}>Used {usage}x</span>}
      </div>
    </motion.div>
  )
}
