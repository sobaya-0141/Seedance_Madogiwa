import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {CH15, HANDWRITING, OLD_NAME} from './paper';
import {StrayMask} from './StrayMask';
import paperColours from './paper-ch15.json';
import type {PaperColours} from './StrayMask';

/**
 * Chapter 15 — the close-up of the signed contract.
 *
 * H3's take spends its first 22 frames lifting the sheet into position, so the composition starts
 * there: from that point the paper is static and the handwriting can simply be placed, with no
 * tracking. The name here is deliberately the OLD one — he has not been renamed yet.
 */
export const CH15_TRIM_BEFORE = 22;
export const CH15_DURATION = 68;

export const Ch15Signature: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <OffthreadVideo src={staticFile('ch15.mp4')} trimBefore={CH15_TRIM_BEFORE} />
      {/* The mask has to paint OVER the stray mark, so it cannot be in the multiply layer —
          multiply can only darken, and the mark is darker than the paper. */}
      <AbsoluteFill>
        <StrayMask geometry={CH15} colours={paperColours as PaperColours} />
      </AbsoluteFill>
      <AbsoluteFill style={{mixBlendMode: 'multiply'}}>
        <div
          style={{
            position: 'absolute',
            left: CH15.lineX,
            top: CH15.baselineY - CH15.fontSize,
            transform: `rotate(${CH15.rotation}deg)`,
            transformOrigin: 'left bottom',
            fontFamily: HANDWRITING,
            fontSize: CH15.fontSize,
            lineHeight: 1,
            letterSpacing: 2,
            color: CH15.ink,
            whiteSpace: 'nowrap',
          }}
        >
          {OLD_NAME}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
