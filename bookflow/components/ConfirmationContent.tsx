"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import { getServices } from '@/lib/api';
import styles from '@/app/confirmation/page.module.css';

export default function ConfirmationContent() {
    const searchParams = useSearchParams();
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    const name = searchParams.get('name');

    const [serviceName, setServiceName] = useState('Loading...');

    useEffect(() => {
        if (serviceId) {
            getServices().then(services => {
                const found = services.find(s => s.id === serviceId);
                if (found) setServiceName(found.name);
            });
        }
    }, [serviceId]);

    return (
        <div className={styles.card}>
            <div className={styles.icon}>✅</div>
            <h1 className={styles.title}>Booking Confirmed!</h1>
            <p className={styles.message}>Thank you, {name}. Your appointment has been successfully booked.</p>

            <div className={styles.details}>
                <div className={styles.row}>
                    <span className={styles.label}>Service:</span>
                    <span className={styles.value}>{serviceName}</span>
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>Date:</span>
                    <span className={styles.value}>{date}</span>
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>Time:</span>
                    <span className={styles.value}>{time}</span>
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>Payment:</span>
                    <span className={styles.value} style={{ color: '#28a745' }}>Paid (EasePay)</span>
                </div>
            </div>

            <Link href="/" className={styles.link}>
                <Button fullWidth>Back to Home</Button>
            </Link>
        </div>
    );
}
