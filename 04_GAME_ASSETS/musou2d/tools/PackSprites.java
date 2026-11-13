import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * 画像生成で作ったキャラのコマ（マゼンタ背景 #FF00FF・1280×1280）を、ゲーム用のアトラスにまとめる。
 *
 *   java 04_GAME_ASSETS/musou2d/tools/PackSprites.java <コマのフォルダ> <動作一覧.txt> <出力先フォルダ> <名前>
 *
 * 1. マゼンタ背景を透過にする。輪郭の混ざった画素は、マゼンタとの混ざり具合から透明度を求めて色を戻す
 * 2. ジョッキの空いた部分などに透けたマゼンタの色味を抜く（ガラスは青みのグレーになる）
 * 3. 床に触れているコマは、一番下の点を床の線（pivot の y）に合わせる（動作一覧の airborne は動かさない）
 * 4. 倍率 scale で縮小し、余白を切り詰めて1枚のアトラスに詰める
 * エフェクトは動作一覧に次を書く:
 *   background black … 黒背景の光の素材（加算合成用）。明るさを透明度にして色を戻す
 *   align none       … 床の線に合わせない（キャンバス上の位置をそのまま保つ。pivot はキャンバスの中心など）
 * 1枚だけの素材（コマ数1）は <名前>.png でもよい（擬音・アイテム）
 * 出力: <名前>_0.png（アトラス）と <名前>.txt（各コマの位置と、足元からのずれ）
 */
public class PackSprites {
    record Anim(String name, int count, int fps, String mode, int hit) {}
    record Frame(String anim, int index, BufferedImage img, int offX, int offY) {}

    static final int PAGE = 4096;

    public static void main(String[] args) throws IOException {
        if (args.length != 4) {
            System.err.println("usage: PackSprites <frames dir> <anims.txt> <out dir> <name>");
            System.exit(2);
        }
        Path src = Path.of(args[0]);
        Path out = Path.of(args[2]);
        String name = args[3];
        List<Anim> anims = new ArrayList<>();
        Set<String> airborne = new HashSet<>();
        int pivotX = 640, pivotY = 1180;
        boolean black = false, alignFloor = true;
        double scale = 0.5;
        for (String line : Files.readAllLines(Path.of(args[1]))) {
            String[] f = line.trim().split("\\s+");
            if (f.length == 0 || f[0].isEmpty() || f[0].startsWith("#")) continue;
            switch (f[0]) {
                case "anim" -> {
                    int hit = 0;
                    if (f.length > 5 && f[5].startsWith("hit=")) hit = Integer.parseInt(f[5].substring(4));
                    anims.add(new Anim(f[1], Integer.parseInt(f[2]), Integer.parseInt(f[3]), f[4], hit));
                }
                case "airborne" -> { for (int i = 1; i < f.length; i++) airborne.add(f[i]); }
                case "pivot" -> { pivotX = Integer.parseInt(f[1]); pivotY = Integer.parseInt(f[2]); }
                case "scale" -> scale = Double.parseDouble(f[1]);
                case "background" -> black = f[1].equals("black");
                case "align" -> alignFloor = !f[1].equals("none");
                default -> throw new IllegalArgumentException("unknown line: " + line);
            }
        }

        List<Frame> frames = new ArrayList<>();
        StringBuilder log = new StringBuilder();
        for (Anim a : anims) {
            for (int i = 1; i <= a.count; i++) {
                String file = String.format("%s_%02d", a.name, i);
                File f = src.resolve(file + ".png").toFile();
                if (!f.exists() && a.count == 1) f = src.resolve(a.name + ".png").toFile();
                if (!f.exists()) throw new IOException("missing frame: " + f);
                BufferedImage raw = ImageIO.read(f);
                BufferedImage keyed = black ? keyBlack(raw) : key(raw);
                int shift = 0;
                if (alignFloor && !airborne.contains(file)) {
                    int lowest = lowestRow(keyed);
                    shift = pivotY - lowest;
                    keyed = shiftDown(keyed, shift);
                }
                BufferedImage small = downscale(keyed, scale);
                int[] box = bounds(small);
                BufferedImage trimmed = small.getSubimage(box[0], box[1], box[2], box[3]);
                // 足元（pivot）から見た、切り詰めた絵の左上の位置（縮小後のピクセル）
                int offX = (int) Math.round(box[0] - pivotX * scale);
                int offY = (int) Math.round(box[1] - pivotY * scale);
                frames.add(new Frame(a.name, i - 1, copy(trimmed), offX, offY));
                log.append(String.format(Locale.ROOT, "%s floor_shift=%d size=%dx%d%n", file, shift, box[2], box[3]));
            }
        }

        // 高い順に棚詰め
        List<Frame> order = new ArrayList<>(frames);
        order.sort(Comparator.comparingInt((Frame fr) -> fr.img.getHeight()).reversed());
        List<BufferedImage> pages = new ArrayList<>();
        StringBuilder meta = new StringBuilder();
        meta.append("# PackSprites.java が書き出した。手で編集しない\n");
        meta.append(String.format(Locale.ROOT, "scale %s%n", scale));
        for (Anim a : anims) meta.append(String.format("anim %s %d %d %s %d%n", a.name, a.count, a.fps, a.mode, a.hit));
        int page = -1, x = PAGE, y = 0, shelf = 0;
        Graphics2D g = null;
        StringBuilder frameLines = new StringBuilder();
        for (Frame fr : order) {
            int w = fr.img.getWidth(), h = fr.img.getHeight();
            if (x + w + 2 > PAGE) { x = 0; y += shelf + 2; shelf = 0; }
            if (page < 0 || y + h > PAGE) {
                if (g != null) g.dispose();
                BufferedImage p = new BufferedImage(PAGE, PAGE, BufferedImage.TYPE_INT_ARGB);
                pages.add(p);
                g = p.createGraphics();
                page++;
                x = 0; y = 0; shelf = 0;
            }
            g.drawImage(fr.img, x, y, null);
            frameLines.append(String.format("frame %s %d %d %d %d %d %d %d %d%n", fr.anim, fr.index, page, x, y, w, h, fr.offX, fr.offY));
            x += w + 2;
            shelf = Math.max(shelf, h);
        }
        if (g != null) g.dispose();
        Files.createDirectories(out);
        // 前回の書き出しで残った余分なページを消す
        try (var old = Files.newDirectoryStream(out, name + "_[0-9]*.png")) { for (Path o : old) Files.delete(o); }
        for (int i = 0; i < pages.size(); i++) {
            BufferedImage p = pages.get(i);
            int usedH = usedHeight(p);
            BufferedImage cropped = copy(p.getSubimage(0, 0, PAGE, Math.max(1, usedH)));
            ImageIO.write(cropped, "png", out.resolve(name + "_" + i + ".png").toFile());
            meta.append(String.format("page %d %s_%d.png%n", i, name, i));
        }
        meta.append(frameLines);
        Files.writeString(out.resolve(name + ".txt"), meta.toString());
        Files.createDirectories(out.resolve("logs"));
        Files.writeString(out.resolve("logs").resolve(name + "_pack_log.txt"), log.toString());
        System.out.println("packed " + frames.size() + " frames into " + pages.size() + " page(s)");
    }

    /** マゼンタとの混ざり具合 m = min(R,B) - G から透明度を求め、混ざった色を元に戻す */
    static BufferedImage key(BufferedImage raw) {
        int w = raw.getWidth(), h = raw.getHeight();
        BufferedImage out = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        for (int yy = 0; yy < h; yy++) {
            for (int xx = 0; xx < w; xx++) {
                int p = raw.getRGB(xx, yy);
                double r = ((p >> 16) & 255) / 255.0, gg = ((p >> 8) & 255) / 255.0, b = (p & 255) / 255.0;
                double m = Math.min(r, b) - gg;
                // 背景のマゼンタは生成のノイズで m=0.85〜0.98 にばらつくので、0.82 以上は完全な透明にする
                double a = clamp((0.82 - m) / 0.7);
                if (a <= 0.004) { out.setRGB(xx, yy, 0); continue; }
                // P = a*C + (1-a)*M（M はマゼンタ 1,0,1）を C について解く
                double cr = clamp((r - (1 - a)) / a), cg = clamp(gg / a), cb = clamp((b - (1 - a)) / a);
                // 残ったマゼンタの色味を抜く（白・グレー・赤・琥珀・青紫の逆光は変わらない）
                double e = Math.min(cr, cb) - cg;
                if (e > 0.03) { cr -= e; cb -= e; }
                int A = (int) Math.round(a * 255);
                out.setRGB(xx, yy, (A << 24) | ((int) Math.round(clamp(cr) * 255) << 16) | ((int) Math.round(clamp(cg) * 255) << 8) | (int) Math.round(clamp(cb) * 255));
            }
        }
        return out;
    }

    /**
     * 黒背景の光の素材。一番明るい色成分を透明度にし、色を割り戻す（黒＝透明、白＝不透明の白）。
     * 加算合成で描けば元の絵と同じ光り方になる。生成のノイズで黒が少し浮くので、暗い部分は切り捨てる
     */
    static BufferedImage keyBlack(BufferedImage raw) {
        int w = raw.getWidth(), h = raw.getHeight();
        BufferedImage out = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        for (int yy = 0; yy < h; yy++) {
            for (int xx = 0; xx < w; xx++) {
                int p = raw.getRGB(xx, yy);
                double r = ((p >> 16) & 255) / 255.0, gg = ((p >> 8) & 255) / 255.0, b = (p & 255) / 255.0;
                double mx = Math.max(r, Math.max(gg, b));
                double a = clamp((mx - 0.05) / 0.95);
                if (a <= 0.004) { out.setRGB(xx, yy, 0); continue; }
                int A = (int) Math.round(a * 255);
                out.setRGB(xx, yy, (A << 24) | ((int) Math.round(clamp(r / mx) * 255) << 16) | ((int) Math.round(clamp(gg / mx) * 255) << 8) | (int) Math.round(clamp(b / mx) * 255));
            }
        }
        return out;
    }

    /** 不透明な画素が3つ以上ある一番下の行 */
    static int lowestRow(BufferedImage img) {
        for (int yy = img.getHeight() - 1; yy >= 0; yy--) {
            int n = 0;
            for (int xx = 0; xx < img.getWidth(); xx++) if ((img.getRGB(xx, yy) >>> 24) > 128 && ++n >= 3) return yy;
        }
        return img.getHeight() - 1;
    }

    static BufferedImage shiftDown(BufferedImage img, int dy) {
        if (dy == 0) return img;
        BufferedImage out = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = out.createGraphics();
        g.drawImage(img, 0, dy, null);
        g.dispose();
        return out;
    }

    /** 乗算済みアルファで半分ずつ縮小してから目標の大きさへ（輪郭に色のにじみを出さない） */
    static BufferedImage downscale(BufferedImage img, double scale) {
        int tw = (int) Math.round(img.getWidth() * scale), th = (int) Math.round(img.getHeight() * scale);
        BufferedImage cur = toPre(img);
        while (cur.getWidth() / 2 >= tw) cur = resize(cur, cur.getWidth() / 2, cur.getHeight() / 2);
        if (cur.getWidth() != tw) cur = resize(cur, tw, th);
        return copy(cur);
    }

    static BufferedImage toPre(BufferedImage img) {
        BufferedImage pre = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_INT_ARGB_PRE);
        Graphics2D g = pre.createGraphics();
        g.drawImage(img, 0, 0, null);
        g.dispose();
        return pre;
    }

    static BufferedImage resize(BufferedImage img, int w, int h) {
        BufferedImage out = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB_PRE);
        Graphics2D g = out.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.drawImage(img, 0, 0, w, h, null);
        g.dispose();
        return out;
    }

    /** はっきり見える画素（不透明度16%超）の外接矩形（2px の余白付き）。背景ノイズの淡い点で広がらないようにする */
    static int[] bounds(BufferedImage img) {
        int minX = img.getWidth(), minY = img.getHeight(), maxX = -1, maxY = -1;
        for (int yy = 0; yy < img.getHeight(); yy++)
            for (int xx = 0; xx < img.getWidth(); xx++)
                if ((img.getRGB(xx, yy) >>> 24) > 40) {
                    minX = Math.min(minX, xx); maxX = Math.max(maxX, xx);
                    minY = Math.min(minY, yy); maxY = Math.max(maxY, yy);
                }
        if (maxX < 0) return new int[]{0, 0, 1, 1};
        minX = Math.max(0, minX - 2); minY = Math.max(0, minY - 2);
        maxX = Math.min(img.getWidth() - 1, maxX + 2); maxY = Math.min(img.getHeight() - 1, maxY + 2);
        return new int[]{minX, minY, maxX - minX + 1, maxY - minY + 1};
    }

    static int usedHeight(BufferedImage p) {
        for (int yy = p.getHeight() - 1; yy >= 0; yy--)
            for (int xx = 0; xx < p.getWidth(); xx++)
                if ((p.getRGB(xx, yy) >>> 24) != 0) return yy + 1;
        return 1;
    }

    static BufferedImage copy(BufferedImage img) {
        BufferedImage out = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = out.createGraphics();
        g.drawImage(img, 0, 0, null);
        g.dispose();
        return out;
    }

    static double clamp(double v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
}
