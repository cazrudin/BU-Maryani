import React from 'react';

interface StoreLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function StoreLogo({ className = '', showText = false, size = 'md' }: StoreLogoProps) {
  const sizeClasses = {
    sm: 'h-10 w-auto',
    md: 'h-13 w-auto sm:h-16',
    lg: 'h-18 w-auto sm:h-22',
    xl: 'h-26 w-auto sm:h-32',
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/logo.png"
        alt="Pusat Oleh Oleh Klaten - Bu Maryani"
        className={`${sizeClasses} object-contain shrink-0 drop-shadow-sm select-none`}
        loading="eager"
      />
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase">
              PUSAT OLEH OLEH KLATEN
            </span>
            <span className="text-[10px] font-bold text-red-600">
              Since 1965
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-cooper text-red-700 tracking-tight leading-tight">
            Bu Maryani
          </span>
          <span className="text-[11px] font-semibold text-neutral-600">
            Kios Pasar Klaten
          </span>
        </div>
      )}
    </div>
  );
}
