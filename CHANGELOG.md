# Changelog (recent frontend/backend edits)

Generated: 2026-08-13

- frontend/src/App.js
  - Added token validation on app load. Calls `GET /auth/me` and attempts `POST /auth/refresh` if the access token is invalid. Stores refreshed token in `localStorage`.

- frontend/src/components/AIMockInterview.js
  - Added `faceHistory` collection (timestamped faceDetected booleans) and `transcriptSegments` (text segments with timestamps).
  - Pushes transcript segments during speech recognition and records face-presence history during face-api checks.
  - Includes `faceHistory` and `transcriptSegments` when calling `POST /api/interview/generate-report`.

- frontend/src/components/InterviewReport.jsx
  - Renders quick speech metrics by calling `analyzeTranscriptSegments` when `transcriptSegments` present.
  - Renders basic non-verbal metrics by calling `computeFacePresence` and `computeLookingAwayRate` when `faceHistory` present.

- frontend/src/utils/SpeechAnalyzer.js
  - Exposes `analyzeTranscriptSegments(segments)` used by `InterviewReport` to summarize words, WPM, pauses, and filler words.

- frontend/src/utils/WebcamAnalyzer.js
  - Exposes `computeFacePresence`, `computeLookingAwayRate`, and `summarizeHeadMovement` helpers used by `InterviewReport`.

Notes/Next steps:
- Run `npm install` in both `backend/` and `frontend/` and start dev servers to validate end-to-end behaviors.
- Ensure environment variables are set (`JWT_SECRET`, mail settings, `REACT_APP_GOOGLE_CLIENT_ID`, Groq API keys).
- Consider adding server-side validation of the `faceHistory` and `transcriptSegments` payload sizes to avoid abuse.

If you want, I can run the installs and start the dev servers now and report back any errors.
