import React from 'react';
import {OffthreadVideo, staticFile} from 'remotion';
import {VIDEO} from './paper';

/**
 * Hides a stray mark by cloning a clean piece of the SAME sheet over it.
 *
 * A flat colour patch does not survive chapter 17: the golden light sweeps across the paper and
 * changes its brightness and hue through the shot, so any fixed fill — even one re-sampled per
 * frame from elsewhere on the page — reads as a rectangle sitting on top. Cloning the paper from
 * `offsetX` pixels away carries the real grain, the real gradient and the real moving light with
 * it, for free.
 *
 * The direction of the offset matters. Chapter 17's red lamp flare is centred to the RIGHT of the
 * mark, so the paper's brightness gradient across it is mostly horizontal; cloning sideways there
 * leaves a visibly darker patch. Cloning straight DOWN keeps the same x, so the horizontal
 * gradient matches exactly, and the clean band between the ruled lines (y 395 to 488, measured) is
 * just tall enough to do it without dragging a rule into frame.
 */
export const CloneMask: React.FC<{
  src: string;
  rect: {x: number; y: number; width: number; height: number};
  offsetX: number;
  offsetY?: number;
  /** Width of the feathered edge, in pixels. */
  feather?: number;
}> = ({src, rect, offsetX, offsetY = 0, feather = 9}) => {
  // `rect` is covered completely; the feather is a soft ring OUTSIDE it, so the element is the
  // rect grown by `feather` on every side. An elliptical fade would leave the rect's corners
  // showing, so this intersects a horizontal and a vertical gradient to feather a RECTANGLE.
  const width = rect.width + feather * 2;
  const height = rect.height + feather * 2;
  const fx = (feather / width) * 100;
  const fy = (feather / height) * 100;
  const fade =
    `linear-gradient(to right, transparent 0%, #000 ${fx}%, #000 ${100 - fx}%, transparent 100%), ` +
    `linear-gradient(to bottom, transparent 0%, #000 ${fy}%, #000 ${100 - fy}%, transparent 100%)`;
  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x - feather,
        top: rect.y - feather,
        width,
        height,
        overflow: 'hidden',
        WebkitMaskImage: fade,
        maskImage: fade,
        WebkitMaskComposite: 'source-in',
        maskComposite: 'intersect',
      }}
    >
      <OffthreadVideo
        src={staticFile(src)}
        style={{
          position: 'absolute',
          left: -(rect.x - feather + offsetX),
          top: -(rect.y - feather + offsetY),
          width: VIDEO.width,
          height: VIDEO.height,
        }}
      />
    </div>
  );
};
