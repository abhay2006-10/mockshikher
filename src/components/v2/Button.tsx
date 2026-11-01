import React from 'react';
import Link from 'next/link';
import { ArrowRight } from './Icons';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondaryOutline' | 'dark' | 'amber' | 'ghostLink';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  withArrow?: boolean;
  shine?: boolean;
  children: React.ReactNode;
  className?: string;
}

export type ButtonProps = BaseButtonProps &
  (
    | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
    | ({ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
  );

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  withArrow = false,
  shine = false,
  children,
  className = '',
  href,
  ...props
}: ButtonProps) {
  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    shine ? styles.shine : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {children}
      {withArrow && (
        <span className={styles.arrow}>
          <ArrowRight size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
        </span>
      )}
    </>
  );

  if (href) {
    const isExternal = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('https://wa.me');
    if (isExternal) {
      return (
        <a
          href={href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...(props as any)}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  );
}

