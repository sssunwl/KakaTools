export function luminance(hex) {
  const rgb = hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
export function contrastReason(options) {
  const bg=luminance(options.bg);
  for(const color of options.gradient==='none'?[options.fg]:[options.fg,options.fg2]) {
    const fg=luminance(color);
    if(fg>=bg) return '前景要比背景深';
    if((bg+.05)/(fg+.05)<3) return '對比不足，請選深一點的前景色（至少 3:1）';
  }
  return '';
}
export function verify(source, text, options={}) {
  const reason=options.fg?contrastReason(options):'';
  if(reason) return {ok:false,text:'',reason};
  const canvas=document.createElement('canvas'), scale=Math.min(1,1400/source.width);
  canvas.width=Math.round(source.width*scale); canvas.height=Math.round(source.height*scale);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(source instanceof ImageData) { const tmp=document.createElement('canvas'); tmp.width=source.width;tmp.height=source.height;tmp.getContext('2d').putImageData(source,0,0);ctx.drawImage(tmp,0,0,canvas.width,canvas.height); }
  else ctx.drawImage(source,0,0,canvas.width,canvas.height);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
  const decoded=window.jsQR(pixels.data,pixels.width,pixels.height,{inversionAttempts:'dontInvert'});
  return {ok:decoded?.data===text,text:decoded?.data||'',reason:decoded?.data===text?'':options.logo?'logo 太大或資料太密，請縮小 logo':'其他：資料太密或形狀不易辨識，請換方塊或提高尺寸'};
}
export function svgCanvas(svg,size) {
  return new Promise((resolve,reject)=>{const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=size;c.getContext('2d').drawImage(img,0,0,size,size);URL.revokeObjectURL(url);resolve(c);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('SVG 無法讀取'));};img.src=url;});
}
