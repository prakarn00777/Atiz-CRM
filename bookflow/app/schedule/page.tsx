"use client";

import React, { useState } from 'react';
import styles from "@/app/page.module.css";
import {
    Menu, Bell, Search, ScanLine, ChevronLeft, ChevronRight, ChevronDown, Plus, X, Clock, User, Phone, FileText
} from "lucide-react";

// Mock Data
const SCHEDULES = [
    { id: 1, startTime: "09:30", endTime: "10:30", client: "K'Mai", service: "นวดเท้า", status: "จองตรง", statusColor: "success", price: "1,200", phone: "081-234-5678", notes: "-" },
    { id: 2, startTime: "10:30", endTime: "11:30", client: "K'Que", service: "นวดตัว", status: "แอปพาร์ทเนอร์", statusColor: "primary", price: "500", phone: "089-999-8888", notes: "แพ้น้ำมันหอมระเหย" },
    { id: 3, startTime: "13:10", endTime: "", client: "Walk-in", service: "นวดเท้า", status: "หน้าร้าน", statusColor: "warning", price: "600", phone: "-", notes: "ลูกค้าประจำ" },
    { id: 4, startTime: "14:30", endTime: "15:30", client: "K'Que", service: "นวดตัว", status: "แอปพาร์ทเนอร์", statusColor: "primary", price: "500", phone: "089-999-8888", notes: "-" },
    { id: 5, startTime: "15:00", endTime: "", client: "K'Mai", service: "จองตรง", status: "จองตรง", statusColor: "success", price: "1,700", phone: "081-234-5678", notes: "ขอหมอคนเดิม" }
];

export default function SchedulePage() {
    const [currentDateIndex, setCurrentDateIndex] = useState(0);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    const dates = [
        "วันนี้ · ศ · 19 ธ.ค.",
        "พรุ่งนี้ · ส · 20 ธ.ค.",
        "อาทิตย์ · 21 ธ.ค."
    ];

    const handlePrevDate = () => {
        setCurrentDateIndex(prev => (prev > 0 ? prev - 1 : prev));
    };

    const handleNextDate = () => {
        setCurrentDateIndex(prev => (prev < dates.length - 1 ? prev + 1 : prev));
    };

    return (
        <main className="container" style={{ paddingBottom: '140px', position: 'relative' }}>

            {/* 1. Header */}
            <header className={styles.appBar} style={{ paddingLeft: '16px', paddingRight: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => alert("Open Menu")}><Menu size={24} color="#121212" /></button>
                    <span className={styles.categoryTitle} style={{ fontSize: '20px' }}>BookFlow</span>
                </div>
                <button className={styles.notificationBtn} style={{ width: '36px', height: '36px', boxShadow: 'none' }}>
                    <Bell size={24} color="#121212" />
                    <span className={styles.badge} style={{ top: '2px', right: '2px', backgroundColor: '#FF3B30', border: '2px solid white' }}>4</span>
                </button>
            </header>

            {/* 2. Search & Scan */}
            <div style={{ padding: '0 16px 16px', display: 'flex', gap: '12px' }}>
                <div className={styles.searchBar} style={{ flex: 1, backgroundColor: '#F9F9F9', border: '1px solid #E0E0E0', borderRadius: '8px', padding: '10px 12px', height: '44px' }}>
                    <Search size={18} color="#999" />
                    <input type="text" placeholder="ค้นหาชื่อ, เบอร์โทร..." className={styles.searchInput} style={{ fontSize: '14px' }} />
                </div>
                <button onClick={() => alert("Scan QR Code")} style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: '#8E919E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                    <ScanLine size={20} />
                </button>
            </div>

            <div style={{ backgroundColor: 'white' }}>
                {/* 3. Date Navigator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <button onClick={handlePrevDate} disabled={currentDateIndex === 0} style={{ opacity: currentDateIndex === 0 ? 0.3 : 1 }}>
                        <ChevronLeft size={20} color="#666" />
                    </button>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#121212', minWidth: '140px', textAlign: 'center' }}>
                        {dates[currentDateIndex]}
                    </span>
                    <button onClick={handleNextDate} disabled={currentDateIndex === dates.length - 1} style={{ opacity: currentDateIndex === dates.length - 1 ? 0.3 : 1 }}>
                        <ChevronRight size={20} color="#666" />
                    </button>
                </div>

                {/* 4. Filters */}
                <div style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                    <button onClick={() => alert("Filter Channels")} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', backgroundColor: '#F9F9F9', color: '#333', fontSize: '14px', flex: 1, justifyContent: 'space-between' }}>
                        <span>ทุกช่องทาง</span>
                        <ChevronDown size={14} color="#666" />
                    </button>
                    <button onClick={() => alert("Filter Staff")} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: '8px', backgroundColor: '#F9F9F9', color: '#333', fontSize: '14px', flex: 1.2, justifyContent: 'space-between' }}>
                        <span>พนักงานทั้งหมด</span>
                        <ChevronDown size={14} color="#666" />
                    </button>
                </div>

                {/* 5. Schedule List */}
                <div>
                    {SCHEDULES.map((item) => {
                        let badgeStyle = { border: '1px solid #ccc', color: '#666', bg: 'transparent' };
                        if (item.statusColor === 'success') badgeStyle = { border: '1px solid #28a745', color: '#28a745', bg: '#f0fff4' };
                        else if (item.statusColor === 'primary') badgeStyle = { border: '1px solid #0066FF', color: '#0066FF', bg: '#f0f7ff' };
                        else if (item.statusColor === 'warning') badgeStyle = { border: '1px solid #EBC600', color: '#8A7500', bg: '#FFFEF0' };

                        return (
                            <div
                                key={item.id}
                                onClick={() => setSelectedBooking(item)}
                                style={{ display: 'flex', padding: '16px', borderBottom: '1px solid #F0F0F0', cursor: 'pointer', transition: 'background 0.2s' }}
                                className="active:bg-gray-50" // Tailwind-like behavior via CSS or simpler inline
                                onMouseDown={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                onMouseUp={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div style={{ width: '60px', flexShrink: 0 }}>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#121212' }}>{item.startTime}</div>
                                    {item.endTime && <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>- {item.endTime}</div>}
                                </div>
                                <div style={{ flex: 1, paddingLeft: '16px' }}>
                                    <div style={{ fontSize: '16px', color: '#121212', marginBottom: '4px' }}>{item.client}</div>
                                    <div style={{ fontSize: '14px', color: '#666' }}>{item.service}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', border: badgeStyle.border, color: badgeStyle.color, backgroundColor: badgeStyle.bg, fontWeight: '500' }}>
                                        {item.status}
                                    </span>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#121212' }}>฿{item.price}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 6. Sticky Footer Summary */}
            <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', backgroundColor: '#F9F9F9', borderTop: '1px solid #E0E0E0', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -2px 10px rgba(0,0,0,0.03)', zIndex: 80 }}>
                <span style={{ color: '#666', fontSize: '14px' }}>รวม: {SCHEDULES.length} การจอง</span>
                <span style={{ color: '#121212', fontSize: '18px', fontWeight: '800' }}>฿4,500</span>
            </div>

            {/* 7. FAB */}
            <button onClick={() => alert("Create New Booking")} style={{ position: 'fixed', bottom: '140px', right: 'calc(50% - 220px + 16px)', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#4A5568', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 90 }}>
                <Plus size={32} />
            </button>

            {/* Booking Detail Modal (Bottom Sheet Style) */}
            {selectedBooking && (
                <>
                    <div onClick={() => setSelectedBooking(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }} />
                    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', backgroundColor: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', zIndex: 101, animation: 'slideUp 0.3s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Booking Details</h3>
                            <button onClick={() => setSelectedBooking(null)}><X size={24} color="#666" /></button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: '#666' }}>
                                {selectedBooking.client.charAt(0)}
                            </div>
                            <div>
                                <div style={{ fontSize: '18px', fontWeight: '600' }}>{selectedBooking.client}</div>
                                <div style={{ color: 'var(--primary-color)', fontWeight: '500' }}>{selectedBooking.service}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Clock size={20} color="#666" />
                                <div>
                                    <div style={{ fontSize: '14px', color: '#999' }}>Time</div>
                                    <div style={{ fontSize: '16px', color: '#333' }}>{selectedBooking.startTime} - {selectedBooking.endTime || 'N/A'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Phone size={20} color="#666" />
                                <div>
                                    <div style={{ fontSize: '14px', color: '#999' }}>Phone</div>
                                    <div style={{ fontSize: '16px', color: '#333' }}>{selectedBooking.phone}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <FileText size={20} color="#666" />
                                <div>
                                    <div style={{ fontSize: '14px', color: '#999' }}>Note</div>
                                    <div style={{ fontSize: '16px', color: '#333' }}>{selectedBooking.notes}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E0E0E0', backgroundColor: 'white', color: '#333', fontWeight: '600' }}>Cancel</button>
                            <button style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: '600' }}>Edit</button>
                        </div>
                    </div>
                </>
            )}
        </main>
    );
}
