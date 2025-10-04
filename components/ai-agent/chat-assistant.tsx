'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient as createDeepgram, LiveTranscriptionEvents } from '@deepgram/sdk'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatAssistantProps {
  onFormUpdate?: (data: any) => void
}

export function ChatAssistant({ onFormUpdate }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey! I'm here to help you create your event. Just tell me about it, or if you prefer, click the mic button and talk to me. What kind of event are you planning?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const deepgramRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = { role: 'user', content }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      const data = await response.json()

      if (data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
      }

      // Update form if AI extracted data
      if (data.formData && onFormUpdate) {
        onFormUpdate(data.formData)
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Initialize Deepgram
      const response = await fetch('/api/ai-agent/deepgram-token')
      const { token } = await response.json()

      const deepgram = createDeepgram(token)
      const connection = deepgram.listen.live({
        model: 'nova-3',
        language: 'en-US',
        smart_format: true,
        interim_results: true,
      })

      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened')
      })

      connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        const transcript = data.channel.alternatives[0].transcript
        if (transcript && data.is_final) {
          setTranscript((prev) => prev + ' ' + transcript)
        }
      })

      connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error('Deepgram error:', error)
      })

      deepgramRef.current = connection

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && deepgramRef.current) {
          deepgramRef.current.send(event.data)
        }
      }

      mediaRecorder.start(250) // Send data every 250ms
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to access microphone. Please ensure you have granted permission.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }

    if (deepgramRef.current) {
      deepgramRef.current.finish()
    }

    setIsRecording(false)

    // Send the transcript as a message
    if (transcript.trim()) {
      sendMessage(transcript.trim())
      setTranscript('')
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-fuchsia-500/20 to-purple-600/20 border-b border-white/10 p-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          AI Event Assistant
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Type or speak to create your event - I'll fill in the form for you
        </p>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white'
                  : 'bg-white/10 text-slate-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-4">
        {isRecording && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-red-300">Recording...</p>
              </div>
              {transcript && (
                <p className="text-xs text-slate-400 italic">{transcript}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage(input)}
            placeholder="Type your message or use the mic..."
            disabled={isLoading || isRecording}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 disabled:opacity-50"
          />

          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-lg transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isRecording ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              )}
            </svg>
          </button>

          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim() || isRecording}
            className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:shadow-lg hover:shadow-fuchsia-500/50 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
