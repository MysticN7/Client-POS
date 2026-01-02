import React from 'react';
import { Send, MessageCircle } from 'lucide-react';

const Footer = () => {
    return (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <div className="pointer-events-auto bg-white/10 dark:bg-gray-900/60 backdrop-blur-md border border-white/20 shadow-xl rounded-full px-4 sm:px-6 py-2 transform hover:scale-105 transition-transform duration-300 max-w-[95vw]">
                <p className="text-xs sm:text-sm font-semibold flex flex-wrap items-center justify-center gap-1 text-center">
                    <span className="text-gray-600 dark:text-gray-300">Software Developed by </span>
                    <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent font-bold drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                        Liquid ARC Studio
                    </span>

                    <div className="flex items-center gap-2 ml-1">
                        {/* Email Link */}
                        <a href="mailto:liquidarc.studio@gmail.com" title="Email Us" className="inline-flex items-center hover:opacity-80 transition-opacity p-1 bg-white/20 rounded-full">
                            <Send size={14} className="text-orange-500 animate-pulse drop-shadow-[0_0_5px_rgba(249,115,22,0.6)]" />
                        </a>

                        {/* WhatsApp/Chat Link - The "Extra" for mobile */}
                        <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp" className="inline-flex items-center hover:opacity-80 transition-opacity p-1 bg-green-500/20 rounded-full sm:hidden">
                            <MessageCircle size={14} className="text-green-500 animate-bounce drop-shadow-[0_0_5px_rgba(34,197,94,0.6)]" />
                        </a>

                        <span className="text-gray-500 dark:text-gray-400 text-xs hover:text-orange-500 transition-colors pointer-events-auto hidden sm:inline">
                            ( liquidarc.studio@gmail.com )
                        </span>
                    </div>
                </p>
            </div>
        </div>
    );
};

export default Footer;
