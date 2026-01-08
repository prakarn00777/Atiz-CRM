export interface Service {
    id: string;
    name: string;
    category: 'Spa' | 'Salon' | 'Wellness';
    price: number;
    duration: number; // in minutes
    description: string;
    image?: string;
}

export interface TimeSlot {
    time: string; // "10:00"
    available: boolean;
}

export interface Booking {
    id?: string;
    serviceId: string;
    date: string;
    time: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    paymentStatus: 'pending' | 'paid';
}
