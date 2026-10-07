import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {CH17, HANDWRITING, NEW_NAME, OLD_NAME} from './paper';
import {CloneMask} from './CloneMask';

/**
 * Chapter 17 — the name lifts off the contract, changes, and settles back as the new one.
 *
 * H3 generated only the golden thread of light (it renders no text at all in this run), so the
 * name itself is composited here and keyed to that thread's four beats. The paper is static for
 * the whole shot, so the writing is placed rather than tracked.
 */
export const CH17_DURATION = 124;

/** Beat boundaries, in frames, matching the light H3 generated. */
const LIFT_END = 31; // the thread peels up out of the signature line
const MORPH_END = 62; // it hovers and turns on itself, changing shape
const SETTLE_END = 96; // it sinks back into the line
/** How far above the line the name floats, in video pixels. */
const FLOAT_HEIGHT = 58;

const GOLD = '#ffcf6a';

export const Ch17Transform: React.FC = () => {
  const frame = useCurrentFrame();

  // Airborne between LIFT_END and SETTLE_END; on the paper at either end.
  const lift = interpolate(
    frame,
    [0, LIFT_END, SETTLE_END, SETTLE_END + 8],
    [0, FLOAT_HEIGHT, FLOAT_HEIGHT, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const airborne = interpolate(
    frame,
    [0, LIFT_END, SETTLE_END, SETTLE_END + 8],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // While airborne the name is a ribbon of light riding with the thread, so it thins out and
  // glows; once it lands it is ink on paper again.
  const opacity = interpolate(airborne, [0, 1], [1, 0.55]);
  const glow = airborne * 18;
  const colour = airborne > 0.5 ? GOLD : CH17.ink;

  // The thread turns on itself through the middle beat, and the name changes with it.
  const half = (MORPH_END + LIFT_END) / 2;
  const toNew = interpolate(frame, [LIFT_END + 4, half, MORPH_END], [0, 0.5, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const squeeze = 1 - Math.sin(Math.min(Math.max(toNew, 0), 1) * Math.PI) * 0.75;
  const wobble = Math.sin(frame / 3.2) * airborne * 1.6;

  // One gold pulse as the signature field flares at the end of the shot.
  const pulse = interpolate(frame, [SETTLE_END + 4, SETTLE_END + 12, SETTLE_END + 26], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const common: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    fontFamily: HANDWRITING,
    fontSize: CH17.fontSize,
    lineHeight: 1,
    letterSpacing: 2,
    whiteSpace: 'nowrap',
    color: colour,
    textShadow: glow > 0.5 ? `0 0 ${glow}px ${GOLD}, 0 0 ${glow * 2}px ${GOLD}` : 'none',
  };

  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <OffthreadVideo src={staticFile('ch17.mp4')} />
      {/* The stray kanji H3 wrote on the "blank" line, covered with clean paper cloned from
          34px below it, so the lamp flare's horizontal gradient carries across it correctly. */}
      <AbsoluteFill>
        <CloneMask src="ch17.mp4" rect={CH17.stray} offsetX={0} offsetY={34} feather={6} />
        {CH17.strayTop ? (
          <CloneMask src="ch17.mp4" rect={CH17.strayTop} offsetX={0} offsetY={54} feather={4} />
        ) : null}
      </AbsoluteFill>
      <AbsoluteFill style={{mixBlendMode: airborne > 0.5 ? 'screen' : 'multiply'}}>
        <div
          style={{
            position: 'absolute',
            left: CH17.lineX,
            top: CH17.baselineY - CH17.fontSize,
            width: 240,
            height: CH17.fontSize * 1.4,
            transform: `translateY(${-lift}px) rotate(${CH17.rotation + wobble}deg) scaleX(${squeeze})`,
            transformOrigin: 'left bottom',
            opacity,
          }}
        >
          <div style={{...common, opacity: 1 - toNew}}>{OLD_NAME}</div>
          <div style={{...common, opacity: toNew}}>{NEW_NAME}</div>
        </div>
      </AbsoluteFill>
      {/* The signature field flares gold once as the light goes out. */}
      <AbsoluteFill style={{mixBlendMode: 'screen', opacity: pulse}}>
        <div
          style={{
            position: 'absolute',
            left: CH17.lineX - 14,
            top: CH17.baselineY - CH17.fontSize - 6,
            width: 220,
            height: CH17.fontSize + 16,
            borderRadius: 14,
            background: `radial-gradient(ellipse at center, ${GOLD}aa 0%, transparent 70%)`,
            filter: 'blur(6px)',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
