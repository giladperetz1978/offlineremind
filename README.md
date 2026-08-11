# OfflineRemind

Offline-first personal workspace for local transcription, reminders and device navigation.

## Current scope

- Local reminders stored in browser `localStorage`.
- Local destination list stored in browser `localStorage`.
- Recording sent only to the local Moonshine STT bridge at `http://127.0.0.1:3000/api/stt`.
- No Google login, cloud database or cloud sync.
- Waze opens only after an explicit user action and requires Waze/network access.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

The GitHub Pages workflow builds the app and publishes `dist/` on pushes to `main`.

## Local transcription bridge

The UI sends JSON containing `audio_base64` and `language` to the local STT endpoint. The audio is converted in the browser to raw Float32 samples at 16 kHz, which matches the current `gemma-translator/backend/server.py` contract.

Run the local Python service from the Gemma Translator project when you want transcription. GitHub Pages hosts only the static UI; it does not run the STT model.
