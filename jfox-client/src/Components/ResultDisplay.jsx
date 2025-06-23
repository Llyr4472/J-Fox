import React from "react";

function ResultsDisplay({ results, error }) {
    const containerClasses = `
    mt-10 p-6 rounded-xl text-left border
    ${error ? 'bg-red-900/10 border-red-500/30' : 'bg-brand-light border-white/10'}
  `;

    // Handle errors
    if (error) {
        return (
            <div className={containerClasses}>
              <h3 className="font-bold text-red-400">An Error Occurred</h3>
              <p className="mt-2 text-red-400/80">{error}</p>
            </div>
          );
        }
    
        // Handle No results
    if (!results) {
        return null;
    }

    // Handle results
    return (
        <div className={containerClasses}>
          <h2 className="text-2xl font-bold text-brand-text border-b border-white/10 pb-3 mb-4">
            Analysis Results
          </h2>
          <pre className="bg-brand-dark p-4 rounded-lg text-sm text-brand-subtext whitespace-pre-wrap break-all">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      );
}

export default ResultsDisplay;