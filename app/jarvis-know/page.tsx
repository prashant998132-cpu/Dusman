'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { getRelationship, updateStreak, getProfile, getChats } from '@/lib/memory'

export default function JarvisKnows() {
  const [relationship] = useState(getRelationship())
  const [streak] = useState(updateStreak())
  const [profile] = useState(getProfile())
  const [chats] = useState(getChats())

  const LEVEL_NAMES = ['', 'Stranger 👋', 'Acquaintance 🤝', 'Friend 😊', 'Best Friend 🔥', 'JARVIS MODE 🤖']

  return (
    <div style={{ minHeight: '100vh', background: '#05050f', color: '#f0f0ff', padding: '20px 16px', fontFamily: 'system-ui' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontFamily: 'Courier New', color: '#ff1a88', fontSize: 22, letterSpacing: 2, marginBottom: 24 }}>
          👁️ WHAT JARVIS KNOWS
        </h1>

        {profile.name && (
          <div style={{ background: 'rgba(255,26,136,0.08)', border: '1px solid rgba(255,26,136,0.2)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#6b6b8a', marginBottom: 8 }}>PROFILE</div>
            <div style={{ fontSize: 14 }}>👤 Name: {profile.name}</div>
            <div style={{ fontSize: 14 }}>🌐 Language: {profile.language}</div>
            {profile.goals?.length > 0 && <div style={{ fontSize: 14 }}>🎯 Goals: {profile.goals.join(', ')}</div>}
          </div>
        )}

        <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#6b6b8a', marginBottom: 8 }}>RELATIONSHIP</div>
          <div style={{ fontSize: 14 }}>⭐ Level: {relationship.level} — {LEVEL_NAMES[relationship.level]}</div>
          <div style={{ fontSize: 14 }}>💬 Total Chats: {relationship.totalInteractions}</div>
          <div style={{ fontSize: 14 }}>🔥 Streak: {streak.currentStreak} days (Best: {streak.longestStreak})</div>
          <div style={{ fontSize: 14 }}>📅 First Met: {new Date(relationship.firstMet).toLocaleDateString('hi-IN')}</div>
        </div>

        <div style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#6b6b8a', marginBottom: 8 }}>CHATS SAVED</div>
          <div style={{ fontSize: 14 }}>💾 {chats.length} conversations saved locally</div>
          <div style={{ fontSize: 14 }}>📝 {chats.reduce((a, c) => a + c.messages.length, 0)} total messages</div>
        </div>

        <div style={{ padding: 16, background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#6b6b8a', marginBottom: 8 }}>PRIVACY GUARANTEE</div>
          <div style={{ fontSize: 13, color: '#f0f0ff', lineHeight: 1.6 }}>
            🔒 Sab data sirf aapke device pe hai — localStorage mein.<br/>
            ❌ Koi server tracking nahi.<br/>
            ❌ Koi analytics nahi.<br/>
            ✅ Aap kabhi bhi Settings se sab delete kar sakte ho.
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/" style={{ color: '#ff1a88', fontSize: 13, textDecoration: 'none' }}>← JARVIS wapas jao</a>
        </div>
      </motion.div>
    </div>
  )
}
