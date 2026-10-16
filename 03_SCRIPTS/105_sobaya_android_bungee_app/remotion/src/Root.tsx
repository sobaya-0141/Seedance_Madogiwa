import {Composition} from 'remotion';
import {BungeeApp} from './Composition';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './chapters';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BungeeApp"
      component={BungeeApp}
      width={WIDTH}
      height={HEIGHT}
      fps={FPS}
      durationInFrames={TOTAL_FRAMES}
    />
  );
};
