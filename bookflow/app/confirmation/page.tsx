import { Metadata } from 'next';
import { Suspense } from 'react';
import ConfirmationContent from '@/components/ConfirmationContent';
import styles from './page.module.css';

export const metadata: Metadata = {
    title: 'Booking Confirmed | BookFlow',
    description: 'Your appointment has been successfully confirmed.',
};

export default function ConfirmationPage() {
    return (
        <main className="container">
            <div className={styles.wrapper}>
                <Suspense fallback={<div>Loading confirmation...</div>}>
                    <ConfirmationContent />
                </Suspense>
            </div>
        </main>
    );
}
