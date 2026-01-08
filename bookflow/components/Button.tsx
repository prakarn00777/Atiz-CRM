import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    fullWidth = false,
    className,
    ...props
}) => {
    const baseClass = "btn"; // Defined in globals.css
    const variantClass = variant === 'primary' ? "btn-primary" : ""; // Add other variants if needed
    const widthClass = fullWidth ? styles.fullWidth : "";

    return (
        <button
            className={`${baseClass} ${variantClass} ${widthClass} ${className || ''}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
