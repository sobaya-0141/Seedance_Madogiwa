"""Run with: python3 -m unittest discover -s tools -p test_compile_pickup_videos.py"""
import contextlib
import io
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import compile_pickup_videos as compiler


class CompilationTests(unittest.TestCase):
    def episodes(self):
        return [dict(id=str(i), slug=str(i), title='窓際族物語：タイトル検証',
                     status='published', has_featured_video=1,
                     primary_video_id=f'test-{i}', created_at=str(i)) for i in range(2)]

    def test_selection(self):
        episodes = self.episodes()
        hidden = dict(episodes[0], primary_video_id='hidden', status='archived')
        unfeatured = dict(episodes[0], primary_video_id='other', has_featured_video=0)
        result = compiler.select(episodes + [episodes[0], hidden, unfeatured], 0, 42, 'shuffle')
        self.assertEqual(len(result), 2)
        self.assertEqual(result, compiler.select(episodes, 0, 42, 'shuffle'))
        self.assertEqual(compiler.select(episodes, 1, 42, 'shuffle')[0]['video_id'], 'test-1')

    @unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe') and
                         Path('/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc').exists(),
                         'Integration test requires FFmpeg and Japanese macOS font')
    def test_both_versions(self):
        with tempfile.TemporaryDirectory(prefix='pickup-test-') as directory:
            root = Path(directory)
            cache = root / '.local/pickup-compilations/cache'
            cache.mkdir(parents=True)
            for index, size in enumerate(['160x90', '90x160']):
                command = ['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i',
                           f'color=c=red:s={size}:r=24:d=0.7']
                if index == 0:
                    command += ['-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.7', '-c:a', 'aac']
                subprocess.run(command + ['-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                                          str(cache / f'test-{index}.mp4')], check=True)
            catalog = root / 'catalog.json'
            catalog.write_text(json.dumps({'episodes': self.episodes()}))
            argv = ['compile', '--catalog', str(catalog), '--output', str(root / 'result.mp4'),
                    '--size', '320x180', '--seed', '42']
            with patch.object(compiler, 'ROOT', root), patch.object(sys, 'argv', argv), contextlib.redirect_stdout(io.StringIO()):
                compiler.main()
                with self.assertRaises(ValueError):
                    compiler.main()  # No overwrite.
            manifest = json.loads((root / 'result.json').read_text())
            self.assertEqual(manifest['status'], 'complete')
            durations = {}
            for version in ('plain', 'titles'):
                info = compiler.probe(root / f'result_{version}.mp4')
                video = next(s for s in info['streams'] if s['codec_type'] == 'video')
                audio = next(s for s in info['streams'] if s['codec_type'] == 'audio')
                self.assertEqual((video['width'], video['height']), (320, 180))
                self.assertEqual(audio['channels'], 2)
                durations[version] = float(info['format']['duration'])
            self.assertAlmostEqual(durations['titles'] - durations['plain'], 4, delta=0.1)
            self.assertEqual([entry['type'] for entry in manifest['results']['titles']['timeline']],
                             ['title', 'video', 'title', 'video'])


if __name__ == '__main__':
    unittest.main()
