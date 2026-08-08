/**
 * Seedance製カットシーン動画のフルスクリーン再生プレイヤー（cutscene.css と対で使う）。
 *
 * 再生完了・スキップ・読み込み失敗のいずれでも resolve する。動画ファイルが
 * まだ配置されていない段階でも自動でスキップされ、ゲームフローは止まらない。
 */
export interface CutsceneOptions {
  /** public/ 配下の動画パス。base:"./" 運用のため先頭スラッシュを付けない */
  src: string;
  poster?: string;
  skippable?: boolean;
}

export function playCutscene(root: HTMLElement, options: CutsceneOptions): Promise<void> {
  const skippable = options.skippable !== false;
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "cutscene";

    const video = document.createElement("video");
    video.className = "cutscene-video";
    video.src = options.src;
    if (options.poster) video.poster = options.poster;
    video.playsInline = true;
    video.preload = "auto";

    const hint = document.createElement("span");
    hint.className = "cutscene-hint";
    hint.textContent = skippable ? "▶ タップでスキップ" : "";

    overlay.append(video, hint);
    root.appendChild(overlay);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      video.pause();
      video.removeAttribute("src");
      video.load();
      overlay.remove();
      resolve();
    };

    video.addEventListener("ended", finish);
    video.addEventListener("error", finish);

    let playing = false;
    overlay.addEventListener("click", () => {
      if (playing) {
        if (skippable) finish();
        return;
      }
      video
        .play()
        .then(() => {
          playing = true;
          hint.textContent = skippable ? "▶ タップでスキップ" : "";
        })
        .catch(finish);
    });

    video
      .play()
      .then(() => {
        playing = true;
      })
      .catch(() => {
        hint.textContent = "▶ タップで再生";
      });
  });
}
