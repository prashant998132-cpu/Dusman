'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const ChatInterface = dynamic(() => import('@/components/ChatInterface'), { ssr: false })
const MatrixBoot = dynamic(() => import('@/components/MatrixBoot'), { ssr: false })

export default function Home() {
  const [booted, setBooted] = useState(false)
  
  return (
    <main style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {!booted && <MatrixBoot onDone={() => setBooted(true)} />}
      {booted && <ChatInterface />}
    </main>
  )
}