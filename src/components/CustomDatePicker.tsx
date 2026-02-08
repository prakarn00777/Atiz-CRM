"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface CustomDatePickerProps {
    value: string;
    onChange: (date: string) => void;
    placeholder?: string;
    min?: string;
    max?: string;
    className?: string;
    align?: 'left' | 'right';
    portalContainer?: HTMLElement | null;
}

type ViewMode = 'days' | 'months' | 'years';

export default function CustomDatePicker({
    value,
    onChange,
    placeholder = "Select date",
    min,
    max,
    className,
    align = 'left',
    portalContainer
}: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('days');
    const [currentMonth, setCurrentMonth] = useState(() => value ? new Date(value) : new Date());
    const [yearRangeStart, setYearRangeStart] = useState(() => {
        const year = value ? new Date(value).getFullYear() : new Date().getFullYear();
        return Math.floor(year / 12) * 12;
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            const isOutsideContainer = containerRef.current && !containerRef.current.contains(target);
            const isOutsidePortal = portalRef.current && !portalRef.current.contains(target);

            if (isOutsideContainer && isOutsidePortal) {
                setIsOpen(false);
                setViewMode('days');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset view mode when closing
    useEffect(() => {
        if (!isOpen) {
            setViewMode('days');
        }
    }, [isOpen]);

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

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
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    const monthNamesFull = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentMonth(newDate);
    };

    const changeYearRange = (offset: number) => {
        setYearRangeStart(prev => prev + (offset * 12));
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

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(monthIndex);
        setCurrentMonth(newDate);
        setViewMode('days');
    };

    const handleYearSelect = (year: number) => {
        const newDate = new Date(currentMonth);
        newDate.setFullYear(year);
        setCurrentMonth(newDate);
        setViewMode('months');
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

    const isCurrentMonth = (monthIndex: number) => {
        const today = new Date();
        return monthIndex === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear();
    };

    const isSelectedMonth = (monthIndex: number) => {
        return monthIndex === currentMonth.getMonth();
    };

    const isCurrentYear = (year: number) => {
        return year === new Date().getFullYear();
    };

    const isSelectedYear = (year: number) => {
        return year === currentMonth.getFullYear();
    };

    const getDropdownPosition = () => {
        if (!containerRef.current) return { top: 0, left: 0, showAbove: false };

        const rect = containerRef.current.getBoundingClientRect();
        const dropdownHeight = 320;
        const gap = 4;
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

        const top = showAbove
            ? rect.top - dropdownHeight - gap
            : rect.bottom + gap;

        const left = align === 'right'
            ? rect.right - 280
            : rect.left;

        const adjustedLeft = Math.max(8, Math.min(left, window.innerWidth - 288));

        return { top, left: adjustedLeft, showAbove };
    };

    const renderHeader = () => {
        if (viewMode === 'years') {
            return (
                <div className="flex items-center justify-between mb-4">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); changeYearRange(-1); }}
                        className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-main transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-text-main">
                        {yearRangeStart + 543} - {yearRangeStart + 11 + 543}
                    </span>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); changeYearRange(1); }}
                        className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-main transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            );
        }

        if (viewMode === 'months') {
            return (
                <div className="flex items-center justify-between mb-4">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setViewMode('days'); }}
                        className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-main transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setViewMode('years'); setYearRangeStart(Math.floor(currentMonth.getFullYear() / 12) * 12); }}
                        className="text-sm font-semibold text-text-main hover:text-indigo-500 transition-colors cursor-pointer"
                    >
                        {currentMonth.getFullYear() + 543}
                    </button>
                    <div className="w-7" /> {/* Spacer for alignment */}
                </div>
            );
        }

        return (
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); changeMonth(-1); }}
                    className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-main transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setViewMode('months'); }}
                        className="text-sm font-semibold text-text-main hover:text-indigo-500 transition-colors cursor-pointer px-1"
                    >
                        {monthNamesFull[currentMonth.getMonth()]}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setViewMode('years'); setYearRangeStart(Math.floor(currentMonth.getFullYear() / 12) * 12); }}
                        className="text-sm font-semibold text-text-main hover:text-indigo-500 transition-colors cursor-pointer px-1"
                    >
                        {currentMonth.getFullYear() + 543}
                    </button>
                </div>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); changeMonth(1); }}
                    className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-main transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        );
    };

    const renderYearPicker = () => {
        const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);

        return (
            <div className="grid grid-cols-3 gap-2">
                {years.map((year) => (
                    <button
                        key={year}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleYearSelect(year); }}
                        className={`
                            py-2.5 rounded-lg text-xs font-medium transition-all duration-150
                            ${isSelectedYear(year)
                                ? "bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20"
                                : isCurrentYear(year)
                                    ? "border border-indigo-500/50 text-indigo-500 hover:bg-bg-hover"
                                    : "text-text-main hover:bg-bg-hover"
                            }
                        `}
                    >
                        {year + 543}
                    </button>
                ))}
            </div>
        );
    };

    const renderMonthPicker = () => {
        return (
            <div className="grid grid-cols-3 gap-2">
                {monthNames.map((month, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMonthSelect(index); }}
                        className={`
                            py-2.5 rounded-lg text-xs font-medium transition-all duration-150
                            ${isSelectedMonth(index)
                                ? "bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20"
                                : isCurrentMonth(index)
                                    ? "border border-indigo-500/50 text-indigo-500 hover:bg-bg-hover"
                                    : "text-text-main hover:bg-bg-hover"
                            }
                        `}
                    >
                        {month}
                    </button>
                ))}
            </div>
        );
    };

    const renderDayPicker = () => {
        return (
            <>
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
                                type="button"
                                onClick={(e) => { e.stopPropagation(); !disabled && handleDateClick(day); }}
                                disabled={disabled}
                                className={`
                                    h-8 w-8 rounded-lg flex items-center justify-center text-xs transition-all duration-150
                                    ${selected
                                        ? "bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20"
                                        : disabled
                                            ? "text-text-muted cursor-not-allowed opacity-30"
                                            : "text-text-main hover:bg-bg-hover"
                                    }
                                    ${today && !selected ? "border border-indigo-500/50 text-indigo-500 dark:text-indigo-500" : ""}
                                `}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </>
        );
    };

    return (
        <div className={`relative ${className || ""}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`input-field flex items-center justify-between group cursor-pointer active:scale-[0.99] transition-all duration-200 px-3 ${className || ""}`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <CalendarIcon className="w-4 h-4 text-text-muted shrink-0" />
                    <span className={`truncate text-xs ${value ? "text-text-main" : "text-text-muted"}`}>
                        {value ? formatDisplayDate(value) : placeholder}
                    </span>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-300 ease-in-out ml-1 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && createPortal(
                (() => {
                    const { top, left, showAbove } = getDropdownPosition();
                    return (
                        <div
                            ref={portalRef}
                            className={`fixed z-[9999] w-[280px] p-4 bg-card-bg border border-border rounded-xl shadow-2xl transition-all duration-150 ease-out backdrop-blur-xl ${showAbove ? 'origin-bottom' : 'origin-top'} ${isOpen
                                ? "opacity-100 visible"
                                : "opacity-0 invisible"
                            }`}
                            style={{
                                top,
                                left,
                                willChange: "transform, opacity",
                            }}
                        >
                            {renderHeader()}
                            {viewMode === 'years' && renderYearPicker()}
                            {viewMode === 'months' && renderMonthPicker()}
                            {viewMode === 'days' && renderDayPicker()}
                        </div>
                    );
                })(),
                portalContainer || document.body
            )}
        </div>
    );
}
