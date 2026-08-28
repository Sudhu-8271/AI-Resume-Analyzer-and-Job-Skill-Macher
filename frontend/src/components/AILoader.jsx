import React from "react";

function AILoader() {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-purple-400">

      {/* Spinner */}
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>

      {/* Text */}
      <h2 className="text-xl font-semibold mb-2">
        🤖 AI Analyzing Resume...
      </h2>

      <p className="text-purple-300 animate-pulse">
        Extracting Skills & Matching Job Requirements
      </p>

    </div>
  );
}

export default AILoader;