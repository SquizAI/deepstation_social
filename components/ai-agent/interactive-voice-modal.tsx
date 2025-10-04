'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Mic, Send, Sparkles } from 'lucide-react'

interface InteractiveVoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onFormUpdate: (data: any) => void
  formType: 'event' | 'post' | 'speaker' | 'generic'
  currentFormData: any
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function InteractiveVoiceModal({
  isOpen,
  onClose,
  onFormUpdate,
  formType = 'event',
  currentFormData = {}
}: InteractiveVoiceModalProps) {
  const [conversation, setConversation] = useState<Message[]>([])
  const [textInput, setTextInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initial greeting
  useEffect(() => {
    if (isOpen && conversation.length === 0) {
      const greetings = {
        event: "What's the event called?",
        post: "What do you want to post about?",
        speaker: "Who's the speaker?",
        generic: "How can I help you?"
      }
      setConversation([{ role: 'assistant', content: greetings[formType] }])
    }
  }, [isOpen, formType])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  const processText = async (text: string) => {
    setIsProcessing(true)

    const updatedConversation = [...conversation, { role: 'user' as const, content: text }]
    setConversation(updatedConversation)
    setTextInput('')

    try {
      const response = await fetch('/api/ai-agent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: updatedConversation,
          formType,
        }),
      })

      const { response: aiResponse, formData } = await response.json()

      setConversation([...updatedConversation, { role: 'assistant', content: aiResponse }])

      if (formData) {
        onFormUpdate(formData)
      }
    } catch (error) {
      console.error('Error processing text:', error)
      setConversation([...updatedConversation, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim() && !isProcessing) {
      processText(textInput.trim())
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const visualize = () => {
        if (!analyserRef.current) return
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(average / 255)
        animationFrameRef.current = requestAnimationFrame(visualize)
      }
      visualize()

      const mediaRecorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        setAudioLevel(0)
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Microphone access denied.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)

      const transcribeResponse = await fetch('/api/ai-agent/transcribe', {
        method: 'POST',
        body: formData,
      })

      const { transcript } = await transcribeResponse.json()
      await processText(transcript)
    } catch (error) {
      console.error('Error processing audio:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateCoverImage = async () => {
    setIsProcessing(true)

    try {
      const response = await fetch('/api/ai-agent/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentFormData.title,
          description: currentFormData.description,
          eventType: currentFormData.event_type,
        }),
      })

      const { prompt, imageUrl, message } = await response.json()

      // Update form with generated image
      onFormUpdate({ cover_image: imageUrl })

      // Show success message in conversation
      setConversation([
        ...conversation,
        {
          role: 'assistant',
          content: `${message}\n\nPrompt: ${prompt}`
        }
      ])
    } catch (error) {
      console.error('Error generating image:', error)
      setConversation([
        ...conversation,
        {
          role: 'assistant',
          content: 'Sorry, image generation failed. Please try again.'
        }
      ])
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[90vh] bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] rounded-2xl shadow-2xl flex overflow-hidden">

        {/* Left: Conversation */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">AI Assistant</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Speak or type to fill your {formType}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white'
                      : 'bg-white/10 border border-white/20 text-white'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-white/10">
            <form onSubmit={handleTextSubmit} className="flex gap-3">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your answer or click the mic..."
                disabled={isProcessing || isRecording}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />

              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`p-3 rounded-xl transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90'
                }`}
              >
                <Mic className="w-6 h-6 text-white" />
              </button>

              <button
                type="submit"
                disabled={!textInput.trim() || isProcessing || isRecording}
                className="p-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-6 h-6 text-white" />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Form Preview */}
        <div className="w-80 bg-black/20 backdrop-blur-sm border-l border-white/10 p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-4">
            Preview
          </h3>

          <div className="space-y-4">
            {Object.entries(currentFormData).map(([key, value]) => {
              if (!value) return null

              return (
                <div key={key} className="bg-white/5 rounded-lg p-3">
                  <label className="text-xs text-slate-400 uppercase tracking-wide">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <p className="text-white mt-1 text-sm break-words">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </p>
                </div>
              )
            })}

            {currentFormData.title && !currentFormData.cover_image && (
              <button
                onClick={generateCoverImage}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Generate Cover Image
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
