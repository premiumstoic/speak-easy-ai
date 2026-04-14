const UmayLogo = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="45" r="9" fill="#D97742" />
    <path d="M 50 82 C 50 65, 22 65, 22 45 C 22 25, 38 18, 50 25" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
    <path d="M 50 82 C 50 65, 78 65, 78 45 C 78 25, 62 18, 50 25" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
  </svg>
);

export default UmayLogo;
