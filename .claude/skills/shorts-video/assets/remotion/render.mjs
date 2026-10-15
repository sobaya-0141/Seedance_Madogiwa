// Explicit single-manifest renderer. Never uploads, schedules, or overwrites outputs.
import {bundle} from '@remotion/bundler';
import {renderMedia,selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const args=process.argv.slice(2),get=(flag)=>{const i=args.indexOf(flag);if(i<0||!args[i+1])throw Error('Required '+flag);return args[i+1];};
const manifest=path.resolve(get('--manifest')),output=path.resolve(get('--output')),project=path.dirname(manifest),m=JSON.parse(fs.readFileSync(manifest));
if(fs.existsSync(output))throw Error('Output exists; choose a new filename');
if(!(m.fps>0&&Number.isInteger(m.durationInFrames)&&m.durationInFrames>0&&m.durationInFrames/m.fps<60))throw Error('Invalid frame count/fps or duration >=60 seconds');
const probe=(p)=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',p]));
const sha=(p)=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const audioHash=(p)=>execFileSync('ffmpeg',['-v','error','-i',p,'-map','0:a:0','-c','copy','-f','hash','-hash','sha256','-']).toString().trim();
let end=0;
for(const c of m.clips){if(![c.from,c.duration,c.trimBefore??0].every(Number.isInteger)||c.from!==end||c.duration<=0||(c.trimBefore??0)<0)throw Error('Clips must form a contiguous integer-frame timeline');const p=path.join(project,'public',c.file);const v=probe(p).streams.find(s=>s.codec_type==='video');const rate=v.avg_frame_rate.split('/').map(Number);if(Math.abs(rate[0]/rate[1]-m.fps)>.001||v.width!==c.width||v.height!==c.height)throw Error('Clip fps/size differs from manifest');if(c.duration+(c.trimBefore??0)>Number(v.nb_frames))throw Error('Clip exceeds source');end+=c.duration;}
if(end<m.durationInFrames)throw Error('Clips do not cover full timeline');
end=0;for(const c of m.captions){if(!Number.isInteger(c.startFrame)||!Number.isInteger(c.endFrame)||c.startFrame<end||c.startFrame>=c.endFrame||c.endFrame>m.durationInFrames||c.text.split('\n').length>3)throw Error('Invalid/overlapping captions');end=c.endFrame;}
const out=path.join(project,'out');fs.mkdirSync(out,{recursive:true});
const duration=m.durationInFrames/m.fps,audio=m.audioSource?path.resolve(project,m.audioSource):null;
let audioCodec=null,trimmed=false;
if(audio){const s=probe(audio).streams.find(s=>s.codec_type==='audio');if(!s||Number(s.duration??probe(audio).format.duration)+.08<duration)throw Error('Audio missing/too short');audioCodec=s.codec_name;trimmed=Number(s.duration??probe(audio).format.duration)>duration+.08;}
const url=await bundle({entryPoint:path.join(project,'src/index.tsx'),publicDir:path.join(project,'public')});
const composition=await selectComposition({serveUrl:url,id:'Shorts',inputProps:m});const silent=path.join(out,'shorts-silent.mp4');
await renderMedia({serveUrl:url,composition,inputProps:m,outputLocation:silent,codec:'h264',crf:18,concurrency:2,muted:true,logLevel:'error'});
fs.mkdirSync(path.dirname(output),{recursive:true});
let muxAudio=null;
if(audio){muxAudio=path.join(out,'adopted-audio.m4a');execFileSync('ffmpeg',['-v','error','-y','-i',audio,'-map','0:a:0','-t',String(duration),'-c:a',audioCodec==='aac'?'copy':'aac',...(audioCodec==='aac'?[]:['-b:a','192k']),muxAudio]);}
execFileSync('ffmpeg',['-v','error','-n','-i',silent,...(muxAudio?['-i',muxAudio]:[]),'-map','0:v:0',...(muxAudio?['-map','1:a:0']:[]),'-c','copy','-t',String(duration),'-movflags','+faststart',output]);
execFileSync('ffmpeg',['-v','error','-i',output,'-f','null','-']);
const d=probe(output),v=d.streams.find(s=>s.codec_type==='video'),fps=v.avg_frame_rate.split('/').map(Number);
if(v.width!==720||v.height!==1280||Number(v.nb_frames)!==m.durationInFrames||Math.abs(fps[0]/fps[1]-m.fps)>.001)throw Error('Output geometry/timing mismatch');
const audioMatched=muxAudio?audioHash(output)===audioHash(muxAudio):!d.streams.some(s=>s.codec_type==='audio');if(!audioMatched)throw Error('Mux audio differs');
fs.writeFileSync(output+'.audit.json',JSON.stringify({output,sha256:sha(output),manifestSha256:sha(manifest),width:v.width,height:v.height,frames:Number(v.nb_frames),fps:m.fps,duration,decode:'pass',audioSourceCodec:audioCodec,audioStreamCopied:audioCodec==='aac',audioTrimmed:trimmed,muxAudioMatched:audioMatched,adoptedAudioSha256:audio?sha(audio):null,visualReview:false,listeningReview:false},null,2)+'\n');console.log(output);
