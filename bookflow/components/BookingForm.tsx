import React, { useState } from 'react';
import styles from './BookingForm.module.css';
import Button from './Button';

interface UserInfo {
    name: string;
    email: string;
    phone: string;
}

interface BookingFormProps {
    onSubmit: (info: UserInfo) => void;
    initialData?: UserInfo;
}

const BookingForm: React.FC<BookingFormProps> = ({ onSubmit, initialData }) => {
    const [formData, setFormData] = useState<UserInfo>(initialData || {
        name: '',
        email: '',
        phone: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
                <label className={styles.label} htmlFor="name">Full Name</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className={styles.input}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                />
            </div>

            <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email Address</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className={styles.input}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                />
            </div>

            <div className={styles.field}>
                <label className={styles.label} htmlFor="phone">Phone Number</label>
                <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className={styles.input}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="081-234-5678"
                />
            </div>

            <Button type="submit" fullWidth className={styles.submitBtn}>
                Continue to Payment
            </Button>
        </form>
    );
};

export default BookingForm;
