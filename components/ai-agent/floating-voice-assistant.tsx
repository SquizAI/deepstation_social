'use client'

import { useState, useEffect, useRef } from 'react'
import Vapi from '@vapi-ai/web'

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || ''
const ASSISTANT_ID = 'cc104999-bed0-4a40-9934-2c6bb85efd2c' // DeepStation Voice Event Creator

interface FloatingVoiceAssistantProps {
  onFormUpdate?: (data: any) => void
}

export function FloatingVoiceAssistant({ onFormUpdate }: FloatingVoiceAssistantProps) {
  const [vapi, setVapi] = useState<Vapi | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const vapiInstance = new Vapi(VAPI_PUBLIC_KEY)
    setVapi(vapiInstance)

    vapiInstance.on('call-start', () => {
      setIsConnected(true)
      setIsConnecting(false)
      setIsExpanded(true)
    })

    vapiInstance.on('call-end', () => {
      setIsConnected(false)
      setIsExpanded(false)
      setIsSpeaking(false)
      setIsListening(false)
    })

    vapiInstance.on('speech-start', () => {
      setIsSpeaking(true)
      setIsListening(false)
    })

    vapiInstance.on('speech-end', () => {
      setIsSpeaking(false)
      setIsListening(true)
    })

    vapiInstance.on('message', (message: any) => {
      console.log('VAPI message:', message)

      if (message.type === 'transcript' && message.role === 'assistant') {
        setCurrentQuestion(message.transcript)
      }

      if (message.type === 'function-call' && message.functionCall?.name === 'create_event') {
        const formData = message.functionCall.parameters
        if (onFormUpdate) {
          onFormUpdate(formData)
        }
      }
    })

    vapiInstance.on('volume-level', (level: number) => {
      setVolumeLevel(level)
    })

    return () => {
      vapiInstance.stop()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [onFormUpdate])

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
  }

  return (
    <>
      {/* Floating Assistant Button */}
      <div
        className={`fixed bottom-8 right-8 z-50 transition-all duration-500 ${
          isExpanded ? 'scale-110' : 'scale-100'
        }`}
      >
        {!isConnected && !isConnecting && (
          <button
            onClick={startCall}
            className="group relative"
          >
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 opacity-75 blur-xl group-hover:opacity-100 transition-opacity"></div>

            {/* Main button */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-fuchsia-500/50 group-hover:shadow-fuchsia-500/80 transition-all cursor-pointer">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-4 px-4 py-2 bg-black/90 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Click to start voice assistant
              <div className="absolute top-full right-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black/90"></div>
            </div>
          </button>
        )}

        {/* Active Assistant */}
        {(isConnected || isConnecting) && (
          <div className="relative">
            {/* Audio Visualizer */}
            <div className="relative w-32 h-32">
              {/* Outer rings */}
              <div className={`absolute inset-0 rounded-full border-2 border-fuchsia-500/30 ${isSpeaking || isListening ? 'animate-ping' : ''}`}></div>
              <div className={`absolute inset-2 rounded-full border-2 border-purple-500/30 ${isSpeaking || isListening ? 'animate-pulse' : ''}`}></div>

              {/* Waveform bars */}
              <div className="absolute inset-0 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full bg-gradient-to-t from-fuchsia-500 to-purple-600 transition-all duration-100`}
                    style={{
                      height: isSpeaking || isListening
                        ? `${20 + Math.random() * volumeLevel * 60}%`
                        : '20%',
                    }}
                  ></div>
                ))}
              </div>

              {/* Center orb */}
              <div className="absolute inset-6 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-2xl shadow-fuchsia-500/50 flex items-center justify-center">
                {isConnecting ? (
                  <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isSpeaking ? (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                  </svg>
                )}
              </div>

              {/* Status indicator */}
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 border-2 border-white shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              </div>
            </div>

            {/* End call button */}
            <button
              onClick={endCall}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg shadow-lg transition-all"
            >
              End Call
            </button>
          </div>
        )}
      </div>

      {/* Current Question Bubble */}
      {isConnected && currentQuestion && (
        <div className="fixed bottom-32 right-8 z-40 max-w-md animate-in slide-in-from-bottom-4 fade-in">
          <div className="bg-gradient-to-r from-fuchsia-500/20 to-purple-600/20 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-fuchsia-400 animate-pulse"></div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Assistant is asking:</p>
                <p className="text-white text-sm">{currentQuestion}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions - Show on hover when not active */}
      {!isConnected && !isConnecting && (
        <div className="fixed bottom-32 right-8 z-40 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-black/90 backdrop-blur-sm rounded-xl p-4 max-w-xs">
            <h4 className="text-white font-semibold text-sm mb-2">Voice Assistant</h4>
            <ul className="text-slate-300 text-xs space-y-1">
              <li>• Click the button to start</li>
              <li>• I'll ask you questions about your event</li>
              <li>• Answer naturally with your voice</li>
              <li>• The form will fill automatically</li>
              <li>• I can research companies, venues, etc.</li>
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
