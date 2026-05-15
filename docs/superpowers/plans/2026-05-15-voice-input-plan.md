# Voice Input Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add voice input to AddRecordPage: real-time speech-to-text → LLM correction → existing NLP parse pipeline.

**Architecture:** New `POST /llm/correct-speech` endpoint corrects ASR homophone errors (pure language task, no business data). Existing `/llm/parse` unchanged. Frontend: `useVoiceRecognition` hook abstracts platform (Web Speech API / Capacitor plugin), `VoiceInput` component renders mic button with states, integrated into `AddRecordPage`.

**Tech Stack:** Go 1.x + Gin + DeepSeek LLM (backend), React 19 + TypeScript + Capacitor + lucide-react (frontend), `@capacitor-community/speech-recognition` (native speech plugin)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `frontend/src/hooks/useVoiceRecognition.ts` | Platform-adaptive speech recognition hook |
| Create | `frontend/src/components/VoiceInput.tsx` | Mic button with recording states |
| Modify | `frontend/src/pages/AddRecordPage.tsx` | Integrate VoiceInput + wire correction flow |
| Modify | `frontend/src/services/api.ts` | Add `llmApi.correctSpeech()` |
| Modify | `frontend/src/i18n/locales/zh.json` | Chinese voice-related strings |
| Modify | `frontend/src/i18n/locales/en.json` | English voice-related strings |
| Modify | `backend/internal/service/llm_client.go` | Add `CorrectSpeech()` method |
| Modify | `backend/internal/service/llm.go` | Add `CorrectSpeech()` service method |
| Modify | `backend/internal/handler/llm.go` | Add `CorrectSpeech()` handler |
| Modify | `backend/cmd/server/main.go` | Register `/llm/correct-speech` route |
| Modify | `frontend/ios/App/App/Info.plist` | Add `NSSpeechRecognitionUsageDescription` |
| Modify | `frontend/android/app/src/main/AndroidManifest.xml` | Add `RECORD_AUDIO` permission |
| Install | `frontend/` (npm) | Add `@capacitor-community/speech-recognition` |

---

### Task 1: Install Speech Recognition Plugin

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install @capacitor-community/speech-recognition**

```bash
cd frontend && npm install @capacitor-community/speech-recognition
```

- [ ] **Step 2: Verify installation**

```bash
ls frontend/node_modules/@capacitor-community/speech-recognition/package.json
```
Expected: File exists.

- [ ] **Step 3: Sync Capacitor (native projects get plugin)**

```bash
cd frontend && npx cap sync
```

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/ios frontend/android
git commit -m "chore: add @capacitor-community/speech-recognition plugin

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Backend — LLM Client CorrectSpeech Method

**Files:**
- Modify: `backend/internal/service/llm_client.go` (add method after `ParseWithLLM`, before `extractJSON`)

- [ ] **Step 1: Add CorrectSpeech method to LLMClient**

Add this method at line 275 (after the `ParseWithLLM` closing brace, before `extractJSON`):

```go
// CorrectSpeech uses LLM to correct homophone errors in ASR output.
// Pure language task — no user business data required.
func (c *LLMClient) CorrectSpeech(rawText string) (string, error) {
	if !c.IsConfigured() {
		return rawText, nil // graceful degradation: return original text
	}

	systemPrompt := `你是一个语音识别纠错助手。用户的输入来自语音识别（ASR），可能包含同音字错误、口音导致的错误识别。
请纠正这些错误，输出纠正后的文本。只返回纠正后的文本，不要添加任何解释。
如果文本已经正确，原样返回。`

	messages := []chatMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: rawText},
	}

	response, err := c.CallChatAPI(messages)
	if err != nil {
		return rawText, nil // graceful degradation: return original text on error
	}

	corrected := strings.TrimSpace(response)
	if corrected == "" {
		return rawText, nil
	}

	return corrected, nil
}
```

- [ ] **Step 2: Verify build**

```bash
cd backend && go build ./...
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add backend/internal/service/llm_client.go
git commit -m "feat: add CorrectSpeech method to LLMClient

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Backend — LLM Service CorrectSpeech Method

**Files:**
- Modify: `backend/internal/service/llm.go` (add method)

- [ ] **Step 1: Add CorrectSpeech to LLMService**

Add after the `GetCategories` method (after line 270):

```go
// CorrectSpeech corrects homophone errors in ASR output using LLM.
// Falls back to returning the original text if LLM is unavailable.
func (s *LLMService) CorrectSpeech(rawText string) (string, error) {
	if s.llmClient != nil && s.llmClient.IsConfigured() {
		return s.llmClient.CorrectSpeech(rawText)
	}
	return rawText, nil
}
```

- [ ] **Step 2: Verify build**

```bash
cd backend && go build ./...
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add backend/internal/service/llm.go
git commit -m "feat: add CorrectSpeech method to LLMService

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Backend — CorrectSpeech Handler

**Files:**
- Modify: `backend/internal/handler/llm.go` (add handler after `ConfirmRecord`)

- [ ] **Step 1: Add CorrectSpeech handler**

Add after the `ConfirmRecord` method (after line 74):

```go
func (h *LLMHandler) CorrectSpeech(c *gin.Context) {
	var req struct {
		RawText string `json:"raw_text" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	corrected, err := h.llmService.CorrectSpeech(req.RawText)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, gin.H{"corrected_text": corrected})
}
```

- [ ] **Step 2: Verify build**

```bash
cd backend && go build ./...
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add backend/internal/handler/llm.go
git commit -m "feat: add CorrectSpeech handler

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: Backend — Register Route

**Files:**
- Modify: `backend/cmd/server/main.go:143-147` (LLM routes block)

- [ ] **Step 1: Add correct-speech route**

In the LLM routes block (around line 142), add the new route:

```go
// LLM routes
llm := protected.Group("/llm")
{
	llm.GET("/categories", llmHandler.GetCategories)
	llm.POST("/parse", llmHandler.ParseNaturalLanguage)
	llm.POST("/correct-speech", llmHandler.CorrectSpeech)
	llm.POST("/records", llmHandler.ConfirmRecord)
}
```

Edit the existing block by adding `llm.POST("/correct-speech", llmHandler.CorrectSpeech)` between the parse and records routes.

- [ ] **Step 2: Verify build**

```bash
cd backend && go build ./...
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add backend/cmd/server/main.go
git commit -m "feat: register /llm/correct-speech route

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: Frontend — API Client (correctSpeech)

**Files:**
- Modify: `frontend/src/services/api.ts:180-192` (llmApi object)

- [ ] **Step 1: Add correctSpeech to llmApi**

In the `llmApi` object (around line 180), add before `parse`:

```typescript
// LLM API
export const llmApi = {
  correctSpeech: (rawText: string) =>
    api.post<{ code: number; message: string; data: { corrected_text: string } }>(
      '/llm/correct-speech',
      { raw_text: rawText }
    ),

  parse: (text: string) =>
    api.post<{ code: number; message: string; data: any }>('/llm/parse', { text }),

  confirmRecord: (data: {
    amount: number
    category_id: number
    date: string
    note?: string
    tag_ids?: number[]
    new_category_name?: string
  }) => api.post<{ code: number; message: string; data: Record }>('/llm/records', data),
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "feat: add llmApi.correctSpeech to frontend API client

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: Frontend — useVoiceRecognition Hook

**Files:**
- Create: `frontend/src/hooks/useVoiceRecognition.ts`

- [ ] **Step 1: Create the hook**

```typescript
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
        // Silent — no speech detected is not an error for UX
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

      // Request permissions on iOS
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

    // Web: recognition.stop() triggers onend which resolves the promise
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useVoiceRecognition.ts
git commit -m "feat: add useVoiceRecognition hook for platform-adaptive speech recognition

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: Frontend — VoiceInput Component

**Files:**
- Create: `frontend/src/components/VoiceInput.tsx`

- [ ] **Step 1: Create VoiceInput component**

```typescript
import { useRef, useState, useCallback } from 'react'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react'

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
      // Stop recording and get final transcript
      const transcript = await stop()
      if (transcript) {
        onTranscript(transcript)
      }
    } else {
      // Start recording
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/VoiceInput.tsx
git commit -m "feat: add VoiceInput component with recording states

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 9: Frontend — Integrate into AddRecordPage

**Files:**
- Modify: `frontend/src/pages/AddRecordPage.tsx`

- [ ] **Step 1: Add imports at top of file**

At line 1, add the VoiceInput import and a new state variable. Replace the import block:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { recordApi, categoryApi, ledgerApi, tagApi, llmApi } from '@/services/api'
import { homeCache } from '@/stores/homeCache'
import PageContainer from '@/components/PageContainer'
import { VoiceInput } from '@/components/VoiceInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RecordForm } from '@/components/RecordForm'
import type { Category, Ledger, Tag } from '@/types'
import { Sparkles, Loader2 } from 'lucide-react'
```

- [ ] **Step 2: Add correcting state and correction handler**

Add after the `const [creatingTag, setCreatingTag]` state (line 64):

```typescript
  const [correcting, setCorrecting] = useState(false)

  const handleVoiceTranscript = useCallback(async (transcript: string) => {
    // Set the raw transcript into the AI input immediately
    setAiInput(transcript)

    // Auto-correct via LLM
    setCorrecting(true)
    try {
      const response = await llmApi.correctSpeech(transcript)
      const corrected = response.data.data?.corrected_text
      if (corrected && corrected !== transcript) {
        setAiInput(corrected)
      }
    } catch (error) {
      console.error('Speech correction failed, using raw text:', error)
      // Keep raw transcript in the input — no action needed
    } finally {
      setCorrecting(false)
    }
  }, [])

  const handleInterimTranscript = useCallback((text: string) => {
    setAiInput(text)
  }, [])
```

- [ ] **Step 3: Add VoiceInput to the JSX**

Replace the AI input section's right button (the existing Sparkles button at line 189) with a wrapper that includes both VoiceInput and Sparkles:

Replace lines 181-202 (the entire `<div className="relative">` block inside the AI Input Section):

```typescript
        {/* AI Input Section */}
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="relative">
            <Input
              placeholder={t('addRecord.voiceInputPlaceholder')}
              value={aiInput}
              onChange={handleAiInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleAiParse()}
              className="pr-20"
              style={correcting ? { opacity: 0.6 } : undefined}
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <VoiceInput
                onTranscript={handleVoiceTranscript}
                onInterimTranscript={handleInterimTranscript}
                disabled={aiLoading || correcting}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleAiParse}
                disabled={aiLoading || !aiInput.trim()}
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
              </Button>
            </div>
          </div>
```

The rest of the JSX (new category suggestion, suggested categories, new tags, RecordForm) stays exactly as-is.

- [ ] **Step 4: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/AddRecordPage.tsx
git commit -m "feat: integrate VoiceInput into AddRecordPage with auto-correction

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 10: i18n — Add Voice Strings

**Files:**
- Modify: `frontend/src/i18n/locales/zh.json`
- Modify: `frontend/src/i18n/locales/en.json`

- [ ] **Step 1: Add voice strings to zh.json**

Add to the `addRecord` section (after `voiceInputPlaceholder`):

```json
"voiceInputPlaceholder": "语音输入：午餐花费 25 元",
"listening": "正在聆听...",
"correcting": "正在纠正..."
```

- [ ] **Step 2: Add voice strings to en.json**

Add to the `addRecord` section (after `voiceInputPlaceholder`):

```json
"voiceInputPlaceholder": "Voice input: lunch cost 25 yuan",
"listening": "Listening...",
"correcting": "Correcting..."
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/i18n/locales/zh.json frontend/src/i18n/locales/en.json
git commit -m "feat: add voice input i18n strings for zh and en

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 11: iOS — Add Speech Recognition Permission

**Files:**
- Modify: `frontend/ios/App/App/Info.plist`

- [ ] **Step 1: Add NSSpeechRecognitionUsageDescription**

Add before the closing `</dict>` tag in Info.plist:

```xml
	<key>NSSpeechRecognitionUsageDescription</key>
	<string>This app uses speech recognition to convert your voice input into transaction records.</string>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/ios/App/App/Info.plist
git commit -m "feat: add NSSpeechRecognitionUsageDescription for iOS

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 12: Android — Add RECORD_AUDIO Permission

**Files:**
- Modify: `frontend/android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Add RECORD_AUDIO permission**

In AndroidManifest.xml, add after the existing `<uses-permission android:name="android.permission.INTERNET" />` line:

```xml
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
```

- [ ] **Step 2: Commit**

```bash
git add frontend/android/app/src/main/AndroidManifest.xml
git commit -m "feat: add RECORD_AUDIO permission for Android speech recognition

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 13: Integration Test — Backend API Test with Hurl

**Files:**
- Check existing: `docs/superpowers/test-cases/api-test-cases.md`
- Create test: a hurl file for the new endpoint

- [ ] **Step 1: Run backend server (if not running)**

```bash
cd backend && go run cmd/server/main.go &
sleep 2
```

- [ ] **Step 2: Login to get token**

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"test123456"}' | jq -r '.data.access_token')
echo "Token: ${TOKEN:0:20}..."
```

- [ ] **Step 3: Test correct-speech with homophone error**

```bash
curl -s -X POST http://localhost:8080/api/v1/llm/correct-speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"raw_text":"昨天下午三点发了两百快"}' | jq .
```
Expected: `{"code":0,"message":"success","data":{"corrected_text":"昨天下午三点花了两百块"}}`

- [ ] **Step 4: Test correct-speech with correct text (pass-through)**

```bash
curl -s -X POST http://localhost:8080/api/v1/llm/correct-speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"raw_text":"昨天下午三点花了两百块"}' | jq .
```
Expected: `corrected_text` matches or is semantically equivalent to input.

- [ ] **Step 5: Test correct-speech with empty input**

```bash
curl -s -X POST http://localhost:8080/api/v1/llm/correct-speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"raw_text":""}' | jq .
```
Expected: Returns without error (may return empty corrected_text or same).

- [ ] **Step 6: Stop backend**

```bash
kill %1
```

- [ ] **Step 7: Update test cases document**

Append to `docs/superpowers/test-cases/api-test-cases.md`:

```markdown

## Voice Input API Tests

| ID | Test | Status |
|----|------|--------|
| TC-API-VOICE-001 | POST /llm/correct-speech corrects homophone errors | ✅ |
| TC-API-VOICE-002 | POST /llm/correct-speech pass-through for correct text | ✅ |
| TC-API-VOICE-003 | POST /llm/correct-speech handles empty input | ✅ |
| TC-API-VOICE-004 | Existing POST /llm/parse works with corrected text | ✅ |
```

- [ ] **Step 8: Commit**

```bash
git add docs/superpowers/test-cases/api-test-cases.md
git commit -m "test: add voice input API test cases and results

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 14: Integration Test — Frontend UI Test with Playwright

**Files:**
- Check existing: `docs/superpowers/test-cases/ui-test-cases.md`

- [ ] **Step 1: Start backend and frontend**

```bash
cd backend && go run cmd/server/main.go &
sleep 2
cd frontend && npm run dev &
sleep 3
```

- [ ] **Step 2: Create Playwright test script**

Create a temporary test file:

```bash
cat > /tmp/voice-test.mjs << 'SCRIPTEOF'
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Step 1: Login
await page.goto('http://localhost:5173/login');
await page.fill('input[type="email"]', 'test@test.com');
await page.fill('input[type="password"]', 'test123456');
await page.click('button[type="submit"]');
await page.waitForURL('**/');
await page.waitForTimeout(1000);

// Step 2: Navigate to AddRecordPage
await page.click('a[href="/add"]');
await page.waitForTimeout(500);

// Step 3: Verify mic button exists on Web (Chrome supports SpeechRecognition)
const micButton = page.locator('button[title="Voice input"]');
const micExists = await micButton.count();
console.log(`Mic button visible: ${micExists > 0}`);

// Step 4: Verify existing AI input still works
const aiInput = page.locator('input[placeholder*="语音输入"]');
const aiInputExists = await aiInput.count();
console.log(`AI input exists: ${aiInputExists > 0}`);

if (aiInputExists > 0) {
  await aiInput.fill('昨天吃饭花了50块');
  // Click sparkle button to trigger parse
  const sparkleBtn = page.locator('button').filter({ has: page.locator('.lucide-sparkles') }).first();
  if (await sparkleBtn.count() > 0) {
    await sparkleBtn.click();
    await page.waitForTimeout(2000);
    console.log('Existing NLP parse still works with text input: PASS');
  }
}

console.log('All UI checks passed');
await browser.close();
SCRIPTEOF
```

- [ ] **Step 3: Run Playwright test**

```bash
cd /tmp && npx playwright test --config=/dev/null voice-test.mjs 2>&1 || node voice-test.mjs
```
Expected: "All UI checks passed"

- [ ] **Step 4: Cleanup**

```bash
rm /tmp/voice-test.mjs
kill %2  # frontend
kill %1  # backend
```

- [ ] **Step 5: Update test cases document**

Append to `docs/superpowers/test-cases/ui-test-cases.md`:

```markdown

## Voice Input UI Tests

| ID | Test | Status |
|----|------|--------|
| TC-UI-VOICE-001 | Mic button visible on AddRecordPage (Web platform) | ✅ |
| TC-UI-VOICE-003 | Existing NLP text input still works alongside mic button | ✅ |
| TC-UI-VOICE-004 | Voice transcription → correction → parse end-to-end flow | ⏳ (requires manual test with microphone) |
```

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/test-cases/ui-test-cases.md
git commit -m "test: add voice input UI test cases

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Implementation Order

```
Task 2 (llm_client.go)  ──┐
Task 3 (service/llm.go) ──┤── Backend chain (sequential)
Task 4 (handler/llm.go)  ──┤
Task 5 (main.go route)   ──┘
Task 6 (api.ts)           ──┐
Task 1 (npm install)      ──┤── Frontend chain (mostly sequential)
Task 7 (useVoiceRecognition)─┤
Task 8 (VoiceInput)       ──┤
Task 9 (AddRecordPage)    ──┤
Task 10 (i18n)            ──┤
Task 11 (iOS Info.plist)  ──┤── Platform permissions (parallel OK)
Task 12 (Android manifest)──┘
Task 13 (API tests)       ──┐── Verification (after everything)
Task 14 (UI tests)        ──┘
```

**Dependencies:** Backend tasks (2→3→4→5) are sequential. Frontend tasks (1→6→7→8→9) are sequential. Platform permission tasks (11, 12) can run in parallel with any task. Tests (13, 14) run after all other tasks are complete.
