// 105_sobaya_android_bungee_app — chapter table for the final cut.
//
// frames        : must equal the '- Duration: ... Frames: N' line in script.md for that chapter.
// speechIn/Out  : frame range (relative to the chapter) in which the dialogue audio plays, taken from
//                 the chapter's Action beats in script.md. The subtitle fades in just before speechIn
//                 and out just after speechOut.
// subtitle      : the burned-in line. Sobaya's two lines end with a playing-card suit (ch1 = ♠,
//                 ch4 = ♥) at the user's request — a nod to the card fan on his ALT DESIGN sheet.
// wav           : the local take. Only used when useEmbeddedAudio is false (see Composition.tsx).

export type Speaker = 'sobaya' | 'yametaro';

export type Chapter = {
  id: string;
  video: string;
  wav: string;
  frames: number;
  speaker: Speaker;
  speakerLabel: string;
  subtitle: string;
  speechIn: number;
  speechOut: number;
};

export const FPS = 24;
export const WIDTH = 1344;
export const HEIGHT = 768;

// script.md step 3: keep H3's embedded audio unless the pilot hears degradation. Flip this to false
// to mute the chapter mp4s and lay the original local wavs over them instead.
export const USE_EMBEDDED_AUDIO = true;

export const SPEAKER_COLORS: Record<Speaker, string> = {
  // the magenta star / purple teardrop of Sobaya's ALT DESIGN mask
  sobaya: '#c23fb0',
  // the lavender of Yametaro's shirt
  yametaro: '#8b7fd4',
};

export const CHAPTERS: Chapter[] = [
  {
    id: 'ch1',
    video: 'ch1.mp4',
    wav: 'ch1_line1_sobaya.wav',
    frames: 141,
    speaker: 'sobaya',
    speakerLabel: 'そば屋',
    subtitle: '新しいAndroidアプリをリリースしたから使ってみてよ♠',
    speechIn: 48,
    speechOut: 132,
  },
  {
    id: 'ch2',
    video: 'ch2.mp4',
    wav: 'ch2_line1_yametaro.wav',
    frames: 124,
    speaker: 'yametaro',
    speakerLabel: 'やめ太郎',
    subtitle: 'お！さすがAndroidテックリードや！',
    speechIn: 31,
    speechOut: 118,
  },
  {
    id: 'ch3',
    video: 'ch3.mp4',
    wav: 'ch3_line1_yametaro.wav',
    frames: 124,
    speaker: 'yametaro',
    speakerLabel: 'やめ太郎',
    subtitle: 'ってUIキモ！しかもクラッシュした',
    speechIn: 19,
    speechOut: 98,
  },
  {
    id: 'ch4',
    video: 'ch4.mp4',
    wav: 'ch4_line1_sobaya.wav',
    frames: 158,
    speaker: 'sobaya',
    speakerLabel: 'そば屋',
    subtitle: 'ボクのアプリはクソUXとバグ両方の性質を併せ持つ♥',
    speechIn: 24,
    speechOut: 149,
  },
  {
    id: 'ch5',
    video: 'ch5.mp4',
    wav: 'ch5_line1_yametaro.wav',
    frames: 124,
    speaker: 'yametaro',
    speakerLabel: 'やめ太郎',
    subtitle: 'バンジーバグやんけ！ええから早く直さんかい',
    speechIn: 17,
    speechOut: 106,
  },
];

export const TOTAL_FRAMES = CHAPTERS.reduce((sum, c) => sum + c.frames, 0);
