import { useState, useRef, useCallback, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

// Types for the Web Speech API (not fully typed in TypeScript)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

const SPEECH_LANGUAGE = 'zh-CN'

export interface UseVoiceRecognitionReturn {
  isSupported: boolean
  isListening: boolean
  error: string | null
  start: () => Promise<void>
  stop: () => Promise<string>
}

export function useVoiceRecognition(onInterim?: (text: string) => void): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const interimCallbackRef = useRef<((text: string) => void) | undefined>(onInterim)
  const resolveRef = useRef<((text: string) => void) | null>(null)
  const finalTextRef = useRef<string>('')

  interimCallbackRef.current = onInterim

  // Detect support: Web Speech API (web) or Capacitor native (iOS/Android)
  const isWeb = typeof window !== 'undefined' &&
    (typeof window.SpeechRecognition !== 'undefined' || typeof window.webkitSpeechRecognition !== 'undefined')
  const isNative = Capacitor.isNativePlatform()
  const isSupported = isWeb || isNative

  const startWeb = useCallback(async () => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      throw new Error('SpeechRecognition not supported')
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = SPEECH_LANGUAGE
    finalTextRef.current = ''

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (final) finalTextRef.current += final
      if (interimCallbackRef.current) {
        interimCallbackRef.current(finalTextRef.current + interim)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        return
      }
      setError(event.error === 'not-allowed' ? 'Microphone permission denied' : event.message || event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (resolveRef.current) {
        resolveRef.current(finalTextRef.current)
        resolveRef.current = null
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setError(null)
  }, [])

  const startNative = useCallback(async () => {
    try {
      const { SpeechRecognition } = await import('@capacitor-community/speech-recognition')

      if (Capacitor.getPlatform() === 'ios') {
        const { available } = await SpeechRecognition.available()
        if (!available) {
          throw new Error('Speech recognition not available')
        }
      }

      finalTextRef.current = ''

      await SpeechRecognition.start({
        language: SPEECH_LANGUAGE,
        maxResults: 1,
        partialResults: true,
      })

      SpeechRecognition.addListener('partialResults', (data: { value: string[] }) => {
        if (data.value && data.value.length > 0) {
          finalTextRef.current = data.value[0]
          if (interimCallbackRef.current) {
            interimCallbackRef.current(data.value[0])
          }
        }
      })

      setIsListening(true)
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Failed to start speech recognition')
      setIsListening(false)
    }
  }, [])

  const start = useCallback(async () => {
    if (isNative) {
      return startNative()
    }
    return startWeb()
  }, [isNative, startNative, startWeb])

  const stop = useCallback(async (): Promise<string> => {
    if (isNative) {
      try {
        const { SpeechRecognition } = await import('@capacitor-community/speech-recognition')
        await SpeechRecognition.stop()
        SpeechRecognition.removeAllListeners()
        setIsListening(false)
        return finalTextRef.current
      } catch (e: any) {
        setError(e.message || 'Failed to stop speech recognition')
        setIsListening(false)
        return finalTextRef.current
      }
    }

    return new Promise((resolve) => {
      resolveRef.current = resolve
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      } else {
        resolve(finalTextRef.current)
      }
    })
  }, [isNative])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  return { isSupported, isListening, error, start, stop }
}
