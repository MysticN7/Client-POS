```javascript
import React, { useState } from 'react';
import { Send, Heart } from 'lucide-react';

const Footer = () => {
    const [loved, setLoved] = useState(false);

    return (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center z-[100] pointer-events-none text-center">
            <div className="pointer-events-auto bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-full px-5 py-2 transform transition-all duration-300 hover:scale-105 hover:bg-white/20 max-w-[95vw]">
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-medium">
                    <span className="text-gray-600 dark:text-gray-300">
                        Software Developed by 
                    </span>
                    
                    {/* Brand Name with STRONG Neon Glow */}
                    <span 
                        className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 transition-all duration-300"
                        style={{ 
                            textShadow: '0 0 10px rgba(192, 132, 252, 0.6), 0 0 20px rgba(236, 72, 153, 0.4)'
                        }}
                    >
                        Liquid ARC Studio
                    </span>

                    <div className="flex items-center gap-2">
                        {/* Interactive 'Love' Button (Something to enjoy!) */}
                        <button 
                            onClick={() => setLoved(!loved)}
                            className="group relative p-1 transition-transform active:scale-95"
                            title={loved ? "Thanks for the love!" : "Show some love"}
                        >
                            <Heart 
                                size={16} 
                                className={`transition - all duration - 300 ${ loved ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-400 group-hover:text-pink-500' } `} 
                            />
                            {/* Confetti effect could go here, but keeping it clean for now */}
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
    );
};

export default Footer;
```
