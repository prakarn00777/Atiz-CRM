"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Info, CheckCircle2, AlertTriangle, AlertCircle, Trash2, Clock } from 'lucide-react';
import { useNotification } from './NotificationProvider';
import { createPortal } from 'react-dom';

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, clearAll } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const bellRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
            case 'error': return <AlertCircle className="w-4 h-4 text-rose-400" />;
            default: return <Info className="w-4 h-4 text-indigo-400" />;
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short'
        });
    };

    return (
        <div className="relative">
            <button
                ref={bellRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-xl transition-all duration-300 ${isOpen ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-bg-hover text-text-muted hover:text-white hover:bg-bg-hover border border-border-light'
                    }`}
            >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0f172a] animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {mounted && isOpen && createPortal(
                <>
                    {/* Backdrop for closing */}
                    <div
                        className="fixed inset-0 z-[200]"
                        onClick={() => { setIsOpen(false); markAsRead(); }}
                    />

                    {/* Popover */}
                    <div
                        style={{
                            position: 'fixed',
                            top: bellRef.current ? bellRef.current.getBoundingClientRect().bottom + 12 : 80,
                            right: 16,
                        }}
                        className="z-[201] w-80 max-h-[480px] glass-card flex flex-col shadow-2xl border-border animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                        <div className="p-4 border-b border-border-light flex items-center justify-between bg-bg-hover/50">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                การแจ้งเตือน
                                {unreadCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">
                                        {unreadCount} ใหม่
                                    </span>
                                )}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); clearAll(); }}
                                    className="p-1.5 hover:bg-rose-500/10 text-text-muted hover:text-rose-400 rounded-lg transition-colors"
                                    title="ล้างทั้งหมด"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => { setIsOpen(false); markAsRead(); }}
                                    className="p-1.5 hover:bg-bg-hover text-text-muted hover:text-white rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={`p-4 transition-colors hover:bg-bg-hover flex gap-3 ${!notif.isRead ? 'bg-indigo-500/[0.02]' : ''}`}
                                        >
                                            <div className="mt-1 flex-shrink-0">
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-semibold truncate ${!notif.isRead ? 'text-white' : 'text-text-main/80'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[9px] text-text-muted/70 mt-2 flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(notif.timestamp)}
                                                </p>
                                            </div>
                                            {!notif.isRead && (
                                                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50 flex-shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-bg-hover flex items-center justify-center">
                                        <Bell className="w-6 h-6 text-text-muted/50" />
                                    </div>
                                    <p className="text-xs text-text-muted font-medium">ไม่มีการแจ้งเตือนใหม่</p>
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-2 border-t border-border-light bg-bg-hover/30">
                                <button
                                    onClick={() => markAsRead()}
                                    className="w-full py-2 text-[10px] font-bold text-text-muted hover:text-indigo-400 transition-colors uppercase tracking-wider"
                                >
                                    ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
                                </button>
                            </div>
                        )}
                    </div>
                </>
                , document.body
            )}
        </div>
    );
}
