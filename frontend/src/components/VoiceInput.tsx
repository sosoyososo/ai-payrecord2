import { useCallback, useState } from 'react'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { Button } from '@/components/ui/button'
import { Mic, Loader2, AlertCircle } from 'lucide-react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onInterimTranscript?: (text: string) => void
  disabled?: boolean
}

export function VoiceInput({ onTranscript, onInterimTranscript, disabled }: VoiceInputProps) {
  const [correcting, setCorrecting] = useState(false)

  const handleInterim = useCallback((text: string) => {
    onInterimTranscript?.(text)
  }, [onInterimTranscript])

  const { isSupported, isListening, error, start, stop } = useVoiceRecognition(handleInterim)

  const handleClick = useCallback(async () => {
    if (isListening) {
      const transcript = await stop()
      if (transcript) {
        onTranscript(transcript)
      }
    } else {
      try {
        await start()
      } catch (e) {
        console.error('Failed to start recording:', e)
      }
    }
  }, [isListening, start, stop, onTranscript])

  if (!isSupported) return null

  if (error) {
    return (
      <Button
        size="icon"
        variant="ghost"
        className="relative"
        onClick={() => handleClick()}
        title={error}
        disabled={disabled}
      >
        <AlertCircle className="h-4 w-4 text-destructive" />
      </Button>
    )
  }

  if (isListening) {
    return (
      <Button
        size="icon"
        variant="ghost"
        className="relative animate-pulse"
        onClick={handleClick}
        disabled={disabled}
        title="Stop recording"
      >
        <Mic className="h-4 w-4 text-red-500" />
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />
      </Button>
    )
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleClick}
      disabled={disabled || correcting}
      title="Voice input"
    >
      {correcting ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Mic className="h-4 w-4 text-primary" />
      )}
    </Button>
  )
}
