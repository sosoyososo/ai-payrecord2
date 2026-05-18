# Voice Input: Stop Recording on Parse

## Problem

On the Add Record page, if voice input is active (recording) and the user clicks the parse button (or presses Enter), the NLP parse executes while the microphone is still recording. The parse clears `aiInput` and fills form fields (amount, category, date, etc.), but the speech recognition continues running. If the user speaks again, new speech results overwrite the form data by re-populating `aiInput`.

## Root Cause

`handleAiParse` in `AddRecordPage.tsx` does not check or stop active voice recognition before executing the parse.

## Design

### Files Changed

1. **`frontend/src/components/VoiceInput.tsx`** — Expose imperative `stop()` via `forwardRef`
2. **`frontend/src/pages/AddRecordPage.tsx`** — Call `stop()` before parsing

### Implementation Detail

#### VoiceInput.tsx

- Wrap component with `forwardRef`
- Add `useImperativeHandle` exposing `{ stop, isListening }`
- Export `VoiceInputHandle` interface

#### AddRecordPage.tsx

- Create `voiceInputRef` with type `React.RefObject<VoiceInputHandle>`
- In `handleAiParse`, before the existing early return: if `voiceInputRef.current?.isListening`, `await voiceInputRef.current.stop()`
- Bind `ref={voiceInputRef}` on `<VoiceInput>`

### Behavior

- `stop()` calls `useVoiceRecognition.stop()` directly — stops recognition but does NOT trigger `onTranscript`, so `aiInput` is not re-populated
- Parse uses the current `aiInput` value (from interim results), preserving user's recognized text
- Covers both parse triggers: Sparkles button click and Enter key

### Risk

LOW. `stop()` is idempotent — calling it when not recording is a no-op. No API changes, no new dependencies.
