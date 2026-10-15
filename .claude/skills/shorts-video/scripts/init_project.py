#!/usr/bin/env python3
"""Initialize a portable Shorts edit from adopted local media; never overwrite."""
import argparse,json,os,shutil,subprocess
from fractions import Fraction
from pathlib import Path

def probe(p):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
def link(src,dst):
 try:os.link(src,dst)
 except OSError:shutil.copy2(src,dst)
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--project',type=Path,required=True);p.add_argument('--video',type=Path,required=True);p.add_argument('--audio',type=Path);p.add_argument('--silent',action='store_true');p.add_argument('--title',required=True);p.add_argument('--subtitle',default='');a=p.parse_args()
 dest=a.project.resolve();video=a.video.resolve();audio=(a.audio or a.video).resolve()
 if dest.exists():p.error('Project already exists; choose a new directory')
 if a.silent and a.audio:p.error('--silent and --audio are mutually exclusive')
 info=probe(video);v=next(s for s in info['streams'] if s['codec_type']=='video');fps=float(Fraction(v['avg_frame_rate']));frames=int(v['nb_frames'])
 if abs(float(Fraction(v['r_frame_rate']))-fps)>.001:p.error('Variable frame rate: review/normalize the source first')
 if v['width']<v['height'] or any(s.get('rotation',0) for s in v.get('side_data_list',[])):p.error('Expected unrotated horizontal footage')
 if not 0<frames/fps<60:p.error('Template expects an adopted cut shorter than 60 seconds')
 if not a.silent:
  aud=next((s for s in probe(audio)['streams'] if s['codec_type']=='audio'),None)
  if not aud:p.error('Adopted audio track missing; specify --audio or use --silent for an intentionally silent film')
  if float(aud.get('duration',probe(audio)['format']['duration']))+.08<frames/fps:p.error('Adopted audio is shorter than the footage')
 skill=Path(__file__).resolve().parents[1];repo=skill.parents[2]
 shutil.copytree(skill/'assets/remotion',dest);(dest/'public').mkdir();(dest/'out').mkdir();link(video,dest/'public/input.mp4')
 shutil.copy2(repo/'03_SCRIPTS/00_TEMPLATES/subtitles/member-colors.ts',dest/'src/member-colors.ts')
 if not a.silent:link(audio,dest/('public/audio'+audio.suffix))
 m=dict(slug=dest.parent.name,title=a.title,titleLines=[x for x in [a.subtitle,a.title] if x],accent='#fff2d4',fps=fps,durationInFrames=frames,clips=[dict(file='input.mp4',source=os.path.relpath(video,dest),duration=frames,trimBefore=0,width=v['width'],height=v['height'],**{'from':0})],captions=[],creditText='',audioSource=None if a.silent else 'public/audio'+audio.suffix,adoptedAudioSource=None if a.silent else os.path.relpath(audio,dest))
 (dest/'shorts-manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');print(dest)
if __name__=='__main__':main()
