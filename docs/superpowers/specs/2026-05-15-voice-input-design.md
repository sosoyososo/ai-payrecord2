# Voice Input Feature Design

## Overview

Add voice input capability to the existing natural language record creation flow. Users speak a description, the speech is transcribed in real-time, ASR errors get corrected by LLM, then the corrected text flows through the existing `/llm/parse` pipeline.

**Platforms**: Web, iOS, Android (via Capacitor)

---

## API Design

### Principle: Split concerns

Speech correction and NLP parsing are two independent capabilities. Correction is a pure language task (no business data dependency). Parsing is a domain task (needs user categories, tags, date context). They should be separate endpoints, independently testable, independently evolvable.

### `POST /api/v1/llm/correct-speech` (NEW)

Purpose: Correct homophone errors and colloquialisms in ASR output. Pure language model task — no user business data required.

Request:
```json
{
  "raw_text": "昨天下午三点发了两百快"
}
```

Response:
```json
{
  "corrected_text": "昨天下午三点花了两百块"
}
```

Backend implementation:
- `LLMClient.CorrectSpeech(rawText string) (string, error)` — simple system prompt: "You are a speech corrector. Fix homophone errors and colloquialisms in Chinese speech recognition output. Return only corrected text."
- No category/tag/date context needed — this is language-only
- Falls back to returning the original text if LLM unavailable (graceful degradation)

### `POST /api/v1/llm/parse` (EXISTING, unchanged)

Parses clean natural language text into structured record data. No changes needed.

---

## Frontend Flow

```
1. User taps mic button → VoiceInput activates
2. Platform speech recognition starts → real-time transcription visible in AI input field
3. User speaks description ("昨天下午三点发了两百快")
4. User taps stop (or silence timeout) → recording ends
5. Auto-call POST /llm/correct-speech with raw ASR text
6. AI input field updated with corrected text ("昨天下午三点花了两百块")
7. User can manually edit the corrected text (optional)
8. User presses Enter / clicks sparkle → existing /llm/parse flow
9. Form filled → user confirms → save (existing flow)
```

User has two edit points:
- After correction (step 7): fix LLM correction mistakes
- After parse (step 9): adjust structured fields

---

## Component Architecture

### New Files

| File | Purpose |
|------|---------|
| `frontend/src/components/VoiceInput.tsx` | Mic button + recording state indicator |
| `frontend/src/hooks/useVoiceRecognition.ts` | Platform-adaptive speech recognition hook |

### VoiceInput Component

Props:
- `onTranscript: (text: string) => void` — called with final transcript when recording stops
- `onInterimTranscript?: (text: string) => void` — real-time partial results
- `disabled?: boolean`

States:
- `idle` — mic icon, ready
- `listening` — pulsing red mic, "Listening..." text
- `error` — error state with retry
- `unsupported` — hidden (platform doesn't support speech recognition)

### useVoiceRecognition Hook

Platform detection and unified interface:

```typescript
interface UseVoiceRecognition {
  isSupported: boolean
  isListening: boolean
  error: string | null
  start: () => Promise<void>
  stop: () => Promise<string>  // returns final transcript
  onInterim: (callback: (text: string) => void) => void
}
```

Implementation strategy:
1. **Web**: `window.SpeechRecognition` / `webkitSpeechRecognition` API (Chrome, Edge, Safari 14.5+)
2. **iOS/Android**: `@capacitor-community/speech-recognition` plugin (wraps `SFSpeechRecognizer` / Android `SpeechRecognizer`)
3. **Capacitor runtime detection**: `Capacitor.isNativePlatform()` to decide which engine to use

### Modified Files

| File | Changes |
|------|---------|
| `frontend/src/pages/AddRecordPage.tsx` | Add VoiceInput next to AI input, wire correction flow |
| `frontend/src/services/api.ts` | Add `llmApi.correctSpeech(rawText)` |
| `backend/internal/service/llm_client.go` | Add `CorrectSpeech()` method |
| `backend/internal/service/llm.go` | Add `CorrectSpeech()` service method |
| `backend/internal/handler/llm.go` | Add `CorrectSpeech()` handler |
| `backend/cmd/server/main.go` | Register `POST /llm/correct-speech` route |

---

## LLM Prompt Design: correct-speech

System prompt (minimal, language-only):

```
你是一个语音识别纠错助手。用户的输入来自语音识别（ASR），可能包含同音字错误、口音导致的错误识别。
请纠正这些错误，输出纠正后的文本。只返回纠正后的文本，不要添加任何解释。
如果文本已经正确，原样返回。
```

No user data, no examples needed — DeepSeek handles this with a simple instruction.

---

## Capacitor Plugin: @capacitor-community/speech-recognition

Package: `@capacitor-community/speech-recognition`

### Platform Support

| Platform | Engine | Notes |
|----------|--------|-------|
| iOS | `SFSpeechRecognizer` | Requires `NSSpeechRecognitionUsageDescription` in Info.plist |
| Android | `SpeechRecognizer` | Requires `RECORD_AUDIO` permission |
| Web | `SpeechRecognition` API | Fallback — but in `useVoiceRecognition` we handle Web directly |

### Permissions Required

- **iOS**: `NSSpeechRecognitionUsageDescription` — "This app uses speech recognition to convert your voice input into transaction records."
- **Android**: `RECORD_AUDIO` + `INTERNET` — declared in AndroidManifest.xml via plugin

### Plugin Usage (Capacitor native path only)

```typescript
import { SpeechRecognition } from '@capacitor-community/speech-recognition'

// Check availability
const { available } = await SpeechRecognition.available()

// Start listening
await SpeechRecognition.start({
  language: 'zh-CN',
  maxResults: 1,
  partialResults: true,  // enables real-time transcription
})

// Partial results callback
SpeechRecognition.addListener('partialResults', (data) => {
  onInterim(data.value)
})
```

### Language Configuration

- Default: `zh-CN` (matching the app's primary user base)
- Future: respect `i18n.language` for multi-language support
- Configurable via constant in `useVoiceRecognition.ts`

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Speech recognition not supported | Hide mic button, no-op |
| Microphone permission denied | Show error toast, suggest settings |
| Speech recognition error (no speech detected, etc.) | Show error state on mic button, retry on tap |
| LLM correct-speech fails | Use raw ASR text as-is, proceed to parse |
| LLM parse fails | Same behavior as existing text-based flow |
| Network timeout during correction | Use raw ASR text, proceed |

Key principle: degradation, not blocking. Voice → ASR → correction → parse is a chain where each link can fall through gracefully.

---

## User-Facing States

### VoiceInput Button

| State | Visual |
|-------|--------|
| idle | Mic icon, primary color |
| listening | Mic icon, pulsing red animation + "Listening..." below |
| processing (correcting) | Spinner on mic button |
| error | Mic icon with exclamation, tap to retry |
| unsupported | Not rendered |

### AI Input Field Integration

- During listening: shows real-time interim text, dimmed style (to indicate it's provisional)
- After recording stops: text normalized, brief "Correcting..." indicator
- After correction: text finalized, ready for user editing
- After parse: existing flow unchanged (Sparkles button, form fill, new category/tag prompts)

---

## Testing

### API Tests (hurl)

| ID | Test |
|----|------|
| TC-API-VOICE-001 | `POST /llm/correct-speech` — corrects common homophone errors |
| TC-API-VOICE-002 | `POST /llm/correct-speech` — returns original text when already correct |
| TC-API-VOICE-003 | `POST /llm/correct-speech` — handles empty/malformed input |
| TC-API-VOICE-004 | Existing `/llm/parse` still works with text from correct-speech |

### UI Tests (Playwright)

| ID | Test |
|----|------|
| TC-UI-VOICE-001 | Mic button visible on AddRecordPage (Web platform, SpeechRecognition supported) |
| TC-UI-VOICE-002 | Mic button hidden when SpeechRecognition not supported |
| TC-UI-VOICE-003 | Tapping mic starts listening state |
| TC-UI-VOICE-004 | End-to-end: voice input → text appears in field → correct-speech called → parse → form filled |

---

## Non-Goals (Out of Scope)

- Offline speech recognition
- Multi-language switching (hardcoded `zh-CN` for now)
- Voice input on other pages (only AddRecordPage)
- Custom Capacitor plugin development (using community plugin)
- Streaming LLM correction (whole-text correction only)
- Background listening / wake word detection

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `@capacitor-community/speech-recognition` maintenance | Plugin is popular (GitHub stars), stable API. Fallback to Web API on all platforms if needed. |
| Android WebView inconsistent SpeechRecognition support | Use Capacitor native plugin on Android, not WebView API |
| iOS SFSpeechRecognizer requires internet | Acceptable — the app already requires network for LLM calls |
| Correction changes meaning (over-correction) | User can edit corrected text before parse, or re-parse |
