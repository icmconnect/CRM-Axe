interface LogoProps {
  className?: string;
  variant?: 'vertical' | 'horizontal' | 'inverted' | 'sidebar' | 'rodape';
  src?: string;
}

export function Logo({ className, variant = 'vertical', src }: LogoProps) {
  let primarySrc = src;

  if (!primarySrc) {
    if (variant === 'sidebar') {
      primarySrc = '/assets/images/logo-menu.png';
    } else if (variant === 'rodape') {
      primarySrc = '/assets/images/logo-rodape.png';
    } else if (variant === 'horizontal' || variant === 'inverted') {
      primarySrc = '/assets/images/logo-dash.png';
    } else {
      primarySrc = '/assets/images/logo-nova.png';
    }
  }

  const defaultClass = variant === 'sidebar'
    ? 'w-32 sm:w-36 h-auto object-contain mx-auto'
    : variant === 'horizontal' || variant === 'inverted' || variant === 'rodape'
    ? 'w-64 sm:w-80 h-auto object-contain' 
    : 'h-28 sm:h-32 w-auto object-contain';
  
  return (
    <img 
      src={primarySrc} 
      alt="Ase Connect Logo" 
      className={className || defaultClass} 
      style={{ imageRendering: '-webkit-optimize-contrast' }}
      referrerPolicy="no-referrer"
      onError={(e) => {
        const target = e.currentTarget;
        if (!target.src.includes('logo-dash.png')) {
          target.src = '/assets/images/logo-dash.png';
        }
      }}
    />
  );
}


