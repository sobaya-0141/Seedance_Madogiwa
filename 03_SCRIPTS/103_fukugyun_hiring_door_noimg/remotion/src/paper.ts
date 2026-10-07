/**
 * Geometry of the contract paper, measured off the H3 output at full resolution (1344x768).
 *
 * H3 renders no text in this run, so the signed name is composited here. It also wrote a stray
 * mark on the signature line of both shots (a Latin squiggle in ch15, a garbled kanji in ch17);
 * `stray` is the rectangle that has to be masked with paper colour before the name goes down.
 */

export const VIDEO = {width: 1344, height: 768, fps: 24} as const;

export type PaperGeometry = {
  /** Left end of the ruled signature line, in video pixels. */
  lineX: number;
  /** Baseline the handwriting sits on, in video pixels. */
  baselineY: number;
  /** Rectangle covering the stray mark H3 drew, in video pixels. */
  stray: {x: number; y: number; width: number; height: number};
  /** Chapter 17 only: the faint upper half of the mark, cloned separately (see Ch17). */
  strayTop?: {x: number; y: number; width: number; height: number};
  /** Median colour of clean paper beside the signature line. */
  paper: string;
  /** Ink colour of the handwriting. */
  ink: string;
  /** Size of the handwriting, in video pixels. */
  fontSize: number;
  /** The paper is not perfectly square to camera; the writing follows it. */
  rotation: number;
};

export const CH15: PaperGeometry = {
  lineX: 583,
  baselineY: 427,
  stray: {x: 519, y: 399, width: 66, height: 33},
  paper: 'rgb(154, 158, 164)',
  ink: '#262b33',
  fontSize: 27,
  rotation: -1.2,
};

export const CH17: PaperGeometry = {
  lineX: 586,
  baselineY: 431,
  // The stray kanji runs x 537-578, y 410-444: dark strokes from 422 down, and a faint upper
  // half from 410 that only shows once the red lamp flares. The only clean paper to clone from is
  // the 40px band at y 446-486 (below the mark, above the ruled line at y 488), which is not tall
  // enough for one patch, so it is covered by two that sample from different depths in that band.
  stray: {x: 534, y: 420, width: 48, height: 26},
  strayTop: {x: 534, y: 408, width: 48, height: 13},
  paper: 'rgb(92, 96, 101)',
  ink: '#2b3039',
  fontSize: 25,
  rotation: -1.0,
};

/** The name as it is written on the contract, before the Window-Side King renames him. */
export const OLD_NAME = '福ちゃん';
/** The name he is given at the end of the episode. */
export const NEW_NAME = '福ギュン';

/** A Japanese face that reads as brush-written rather than typeset. */
export const HANDWRITING =
  '"Hiragino Mincho ProN", "Hiragino Mincho Pro", "YuMincho", "Yu Mincho", serif';
