import React from 'react';

export default function ConsentModal({ open, onAccept, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-slate-900 p-6 rounded-lg w-11/12 max-w-xl border border-slate-700">
        <h3 className="text-lg font-semibold mb-3">Camera & Microphone Consent</h3>
        <p className="text-sm text-gray-300 mb-4">This interview requires access to your camera and microphone to analyze non-verbal cues and transcribe your spoken answers. We will not store raw audio or video without your explicit consent. You can stop the interview at any time.</p>
        <ul className="text-sm text-gray-400 mb-4 list-disc pl-5 space-y-1">
          <li>Permissions are requested by your browser and can be revoked at any time.</li>
          <li>Only analysis metadata (transcripts, metrics) may be stored for the report.</li>
          <li>No personal data is shared without your consent.</li>
        </ul>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-slate-700">Cancel</button>
          <button onClick={onAccept} className="px-4 py-2 rounded bg-purple-600">I Consent, Start Interview</button>
        </div>
      </div>
    </div>
  );
}
