function MaleIcon({ color = "#ffffff" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10" cy="6" r="3.5" stroke={color} strokeWidth="1.5" />
      <path
        d="M5 20c0-3.5 2.2-6 5-6s5 2.5 5 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 4h5v5M17 4l4 4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FemaleIcon({ color = "#ffffff" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="6" r="3.5" stroke={color} strokeWidth="1.5" />
      <path
        d="M7 20c0-3.5 2.2-6 5-6s5 2.5 5 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 13v6M9.5 17h5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { MaleIcon, FemaleIcon };
