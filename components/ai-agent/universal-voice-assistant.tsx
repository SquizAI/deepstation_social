'use client'

import { useState, useRef, useCallback } from 'react'

interface UniversalVoiceAssistantProps {
  onFormUpdate: (data: any) => void
  formType: 'event' | 'post' | 'speaker' | 'generic'
  placeholder?: string
}

export function UniversalVoiceAssistant({
  onFormUpdate,
  formType = 'generic',
  placeholder = 'Describe what you want to create...'
}: UniversalVoiceAssistantProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [audioLevel, setAudioLevel] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()

  const startRecording = async () => {
    try {
      // Show initial greeting on first interaction
      if (conversation.length === 0) {
        setAiResponse("What's the event called?")
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Set up audio visualization
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Visualize audio levels
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
      alert('Microphone access denied. Please allow microphone access and try again.')
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
      // Step 1: Transcribe with Deepgram
      const formData = new FormData()
      formData.append('audio', audioBlob)

      const transcribeResponse = await fetch('/api/ai-agent/transcribe', {
        method: 'POST',
        body: formData,
      })

      const { transcript: text } = await transcribeResponse.json()
      setTranscript(text)

      // Step 2: Process with Claude
      const updatedConversation = [...conversation, { role: 'user' as const, content: text }]
      setConversation(updatedConversation)

      const aiResponse = await fetch('/api/ai-agent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: updatedConversation,
          formType,
        }),
      })

      const { response, formData: extractedData } = await aiResponse.json()

      setAiResponse(response)
      setConversation([...updatedConversation, { role: 'assistant', content: response }])

      // Step 3: Update form
      if (extractedData) {
        onFormUpdate(extractedData)
      }

    } catch (error) {
      console.error('Error processing audio:', error)
      setAiResponse('Sorry, I encountered an error. Please try again.')
    } finally {
      setIsProcessing(false)
      setTranscript('')
    }
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      {/* Conversation bubble */}
      {aiResponse && !isRecording && (
        <div className="max-w-sm bg-gradient-to-r from-fuchsia-500/90 to-purple-600/90 backdrop-blur-xl text-white rounded-2xl p-4 shadow-2xl shadow-fuchsia-500/50 animate-in slide-in-from-bottom-4">
          <p className="text-sm">{aiResponse}</p>
        </div>
      )}

      {/* Recording indicator */}
      {transcript && isRecording && (
        <div className="max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl p-4">
          <p className="text-xs text-slate-300 mb-1">You're saying:</p>
          <p className="text-sm italic">"{transcript}"</p>
        </div>
      )}

      {/* Main button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className="relative group"
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
          isRecording
            ? 'bg-red-500 opacity-75 blur-xl animate-pulse'
            : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 opacity-75 blur-xl group-hover:opacity-100'
        }`}></div>

        {/* Audio visualization rings */}
        {isRecording && (
          <>
            <div
              className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping"
              style={{ opacity: audioLevel }}
            ></div>
            <div
              className="absolute inset-2 rounded-full border-2 border-red-300"
              style={{ opacity: audioLevel * 0.7, transform: `scale(${1 + audioLevel * 0.2})` }}
            ></div>
          </>
        )}

        {/* Main button */}
        <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          isRecording
            ? 'bg-red-500 shadow-red-500/50'
            : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-fuchsia-500/50 group-hover:scale-110'
        }`}>
          {isProcessing ? (
            <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isRecording ? (
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2"></rect>
            </svg>
          ) : (
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </div>

        {/* Status text */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-white font-medium">
          {isProcessing ? 'Processing...' : isRecording ? 'Tap to stop' : 'Tap to speak'}
        </div>
      </button>

      {/* Instructions (show on first load) */}
      {conversation.length === 0 && !isRecording && (
        <div className="absolute bottom-32 right-0 bg-black/90 backdrop-blur-sm text-white text-sm rounded-xl p-4 max-w-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <p className="font-semibold mb-2">Voice Assistant</p>
          <ul className="text-xs space-y-1 text-slate-300">
            <li>• Tap to start speaking</li>
            <li>• Describe what you want to create</li>
            <li>• Form fills automatically</li>
            <li>• I can research info for you</li>
          </ul>
        </div>
      )}
    </div>
  )
}
