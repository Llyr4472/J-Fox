import React from 'react';

function Header() {
    return (
        <header className="mb-12 text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold">
        J-Fox <span className="text-brand-orange inline-block transform hover:scale-110 transition-transform duration-300">🦊</span>
            </h1>
            <p className="mt-4 text-lg text-brand-subtext">
        The clever fox that sniffs out vulnerabilities in your JavaScript.
            </p>
        </header>
    );
}

export default Header;