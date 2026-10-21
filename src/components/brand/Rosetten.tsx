import type { ReactNode } from 'react';
import { ROSETT } from './palette';

export type RosettenPose = 'hello' | 'happy' | 'sleep' | 'lost' | 'sad' | 'locked';

const STROKE = {
  stroke: ROSETT.ink,
  strokeWidth: 4,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;

const ARM_DOWN_LEFT = 'M48 132C32 136 30 154 44 158';
const ARM_DOWN_RIGHT = 'M152 132C168 136 170 154 156 158';

interface FigureProps {
  leftArm: string;
  rightArm: string;
  droop?: boolean;
  wiggle?: boolean;
  /** Stroked extras drawn with the figure (question mark, cloud, padlock, z's). */
  extras?: ReactNode;
  /** Face and other unstroked detail. */
  face: ReactNode;
  /** Unstroked extras (dots, tears). */
  overlay?: ReactNode;
}

const Figure = ({ leftArm, rightArm, droop = false, wiggle = false, extras, face, overlay }: FigureProps) => (
  <>
    <ellipse cx="100" cy="192" rx="52" ry="6" fill={ROSETT.ink} opacity=".1" />
    <g {...STROKE}>
      <path d={leftArm} fill="none" />
      <path d={rightArm} fill="none" />
      <rect x="66" y="176" width="24" height="14" rx="7" fill={ROSETT.deep} />
      <rect x="110" y="176" width="24" height="14" rx="7" fill={ROSETT.deep} />
      <rect x="48" y="98" width="104" height="82" rx="16" fill={ROSETT.pink} />
      <rect x="40" y="76" width="120" height="32" rx="12" fill={ROSETT.deep} />
      <rect x="90" y="76" width="20" height="32" fill={ROSETT.cream} />
      <g className={wiggle ? 'rs-wiggle' : undefined}>
        <path
          d={droop ? 'M100 76C80 44 46 58 64 78C74 86 92 82 100 76Z' : 'M100 76C78 30 38 46 62 74C72 82 92 80 100 76Z'}
          fill={ROSETT.pink}
        />
        <path
          d={droop ? 'M100 76C120 44 154 58 136 78C126 86 108 82 100 76Z' : 'M100 76C122 30 162 46 138 74C128 82 108 80 100 76Z'}
          fill={ROSETT.pink}
        />
        <rect x="90" y="64" width="20" height="18" rx="7" fill={ROSETT.cream} />
      </g>
      {extras}
    </g>
    <ellipse cx="70" cy="146" rx="9" ry="5.5" fill={ROSETT.cream} opacity=".55" />
    <ellipse cx="130" cy="146" rx="9" ry="5.5" fill={ROSETT.cream} opacity=".55" />
    {face}
    {overlay}
  </>
);

const RoundEyes = ({ dx = 0 }: { dx?: number }) => (
  <>
    <g fill={ROSETT.ink}>
      <ellipse cx={82 + dx} cy={130} rx={6} ry={7} />
      <ellipse cx={118 + dx} cy={130} rx={6} ry={7} />
    </g>
    <g fill={ROSETT.highlight}>
      <circle cx={84 + dx} cy={127} r={2.2} />
      <circle cx={120 + dx} cy={127} r={2.2} />
    </g>
  </>
);

const line = { fill: 'none', stroke: ROSETT.ink, strokeWidth: 4, strokeLinecap: 'round' } as const;

const POSES: Record<RosettenPose, () => ReactNode> = {
  hello: () => (
    <Figure
      leftArm="M48 132C28 126 24 104 36 94"
      rightArm={ARM_DOWN_RIGHT}
      face={
        <>
          <RoundEyes />
          <path d="M90 146Q100 158 110 146" {...line} />
        </>
      }
    />
  ),
  happy: () => (
    <Figure
      leftArm="M48 132C28 126 24 104 36 94"
      rightArm="M152 132C172 126 176 104 164 94"
      face={
        <>
          <path d="M74 132Q82 120 90 132M110 132Q118 120 126 132" {...line} />
          <path d="M88 144Q100 168 112 144Z" fill={ROSETT.ink} stroke={ROSETT.ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M95 158Q100 152 105 158Z" fill={ROSETT.pink} />
        </>
      }
    />
  ),
  sleep: () => (
    <Figure
      leftArm={ARM_DOWN_LEFT}
      rightArm={ARM_DOWN_RIGHT}
      droop
      extras={<path d="M146 36H162L146 56H162M168 18H178L168 30H178" fill="none" />}
      face={
        <>
          <path d="M74 130Q82 138 90 130M110 130Q118 138 126 130" {...line} />
          <path d="M94 150Q100 154 106 150" {...line} />
        </>
      }
    />
  ),
  lost: () => (
    <Figure
      leftArm="M48 130C26 118 26 92 50 80"
      rightArm={ARM_DOWN_RIGHT}
      extras={<path d="M150 40C150 22 178 22 178 40C178 52 164 52 164 66" fill="none" strokeWidth={5} />}
      overlay={<circle cx="164" cy="78" r="3.5" fill={ROSETT.ink} />}
      face={
        <>
          <g fill={ROSETT.ink}>
            <circle cx="80" cy="128" r="5.5" />
            <circle cx="116" cy="128" r="5.5" />
          </g>
          <path d="M72 122L90 116M128 122L110 116" {...line} />
          <path d="M88 152Q94 145 100 152T112 152" {...line} />
        </>
      }
    />
  ),
  sad: () => (
    <Figure
      leftArm={ARM_DOWN_LEFT}
      rightArm={ARM_DOWN_RIGHT}
      droop
      extras={
        <>
          <path
            d="M140 40C132 40 128 46 130 52C122 52 120 62 128 64H164C174 64 176 52 168 50C168 42 152 38 140 40Z"
            fill={ROSETT.cream}
          />
          <path d="M134 74L170 34" fill="none" />
        </>
      }
      overlay={<path d="M126 138C121 148 131 148 126 138Z" fill={ROSETT.tear} stroke={ROSETT.ink} strokeWidth={2} />}
      face={
        <>
          <g fill={ROSETT.ink}>
            <ellipse cx="82" cy="130" rx="6" ry="7" />
            <ellipse cx="118" cy="130" rx="6" ry="7" />
          </g>
          <path d="M72 122L90 116M128 122L110 116" {...line} />
          <path d="M90 154Q100 144 110 154" {...line} />
        </>
      }
    />
  ),
  locked: () => (
    <Figure
      leftArm={ARM_DOWN_LEFT}
      rightArm="M152 134C168 138 170 150 158 156"
      extras={
        <>
          <path d="M150 152V142C150 128 174 128 174 142V152" fill="none" />
          <rect x="144" y="150" width="36" height="28" rx="7" fill={ROSETT.gold} />
        </>
      }
      overlay={<circle cx="162" cy="162" r="4" fill={ROSETT.ink} />}
      face={
        <>
          <RoundEyes dx={4} />
          <path d="M92 150H108" {...line} />
        </>
      }
    />
  ),
};

interface RosettenProps {
  pose: RosettenPose;
  size?: number;
  className?: string;
}

/** The mascot. Decorative: the heading next to it says what is going on. */
export const Rosetten = ({ pose, size = 120, className }: RosettenProps) => (
  <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" className={className}>
    {POSES[pose]()}
  </svg>
);

interface RosettenLoaderProps {
  label: string;
  size?: number;
  className?: string;
}

/** Floats and wiggles its bow while something loads; stands still under reduced motion. */
export const RosettenLoader = ({ label, size = 120, className }: RosettenLoaderProps) => (
  <div role="status" aria-label={label} className={className}>
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
      <g className="rs-float">
        <Figure
          leftArm={ARM_DOWN_LEFT}
          rightArm={ARM_DOWN_RIGHT}
          wiggle
          face={
            <>
              <RoundEyes />
              <path d="M92 146Q100 154 108 146" {...line} />
            </>
          }
        />
      </g>
    </svg>
  </div>
);
