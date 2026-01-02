import React, { useRef } from 'react';
import { Plus } from 'lucide-react';

export default function SmartRxInput({ value, onChange, placeholder, className, ...props }) {
    const inputRef = useRef(null);

    const handleQuickAction = (action) => {
        if (action === 'PLANO') {
            onChange({ target: { value: 'Plano' } });
            // inputRef.current?.focus(); // Creating focus issues on mobile sometimes, better to just set it
        } else if (action === 'L') {
            onChange({ target: { value: (value || '') + 'L' } });
        }
    };

    return (
        <div className="flex relative w-full group">
            <input
                ref={inputRef}
                type="tel" // Default to numeric keypad
                className={`${className} pr-6`}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                {...props}
            />
            {/* Overlay 'P' button for quick access */}
            <button
                type="button"
                tabIndex="-1" // Skip tab index so tabbing through inputs works smoothly
                onClick={(e) => {
                    e.preventDefault(); // Prevent focus loss if possible
                    handleQuickAction('PLANO');
                }}
                className="absolute right-0 top-0 bottom-0 px-1 bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 border-l dark:border-gray-600 rounded-r transition-colors flex items-center justify-center min-w-[20px]"
                title="Set to Plano"
            >
                P
            </button>
        </div>
    );
}
