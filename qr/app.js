import {createQR} from './qr-core.js';
import {renderCanvas,renderSVG,logoBox} from './render2d.js';
import {verify,svgCanvas} from './verify.js';
import {Ambient} from './ambient.js';
const $=id=>document.getElementById(id),fields=['fg','bg','fg2','gradient','angle','shape','finder','ec','size','quiet','logoSize'];
let logo='',mode='2d',season='spring',leaf='',scene,sceneLoading,webglFailed=false,generation=0,timer,latest,assets={},audio=new Ambient();
try{const saved=JSON.parse(localStorage.getItem('kaka-qr-style')||'{}');for(const id of fields){if(saved[id]!==undefined)$(id).value=saved[id];if(!$(id).value&&$(id).options)$(id).selectedIndex=0;}if(['spring','summer','autumn'].includes(saved.season))season=saved.season;if(/^#[0-9a-f]{6}$/i.test(saved.leaf||''))leaf=saved.leaf;}catch{/* Private browsing can refuse storage. */}
function options(){const o=Object.fromEntries(fields.map(id=>[id,$(id).value]));o.quiet=Math.max(4,Math.min(8,+o.quiet||4));o.logoSize=+$('logoSize').value/100;o.logo=logo;return o;}
function save(){try{localStorage.setItem('kaka-qr-style',JSON.stringify({...Object.fromEntries(fields.map(id=>[id,$(id).value])),season,leaf}));}catch{}}
function disable(){for(const id of ['png','svg','flat','poster'])$(id).disabled=true;assets={};}
function badge(result){$('status').textContent=result.ok?'✅ 已驗證可掃描':`⚠️ 這個組合掃不到：${result.reason}`;$('status').dataset.ok=result.ok;}
async function ensureScene(){if(scene||webglFailed)return;if(!sceneLoading)sceneLoading=import('./scene3d.js').then(m=>{scene=m.createScene($('scene'),()=>webglFailed=true,flat=>{$('fold').textContent=flat?'長出小樹':'摺回 QR';});}).catch(()=>{webglFailed=true;$('scene').textContent='這台裝置不支援 3D，請用 2D 模式';});await sceneLoading;}
async function redraw(){
  const token=++generation;disable();latest=null;$('poster-status').textContent='';const text=$('content').value;
  $('logo-value').value=$('logoSize').value+'%';$('input-note').textContent=Array.from(text).length>300?'內容很長，QR 會很密，建議用短一點的連結':'';
  if(!text){$('preview2d').textContent='貼上內容，QR 就會出現。';$('status').textContent='先貼上連結或文字吧。';delete $('status').dataset.ok;if(scene)$('scene').style.visibility='hidden';return;}
  $('scene').style.visibility='visible';$('status').textContent='正在幫你掃一次…';
  try{
    const o=options(),q=createQR(text,logo?'H':o.ec);latest={q,text,o};
    if(mode==='2d'){
      const canvas=await renderCanvas(q,o);if(token!==generation)return;$('preview2d').replaceChildren(canvas);
      const pngResult=verify(canvas,text,o),svg=renderSVG(q,o),svgResult=verify(await svgCanvas(svg,+o.size),text,o);if(token!==generation)return;
      badge(!pngResult.ok?pngResult:svgResult);assets={canvas,svg};$('png').disabled=!pngResult.ok;$('svg').disabled=!svgResult.ok;
      if(logo){const b=logoBox(q,o);$('logo-note').textContent=`logo 已鎖定 H 容錯；實際底板約 ${b?Math.round(b.side/q.size*100):0}%，已避開定位方塊。`;}
    }else{
      await ensureScene();if(token!==generation)return;if(!scene){$('status').textContent='這台裝置不支援 3D，請用 2D 模式';return;}
      scene.update(q,text,season,leaf);const canvas=scene.flatCanvas(),result=verify(canvas,text);badge(result);assets={canvas};$('flat').disabled=!result.ok;
      if(result.ok){const poster=scene.poster(),check=verify(poster,text);if(token!==generation)return;assets.poster=poster;$('poster').disabled=!check.ok;$('poster-status').textContent=check.ok?'海報 QR 也已驗證可掃描。':`⚠️ 海報掃不到：${check.reason}`;}
    }
  }catch(error){if(token===generation)badge({ok:false,reason:'內容太長或圖片無法讀取，請縮短內容或更換圖片'});console.error(error);}
}
function schedule(){disable();generation++;clearTimeout(timer);timer=setTimeout(redraw,200);}
$('content').addEventListener('input',schedule);
for(const id of fields)$(id).addEventListener('input',()=>{save();schedule();});
for(const tab of ['2d','3d'])$('tab'+tab).addEventListener('click',async()=>{mode=tab;for(const m of ['2d','3d']){const active=m===mode;$('tab'+m).setAttribute('aria-selected',active);$('panel'+m).hidden=!active;$('settings'+m).hidden=!active;$('downloads'+m).hidden=!active;}await redraw();});
const presets={coral:['#9d392b','#fffaf2','#673c55'],mint:['#1c6559','#f3fff8','#254d60'],navy:['#283d64','#f5f7ff','#4d376e'],classic:['#161616','#ffffff','#242424']};
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{[$('fg').value,$('bg').value,$('fg2').value]=presets[b.dataset.preset];save();redraw();});
function logoLock(){for(const option of $('ec').options)option.disabled=!!logo&&option.value!=='H';if(logo)$('ec').value='H';}
let fileToken=0;
$('logo').onchange=()=>{const file=$('logo').files[0];if(!file)return;if(!file.type.startsWith('image/')){$('logo-note').textContent='請選圖片檔案。';return;}disable();generation++;const token=++fileToken,reader=new FileReader();reader.onload=()=>{if(token!==fileToken)return;logo=String(reader.result);logoLock();redraw();};reader.onerror=()=>{$('logo-note').textContent='這張圖片讀不到，請換一張。';};reader.readAsDataURL(file);};
$('remove-logo').onclick=()=>{fileToken++;logo='';$('logo').value='';logoLock();$('logo-note').textContent='圖片只在本機讀取，不會上傳。';redraw();};
function seasonButtons(){document.querySelectorAll('[data-season]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.season===season));document.querySelectorAll('[data-leaf]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.leaf===leaf));}
document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>{season=b.dataset.season;audio.setSeason(season);seasonButtons();save();redraw();});
document.querySelectorAll('[data-leaf]').forEach(b=>b.onclick=()=>{leaf=b.dataset.leaf;seasonButtons();save();redraw();});$('season-leaf').onclick=()=>{leaf='';seasonButtons();save();redraw();};
$('fold').onclick=()=>{if(scene)$('fold').textContent=scene.toggle()?'長出小樹':'摺回 QR';};
$('sound').onclick=async()=>{try{const enabled=await audio.toggle();$('sound').textContent=enabled?'🔊 環境音':'🔇 環境音';$('sound').setAttribute('aria-pressed',enabled);}catch{$('sound').textContent='這台裝置無法播放環境音';}};
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
for(const id of ['png','svg','flat','poster'])$(id).onclick=async()=>{
  if(!latest)return;const {text,o}=latest;
  if(id==='svg'){const svg=assets.svg;if(!svg)return;const checked=verify(await svgCanvas(svg,+o.size),text,o);if(!checked.ok){badge(checked);$('svg').disabled=true;return;}download(new Blob([svg],{type:'image/svg+xml'}),'kaka-qr.svg');return;}
  let canvas=id==='poster'?scene?.poster():assets.canvas;if(!canvas)return;const result=verify(canvas,text,id==='png'?o:{});if(!result.ok){badge(result);$(id).disabled=true;return;}canvas.toBlob(blob=>{if(blob)download(blob,id==='poster'?'kaka-tree-poster.png':'kaka-qr.png');},'image/png');
};
seasonButtons();audio.setSeason(season);redraw();
