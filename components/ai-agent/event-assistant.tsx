'use client'

import { useState, useEffect } from 'react'
import Vapi from '@vapi-ai/web'

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || 'your-vapi-public-key'
const ASSISTANT_ID = '5f96b657-0a75-4ce8-a7ef-7ff9a83b5556'

export function EventAssistant() {
  const [vapi, setVapi] = useState<Vapi | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [transcript, setTranscript] = useState<string[]>([])
  const [assistantMessage, setAssistantMessage] = useState('')

  useEffect(() => {
    const vapiInstance = new Vapi(VAPI_PUBLIC_KEY)
    setVapi(vapiInstance)

    // Listen to events
    vapiInstance.on('call-start', () => {
      setIsConnected(true)
      setIsConnecting(false)
    })

    vapiInstance.on('call-end', () => {
      setIsConnected(false)
      setIsConnecting(false)
    })

    vapiInstance.on('speech-start', () => {
      setAssistantMessage('')
    })

    vapiInstance.on('speech-end', () => {
      // Assistant finished speaking
    })

    vapiInstance.on('message', (message: any) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const role = message.role === 'user' ? 'You' : 'Assistant'
        setTranscript((prev) => [...prev, `${role}: ${message.transcript}`])
      }

      if (message.type === 'function-call') {
        console.log('Function called:', message.functionCall)
      }
    })

    vapiInstance.on('error', (error: any) => {
      console.error('VAPI error:', error)
      setIsConnected(false)
      setIsConnecting(false)
    })

    return () => {
      vapiInstance.stop()
    }
  }, [])

  const startCall = async () => {
    if (!vapi) return

    setIsConnecting(true)
    try {
      await vapi.start(ASSISTANT_ID)
    } catch (error) {
      console.error('Failed to start call:', error)
      setIsConnecting(false)
    }
  }

  const endCall = () => {
    if (!vapi) return
    vapi.stop()
    setIsConnected(false)
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            AI Event Assistant
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Talk to our AI to create your event - just describe what you want!
          </p>
        </div>

        <button
          onClick={isConnected ? endCall : startCall}
          disabled={isConnecting}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            isConnected
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:shadow-lg hover:shadow-fuchsia-500/50 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isConnecting ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Connecting...
            </>
          ) : isConnected ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
              End Call
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              Start Voice Call
            </>
          )}
        </button>
      </div>

      {/* Conversation Transcript */}
      {transcript.length > 0 && (
        <div className="mt-6 bg-black/20 rounded-xl p-4 max-h-96 overflow-y-auto">
          <h4 className="text-sm font-semibold text-white mb-3">Conversation</h4>
          <div className="space-y-2">
            {transcript.map((message, index) => {
              const isUser = message.startsWith('You:')
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    isUser
                      ? 'bg-fuchsia-500/20 border border-fuchsia-500/30 ml-8'
                      : 'bg-white/5 border border-white/10 mr-8'
                  }`}
                >
                  <p className="text-sm text-white">{message}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isConnected && transcript.length === 0 && (
        <div className="mt-6 bg-gradient-to-br from-fuchsia-500/10 to-purple-600/10 border border-fuchsia-500/20 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white mb-2">How it works:</h4>
          <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
            <li>Click "Start Voice Call" to begin</li>
            <li>Tell the AI about your event (title, date, location, etc.)</li>
            <li>The AI will ask clarifying questions</li>
            <li>It can research venues, speakers, or topics for you</li>
            <li>Once confirmed, your event will be created automatically</li>
          </ul>
        </div>
      )}
    </div>
  )
}
