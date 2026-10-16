import {Audio, Video} from '@remotion/media';
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {
  Chapter,
  CHAPTERS,
  SPEAKER_COLORS,
  USE_EMBEDDED_AUDIO,
} from './chapters';

const FONT_STACK =
  'Hiragino Sans, Hiragino Kaku Gothic ProN, Yu Gothic, Noto Sans JP, sans-serif';

// The suits only appear at the end of Sobaya's two lines. A black ♠ would disappear into the dark
// subtitle plate, so each suit is drawn in its own accent colour instead of the printed card colour.
const SUIT_COLORS: Record<string, string> = {
  '♠': '#f2f2f2',
  '♥': '#ff5470',
};

const SubtitleText: React.FC<{text: string}> = ({text}) => {
  const last = text.slice(-1);
  const suitColor = SUIT_COLORS[last];
  if (!suitColor) {
    return <>{text}</>;
  }
  return (
    <>
      {text.slice(0, -1)}
      <span style={{color: suitColor, fontSize: '1.15em', marginLeft: '0.08em'}}>
        {last}
      </span>
    </>
  );
};

const ChapterClip: React.FC<{chapter: Chapter}> = ({chapter}) => {
  const frame = useCurrentFrame();

  // fade the card in 4 frames before the line starts and out 6 frames after it ends
  const opacity = interpolate(
    frame,
    [
      chapter.speechIn - 4,
      chapter.speechIn,
      chapter.speechOut,
      chapter.speechOut + 6,
    ],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Video
        src={staticFile(chapter.video)}
        muted={!USE_EMBEDDED_AUDIO}
        volume={USE_EMBEDDED_AUDIO ? 1 : 0}
        objectFit="cover"
        style={{width: '100%', height: '100%'}}
      />
      {USE_EMBEDDED_AUDIO ? null : (
        <Sequence from={chapter.speechIn}>
          <Audio src={staticFile(chapter.wav)} volume={1} />
        </Sequence>
      )}

      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: 48,
          paddingLeft: 42,
          paddingRight: 42,
          pointerEvents: 'none',
          opacity,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            maxWidth: '94%',
          }}
        >
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '5px 18px 7px',
              borderRadius: 999,
              backgroundColor: SPEAKER_COLORS[chapter.speaker],
              color: '#fff',
              fontFamily: FONT_STACK,
              fontSize: 27,
              fontWeight: 700,
              letterSpacing: '0.06em',
              lineHeight: 1,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.55)',
            }}
          >
            {chapter.speakerLabel}
          </div>
          <div
            style={{
              padding: '14px 30px 18px',
              borderRadius: 16,
              backgroundColor: 'rgba(0, 0, 0, 0.78)',
              color: '#fff',
              fontFamily: FONT_STACK,
              fontSize: 42,
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: '0.02em',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              textShadow: '0 3px 0 #000, 3px 0 0 #000, -3px 0 0 #000',
            }}
          >
            <SubtitleText text={chapter.subtitle} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const BungeeApp: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {CHAPTERS.map((chapter) => {
        const start = from;
        from += chapter.frames;
        return (
          <Sequence
            key={chapter.id}
            from={start}
            durationInFrames={chapter.frames}
            name={chapter.id}
          >
            <ChapterClip chapter={chapter} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
