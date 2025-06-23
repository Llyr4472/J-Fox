import React, { useState } from 'react';
import Header from './Components/Header';
import AnalysisForm from './Components/AnalysisForm';
import ResultsDisplay from './Components/ResultDisplay';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleStartAnalysis = (urlFromForm) => {
    console.log('Sniffing the URL:', urlFromForm);
    setIsLoading(true);
    setResults(null);

    // Simulate an API call or analysis process
    setTimeout(() => {
      setIsLoading(false);
      const didAnErrorOccur = Math.random() < 0.2; // Simulate a 20% chance of error

      if (didAnErrorOccur) {
        setError('An error occurred during analysis.');
        setResults(null);
      } else {
        setResults({
          url: urlFromForm,
          vulnerabilities: [
            { type: 'XSS', description: 'Cross-Site Scripting vulnerability detected.' },
            { type: 'CSRF', description: 'Cross-Site Request Forgery vulnerability detected.' },
          ],
          timestamp: new Date().toISOString(),
        });
        setError(null);
      }

    }, 2000);
  };
  
  const contentHasAppeared = results || error;

  const contentPositionClass = contentHasAppeared 
    ? '-translate-y-1/4' // Move UP
    : 'translate-y-0';   // Stay centered

  const resultsOpacityClass = contentHasAppeared
    ? 'opacity-100' // Fade IN
    : 'opacity-0';  // Stay faded out
    
  return (
  <div className="bg-brand-dark text-brand-text min-h-screen p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl">
      <div className={`transition-transform duration-800 ease-in-out ${contentPositionClass}`}>
          <Header />
          <AnalysisForm
            onAnalyze={handleStartAnalysis}
            isLoading={isLoading}
            />
        </div>
        <div className={`mt-6 transition-opacity duration-800 ease-in-out ${resultsOpacityClass}`}>
          <ResultsDisplay results={results} error={error} />
        </div>
      </div>
    </div>
  );
}

export default App;