interface GiftHuntIconProps {
  className?: string;
  size?: number;
}

const GiftHuntIcon = ({ className = '', size = 40 }: GiftHuntIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      width={size}
      height={size}>
      {/* GitHub-style background: dark with rounded corners */}
      <path
        d="M20 0 h60 a20 20 0 0 1 20 20 v60 a20 20 0 0 1 -20 20 h-60 a20 20 0 0 1 -20 -20 v-60 a20 20 0 0 1 20 -20 z"
        fill="#24292f"
      />

      {/* Subtle gradient overlay for depth (GitHub style) */}
      <defs>
        <linearGradient id="githubGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            style={{ stopColor: '#ffffff', stopOpacity: 0.1 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: '#000000', stopOpacity: 0.1 }}
          />
        </linearGradient>
        <filter id="innerShadow">
          <feOffset dx="0" dy="1" />
          <feGaussianBlur stdDeviation="1" result="offset-blur" />
          <feFlood floodColor="#000000" floodOpacity="0.2" />
          <feComposite in2="offset-blur" operator="in" />
        </filter>
      </defs>

      <path
        d="M20 0 h60 a20 20 0 0 1 20 20 v60 a20 20 0 0 1 -20 20 h-60 a20 20 0 0 1 -20 -20 v-60 a20 20 0 0 1 20 -20 z"
        fill="url(#githubGradient)"
      />

      {/* Magnifying glass lens (bright white like GitHub icons) */}
      <circle
        cx="50"
        cy="50"
        r="28"
        fill="none"
        stroke="#ffffff"
        strokeWidth="5"
        opacity="0.95"
      />

      {/* Magnifying glass handle (crisp white) */}
      <line
        x1="71"
        y1="71"
        x2="85"
        y2="85"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* Gift box inside magnifying glass (GitHub white style) */}
      <g transform="translate(45, 45)">
        {/* Gift box base with subtle shadow */}
        <rect
          x="-10"
          y="-8"
          width="28"
          height="28"
          fill="#ffffff"
          rx="2"
          opacity="0.95"
        />
        <rect
          x="-9"
          y="-7"
          width="26"
          height="26"
          fill="none"
          stroke="#24292f"
          strokeWidth="0.5"
          rx="1.5"
          opacity="0.3"
        />

        {/* Gift ribbon vertical (GitHub dark accent) */}
        <rect x="3" y="-8" width="3" height="28" fill="#24292f" opacity="0.8" />

        {/* Gift ribbon horizontal (GitHub dark accent) */}
        <rect
          x="-10"
          y="5"
          width="28"
          height="3"
          fill="#24292f"
          opacity="0.8"
        />

        {/* Gift bow (crisp white with dark outline) */}
        <ellipse
          cx="0.5"
          cy="-12"
          rx="3"
          ry="2"
          fill="#ffffff"
          transform="rotate(15 -2 -12)"
          opacity="0.95"
        />
        <ellipse
          cx="7"
          cy="-9"
          rx="3"
          ry="2"
          fill="#ffffff"
          transform="rotate(-15 4 -12)"
          opacity="0.95"
        />

        {/* Bow center knot */}
        <circle cx="4.5" cy="-10" r="1.5" fill="#24292f" opacity="0.8" />

        {/* Bow subtle outlines for definition */}
        <ellipse
          cx="0.5"
          cy="-12"
          rx="3"
          ry="2"
          fill="none"
          stroke="#24292f"
          strokeWidth="0.5"
          transform="rotate(15 -2 -12)"
          opacity="0.4"
        />
        <ellipse
          cx="7"
          cy="-9"
          rx="3"
          ry="2"
          fill="none"
          stroke="#24292f"
          strokeWidth="0.5"
          transform="rotate(-15 4 -12)"
          opacity="0.4"
        />
      </g>

      {/* GitHub-style border highlight */}
      <path
        d="M20 1 h60 a19 19 0 0 1 19 19 v60 a19 19 0 0 1 -19 19 h-60 a19 19 0 0 1 -19 -19 v-60 a19 19 0 0 1 19 -19 z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.5"
        opacity="0.2"
      />

      {/* Subtle inner shadow for GitHub depth */}
      <path
        d="M20 0 h60 a20 20 0 0 1 20 20 v60 a20 20 0 0 1 -20 20 h-60 a20 20 0 0 1 -20 -20 v-60 a20 20 0 0 1 20 -20 z"
        fill="none"
        stroke="#000000"
        strokeWidth="1"
        opacity="0.1"
        filter="url(#innerShadow)"
      />
    </svg>
  );
};

export default GiftHuntIcon;
