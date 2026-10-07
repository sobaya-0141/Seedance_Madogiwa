import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {PaperGeometry} from './paper';

export type PaperColours = {
  firstFrame: number;
  colours: number[][];
};

/**
 * Covers the stray mark H3 drew on the "blank" signature line with a patch of paper.
 *
 * The colour comes from `sample_paper_colour.py`, which measures a clean rectangle of the same
 * sheet on every frame. A single fixed colour is not enough: the golden light in chapter 17
 * brightens the paper by about 25 levels through the middle of the shot, and a fixed patch then
 * reads as a grey blob sitting on the page.
 *
 * The patch is feathered with a radial gradient rather than given a hard edge, so it dissolves
 * into the surrounding paper grain instead of looking like a sticker.
 */
export const StrayMask: React.FC<{geometry: PaperGeometry; colours: PaperColours}> = ({
  geometry,
  colours,
}) => {
  const frame = useCurrentFrame();
  const index = Math.min(Math.max(frame, 0), colours.colours.length - 1);
  const [r, g, b] = colours.colours[index] ?? [150, 155, 160];
  const solid = `rgb(${r}, ${g}, ${b})`;
  const clear = `rgba(${r}, ${g}, ${b}, 0)`;
  const {stray} = geometry;

  // Overscan the element so the gradient has room to fade out beyond the mark itself.
  const pad = 10;
  return (
    <div
      style={{
        position: 'absolute',
        left: stray.x - pad,
        top: stray.y - pad,
        width: stray.width + pad * 2,
        height: stray.height + pad * 2,
        background: `radial-gradient(ellipse at center, ${solid} 0%, ${solid} 52%, ${clear} 100%)`,
        filter: 'blur(1.5px)',
      }}
    />
  );
};
