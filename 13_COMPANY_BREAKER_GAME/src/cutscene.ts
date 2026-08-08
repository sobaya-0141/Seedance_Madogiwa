/**
 * Seedance製カットシーン動画のフルスクリーン再生プレイヤー（cutscene.css と対で使う）。
 *
 * 使い方:
 *   await playCutscene(root, { src: "videos/opening.mp4" });
 *   // ← 動画終了後のゲーム処理をこの後に書くだけでよい
 *
 * 再生完了・スキップ・読み込み失敗のいずれでも resolve する。動画ファイルが
 * まだ配置されていない（404になる）段階でも自動でスキップされ、ゲームフローは止まらない。
 */
export interface CutsceneOptions {
  /** public/ 配下の動画パス。base:"./" 運用のため先頭スラッシュを付けない（例: "videos/opening.mp4"） */
  src: string;
  /** 読み込み中に表示する静止画（任意。Seedanceキーフレームの流用を推奨） */
  poster?: string;
  /** タップ/クリックでスキップできるか（既定: true） */
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
    // 動画未配置(404)や破損でもゲームを止めずに次の状態へ進める
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

    // 音声付きの自動再生を試みる。直前にユーザー操作（タイトルのタップ等）があれば通る。
    // ブロックされた場合はmuteにせず「タップで再生」に切り替えて音声を守る。
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
