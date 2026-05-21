"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "cta";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const variantClass = {
      primary: "btn-primary",
      secondary: "btn-secondary",
      cta: "btn-cta",
    }[variant];

    const sizeStyles = {
      sm: { padding: "8px 16px", fontSize: "0.75rem" },
      md: { padding: "12px 24px", fontSize: "0.875rem" },
      lg: { padding: "16px 32px", fontSize: "1rem" },
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${variantClass} ${className}`}
        style={{
          ...sizeStyles,
          opacity: disabled || isLoading ? 0.6 : 1,
          cursor: disabled || isLoading ? "not-allowed" : "pointer",
        }}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Yükleniyor...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
