'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPreferences, setPreferences, getProfile, exportAllData, deleteAllData, type Preferences } from '@/lib/memory'

interface Props { isOpen: boolean; onClose: () => void }

export default function SmartSettings({ isOpen, onClose }: Props) {
  const [prefs, setPrefs] = useState<Preferences>(getPreferences())
  const [profile] = useState(getProfile())
  const [confirmDelete, setConfirmDelete] = useState(false)

  const update = (key: keyof Preferences, value: unknown) => {
    const updated = { ...prefs, [key]: value } as Preferences
    setPrefs(updated)
    setPreferences(updated)
  }

  const MODES = [
    { key: 'default', label: '🤖 Default' },
    { key: 'motivation', label: '💪 Motivation' },
    { key: 'chill', label: '😎 Chill' },
    { key: 'focus', label: '🎯 Focus' },
    { key: 'philosopher', label: '🤔 Philosopher' },
    { key: 'roast', label: '🔥 Roast' },
  ]

  const TOGGLES: { key: keyof Preferences; label: string }[] = [
    { key: 'voiceEnabled', label: '🎤 Voice Mode' },
    { key: 'hapticEnabled', label: '📳 Haptic Feedback' },
    { key: 'notificationsEnabled', label: '🔔 Notifications' },
    { key: 'lowPowerMode', label: '🔋 Low Power Mode' },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '85vh',
              overflowY: 'auto', background: 'rgba(13,13,31,0.98)',
              border: '1px solid rgba(255,26,136,0.2)', borderRadius: '24px 24px 0 0',
              padding: '20px 16px 40px',
            }}
          >
            <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 4, margin: '0 auto 20px' }} />
            <h2 style={{ fontFamily: 'Courier New', fontSize: 18, color: 'var(--pink)', letterSpacing: 2, marginBottom: 20 }}>
              ⚙️ SMART SETTINGS
            </h2>

            {profile.name && (
              <div style={{ padding: '12px 16px', background: 'rgba(255,26,136,0.08)', borderRadius: 12, marginBottom: 16, border: '1px solid rgba(255,26,136,0.15)' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Smart Profile</div>
                <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4 }}>
                  👤 {profile.name} · {profile.language}
                  {profile.goals?.length ? ` · ${profile.goals.length} goals` : ''}
                </div>
              </div>
            )}

            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, letterSpacing: 1 }}>PERSONALITY MODE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {MODES.map(mode => (
                <motion.button key={mode.key} whileTap={{ scale: 0.95 }}
                  onClick={() => update('personalityMode', mode.key as Preferences['personalityMode'])}
                  style={{
                    padding: '10px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    border: prefs.personalityMode === mode.key ? '1px solid rgba(255,26,136,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    background: prefs.personalityMode === mode.key ? 'linear-gradient(135deg,rgba(255,26,136,0.3),rgba(124,58,237,0.3))' : 'rgba(255,255,255,0.05)',
                  }}>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{mode.label}</div>
                </motion.button>
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, letterSpacing: 1 }}>TOGGLES</div>
            {TOGGLES.map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{item.label}</div>
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => update(item.key, !prefs[item.key])}
                  style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', background: prefs[item.key] ? 'linear-gradient(135deg,#ff1a88,#7c3aed)' : 'rgba(255,255,255,0.1)' }}>
                  <motion.div
                    animate={{ x: prefs[item.key] ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: 'white' }}
                  />
                </motion.button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 16, marginBottom: 16 }}>
              <motion.button whileTap={{ scale: 0.95 }} onClick={exportAllData}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.08)', color: 'var(--cyan)', cursor: 'pointer', fontSize: 13 }}>
                ☁️ Backup Data
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmDelete(true)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,68,68,0.3)', background: 'rgba(255,68,68,0.08)', color: '#ff4444', cursor: 'pointer', fontSize: 13 }}>
                🗑️ Delete All
              </motion.button>
            </div>

            {confirmDelete && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ padding: '16px', background: 'rgba(255,68,68,0.12)', borderRadius: 12, border: '1px solid rgba(255,68,68,0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#ff4444', marginBottom: 12 }}>Sir, sure ho? Sab delete ho jaayega! 🚨</div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => { deleteAllData(); window.location.reload() }}
                    style={{ padding: '8px 20px', borderRadius: 10, background: '#ff4444', border: 'none', color: 'white', cursor: 'pointer' }}>
                    Haan, Delete!
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    style={{ padding: '8px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                    Ruko!
                  </button>
                </div>
              </motion.div>
            )}

            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 20 }}>
              JARVIS v6.0 — ₹0 Forever — Privacy First 🔒
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
