import { Service, TimeSlot } from "@/types";

// Mock Data
const SERVICES: Service[] = [
    {
        id: '1',
        name: 'Thai Massage',
        category: 'Wellness',
        price: 500,
        duration: 60,
        description: 'Traditional Thai massage for relaxation and stress relief.',
    },
    {
        id: '2',
        name: 'Aromatherapy Oil Massage',
        category: 'Spa',
        price: 1200,
        duration: 90,
        description: 'Relaxing oil massage with aromatic essential oils.',
    },
    {
        id: '3',
        name: 'Haircut & Styling',
        category: 'Salon',
        price: 350,
        duration: 45,
        description: 'Professional haircut and styling by expert stylists.',
    },
    {
        id: '4',
        name: 'Facial Treatment',
        category: 'Spa',
        price: 800,
        duration: 60,
        description: 'Rejuvenating facial treatment for glowing skin.',
    }
];

export const getServices = async (): Promise<Service[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return SERVICES;
};

export const getAvailableSlots = async (date: string): Promise<TimeSlot[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Mock logic: generate random availability
    const times = ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    return times.map(time => ({
        time,
        available: Math.random() > 0.3 // 70% chance of being available
    }));
};

export const createBooking = async (bookingData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, bookingId: 'BOOK-' + Math.floor(Math.random() * 10000) };
};

export const processPayment = async (amount: number, method: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, transactionId: 'TXN-' + Date.now() };
};
