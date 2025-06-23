import React, { useState } from 'react';

function AnalysisForm({ onAnalyze, isLoading }) {
    const [url, setUrl] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!url) {
            alert('Please enter a URL for the fox to sniff.');
            return;
        }

        onAnalyze(url);
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 w-full bg-brand-light p-2 rounded-xl border border-white/10 shadow-lg">
            <input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                className="flex-grow p-3 bg-transparent text-brand-text placeholder-brand-subtext focus:outline-none"
            />
            <button
                type="submit"
                disabled={isLoading}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Sniffing...' : 'Sniff'}
            </button>
        </form>
    );
}

export default AnalysisForm;