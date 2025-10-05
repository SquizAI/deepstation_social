'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Sparkles, Send, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'sonner'

interface FieldSchema {
  name: string
  type: string
  label: string
  required: boolean
  placeholder?: string
}

interface ContinuousVoiceAssistantProps {
  isActive: boolean
  onToggle: () => void
  onFormUpdate: (data: any, currentField?: string) => void
  formType: 'event' | 'post' | 'speaker' | 'generic'
  fieldSchema?: FieldSchema[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function ContinuousVoiceAssistant({
  isActive,
  onToggle,
  onFormUpdate,
  formType = 'event',
  fieldSchema = []
}: ContinuousVoiceAssistantProps) {
  const [conversation, setConversation] = useState<Message[]>([])
  const [accumulatedData, setAccumulatedData] = useState<Record<string, any>>({})
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [currentField, setCurrentField] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isTTSEnabled, setIsTTSEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  // Start greeting with TTS
  useEffect(() => {
    if (isActive && conversation.length === 0) {
      const greetings = {
        event: "Hi! I'm here to help you create an event. What would you like to call it?",
        post: "Hello! Let's create a post together. What's on your mind?",
        speaker: "Hi there! Let's add a speaker. Who would you like to feature?",
        generic: "Hello! How can I help you today?"
      }
      const greeting = greetings[formType]

      const greetingMsg: Message = {
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      }

      setConversation([greetingMsg])

      // Speak greeting if TTS is enabled
      if (isTTSEnabled) {
        speak(greeting)
      }

      // Auto-start listening after greeting
      setTimeout(() => {
        if (isActive) startContinuousListening()
      }, isTTSEnabled ? 2500 : 1000)
    }
  }, [isActive, formType])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudio()
    }
  }, [])

  // Text-to-Speech function
  const speak = (text: string) => {
    if (!isTTSEnabled || !window.speechSynthesis) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.1
    utterance.pitch = 1.0
    utterance.volume = 0.9

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    speechSynthesisRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const stopAllAudio = () => {
    stopSpeaking()
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
  }

  // Voice Activity Detection with waveform
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
        }, 1500)
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
      // Stop any speaking first
      stopSpeaking()

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
      setError(null)
    } catch (error: any) {
      console.error('Failed to start listening:', error)
      const errorMsg = error.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow microphone access in your browser settings.'
        : 'Failed to access microphone. Please check your device settings.'

      setError(errorMsg)
      toast.error(errorMsg)
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

      if (!transcribeResponse.ok) {
        throw new Error('Transcription failed')
      }

      const { transcript } = await transcribeResponse.json()

      if (!transcript || transcript.trim().length === 0) {
        // No speech detected, restart listening
        setIsProcessing(false)
        startContinuousListening()
        return
      }

      setCurrentTranscript(transcript)
      await processText(transcript)

    } catch (error: any) {
      console.error('Error processing audio:', error)
      setError('Failed to process audio. Please try again.')
      toast.error('Audio processing failed. Please try again.')
      setIsProcessing(false)
      startContinuousListening()
    }
  }

  const processText = async (text: string) => {
    setIsProcessing(true)

    // Add user message to conversation
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() }
    const updatedConversation = [...conversation, userMsg]
    setConversation(updatedConversation)

    try {
      // Process with AI - send accumulated context
      const aiResponse = await fetch('/api/ai-agent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: updatedConversation,
          formType,
          fieldSchema,
          accumulatedData, // Send all previously filled data
        }),
      })

      if (!aiResponse.ok) {
        throw new Error('AI processing failed')
      }

      const { response, formData: extractedData, nextField } = await aiResponse.json()

      // Add AI response to conversation
      const assistantMsg: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
      setConversation([...updatedConversation, assistantMsg])

      // Speak AI response if TTS enabled
      if (isTTSEnabled && response) {
        speak(response)
      }

      // Update form with accumulated data
      if (extractedData && Object.keys(extractedData).length > 0) {
        console.log('[AI] Extracted form data:', extractedData)

        // Merge with accumulated data
        const newAccumulatedData = { ...accumulatedData, ...extractedData }
        setAccumulatedData(newAccumulatedData)

        // Determine current field from extracted data or AI suggestion
        const currentFieldName = nextField || Object.keys(extractedData).pop()
        if (currentFieldName) {
          setCurrentField(currentFieldName)
        }

        // Update form with all accumulated data
        onFormUpdate(newAccumulatedData, currentFieldName)

        // Show success toast
        const fieldCount = Object.keys(extractedData).filter(k => extractedData[k] !== null).length
        if (fieldCount > 0) {
          toast.success(`Filled ${fieldCount} field${fieldCount > 1 ? 's' : ''}!`)
        }
      }

      setCurrentTranscript('')
      setIsProcessing(false)

      // Auto-restart listening after TTS finishes or short delay
      setTimeout(() => {
        if (isActive && !isSpeaking) {
          startContinuousListening()
        }
      }, isTTSEnabled ? 500 : 300)

    } catch (error: any) {
      console.error('Error processing text:', error)
      setError('Failed to process your request. Please try again.')
      toast.error('Processing failed. Please try again.')
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
      stopAllAudio()
      setConversation([])
      setAccumulatedData({})
      setError(null)
    }
    onToggle()
  }

  const toggleTTS = () => {
    if (isTTSEnabled) {
      stopSpeaking()
    }
    setIsTTSEnabled(!isTTSEnabled)
  }

  if (!isActive) {
    return (
      <button
        onClick={handleToggle}
        className="fixed bottom-8 right-8 z-40 group"
        aria-label="Activate Voice Assistant"
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
              {isListening ? (
                <div className="relative">
                  <Mic className="w-6 h-6 text-white animate-pulse" />
                  {/* Listening pulse animation */}
                  <div className="absolute inset-0 rounded-full bg-white animate-ping"
                       style={{ opacity: volumeLevel * 0.3 }}></div>
                  {/* Waveform bars */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-white rounded-full transition-all"
                        style={{
                          height: `${4 + volumeLevel * 16}px`,
                          opacity: 0.3 + volumeLevel * 0.7,
                          animationDelay: `${i * 50}ms`
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <p className="text-white font-semibold">AI Assistant</p>
              <p className="text-xs text-white/70">
                {isProcessing ? 'Processing...' : isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Ready'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTTS}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={isTTSEnabled ? 'Disable voice responses' : 'Enable voice responses'}
            >
              {isTTSEnabled ? (
                <Volume2 className="w-5 h-5 text-white" />
              ) : (
                <VolumeX className="w-5 h-5 text-white/50" />
              )}
            </button>
            <button
              onClick={handleToggle}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close Voice Assistant"
            >
              <MicOff className="w-5 h-5 text-white" />
            </button>
          </div>
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

        {/* Error display */}
        {error && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs text-red-200 bg-red-500/20 rounded px-2 py-1">
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Conversation Transcript Panel */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[32rem]">
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-3">
            {conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`${
                  msg.role === 'user' ? 'text-right' : 'text-left'
                } animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`inline-block rounded-2xl px-4 py-2 max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-50">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {currentTranscript && (
              <div className="text-right animate-in fade-in duration-200">
                <div className="inline-block rounded-2xl px-4 py-2 bg-white/5 text-white/50 max-w-[85%]">
                  <p className="text-sm italic">"{currentTranscript}"</p>
                </div>
              </div>
            )}

            {isProcessing && !currentTranscript && (
              <div className="text-left">
                <div className="inline-block rounded-2xl px-4 py-2 bg-white/10">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
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
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
