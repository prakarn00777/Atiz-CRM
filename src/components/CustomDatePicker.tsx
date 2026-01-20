"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface CustomDatePickerProps {
    value: string;
    onChange: (date: string) => void;
    placeholder?: string;
    min?: string;
    max?: string;
    className?: string;
}

export default function CustomDatePicker({
    value,
    onChange,
    placeholder = "Select date",
    min,
    max,
    className
}: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    // Initialize current viewing month from value or current date
    const [currentMonth, setCurrentMonth] = useState(() => value ? new Date(value) : new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Helper to format date for display (DD/MM/YYYY)
    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Calendar generation helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);
    const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentMonth(newDate);
    };

    const getDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateClick = (day: number) => {
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateStr = getDateString(selectedDate);
        onChange(dateStr);
        setIsOpen(false);
    };

    const isDateDisabled = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateStr = getDateString(date);

        if (min && dateStr < min) return true;
        if (max && dateStr > max) return true;
        return false;
    };

    const isSelected = (day: number) => {
        if (!value) return false;
        const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const checkStr = getDateString(checkDate);
        return value === checkStr;
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear();
    };

    return (
        <div className={`relative ${className || ""}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`input-field flex items-center justify-between group cursor-pointer active:scale-[0.99] transition-all duration-200 px-3 ${className || ""}`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className={`truncate text-xs ${value ? "text-white" : "text-slate-400"}`}>
                        {value ? formatDisplayDate(value) : placeholder}
                    </span>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ease-in-out ml-1 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            <div
                className={`absolute z-[110] w-[280px] mt-1.5 p-4 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl transition-all duration-150 ease-out origin-top ${isOpen
                    ? "opacity-100 translate-y-0 visible"
                    : "opacity-0 -translate-y-2 invisible"
                    }`}
                style={{
                    willChange: "transform, opacity",
                    transform: isOpen ? "translateY(0)" : "translateY(-4px)"
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); changeMonth(-1); }}
                        className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-white">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); changeMonth(1); }}
                        className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Weekdays */}
                <div className="grid grid-cols-7 mb-2">
                    {dayNames.map((day, i) => (
                        <div key={i} className="text-center text-[10px] uppercase font-medium text-slate-500">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: days }).map((_, i) => {
                        const day = i + 1;
                        const disabled = isDateDisabled(day);
                        const selected = isSelected(day);
                        const today = isToday(day);

                        return (
                            <button
                                key={day}
                                onClick={(e) => { e.stopPropagation(); !disabled && handleDateClick(day); }}
                                disabled={disabled}
                                className={`
                                    h-8 w-8 rounded-lg flex items-center justify-center text-xs transition-all duration-150
                                    ${selected
                                        ? "bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20"
                                        : disabled
                                            ? "text-slate-600 cursor-not-allowed opacity-50"
                                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                                    }
                                    ${today && !selected ? "border border-indigo-500/50 text-indigo-400" : ""}
                                `}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
