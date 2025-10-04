'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Sparkles, Send } from 'lucide-react'

interface ContinuousVoiceAssistantProps {
  isActive: boolean
  onToggle: () => void
  onFormUpdate: (data: any, currentField?: string) => void
  formType: 'event' | 'post' | 'speaker' | 'generic'
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function ContinuousVoiceAssistant({
  isActive,
  onToggle,
  onFormUpdate,
  formType = 'event'
}: ContinuousVoiceAssistantProps) {
  const [conversation, setConversation] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [currentField, setCurrentField] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()
  const silenceTimeoutRef = useRef<NodeJS.Timeout>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  // Start greeting
  useEffect(() => {
    if (isActive && conversation.length === 0) {
      const greetings = {
        event: "What's your event called?",
        post: "What do you want to post about?",
        speaker: "Who's the speaker?",
        generic: "How can I help?"
      }
      setConversation([{ role: 'assistant', content: greetings[formType] }])
      setCurrentField('title')
      // Auto-start listening after greeting
      setTimeout(() => startContinuousListening(), 1000)
    }
  }, [isActive, formType])

  // Voice Activity Detection
  const detectSilence = (analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    setVolumeLevel(average / 255)

    // Silence threshold: if volume is very low for 1.5 seconds, process
    if (average < 15) {
      if (!silenceTimeoutRef.current) {
        silenceTimeoutRef.current = setTimeout(() => {
          stopAndProcess()
        }, 1500) // 1.5 seconds of silence
      }
    } else {
      // User is speaking, clear silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
        silenceTimeoutRef.current = undefined
      }
    }

    animationFrameRef.current = requestAnimationFrame(() => detectSilence(analyser))
  }

  const startContinuousListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Start voice activity detection
      detectSilence(analyser)

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      })
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // Request data every 100ms to ensure continuous capture
      mediaRecorder.start(100)
      mediaRecorderRef.current = mediaRecorder
      setIsListening(true)
    } catch (error) {
      console.error('Failed to start listening:', error)
      alert('Microphone access denied.')
    }
  }

  const stopAndProcess = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return

    setIsListening(false)
    setIsProcessing(true)

    // Clear silence detection
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = undefined
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Set up onstop handler to process audio after recording stops
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop())

      // Only process if we have audio data
      if (audioBlob.size > 0) {
        await processAudio(audioBlob)
      } else {
        // No audio captured, restart listening
        setIsProcessing(false)
        if (isActive) {
          startContinuousListening()
        }
      }
    }

    // Stop recording
    mediaRecorderRef.current.stop()
  }

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Transcribe
      const formData = new FormData()
      formData.append('audio', audioBlob)

      const transcribeResponse = await fetch('/api/ai-agent/transcribe', {
        method: 'POST',
        body: formData,
      })

      const { transcript } = await transcribeResponse.json()

      if (!transcript || transcript.trim().length === 0) {
        // No speech detected, restart listening
        setIsProcessing(false)
        startContinuousListening()
        return
      }

      setCurrentTranscript(transcript)
      await processText(transcript)

    } catch (error) {
      console.error('Error processing audio:', error)
      setIsProcessing(false)
      startContinuousListening()
    }
  }

  const processText = async (text: string) => {
    setIsProcessing(true)

    // Add to conversation
    const updatedConversation = [...conversation, { role: 'user' as const, content: text }]
    setConversation(updatedConversation)

    try {
      // Process with AI
      const aiResponse = await fetch('/api/ai-agent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: updatedConversation,
          formType,
        }),
      })

      const { response, formData: extractedData } = await aiResponse.json()

      // Add AI response
      setConversation([...updatedConversation, { role: 'assistant', content: response }])

      // Update form
      if (extractedData) {
        console.log('[AI] Extracted form data:', extractedData)

        // Determine current field from extracted data
        const fields = Object.keys(extractedData).filter(k => extractedData[k] !== null)
        if (fields.length > 0) {
          console.log('[AI] Focusing field:', fields[fields.length - 1])
          setCurrentField(fields[fields.length - 1])
        }
        onFormUpdate(extractedData, fields[fields.length - 1])
      } else {
        console.log('[AI] No form data extracted from response')
      }

      setCurrentTranscript('')
      setIsProcessing(false)

      // Auto-restart listening for next answer
      setTimeout(() => {
        if (isActive) {
          startContinuousListening()
        }
      }, 500)

    } catch (error) {
      console.error('Error processing text:', error)
      setIsProcessing(false)
      if (isActive && !isListening) {
        startContinuousListening()
      }
    }
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim() && !isProcessing) {
      processText(textInput.trim())
      setTextInput('')
    }
  }

  const handleToggle = () => {
    if (isActive) {
      // Stop everything
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
      setIsListening(false)
      setConversation([])
    }
    onToggle()
  }

  if (!isActive) {
    return (
      <button
        onClick={handleToggle}
        className="fixed bottom-8 right-8 z-40 group"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 opacity-75 blur-xl group-hover:opacity-100 transition-opacity"></div>
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-fuchsia-500/50 group-hover:scale-110 transition-all">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </button>
    )
  }

  return (
    <div className="fixed top-20 right-6 w-96 z-40 flex flex-col gap-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-fuchsia-500/90 to-purple-600/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Mic className={`w-6 h-6 text-white ${isListening ? 'animate-pulse' : ''}`} />
              {isListening && (
                <div
                  className="absolute inset-0 rounded-full bg-white"
                  style={{ opacity: volumeLevel * 0.5 }}
                ></div>
              )}
            </div>
            <div>
              <p className="text-white font-semibold">AI Assistant</p>
              <p className="text-xs text-white/70">
                {isProcessing ? 'Processing...' : isListening ? 'Listening...' : 'Ready'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <MicOff className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Current field indicator */}
        {currentField && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs text-white/70">Currently filling:</p>
            <p className="text-sm text-white font-medium capitalize">
              {currentField.replace(/_/g, ' ')}
            </p>
          </div>
        )}
      </div>

      {/* Conversation */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[32rem]">
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-3">
            {conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`${
                  msg.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block rounded-2xl px-4 py-2 max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}

            {currentTranscript && (
              <div className="text-right">
                <div className="inline-block rounded-2xl px-4 py-2 bg-white/5 text-white/50 max-w-[85%]">
                  <p className="text-sm italic">"{currentTranscript}"</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Text Input */}
        <div className="p-3 border-t border-white/10">
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type or speak your answer..."
              disabled={isProcessing}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
