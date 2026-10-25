import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {seedOf,random} from './qr-core.js';
import {floorColors,renderFloor,composePoster} from './render2d.js';
export function createScene(host,onError,onFold) {
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}catch{host.textContent='這台裝置不支援 3D，請用 2D 模式';onError?.();return null;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#f4eddf');
  const camera=new THREE.PerspectiveCamera(42,1,.1,1000),controls=new OrbitControls(camera,renderer.domElement);controls.maxPolarAngle=Math.PI/2-.06;controls.minDistance=15;controls.maxDistance=180;controls.enableDamping=true;controls.autoRotate=true;controls.autoRotateSpeed=.6;controls.addEventListener('start',()=>controls.autoRotate=false);
  scene.add(new THREE.HemisphereLight(0xffffff,0x84765d,2.4));const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(20,40,20);scene.add(sun);
  const geometry=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshStandardMaterial({roughness:1}),dummy=new THREE.Object3D();
  let floor,tree,leaves,points=[],particles=[],q,text,season='spring',leaf='',colors,flat=false,amount=0,target=0,transition=null;
  const set=(mesh,i,p,scale,color)=>{dummy.position.set(...p);dummy.scale.set(...scale);dummy.rotation.set(0,0,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(color)mesh.setColorAt(i,new THREE.Color(color));};
  const dispose=mesh=>{if(mesh){scene.remove(mesh);mesh.dispose();}};
  function update(matrix,input,nextSeason='spring',nextLeaf='') {
    const changed=text!==input||q?.size!==matrix.size;q=matrix;text=input;season=nextSeason;leaf=nextLeaf;colors=floorColors(q,text,season);dispose(floor);dispose(tree);dispose(leaves);
    const n=q.size+8;floor=new THREE.InstancedMesh(geometry,material,n*n);for(let r=0;r<n;r++)for(let c=0;c<n;c++)set(floor,r*n+c,[c-(n-1)/2,-.3,r-(n-1)/2],[1,.5,1],colors[r][c]);scene.add(floor);
    const rng=random(seedOf(text)),height=3+Math.floor(rng()*4);points=[];
    for(let y=0;y<height;y++)points.push({p:[0,y+.5,0],kind:'wood',tone:rng()});
    for(let b=0;b<2;b++){const side=b?1:-1;for(let k=1;k<=2;k++)points.push({p:[side*k,height-2+k*.5,0],kind:'wood',tone:rng()});}
    for(let y=-3;y<=3;y++)for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++){const t=rng();if(x*x/18+y*y/11+z*z/18<1 && t>.16)points.push({p:[x,height+y+2,z],kind:'leaf',tone:t});}
    tree=new THREE.InstancedMesh(geometry,material,points.length);scene.add(tree);
    particles=Array.from({length:22},()=>({x:(rng()-.5)*10,y:rng()*14,z:(rng()-.5)*10,speed:.3+rng(),phase:rng()*6}));leaves=new THREE.InstancedMesh(geometry,material,particles.length);scene.add(leaves);
    if(changed){camera.position.set(n*.82,n*.85,n*.95);controls.target.set(0,1,0);controls.minDistance=n*.6;controls.maxDistance=n*4;flat=false;target=amount=0;transition=null;}
    drawTree(performance.now()/1000);controls.update();
  }
  function drawTree(time){if(!tree)return;const autumn=['#d85c37','#d59826','#a94039'],base=leaf||{spring:'#7cac58',summer:'#3e783c',autumn:'#df8b32'}[season];
    points.forEach((v,i)=>{const progress=Math.max(0,Math.min(1,amount*1.25-i/points.length*.25));const s=Math.max(.001,1-progress);let color=v.kind==='wood'?'#765039':season==='spring'&&v.tone>.92?'#e4a4b5':season==='autumn'&&!leaf?autumn[Math.floor(v.tone*3)%3]:base;set(tree,i,[v.p[0],v.p[1]*s,v.p[2]],[s*.96,s*.96,s*.96],color);});tree.instanceMatrix.needsUpdate=true;if(tree.instanceColor)tree.instanceColor.needsUpdate=true;
    particles.forEach((v,i)=>{const y=season==='autumn'&&i<6?.05:(v.y-time*v.speed)%14;set(leaves,i,[v.x+Math.sin(time+v.phase)*.5,(y+14)%14,v.z],[.22*(1-amount),.1*(1-amount),.22*(1-amount)],season==='spring'?'#edb6c2':base);});leaves.visible=season!=='summer'&&amount<.99;leaves.instanceMatrix.needsUpdate=true;if(leaves.instanceColor)leaves.instanceColor.needsUpdate=true;
    floor.scale.y=1-amount*.98;
  }
  function toggle(){if(!q)return;flat=!flat;target=flat?1:0;controls.autoRotate=false;transition={start:performance.now(),from:amount,position:camera.position.clone(),to:flat?new THREE.Vector3(0,(q.size+8)*1.5,.001):new THREE.Vector3((q.size+8)*.82,(q.size+8)*.85,(q.size+8)*.95)};onFold?.(flat);return flat;}
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6||!tree)return;const b=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(pointer,camera);if(ray.intersectObject(tree).length)toggle();});
  new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}).observe(host);
  function loop(now){requestAnimationFrame(loop);if(document.hidden||!host.clientWidth)return;if(transition){const t=Math.min(1,(now-transition.start)/1200),e=t*t*(3-2*t);amount=THREE.MathUtils.lerp(transition.from,target,e);camera.position.lerpVectors(transition.position,transition.to,e);controls.target.lerp(new THREE.Vector3(0,flat?0:1,0),e);if(t===1)transition=null;}drawTree(now/1000);controls.update();renderer.render(scene,camera);}requestAnimationFrame(loop);
  return {update,toggle,flatCanvas:()=>renderFloor(q,colors),poster:()=>{const w=host.clientWidth,h=host.clientHeight;if(w&&h&&(renderer.domElement.clientWidth!==w||renderer.domElement.clientHeight!==h)){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}drawTree(performance.now()/1000);controls.update();renderer.render(scene,camera);return composePoster(renderer.domElement,renderFloor(q,colors),text);}};
}
