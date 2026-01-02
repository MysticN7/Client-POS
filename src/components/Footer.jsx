import React from 'react';

const Footer = () => {
    return (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <div className="pointer-events-auto bg-white/10 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 shadow-xl rounded-full px-6 py-2 transform hover:scale-105 transition-transform duration-300">
                <p className="text-sm font-semibold whitespace-nowrap">
                    <span className="text-gray-600 dark:text-gray-300">Software Developed by </span>
                    <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent font-bold">
                        Liquid ARC Studio
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                        ( liquidarc.studio@gmail.com )
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Footer;
