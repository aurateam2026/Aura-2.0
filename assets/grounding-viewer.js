(()=>{
const prior=window.showAuraDemo;
const clock=t=>String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');
window.showAuraDemo=(viewer,item,group,card)=>{
 if(!item.grounding){prior(viewer,item,group,card);return}
 const g=item.grounding;
 document.querySelectorAll('.single-card.selected,.demo-card.selected').forEach(x=>x.classList.remove('selected'));card.classList.add('selected');viewer.querySelectorAll('video').forEach(v=>v.pause());viewer.replaceChildren();
 const head=document.createElement('div');head.className='viewer-head';const title=document.createElement('div');const label=document.createElement('small');label.textContent=group;const name=document.createElement('h3');name.textContent=item.title;title.append(label,name);const close=document.createElement('button');close.textContent='关闭 ×';close.onclick=()=>{video.pause();viewer.hidden=true;card.classList.remove('selected')};head.append(title,close);viewer.append(head);
 const layout=document.createElement('div');layout.className='viewer-layout';const stage=document.createElement('div');stage.className='grounding-stage';const video=document.createElement('video');video.muted=true;video.defaultMuted=true;video.volume=0;video.addEventListener('volumechange',()=>{video.muted=true;video.volume=0});video.controls=true;video.playsInline=true;video.preload='metadata';video.src=item.video;const overlay=document.createElement('div');overlay.className='grounding-overlay';stage.append(video,overlay);layout.append(stage);
 const panel=document.createElement('aside');panel.className='dialogue-panel';const heading=document.createElement('strong');heading.textContent='视觉交互';const note=document.createElement('small');note.textContent='模型给出的定位框，与视频同步。';panel.append(heading,note);
 const queries=g.queries||[{time:g.queryTime,text:g.query}];
 const messages=[...queries.map(q=>({...q,role:'User'})),...(g.replies||[]).map(r=>({...r,role:'AURA'}))].sort((a,b)=>a.time-b.time||(a.role==='User'?-1:1));
 const list=document.createElement('div');list.className='recording-timeline';
 messages.forEach(m=>{const box=document.createElement('div');box.className='chat-message '+(m.role==='AURA'?'assistant':'user');const time=document.createElement('button');time.type='button';time.className='recording-time';time.textContent=clock(m.time);time.onclick=()=>{video.currentTime=m.time};const role=document.createElement('b');role.textContent=m.role==='AURA'?'AURA':'用户';const text=document.createElement('p');if(m.en){text.dataset.auraZh=m.text;text.dataset.auraEn=m.en}text.textContent=m.en&&document.documentElement.lang!=='zh'?m.en:m.text;box.append(time,role,text);list.append(box)});
 panel.append(list);layout.append(panel);viewer.append(layout);
 const chunk=g.chunk||1,hold=g.hold||1,frames=g.frames;
 const spans=frames.map((f,i)=>{const next=frames[i+1],prev=frames[i-1];const tracked=(next&&next.time-f.time<=chunk*1.5+1e-6)||(prev&&f.time-prev.time<=chunk*1.5+1e-6);const end=Math.min(next?next.time:Infinity,f.time+(tracked?chunk:hold));return{start:f.time,end,boxes:f.boxes}});
 let shown=null,raf=0;
 function draw(){const t=video.currentTime;let span=null;for(const s of spans){if(s.start>t+1e-3)break;if(t<s.end)span=s}if(span===shown)return;shown=span;overlay.replaceChildren();if(!span)return;for(const b of span.boxes){if(b.length!==4)continue;const box=document.createElement('div');box.className='grounding-box';box.style.left=(b[0]/10)+'%';box.style.top=(b[1]/10)+'%';box.style.width=((b[2]-b[0])/10)+'%';box.style.height=((b[3]-b[1])/10)+'%';overlay.append(box)}}
 function loop(){draw();if(!video.paused&&!video.ended&&viewer.contains(video))raf=requestAnimationFrame(loop)}
 video.addEventListener('play',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)});video.addEventListener('pause',()=>{cancelAnimationFrame(raf);draw()});video.addEventListener('seeked',draw);video.addEventListener('timeupdate',draw);
 video.addEventListener('loadedmetadata',()=>{const w=video.videoWidth,h=video.videoHeight;stage.style.aspectRatio=w+' / '+h;if(h>w){stage.style.width='min(100%, calc(72vh * '+(w/h).toFixed(4)+'))';stage.style.justifySelf='center'}draw()});
 viewer.hidden=false;viewer.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
};
})();
