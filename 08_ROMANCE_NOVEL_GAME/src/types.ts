/** そば屋の表情。SVGアバターの描き分けに使う。 */
export type Mood = "neutral" | "happy" | "fluster" | "surprise";

export interface Choice {
  /** ボタンに表示する選択肢テキスト。 */
  text: string;
  /** 好感度の増減。 */
  points: number;
  /** 選択後に表示されるそば屋の反応セリフ。 */
  response: string;
  /** 反応時のそば屋の表情。 */
  mood: Mood;
  /** ビールを渡す選択肢（毎シーン1つ・最大加点）。 */
  isBeer?: boolean;
}

export interface Scene {
  /** シーンの舞台名（画面上部に表示）。 */
  place: string;
  /** 背景を切り替えるためのキー。 */
  bg: string;
  /** 選択前に順に読ませる地の文・セリフ。 */
  lines: string[];
  /** 選択のときのそば屋の表情。 */
  mood: Mood;
  /** 選択肢（ビールを含め3つ）。 */
  choices: Choice[];
}

export interface Ending {
  /** この結末になる好感度の下限（この値以上）。 */
  min: number;
  title: string;
  lines: string[];
  /** 好感度MAXで到達する“クリア”エンドか。 */
  clear?: boolean;
}
