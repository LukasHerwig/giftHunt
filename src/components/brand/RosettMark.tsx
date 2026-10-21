import { ROSETT } from './palette';

interface RosettMarkProps {
  size?: number;
  className?: string;
}

/** The app mark: Rosetten's bow. Decorative: the wordmark next to it carries the name. */
export const RosettMark = ({ size = 28, className }: RosettMarkProps) => (
  <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className={className}>
    <g stroke={ROSETT.ink} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
      <path d="M30 38L19 58L29 54L33 60L36 54L47 58L34 38Z" fill={ROSETT.deep} />
      <path d="M32 32C20 10 4 20 10 34C14 44 28 40 32 32Z" fill={ROSETT.pink} />
      <path d="M32 32C44 10 60 20 54 34C50 44 36 40 32 32Z" fill={ROSETT.pink} />
      <rect x="25" y="26" width="14" height="14" rx="5" fill={ROSETT.cream} />
    </g>
  </svg>
);
