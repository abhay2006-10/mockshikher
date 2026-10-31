import React from 'react';
import { SearchIcon } from './Icons';
import styles from './SearchInput.module.css';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function SearchInput({ className = '', ...props }: SearchInputProps) {
  return (
    <div className={`${styles.searchContainer} ${className}`}>
      <span className={styles.searchIcon}>
        <SearchIcon size={19} />
      </span>
      <input
        type="search"
        className={styles.searchInput}
        {...props}
      />
    </div>
  );
}
