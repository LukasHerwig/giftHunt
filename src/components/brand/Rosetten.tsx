import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ROSETT } from './palette';

export type RosettenPose = 'hello' | 'happy' | 'sleep' | 'lost' | 'sad' | 'locked' | 'wink' | 'love' | 'teary' | 'oops';

// The outline follows the theme (dark ink on light, light ink on dark) through `text-gh-ink`; the face stays dark on the pink body.
const STROKE = {
  stroke: 'currentColor',
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
    <ellipse cx="100" cy="192" rx="52" ry="6" fill="currentColor" opacity=".1" />
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
    <g fill={ROSETT.ink} className="rs-blink">
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
      overlay={<circle cx="164" cy="78" r="3.5" fill="currentColor" />}
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
        <g transform="translate(8 -18)">
          <path
            d="M140 40C132 40 128 46 130 52C122 52 120 62 128 64H164C174 64 176 52 168 50C168 42 152 38 140 40Z"
            fill={ROSETT.cream}
          />
          <path d="M134 74L170 34" fill="none" />
        </g>
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
  wink: () => (
    <Figure
      leftArm={ARM_DOWN_LEFT}
      rightArm="M152 132C172 126 176 108 164 98"
      extras={<path d="M146 84L150 92L158 96L150 100L146 108L142 100L134 96L142 92Z" fill={ROSETT.gold} strokeWidth={2.5} />}
      face={
        <>
          <g fill={ROSETT.ink} className="rs-blink">
            <ellipse cx="82" cy="130" rx="6" ry="7" />
          </g>
          <circle cx="84" cy="127" r="2.2" fill={ROSETT.highlight} />
          <path d="M110 132Q118 122 126 132" {...line} />
          <path d="M90 146Q100 158 110 146" {...line} />
        </>
      }
    />
  ),
  love: () => (
    <Figure
      leftArm="M48 134C32 128 34 112 50 112"
      rightArm="M152 134C168 128 166 112 150 112"
      extras={
        <>
          <path d="M164 60C156 54 156 46 161 46C163 46 164 47 164 49C164 47 165 46 167 46C172 46 172 54 164 60Z" fill={ROSETT.heart} strokeWidth={2.5} />
          <path d="M180 38C176 35 176 31 178 31C180 31 180 32 180 33C180 32 181 31 182 31C185 31 185 35 180 38Z" fill={ROSETT.heart} strokeWidth={2.5} />
        </>
      }
      face={
        <>
          <ellipse cx="68" cy="148" rx="10" ry="6" fill={ROSETT.heart} opacity=".55" />
          <ellipse cx="132" cy="148" rx="10" ry="6" fill={ROSETT.heart} opacity=".55" />
          <g fill={ROSETT.heart} stroke={ROSETT.ink} strokeWidth={3} strokeLinejoin="round">
            <path d="M82 140C68 130 68 118 77 118C80 118 82 120 82 123C82 120 84 118 87 118C96 118 96 130 82 140Z" />
            <path d="M118 140C104 130 104 118 113 118C116 118 118 120 118 123C118 120 120 118 123 118C132 118 132 130 118 140Z" />
          </g>
          <path d="M90 150Q100 162 110 150" {...line} />
        </>
      }
    />
  ),
  teary: () => (
    <Figure
      leftArm={ARM_DOWN_LEFT}
      rightArm={ARM_DOWN_RIGHT}
      droop
      overlay={
        <g fill={ROSETT.tear} stroke={ROSETT.ink} strokeWidth={2}>
          <path d="M72 142C67 152 77 152 72 142Z" />
          <path d="M128 142C123 152 133 152 128 142Z" />
        </g>
      }
      face={
        <>
          <g fill={ROSETT.ink} className="rs-blink">
            <ellipse cx="82" cy="130" rx="8" ry="9" />
            <ellipse cx="118" cy="130" rx="8" ry="9" />
          </g>
          <g fill={ROSETT.highlight}>
            <circle cx="85" cy="126" r="3.4" />
            <circle cx="121" cy="126" r="3.4" />
            <circle cx="80" cy="134" r="1.6" />
            <circle cx="116" cy="134" r="1.6" />
          </g>
          <path d="M72 120L90 112M128 120L110 112" {...line} />
          <path d="M92 154Q100 147 108 154" {...line} />
        </>
      }
    />
  ),
  oops: () => (
    <Figure
      leftArm="M48 134C32 126 38 110 56 114"
      rightArm="M152 134C168 126 162 110 144 114"
      overlay={<path d="M158 92C152 102 162 102 158 92Z" fill={ROSETT.tear} stroke={ROSETT.ink} strokeWidth={2} />}
      face={
        <>
          <g fill={ROSETT.highlight} stroke={ROSETT.ink} strokeWidth={3}>
            <circle cx="82" cy="130" r="10" />
            <circle cx="118" cy="130" r="10" />
          </g>
          <g fill={ROSETT.ink} className="rs-blink">
            <circle cx="82" cy="131" r="3.6" />
            <circle cx="118" cy="131" r="3.6" />
          </g>
          <ellipse cx="100" cy="154" rx="6" ry="8" fill={ROSETT.ink} />
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
  <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" className={cn('text-gh-ink', className)}>
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
  <div role="status" className={className}>
    <span className="sr-only">{label}</span>
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" className="text-gh-ink">
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

/** Rosetten from the lid up, to peek over a card's edge. Look direction is -1..1. */
export const RosettenPeek = ({ look = 0, className }: { look?: number; className?: string }) => (
  <svg viewBox="0 0 200 84" width={120} height={50} aria-hidden="true" className={cn('text-gh-ink', className)}>
    <g {...STROKE}>
      <path d="M100 52C78 6 38 22 62 50C72 58 92 56 100 52Z" fill={ROSETT.pink} />
      <path d="M100 52C122 6 162 22 138 50C128 58 108 56 100 52Z" fill={ROSETT.pink} />
      <rect x="40" y="52" width="120" height="40" rx="12" fill={ROSETT.deep} />
      <rect x="90" y="52" width="20" height="40" fill={ROSETT.cream} />
      <rect x="90" y="40" width="20" height="18" rx="7" fill={ROSETT.cream} />
    </g>
    <g fill={ROSETT.ink}>
      <ellipse cx={66 + look * 6} cy={74} rx={5} ry={6} />
      <ellipse cx={134 + look * 6} cy={74} rx={5} ry={6} />
    </g>
  </svg>
);

/** Rosetten in mid-run, seen from the front, leaning forward. Two leg positions swap via CSS. */
export const RosettenRun = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" width={84} height={84} aria-hidden="true" className={cn('text-gh-ink', className)}>
    <g transform="rotate(8 100 190)">
      <ellipse cx="100" cy="194" rx="46" ry="5" fill="currentColor" opacity=".1" />
      <g {...STROKE}>
        <path d="M48 130C30 140 24 118 34 108" fill="none" />
        <path d="M152 130C170 120 176 142 166 152" fill="none" />
        <g className="rs-step-a">
          <rect x="56" y="172" width="24" height="14" rx="7" fill={ROSETT.deep} transform="rotate(-18 68 179)" />
          <rect x="118" y="178" width="24" height="14" rx="7" fill={ROSETT.deep} transform="rotate(14 130 185)" />
        </g>
        <g className="rs-step-b">
          <rect x="62" y="178" width="24" height="14" rx="7" fill={ROSETT.deep} transform="rotate(14 74 185)" />
          <rect x="112" y="172" width="24" height="14" rx="7" fill={ROSETT.deep} transform="rotate(-18 124 179)" />
        </g>
        <rect x="48" y="98" width="104" height="82" rx="16" fill={ROSETT.pink} />
        <rect x="40" y="76" width="120" height="32" rx="12" fill={ROSETT.deep} />
        <rect x="90" y="76" width="20" height="32" fill={ROSETT.cream} />
        <path d="M100 76C80 40 44 56 64 78C74 86 92 82 100 76Z" fill={ROSETT.pink} />
        <path d="M100 76C120 40 156 56 136 78C126 86 108 82 100 76Z" fill={ROSETT.pink} />
        <rect x="90" y="64" width="20" height="18" rx="7" fill={ROSETT.cream} />
      </g>
      <g fill={ROSETT.ink}>
        <ellipse cx="86" cy="130" rx="6" ry="7" />
        <ellipse cx="122" cy="130" rx="6" ry="7" />
      </g>
      <path d="M94 148Q104 158 114 148" fill="none" stroke={ROSETT.ink} strokeWidth={4} strokeLinecap="round" />
    </g>
  </svg>
);
