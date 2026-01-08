import { Metadata } from 'next';
import { Suspense } from 'react';
import BookingFlow from '@/components/BookingFlow';

export const metadata: Metadata = {
    title: 'Book Appointment | BookFlow',
    description: 'Select your preferred date and time for your appointment.',
};

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="container">Loading...</div>}>
            <BookingFlow />
        </Suspense>
    );
}
