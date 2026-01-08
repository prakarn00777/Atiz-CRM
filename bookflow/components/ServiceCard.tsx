import React from 'react';
import { Service } from '@/types';
import Button from './Button';
import styles from './ServiceCard.module.css';
import Link from 'next/link';

interface ServiceCardProps {
    service: Service;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>{service.name}</h3>
                    <span className={styles.category}>{service.category}</span>
                </div>
            </div>

            <p className={styles.description}>{service.description}</p>

            <div className={styles.footer}>
                <div>
                    <div className={styles.price}>฿{service.price}</div>
                    <div className={styles.duration}>⏱ {service.duration} mins</div>
                </div>
                <Link href={`/booking?serviceId=${service.id}`} tabIndex={-1}>
                    <Button className={styles.bookBtn}>Book</Button>
                </Link>
            </div>
        </div>
    );
};

export default ServiceCard;
