"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CRMNotification } from '@/types';

interface NotificationContextType {
    notifications: CRMNotification[];
    unreadCount: number;
    pushNotification: (title: string, message: string, type?: CRMNotification['type'], data?: any) => void;
    markAsRead: (id?: string) => void;
    clearAll: () => void;
    requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<CRMNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initialize from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('crm_notifications_v1');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Sanitize: Ensure title and message are strings, not objects
                const sanitized = (Array.isArray(parsed) ? parsed : []).filter((n: any) => {
                    return n &&
                        typeof n.title === 'string' &&
                        typeof n.message === 'string';
                });
                setNotifications(sanitized);
                setUnreadCount(sanitized.filter((n: CRMNotification) => !n.isRead).length);
            } catch (e) {
                console.error("Failed to parse notifications", e);
            }
        }
    }, []);

    // Save to localStorage when changed
    useEffect(() => {
        localStorage.setItem('crm_notifications_v1', JSON.stringify(notifications));
        setUnreadCount(notifications.filter(n => !n.isRead).length);
    }, [notifications]);

    const requestPermission = async () => {
        if (!("Notification" in window)) return false;
        if (Notification.permission === "granted") return true;
        const permission = await Notification.requestPermission();
        return permission === "granted";
    };

    const pushNotification = useCallback(async (
        title: string,
        message: string,
        type: CRMNotification['type'] = "info",
        data?: any
    ) => {
        const newNotif: CRMNotification = {
            id: Date.now().toString(),
            title,
            message,
            type,
            timestamp: new Date().toISOString(),
            isRead: false,
            data
        };

        setNotifications(prev => [newNotif, ...prev].slice(0, 50));

        // Desktop Notification
        if ("Notification" in window && Notification.permission === "granted") {
            try {
                new window.Notification(title, {
                    body: message,
                    icon: '/favicon.ico'
                });
            } catch (err) {
                console.error("Desktop notification failed", err);
            }
        }
    }, []);

    const markAsRead = (id?: string) => {
        setNotifications(prev => prev.map(n =>
            (id === undefined || n.id === id) ? { ...n, isRead: true } : n
        ));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            pushNotification,
            markAsRead,
            clearAll,
            requestPermission
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
