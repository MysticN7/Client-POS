import React, { useState, useEffect } from 'react';
import { Send, Heart } from 'lucide-react';
import ReactConfetti from 'react-confetti';

const Footer = () => {
    const [loved, setLoved] = useState(false);
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

    return (
        <>
            {loved && (
                <div className="fixed inset-0 z-[99] pointer-events-none">
                    <ReactConfetti
                        width={windowDimension.width}
                        height={windowDimension.height}
                        recycle={true}
                        numberOfPieces={300}
                        gravity={0.25} // Faster fall per user request
                        colors={[
                            '#EC4899', // Pink
                            '#8B5CF6', // Purple
                            '#F97316', // Orange
                            '#8B4513', // Brown (SaddleBrown)
                            '#3B82F6'  // Blue
                        ]}
                    />
                </div>
            )}

            <div className="fixed bottom-4 left-0 right-0 flex justify-center z-[100] pointer-events-none text-center">
                {/* Optimized for Tablet/Mobile Lag: Reduced blur (xl->md), reduced shadow (2xl->xl), minimal layout shifts */}
                <div className="pointer-events-auto bg-white/10 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 shadow-xl rounded-full px-5 py-2 transform transition-all duration-300 hover:scale-105 hover:bg-white/20 max-w-[95vw] will-change-transform">
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-medium">
                        <span className="text-gray-600 dark:text-gray-300">
                            Software Developed by
                        </span>

                        {/* Brand Name with Neon Glow - Kept strong visually but efficient */}
                        <span
                            className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600"
                            style={{
                                textShadow: '0 0 10px rgba(192, 132, 252, 0.6)'
                            }}
                        >
                            Liquid ARC Studio
                        </span>

                        <div className="flex items-center gap-2">
                            {/* Interactive 'Love' Button with Confetti */}
                            <button
                                onClick={() => setLoved(!loved)}
                                className="group relative p-1 transition-transform active:scale-95 text-gray-400 hover:text-pink-500"
                                title={loved ? "Stop the rain" : "Make it rain!"}
                            >
                                <Heart
                                    size={16}
                                    className={`transition-all duration-300 ${loved ? 'fill-red-500 text-red-500 scale-110' : 'group-hover:scale-110'}`}
                                />
                            </button>

                            {/* Contact Link */}
                            <a
                                href="mailto:liquidarc.studio@gmail.com"
                                className="inline-flex items-center gap-1 hover:text-orange-500 transition-colors"
                            >
                                <Send size={14} className="text-orange-500 animate-pulse" />
                                <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">
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
