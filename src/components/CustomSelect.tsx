"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    name?: string;
    options: Option[];
    defaultValue?: string;
    value?: string;
    required?: boolean;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export default function CustomSelect({
    name,
    options,
    defaultValue,
    value,
    required,
    onChange,
    placeholder = "เลือกรายการ",
    className,
    icon,
    disabled = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [internalSelected, setInternalSelected] = useState(defaultValue || options[0]?.value || "");
    const containerRef = useRef<HTMLDivElement>(null);

    const activeValue = value !== undefined ? value : internalSelected;
    const selectedOption = options.find((opt) => opt.value === activeValue);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        if (value === undefined) {
            setInternalSelected(val);
        }
        onChange?.(val);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className || ""}`} ref={containerRef}>
            {/* Hidden input for form submission */}
            {name && <input type="hidden" name={name} value={activeValue} required={required} />}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`input-field flex items-center justify-between group transition-all duration-200 ${disabled ? "cursor-not-allowed opacity-50 bg-white/5" : "cursor-pointer active:scale-[0.99]"} ${icon ? "pl-9" : className?.includes("pl-") ? "" : "pl-3"} ${className?.includes("h-") ? "" : "py-2"} ${className || ""}`}
            >
                {icon && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        {icon}
                    </span>
                )}
                <span className={`truncate text-xs ${activeValue ? "text-white" : "text-slate-400"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ease-in-out ml-2 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            <div
                className={`absolute z-[110] w-full mt-1.5 py-1.5 px-1.5 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl transition-all duration-150 ease-out origin-top ${isOpen
                    ? "opacity-100 translate-y-0 visible"
                    : "opacity-0 -translate-y-2 invisible"
                    }`}
                style={{
                    willChange: "transform, opacity",
                    transform: isOpen ? "translateY(0)" : "translateY(-4px)"
                }}
            >
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors duration-150 hover:bg-white/10 rounded-lg ${activeValue === opt.value
                            ? "text-indigo-400 font-bold bg-indigo-500/10"
                            : "text-slate-300"
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
