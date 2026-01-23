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
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const activeValue = value !== undefined ? value : internalSelected;
    const selectedOption = options.find((opt) => opt.value === activeValue);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            // Logic adjusted for Portal: check if click is outside both container AND portal content (handled by keeping portal logic simple or checking e.target)
            // Simple way: if click is not in containerRef, close. 
            // BUT if click is inside the Portal, containerRef won't contain it.
            // We can ignore this for now as selecting an option closes it, and clicking outside (on overlay/body) should close it.
            // Actually, clicking inside the Portal (options) will bubble up? No, it's in body.
            // We need to check if target is distinct.
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // We also need to check if the click target is the dropdown menu itself (which is in the portal).
                // Assign an ID or Data attribute to the portal dropdown?
                const dropdown = document.getElementById(`dropdown-${name || 'select'}`);
                if (dropdown && dropdown.contains(event.target as Node)) {
                    return;
                }
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [name]);

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
                className={`input-field flex items-center justify-between group transition-all duration-200 ${disabled ? "cursor-not-allowed opacity-50 bg-white/5" : "cursor-pointer active:scale-[0.99]"} ${icon ? "pl-9" : className?.includes("pl-") ? "" : "pl-3"} ${className || ""}`}
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


            {isOpen && createPortal(
                <div
                    id={`dropdown-${name || 'select'}`}
                    className="fixed z-[9999] py-1 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
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
                            className={`w-full text-left px-3 py-2 text-xs transition-colors duration-150 hover:bg-white/10 ${activeValue === opt.value
                                ? "text-indigo-400 font-bold bg-indigo-500/10"
                                : "text-slate-300"
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
