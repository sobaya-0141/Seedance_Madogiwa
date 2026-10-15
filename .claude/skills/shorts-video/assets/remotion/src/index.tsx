import React from 'react';
import {AbsoluteFill,Composition,OffthreadVideo,Sequence,registerRoot,staticFile,useCurrentFrame} from 'remotion';
import {memberCaptionStyle} from './member-colors';
export type Clip={file:string;from:number;duration:number;trimBefore?:number;width:number;height:number;crop?:{x:number;y:number;width:number;height:number}};
export type Manifest={creditText?:string;slug:string;title:string;titleLines:string[];accent:string;fps:number;durationInFrames:number;clips:Clip[];captions:{startFrame:number;endFrame:number;speaker:string;text:string}[]};
const placeholder:Manifest={slug:'preview',title:'',titleLines:['',''],accent:'#fff2d4',fps:30,durationInFrames:30,clips:[],captions:[]};
const Footage:React.FC<{clip:Clip;blur?:boolean}>=({clip,blur=false})=>{
 const crop=clip.crop??{x:0,y:0,width:clip.width,height:clip.height};
 const scale=blur?Math.max(720/crop.width,1280/crop.height):Math.min(720/crop.width,480/crop.height);
 const w=crop.width*scale,h=crop.height*scale;
 return <div style={{position:'absolute',left:(720-w)/2,top:((blur?1280:480)-h)/2,width:w,height:h,overflow:'hidden'}}><OffthreadVideo src={staticFile(clip.file)} startFrom={clip.trimBefore??0} muted style={{position:'absolute',width:clip.width*scale,height:clip.height*scale,maxWidth:'none',left:-crop.x*scale,top:-crop.y*scale}}/></div>;
};
const Film:React.FC<Manifest>=(m)=>{
 const f=useCurrentFrame(),c=m.captions.find(c=>f>=c.startFrame&&f<c.endFrame);
 const main=m.titleLines[m.titleLines.length-1],small=m.titleLines.length>1?m.titleLines[0]:'';
 const titleSize=main.length>15?40:main.length>10?46:62;
 return <AbsoluteFill style={{background:'#111820',color:'#fff',fontFamily:'"Hiragino Sans",sans-serif',fontWeight:700,overflow:'hidden'}}>
 <AbsoluteFill style={{filter:'blur(34px)',transform:'scale(1.13)',opacity:.47}}>{m.clips.map((clip,i)=><Sequence key={i} from={clip.from} durationInFrames={clip.duration}><Footage clip={clip} blur/></Sequence>)}</AbsoluteFill>
 <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(8,13,19,.7),rgba(8,13,19,.08) 48%,rgba(8,13,19,.75))'}}/>
 <div style={{position:'absolute',top:92,height:220,left:32,right:32,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',textAlign:'center',textShadow:'0 4px 12px #0008'}}>
 {small&&<div style={{fontSize:30,letterSpacing:2,color:'#fff',marginBottom:20}}>{small}</div>}
 <div style={{fontSize:titleSize,lineHeight:1.22,letterSpacing:-1,color:m.accent,whiteSpace:'pre-line'}}>{main}</div></div>
 <div style={{position:'absolute',top:350,left:0,width:720,height:480,overflow:'hidden'}}>{m.clips.map((clip,i)=><Sequence key={i} from={clip.from} durationInFrames={clip.duration}><Footage clip={clip}/></Sequence>)}</div>
 {c&&<div style={{position:'absolute',top:876,left:40,right:88,textAlign:'center'}}>
 {c.speaker&&<div style={{display:'inline-block',fontSize:28,fontWeight:700,color:'#fff',padding:'2px 0',marginBottom:12,letterSpacing:1,textShadow:'0 2px 5px #0009'}}>{c.speaker}</div>}
 <div style={{fontSize:38,lineHeight:1.5,whiteSpace:'pre-line',...memberCaptionStyle(c.speaker)}}>{c.text}</div></div>}
 {m.creditText&&<div style={{position:'absolute',top:1160,left:40,right:88,fontSize:20,lineHeight:1.4,textAlign:'center',whiteSpace:'pre-line',color:'#fff',textShadow:'0 2px 5px #000'}}>{m.creditText}</div>}
 </AbsoluteFill>;
};
registerRoot(()=> <Composition id="Shorts" component={Film} width={720} height={1280} fps={30} durationInFrames={30} defaultProps={placeholder} calculateMetadata={({props})=>({fps:props.fps,durationInFrames:props.durationInFrames})}/>);
