'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import MatrixBoot from '@/components/MatrixBoot'

const ChatInterface = dynamic(() => import('@/components/ChatInterface'), { ssr: false })
const ParticlesBackground = dynamic(() => import('@/components/ParticlesBackground'), { ssr: false })

export default function Home() {
  const [booted, setBooted] = useState(false)
  return (
    <main style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div className="jarvis-bg" />
      {booted && <ParticlesBackground />}
      {!booted && <MatrixBoot onDone={() => setBooted(true)} />}
      {booted && <ChatInterface />}
    </main>
  )
}
