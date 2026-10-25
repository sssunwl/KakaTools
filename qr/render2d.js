const escapeXML=s=>String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
export function logoBox(q,o) {
  if(!o.logo) return null;
  let side=q.size*Math.min(.22,Math.max(.1,+o.logoSize||.18));
  while(side>.4) {
    const start=(q.size-side)/2,end=start+side;
    let hit=false;
    for(let r=Math.floor(start);r<Math.ceil(end);r++) for(let c=Math.floor(start);c<Math.ceil(end);c++) if(q.isFinder(r,c)||q.isTiming(r,c)) hit=true;
    if(!hit) return {start,side,end};
    side-=.2;
  }
  return null;
}
export function renderSVG(q,o) {
  const n=q.size,z=+o.quiet||4,total=n+z*2,box=logoBox(q,o), parts=[];
  const rect=(x,y,w,h,rx,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
  const paint=o.gradient==='none'?o.fg:'url(#ink)';
  if(o.gradient==='radial') parts.push(`<defs><radialGradient id="ink" gradientUnits="userSpaceOnUse" cx="${total/2}" cy="${total/2}" r="${n/2*1.42}"><stop stop-color="${o.fg}"/><stop offset="1" stop-color="${o.fg2}"/></radialGradient></defs>`);
  else if(o.gradient==='linear') {const a=(+o.angle||0)*Math.PI/180,x=Math.cos(a)*50,y=Math.sin(a)*50;parts.push(`<defs><linearGradient id="ink" gradientUnits="userSpaceOnUse" x1="${total/2-x*n/100}" y1="${total/2-y*n/100}" x2="${total/2+x*n/100}" y2="${total/2+y*n/100}"><stop stop-color="${o.fg}"/><stop offset="1" stop-color="${o.fg2}"/></linearGradient></defs>`);}
  parts.push(rect(0,0,total,total,0,o.bg));
  for(let r=0;r<n;r++) for(let c=0;c<n;c++) {
    if(!q.modules[r][c]||q.isFinder(r,c)) continue;
    if(box && c+1>box.start && c<box.end && r+1>box.start && r<box.end) continue;
    let shape=q.isReserved(r,c)?'square':o.shape;
    const x=c+z,y=r+z;
    if(shape==='dot') parts.push(`<circle cx="${x+.5}" cy="${y+.5}" r=".46" fill="${paint}"/>`);
    else if(shape==='connected') {
      parts.push(rect(x,y,1,1,.35,paint));
      if(q.modules[r][c+1]) parts.push(rect(x+.5,y,.5,1,0,paint));
      if(q.modules[r+1]?.[c]) parts.push(rect(x,y+.5,1,.5,0,paint));
      if(q.modules[r][c-1]) parts.push(rect(x,y,.5,1,0,paint));
      if(q.modules[r-1]?.[c]) parts.push(rect(x,y,1,.5,0,paint));
    } else parts.push(rect(x,y,1.01,1.01,shape==='rounded'?.2:0,paint));
  }
  for(const [x,y] of [[z,z],[z+n-7,z],[z,z+n-7]]) {
    const radius=o.finder==='circle'?3.5:o.finder==='rounded'?1:0;
    parts.push(`<path fill="${paint}" fill-rule="evenodd" d="${roundedPath(x,y,7,radius)} ${roundedPath(x+1,y+1,5,o.finder==='circle'?2.5:radius*.65)}"/>`);
    parts.push(rect(x+2,y+2,3,3,o.finder==='circle'?1.5:radius*.5,paint));
  }
  if(box) {parts.push(rect(box.start+z,box.start+z,box.side,box.side,.35,o.bg));const pad=box.side*.12;parts.push(`<image href="${escapeXML(o.logo)}" x="${box.start+z+pad}" y="${box.start+z+pad}" width="${box.side-pad*2}" height="${box.side-pad*2}" preserveAspectRatio="xMidYMid meet"/>`);}
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${o.size}" height="${o.size}" viewBox="0 0 ${total} ${total}">${parts.join('')}</svg>`;
}
function roundedPath(x,y,w,r){return `M ${x+r} ${y} H ${x+w-r} Q ${x+w} ${y} ${x+w} ${y+r} V ${y+w-r} Q ${x+w} ${y+w} ${x+w-r} ${y+w} H ${x+r} Q ${x} ${y+w} ${x} ${y+w-r} V ${y+r} Q ${x} ${y} ${x+r} ${y} Z`;}
export async function renderCanvas(q,o) { const {svgCanvas}=await import('./verify.js');return svgCanvas(renderSVG(q,o),+o.size); }
// The same deterministic palette feeds the voxel floor and its scan export.
export function floorColors(q,text,season) {
  let seed=2166136261;for(const ch of text)seed=Math.imul(seed^ch.codePointAt(0),16777619);
  const hue={spring:142,summer:105,autumn:30}[season]||142;
  const rgb=(h,s,l)=>{const f=n=>{const k=(n+h/30)%12,a=s*Math.min(l,1-l);return l-a*Math.max(-1,Math.min(k-3,9-k,1));};return [f(0),f(8),f(4)];};
  const labL=rgb=>{const v=rgb.map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4),y=.2126*v[0]+.7152*v[1]+.0722*v[2];return y>.008856?116*Math.cbrt(y)-16:903.3*y;};
  return Array.from({length:q.size+8},(_,r)=>Array.from({length:q.size+8},(_,c)=>{
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;const dark=q.modules[r-4]?.[c-4]===true;
    let l=(dark?.19:.9)+(seed/4294967296-.5)*.045,color=rgb(hue,dark?.35:.22,l);
    while(dark?labL(color)>35:labL(color)<75){l+=dark?-.005:.005;color=rgb(hue,dark?.35:.22,l);}
    return '#'+color.map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');
  }));
}
export function renderFloor(q,colors,size=1024) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d'),n=colors.length;
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){ctx.fillStyle=colors[r][c];ctx.fillRect(Math.floor(c*size/n),Math.floor(r*size/n),Math.ceil(size/n)+1,Math.ceil(size/n)+1);}return canvas;
}
export function composePoster(shot,flat,text) {
  const c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d');x.fillStyle='#fffaf2';x.fillRect(0,0,1080,1350);
  if(shot){const k=Math.min(shot.width/1080,shot.height/700),sw=1080*k,sh=700*k;x.drawImage(shot,(shot.width-sw)/2,(shot.height-sh)/2,sw,sh,0,0,1080,700);}else{x.fillStyle='#d9e8dd';x.fillRect(0,0,1080,700);}
  x.fillStyle='#ffffff';x.beginPath();x.roundRect(60,725,960,590,32);x.fill();x.drawImage(flat,95,760,520,520);
  x.fillStyle='#283044';x.font='bold 34px system-ui';x.fillText('一個連結，一棵小樹',650,960);x.font='22px system-ui';let short=text;while(x.measureText(short).width>330 && short.length>1)short=Array.from(short).slice(0,-1).join('');if(short!==text)short+='…';x.fillText(short,650,1015);x.fillText('掃一下，出發吧。',650,1065);return c;
}
