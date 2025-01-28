import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'medium',
    isLoading = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = `btn-${size}`;
    const loadingClass = isLoading ? 'btn-loading' : '';
    
    return (
        <button
            className={`${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="btn-spinner" />
            ) : children}
        </button>
    );
}; 