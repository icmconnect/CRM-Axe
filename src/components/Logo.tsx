interface LogoProps {
  className?: string;
  variant?: 'vertical' | 'horizontal' | 'inverted';
}

export function Logo({ className, variant = 'vertical' }: LogoProps) {
  let primarySrc = '/assets/images/logo-lp.png';

  if (variant === 'horizontal') {
    primarySrc = '/assets/images/logo-dash.png';
  } else if (variant === 'inverted') {
    primarySrc = '/assets/images/logo-lp.png'; // No inverted specified, using lp
  }

  const defaultClass = variant === 'horizontal' || variant === 'inverted' 
    ? 'h-24 sm:h-28 md:h-32 w-auto object-contain' 
    : 'h-48 sm:h-56 md:h-64 w-auto object-contain';
  
  return (
    <img 
      src={primarySrc} 
      alt="Ase Connect Logo" 
      className={className || defaultClass} 
      style={{ imageRendering: '-webkit-optimize-contrast' }}
      referrerPolicy="no-referrer"
    />
  );
}


