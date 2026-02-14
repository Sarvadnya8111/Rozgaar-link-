
import React from 'react';
import { Volume2 } from 'lucide-react';

export const VoiceBtn = ({ text, label }: { text?: string, label?: string }) => {
    if (!text) return null;
    
    const play = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; // Slightly slower for clarity
        window.speechSynthesis.speak(u);
    };

    return (
        <button 
            type="button"
            onClick={play} 
            className="p-2 bg-lime-400/20 hover:bg-lime-400/40 rounded-full text-lime-400 transition-colors inline-flex items-center justify-center ml-2"
            title="Play Audio"
            aria-label={`Play audio for ${label || 'text'}`}
        >
            <Volume2 className="h-4 w-4" />
        </button>
    );
};
