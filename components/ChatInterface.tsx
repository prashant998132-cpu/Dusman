'use client'

import { useState } from "react"
import { Message } from "@/lib/memory"

function generateId() {
  return crypto.randomUUID()
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = async () => {
    if (!input.trim()) return

    setError(null) // Clear previous errors
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: input,
      timestamp: Date.now(), // Changed from new Date() to Date.now()
      confidence: 1,
      emotion: "neutral",
      model: "user-input",
      mode: "chat",
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()

      const jarvisMessage: Message = {
        id: generateId(),
        role: "jarvis",
        content: data.reply || "No response",
        timestamp: Date.now(), // Changed from new Date() to Date.now()
        confidence: data.confidence ?? 0.9,
        emotion: data.emotion ?? "neutral",
        model: data.model ?? "jarvis-core",
        mode: data.mode ?? "chat",
      }

      setMessages((prev) => [...prev, jarvisMessage])
    } catch (error) {
      console.error("Chat error:", error)
      setError("Failed to send message. Please try again.")
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg) => {
          const isJarvis = msg.role === "jarvis"

          return (
            <div key={msg.id}>
              {msg.confidence !== undefined && isJarvis && (
                <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>
                  {msg.model ? `via ${msg.model}` : ""} ·{" "}
                  {Math.round((msg.confidence || 0) * 100)}% sure
                  {msg.emotion && ` · ${msg.emotion}`}
                </div>
              )}

              <div
                className={`p-3 rounded-xl max-w-[80%] $
                  ${msg.role === "user"
                    ? "bg-blue-500 text-white self-end"
                    : "bg-gray-200 text-black self-start"}
                `}
              >
                {msg.content}
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="text-gray-400 text-sm">Thinking...</div>
        )}

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border rounded-lg"
          placeholder="Type your message..."
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-black text-white rounded-lg"
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  )
}