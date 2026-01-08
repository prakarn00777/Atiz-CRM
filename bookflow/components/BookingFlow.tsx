"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Service, TimeSlot } from '@/types';
import { getServices, getAvailableSlots } from '@/lib/api';
import Calendar from '@/components/Calendar';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import BookingForm from '@/components/BookingForm';
import styles from '@/app/booking/page.module.css';
import Button from '@/components/Button';

export default function BookingFlow() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const serviceId = searchParams.get('serviceId');

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [service, setService] = useState<Service | null>(null);
    const [date, setDate] = useState<string>('');
    const [time, setTime] = useState<string>('');
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        if (serviceId) {
            getServices().then(services => {
                const found = services.find(s => s.id === serviceId);
                if (found) setService(found);
            });
        }
    }, [serviceId]);

    useEffect(() => {
        if (date) {
            setLoadingSlots(true);
            getAvailableSlots(date).then(fetchedSlots => {
                setSlots(fetchedSlots);
                setLoadingSlots(false);
            });
        }
    }, [date]);

    const handleDateSelect = (selectedDate: string) => {
        setDate(selectedDate);
        setTime('');
    };

    const handleTimeSelect = (selectedTime: string) => {
        setTime(selectedTime);
    };

    const handleNextStep = () => {
        if (step === 1 && date && time) {
            setStep(2);
        }
    };

    const handleFormSubmit = async (userInfo: any) => {
        console.log('Submitting booking:', { service, date, time, userInfo });
        const params = new URLSearchParams({
            serviceId: service?.id || '',
            date,
            time,
            name: userInfo.name
        });
        router.push(`/confirmation?${params.toString()}`);
    };

    if (!service) {
        return <div className="container">Loading service...</div>;
    }

    return (
        <main className="container">
            <header className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    ←
                </button>
                <h1 className={styles.title}>Book Appointment</h1>
            </header>

            <div className={styles.summary}>
                <h2 className={styles.serviceName}>{service.name}</h2>
                <p className={styles.serviceDetails}>{service.duration} mins • ฿{service.price}</p>
            </div>

            <div className={styles.progress}>
                <div className={`${styles.step} ${step >= 1 ? styles.activeStep : ''}`}>
                    <div className={styles.stepIndicator}>1</div>
                    <span>Date</span>
                </div>
                <div className={`${styles.step} ${step >= 2 ? styles.activeStep : ''}`}>
                    <div className={styles.stepIndicator}>2</div>
                    <span>Info</span>
                </div>
                <div className={`${styles.step} ${step >= 3 ? styles.activeStep : ''}`}>
                    <div className={styles.stepIndicator}>3</div>
                    <span>Confirm</span>
                </div>
            </div>

            {step === 1 && (
                <div className={styles.stepContent}>
                    <section className={styles.section}>
                        <h3>Select Date</h3>
                        <Calendar onDateSelect={handleDateSelect} selectedDate={date} />
                    </section>

                    {date && (
                        <section className={styles.section}>
                            <h3>Select Time</h3>
                            <TimeSlotPicker
                                slots={slots}
                                selectedTime={time}
                                onTimeSelect={handleTimeSelect}
                                loading={loadingSlots}
                            />
                        </section>
                    )}

                    <div className={styles.actions}>
                        <Button
                            disabled={!date || !time}
                            onClick={handleNextStep}
                            fullWidth
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className={styles.stepContent}>
                    <BookingForm onSubmit={handleFormSubmit} />
                </div>
            )}
        </main>
    );
}
