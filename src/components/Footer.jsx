import React, { useState, useEffect } from 'react';
import { Send, Heart } from 'lucide-react';
import ReactConfetti from 'react-confetti';

const Footer = () => {
    const [loved, setLoved] = useState(false);
    const [recycle, setRecycle] = useState(false);
    const [windowDimension, setWindowDimension] = useState({ width: window.innerWidth, height: window.innerHeight });

    const detectSize = () => {
        setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
    }

    useEffect(() => {
        window.addEventListener('resize', detectSize);
        return () => {
            window.removeEventListener('resize', detectSize);
        }
    }, [windowDimension]);

    const handleLoveClick = () => {
        if (!loved) {
            setLoved(true);
            setRecycle(true);
            // Stop generating new confetti after 3 seconds
            setTimeout(() => {
                setRecycle(false);
            }, 3000);
        } else {
            // Allow re-triggering love or just toggling off immediately
            setLoved(false);
            setRecycle(false);
        }
    };

    return (
        <>
            {loved && (
                <div className="fixed inset-0 z-[99] pointer-events-none">
                    <ReactConfetti
                        width={windowDimension.width}
                        height={windowDimension.height}
                        recycle={recycle}
                        numberOfPieces={300}
                        gravity={0.25} // Faster fall per user request
                        colors={[
                            '#EC4899', // Pink
                            '#8B5CF6', // Purple
                            '#F97316', // Orange
                            '#8B4513', // Brown
                            '#3B82F6'  // Blue
                        ]}
                        onConfettiComplete={(confetti) => {
                            if (!recycle) {
                                confetti.reset();
                                setLoved(false); // Reset heart state when all confetti is gone
                            }
                        }}
                    />
                </div>
            )}

            <div className="fixed bottom-2 sm:bottom-4 left-0 right-0 flex justify-center z-[100] pointer-events-none text-center">
                {/* Optimized for Tablet/Mobile Lag: Reduced blur (xl->md), reduced shadow (2xl->xl), minimal layout shifts */}
                <div className="pointer-events-auto bg-white/10 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 shadow-xl rounded-full px-3 py-1 sm:px-5 sm:py-2 transform transition-transform duration-300 hover:scale-105 hover:bg-white/20 max-w-[95vw] will-change-transform">
                    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 text-[9px] sm:text-xs font-medium">
                        <span className="text-gray-600 dark:text-gray-300">
                            Software Developed by
                        </span>

                        {/* Brand Name with Ultra Luxury Two-Tone (Gold & Chromium Silver) */}
                        <span
                            className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#BF953F] via-[#E2E8F0] to-[#B38728]"
                            style={{
                                textShadow: '0 0 15px rgba(191, 149, 63, 0.4), 0 0 10px rgba(226, 232, 240, 0.5)' // Gold + Silver Glow
                            }}
                        >
                            Liquid ARC Studio
                        </span>

                        <div className="flex items-center gap-1 sm:gap-2">
                            {/* Interactive 'Love' Button with Confetti */}
                            <button
                                onClick={handleLoveClick}
                                className="group relative p-1 transition-transform active:scale-95 text-gray-400 hover:text-pink-500"
                                title={loved ? "Thanks for the love!" : "Show some love"}
                            >
                                <Heart
                                    size={14}
                                    className={`transition-all duration-300 ${loved ? 'fill-red-500 text-red-500 scale-110' : 'group-hover:scale-110'}`}
                                />
                            </button>

                            {/* Contact Link - Hidden on very small screens */}
                            <a
                                href="mailto:liquidarc.studio@gmail.com"
                                className="hidden sm:inline-flex items-center gap-1 hover:text-orange-500 transition-colors"
                            >
                                <Send size={12} className="text-orange-500 animate-pulse" />
                                <span className="text-gray-500 dark:text-gray-400 text-[9px] sm:text-xs">
                                    ( liquidarc.studio@gmail.com )
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Footer;
