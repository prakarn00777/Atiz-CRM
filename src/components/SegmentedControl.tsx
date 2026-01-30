"use client";

import { useState } from "react";

interface Option {
    value: string;
    label: string;
}

interface SegmentedControlProps {
    name?: string;
    options: Option[];
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    className?: string;
}

export default function SegmentedControl({
    name,
    options,
    value,
    defaultValue,
    onChange,
    className = ""
}: SegmentedControlProps) {
    const [internalValue, setInternalValue] = useState(defaultValue || options[0]?.value || "");
    const activeValue = value !== undefined ? value : internalValue;

    const handleSelect = (val: string) => {
        if (value === undefined) {
            setInternalValue(val);
        }
        onChange?.(val);
    };

    return (
        <div className={`flex p-1 bg-bg-hover border border-border rounded-xl w-full ${className}`}>
            {name && <input type="hidden" name={name} value={activeValue} />}
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`flex-1 py-1.5 px-3 text-[10px] sm:text-xs font-medium rounded-lg transition-all duration-200 ${activeValue === option.value
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "text-text-muted hover:text-text-main hover:bg-bg-hover"
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
