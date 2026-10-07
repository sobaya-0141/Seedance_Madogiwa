import './style.css';
import React from 'react';
import {Composition} from 'remotion';
import {VIDEO} from './paper';
import {Ch15Signature, CH15_DURATION} from './Ch15';
import {Ch17Transform, CH17_DURATION} from './Ch17';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Ch15Signature"
        component={Ch15Signature}
        width={VIDEO.width}
        height={VIDEO.height}
        fps={VIDEO.fps}
        durationInFrames={CH15_DURATION}
      />
      <Composition
        id="Ch17Transform"
        component={Ch17Transform}
        width={VIDEO.width}
        height={VIDEO.height}
        fps={VIDEO.fps}
        durationInFrames={CH17_DURATION}
      />
    </>
  );
};
