import React from 'react';
import { Send } from 'lucide-react';

const Footer = () => {
    return (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <div className="pointer-events-auto bg-white/10 dark:bg-gray-900/60 backdrop-blur-md border border-white/20 shadow-xl rounded-full px-4 sm:px-6 py-2 transform hover:scale-105 transition-transform duration-300 max-w-[90vw]">
                <p className="text-xs sm:text-sm font-semibold flex items-center justify-center gap-1">
                    <span className="text-gray-600 dark:text-gray-300 hidden sm:inline">Software Developed by </span>
                    <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent font-bold drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                        Liquid ARC Studio
                    </span>
                    <a href="mailto:liquidarc.studio@gmail.com" className="inline-flex items-center ml-1 sm:ml-2 hover:opacity-80 transition-opacity p-1">
                        <Send size={16} className="text-orange-500 animate-pulse drop-shadow-[0_0_5px_rgba(249,115,22,0.6)]" />
                        <span className="text-gray-500 dark:text-gray-400 text-xs hover:text-orange-500 transition-colors pointer-events-auto hidden sm:inline ml-1">
                            ( liquidarc.studio@gmail.com )
                        </span>
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Footer;
