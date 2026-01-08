import React from 'react';
import { TimeSlot } from '@/types';
import styles from './TimeSlotPicker.module.css';

interface TimeSlotPickerProps {
    slots: TimeSlot[];
    selectedTime?: string;
    onTimeSelect: (time: string) => void;
    loading: boolean;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ slots, selectedTime, onTimeSelect, loading }) => {
    if (loading) {
        return <div className={styles.loading}>Loading available times...</div>;
    }

    if (slots.length === 0) {
        return <div className={styles.empty}>No slots available for this date.</div>;
    }

    return (
        <div className={styles.grid}>
            {slots.map((slot) => (
                <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => onTimeSelect(slot.time)}
                    className={`${styles.slot} ${selectedTime === slot.time ? styles.selected : ''} ${!slot.available ? styles.disabled : ''}`}
                >
                    {slot.time}
                </button>
            ))}
        </div>
    );
};

export default TimeSlotPicker;
