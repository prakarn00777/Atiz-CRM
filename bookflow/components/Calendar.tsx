"use client";

import React, { useState, useEffect } from 'react';
import styles from './Calendar.module.css';
import Button from './Button';

interface CalendarProps {
    onDateSelect: (date: string) => void;
    selectedDate?: string;
}

const Calendar: React.FC<CalendarProps> = ({ onDateSelect, selectedDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Helper to get days in month
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    // Helper to get day of week for start of month
    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Format YYYY-MM-DD
        const dateString = date.toISOString().split('T')[0];
        onDateSelect(dateString);
    };

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Pad empty days
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>);
    }

    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
        const dateString = date.toISOString().split('T')[0];
        const isSelected = selectedDate === dateString;
        const isToday = new Date().toDateString() === date.toDateString();
        // Disable past dates
        const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

        days.push(
            <button
                key={i}
                disabled={isPast}
                className={`${styles.day} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''} ${isPast ? styles.disabled : ''}`}
                onClick={() => handleDateClick(i)}
            >
                {i}
            </button>
        );
    }

    return (
        <div className={styles.calendar}>
            <div className={styles.header}>
                <button onClick={handlePrevMonth} className={styles.navBtn}>&lt;</button>
                <span className={styles.monthLabel}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={handleNextMonth} className={styles.navBtn}>&gt;</button>
            </div>
            <div className={styles.weekdays}>
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>
            <div className={styles.grid}>
                {days}
            </div>
        </div>
    );
};

export default Calendar;
