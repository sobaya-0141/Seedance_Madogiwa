// 全エピソード共通。表示名の心の声・無線などの接尾辞も同じ色にする。
export const memberColors = {
  sobaya: '#D93646', yametaro: '#8950C8', yumemin: '#38BADD',
  yotan: '#F2CE36', fukuchan: '#36A568', tokun: '#E9872C',
  okayaman: '#3859BD', takosan: '#E56AA5', anchor: '#258D91',
  neutral: '#626975',
} as const;
export function memberColor(speaker = ''): string {
  const aliases: [RegExp, keyof typeof memberColors][] = [
    [/そば屋|そばシャーク/, 'sobaya'], [/やめ太郎|やめたろう/, 'yametaro'],
    [/ゆめみん/, 'yumemin'], [/よーたん|ヨータン/, 'yotan'],
    [/福ギュン|福ちゃん/, 'fukuchan'], [/とーくん/, 'tokun'],
    [/おかやまん/, 'okayaman'], [/たこさん/, 'takosan'],
    [/ゆめテレアナウンサー/, 'anchor'],
  ];
  return memberColors[aliases.find(([pattern]) => pattern.test(speaker))?.[1] ?? 'neutral'];
}
export function memberCaptionStyle(speaker = '') {
  return {
    color: '#fffdf7',
    WebkitTextStroke: `6px ${memberColor(speaker)}`,
    paintOrder: 'stroke fill' as const,
    textShadow: 'none',
    filter: 'drop-shadow(1px 0 0 #111820) drop-shadow(-1px 0 0 #111820) drop-shadow(0 1px 0 #111820) drop-shadow(0 -1px 0 #111820)',
  };
}
