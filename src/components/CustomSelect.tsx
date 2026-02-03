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
    portalContainer?: HTMLElement | null;
}

import { createPortal } from "react-dom";

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
    disabled = false,
    portalContainer
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [internalSelected, setInternalSelected] = useState(defaultValue || options[0]?.value || "");
    const containerRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const activeValue = value !== undefined ? value : internalSelected;
    const selectedOption = options.find((opt) => opt.value === activeValue);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            const isOutsideContainer = containerRef.current && !containerRef.current.contains(target);
            const isOutsidePortal = portalRef.current && !portalRef.current.contains(target);

            if (isOutsideContainer && isOutsidePortal) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update coordinates when opening
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen]);

    // Handle scroll to updade coords if needed (optional but good for polish)
    useEffect(() => {
        if (!isOpen) return;
        const handleScroll = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setCoords({
                    top: rect.bottom + window.scrollY, // Use fixed for portal usually or absolute with body relative? 
                    // createPortal renders into body, usually body is static.
                    // Better to use 'fixed' position strategy if we want it to stick to viewport, 
                    // or 'absolute' with page coords. 
                    // Let's stick to fixed for simplicity in modals.
                    left: rect.left,
                    width: rect.width
                });
            }
        };
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

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
                className={`input-field flex items-center justify-between group transition-all duration-200 ${disabled ? "cursor-not-allowed opacity-50 bg-bg-hover" : "cursor-pointer active:scale-[0.99]"} ${icon ? "pl-9" : className?.includes("pl-") ? "" : "pl-3"} ${className || ""}`}
            >
                {icon && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                        {icon}
                    </span>
                )}
                <span className={`truncate text-xs ${activeValue ? "text-text-main" : "text-text-muted"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-300 ease-in-out ml-2 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>


            {isOpen && createPortal(
                <div
                    ref={portalRef}
                    className="fixed z-[9999] py-1 bg-card-bg border border-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
                    style={{
                        top: containerRef.current ? containerRef.current.getBoundingClientRect().bottom + 6 : 0,
                        left: containerRef.current ? containerRef.current.getBoundingClientRect().left : 0,
                        width: containerRef.current ? containerRef.current.getBoundingClientRect().width : 'auto',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}
                >
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelect(opt.value)}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors duration-150 hover:bg-bg-hover ${activeValue === opt.value
                                ? "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10"
                                : "text-text-main"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>,
                portalContainer || document.body
            )}
        </div>
    );
}
