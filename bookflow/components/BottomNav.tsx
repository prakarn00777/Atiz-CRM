"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Calendar, User } from 'lucide-react';
import styles from './BottomNav.module.css';

const BottomNav = () => {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className={styles.nav}>
            <Link href="/" className={`${styles.item} ${isActive('/') ? styles.active : ''}`}>
                <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
                <span className={styles.label}>หน้าแรก</span>
            </Link>

            <Link href="/schedule" className={`${styles.item} ${isActive('/schedule') ? styles.active : ''}`}>
                <ClipboardList size={24} strokeWidth={isActive('/schedule') ? 2.5 : 2} />
                <span className={styles.label}>ตารางงาน</span>
            </Link>

            <Link href="/calendar" className={`${styles.item} ${isActive('/calendar') ? styles.active : ''}`}>
                <Calendar size={24} strokeWidth={isActive('/calendar') ? 2.5 : 2} />
                <span className={styles.label}>ปฏิทิน</span>
            </Link>

            <Link href="/account" className={`${styles.item} ${isActive('/account') ? styles.active : ''}`}>
                <User size={24} strokeWidth={isActive('/account') ? 2.5 : 2} />
                <span className={styles.label}>บัญชี</span>
            </Link>
        </nav>
    );
};

export default BottomNav;
