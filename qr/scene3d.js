import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {seedOf, random} from './qr-core.js';
import {PAPER, SEASONS, palette, floorColors, allocateLeaves} from './palette3d.js';
import {renderFloor, composePoster} from './render2d.js';
import {verify} from './verify.js';

const clamp = v => Math.max(0, Math.min(1, v));
const ease = v => v < .5 ? 4 * v ** 3 : 1 - (-2 * v + 2) ** 3 / 2;
export function createScene(host, onError, onFold, onScan) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
  } catch {
    host.textContent = '這台裝置不支援 3D，請用 2D 模式';
    onError?.();
    return null;
  }
  const mobile = matchMedia('(pointer:coarse)').matches || innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PAPER);
  const camera = new THREE.OrthographicCamera(-30, 30, 30, -30, .1, 1000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.minPolarAngle = Math.PI / 6;
  controls.maxPolarAngle = Math.PI * 65 / 180;
  controls.minZoom = .65;
  controls.maxZoom = 1.7;
  controls.autoRotateSpeed = .5;
  controls.addEventListener('start', () => { touched = true; controls.autoRotate = false; });
  scene.add(new THREE.HemisphereLight(0xffffff, 0x94816b, 2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  sun.position.set(30, 70, 25);
  sun.castShadow = !mobile;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {left: -70, right: 70, top: 70, bottom: -70, far: 200});
  scene.add(sun);
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const basic = new THREE.MeshBasicMaterial();
  const organic = new THREE.MeshStandardMaterial({roughness: 1});
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  let frame = 0, touched = false;
  let q, text, season, leaf, colors, n, foliage, wood, ground, grass, motes, rain;
  let leaves = [], branches = [], blades = [], particles = [], meshes = [], anchors = [];
  let groundTree = [], groundFlat = [], groundAmount = -1, hit;
  let amount = 1, target = 1, transition, opening = 0, recording = false, lastScan = 0;
  const treePosition = new THREE.Vector3();
  const flatPosition = new THREE.Vector3();
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({color: '#736753', transparent: true, opacity: .12, depthWrite: false}));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .005;
  scene.add(shadow);
  const scanCanvas = document.createElement('canvas');
  scanCanvas.width = scanCanvas.height = 512;
  const scanContext = scanCanvas.getContext('2d', {willReadFrequently: true});

  function instance(mesh, index, position, scale, color, rotation = [0, 0, 0]) {
    dummy.position.set(...position);
    dummy.scale.set(...scale);
    dummy.rotation.set(...rotation);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    mesh.setColorAt(index, tint.set(color));
  }
  function mesh(count, material = organic) {
    const result = new THREE.InstancedMesh(geometry, material, count);
    result.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    result.frustumCulled = false;
    scene.add(result);
    meshes.push(result);
    return result;
  }
  function dirty(value) {
    value.instanceMatrix.needsUpdate = true;
    if (value.instanceColor) value.instanceColor.needsUpdate = true;
  }
  function update(matrix, input, nextSeason = 'spring', nextLeaf = '') {
    const changed = text !== input || q?.size !== matrix.size;
    q = matrix; text = input; season = nextSeason; leaf = nextLeaf;
    n = q.size + 8;
    colors = floorColors(q, text, season, leaf);
    for (const item of meshes) { scene.remove(item); item.dispose?.(); item.geometry !== geometry && item.geometry?.dispose(); }
    meshes = [];
    const rng = random(seedOf(text));
    ground = mesh(n * n, basic);
    // Tree view shows a soft stone path; the leaf palette only appears once folded.
    groundFlat = []; groundTree = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const y = r - 4, x = c - 4, dark = q.modules[y]?.[x] === true;
      const stone = dark ? (q.isFinder(y, x) ? SEASONS[season].grass : '#d6cfc2') : '#f6f1e7';
      groundFlat.push(new THREE.Color(colors[r][c]));
      groundTree.push(new THREE.Color(stone).offsetHSL(0, 0, (rng() - .5) * .04));
      instance(ground, r * n + c, [c - (n - 1) / 2, -.16, r - (n - 1) / 2], [1, .3, 1], colors[r][c]);
    }
    groundAmount = -1;
    dirty(ground);
    // Six spreading branch tips give the crown its clustered silhouette.
    const tips = Array.from({length: 6}, (_, i) => {
      const angle = i * Math.PI / 3 + rng() * .3;
      return new THREE.Vector3(Math.cos(angle) * n * .29, n * (.68 + rng() * .25), Math.sin(angle) * n * .29);
    });
    tips.push(new THREE.Vector3(0, n * 1.12, 0));
    branches = []; anchors = [...tips];
    function branch(a, b, width) {
      const direction = b.clone().sub(a);
      const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
      branches.push({p: a.clone().add(b).multiplyScalar(.5), length: direction.length(), width, rotation});
      if (width < n * .01) anchors.push(b.clone());
    }
    branch(new THREE.Vector3(), new THREE.Vector3(0, n * .76, 0), n * .024);
    tips.forEach(tip => {
      const start = new THREE.Vector3(0, n * (.32 + rng() * .17), 0);
      branch(start, tip, n * .014);
      anchors.push(start.clone().lerp(tip, .62));
      for (let i = 0; i < 3; i++) branch(tip.clone().lerp(start, .3), tip.clone().add(new THREE.Vector3((rng() - .5) * n * .22, rng() * n * .12, (rng() - .5) * n * .22)), n * .006);
    });
    wood = mesh(branches.length);
    wood.castShadow = !mobile;
    // Leaves gather in clumps around branch ends; lower and inner leaves are darker.
    const base = new THREE.Color(leaf || SEASONS[season].leaf);
    const top = Math.max(...anchors.map(a => a.y)) + n * .12;
    leaves = allocateLeaves(q, text, mobile ? 2500 : 4500).map((entry, i) => {
      const anchor = anchors[Math.floor(rng() * anchors.length)];
      const u = rng() * 2 - 1, angle = rng() * Math.PI * 2, radius = Math.cbrt(rng()) * n * .12;
      const ring = Math.sqrt(1 - u * u);
      const p = [anchor.x + Math.cos(angle) * ring * radius, anchor.y + u * radius * .75, anchor.z + Math.sin(angle) * ring * radius];
      const height = clamp((p[1] - n * .35) / (top - n * .35));
      const outer = clamp(Math.hypot(p[0], p[2]) / (n * .45));
      const light = (height - .6) * .2 + (outer - .5) * .08 + (rng() - .5) * .08;
      const treeColor = '#' + base.clone().offsetHSL((rng() - .5) * .02, 0, light).getHexString();
      return {...entry, tree: p, tone: Math.floor(rng() * 3), treeColor, size: .55 + rng() * .35};
    });
    foliage = mesh(leaves.length, basic);
    foliage.castShadow = !mobile;
    blades = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const y = r - 4, x = c - 4;
      const finder = q.modules[y]?.[x] && q.isFinder(y, x);
      const border = (r === 4 || c === 4 || r === n - 5 || c === n - 5) && x >= 0 && y >= 0 && x < q.size && y < q.size;
      if (finder || border) for (let i = 0; i < (finder ? 5 : 3); i++) blades.push({x: c - (n - 1) / 2 + (rng() - .5) * .8, z: r - (n - 1) / 2 + (rng() - .5) * .8, finder, phase: rng() * 6, tall: .35 + rng() * .55, shade: '#' + new THREE.Color(SEASONS[season].grass).offsetHSL(0, 0, (rng() - .35) * .16).getHexString()});
    }
    grass = mesh(blades.length, basic);
    // Invisible tap target so taps between leaves still count as tapping the tree.
    hit = new THREE.Mesh(new THREE.CylinderGeometry(n * .38, n * .1, n * 1.15, 12), new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false, colorWrite: false}));
    hit.position.y = n * .58;
    scene.add(hit); meshes.push(hit);
    particles = Array.from({length: 48}, () => ({x: (rng() - .5) * (q.size - 2), z: (rng() - .5) * (q.size - 2), phase: rng() * 6, speed: .5 + rng()}));
    motes = mesh(particles.length, basic);
    rain = mesh(100, new THREE.MeshBasicMaterial({color: '#8b9495', transparent: true, opacity: .22}));
    if (changed) {
      amount = target = 1;
      transition = null;
      opening = performance.now() + 600;
      controls.autoRotate = false;
      onFold?.(true);
    }
    sync();
  }
  function animate(time, complete = false) {
    const safe = palette(season, leaf), original = leaf || SEASONS[season].leaf;
    const shades = safe.leaf.map(color => new THREE.Color(color));
    const flowing = new THREE.Color();
    const tree = 1 - amount;
    shadow.scale.set(n * .25, n * .25, 1);
    shadow.visible = amount < .98;
    frame++;
    leaves.forEach((entry, i) => {
      if (!complete && amount === 0 && i % 4 !== frame % 4) return;
      const x = entry.c - (q.size - 1) / 2, z = entry.r - (q.size - 1) / 2;
      const arc = Math.sin(amount * Math.PI);
      const y = .12 + entry.layer * .025;
      const size = THREE.MathUtils.lerp(entry.size, 1, amount);
      const breath = 1 + Math.sin(time + entry.phase) * .08;
      const colorIndex = (entry.tone + Math.floor(time / 3)) % 3;
      const flatColor = '#' + flowing.copy(shades[colorIndex]).lerp(shades[(colorIndex + 1) % 3], (time / 3) % 1).getHexString();
      instance(foliage, i, [entry.tree[0] * tree + x * amount, (entry.tree[1] + Math.sin(time + entry.phase) * .06) * tree + y * amount * breath + arc * n * .25, entry.tree[2] * tree + z * amount], [size, THREE.MathUtils.lerp(entry.size * .55, .045, amount) * breath, size], amount > .98 ? flatColor : entry.treeColor, [0, tree * entry.phase, tree * .3]);
    });
    dirty(foliage);
    if (groundAmount !== amount) {
      groundAmount = amount;
      groundTree.forEach((color, i) => ground.setColorAt(i, tint.copy(color).lerp(groundFlat[i], amount)));
      ground.instanceColor.needsUpdate = true;
    }
    branches.forEach((entry, i) => {
      dummy.position.copy(entry.p); dummy.position.y *= tree;
      dummy.quaternion.copy(entry.rotation);
      dummy.scale.set(entry.width * tree, entry.length * tree, entry.width * tree);
      dummy.updateMatrix(); wood.setMatrixAt(i, dummy.matrix); wood.setColorAt(i, tint.set('#79523d'));
    });
    dirty(wood);
    blades.forEach((entry, i) => {
      const visible = entry.finder ? 1 : tree;
      instance(grass, i, [entry.x, .12, entry.z], [.1 * visible, (.14 + tree * entry.tall) * visible, .1], amount > .98 ? safe.grass : entry.shade, [Math.sin(time + entry.phase) * .15 * tree, entry.phase, 0]);
    });
    dirty(grass);
    particles.forEach((entry, i) => {
      const visible = amount > .98 ? i < 12 : true;
      const cycle = (time * entry.speed + entry.phase) % 10;
      const y = amount > .98 ? .4 + cycle * .15 : season === 'summer' ? cycle * n / 10 : Math.max(.05, (8 - cycle) * n / 8);
      instance(motes, i, [entry.x + Math.sin(time + entry.phase) * .5, y, entry.z], visible ? [.24, .05, .24] : [0, 0, 0], season === 'summer' ? '#ebd990' : original, [0, time + entry.phase, .3]);
    });
    dirty(motes);
    rain.visible = season === 'autumn' && amount < .98;
    for (let i = 0; i < 100; i++) {
      const p = particles[i % particles.length];
      instance(rain, i, [p.x + i % 3, n * (1 - (time * .4 + i / 100) % 1), p.z], [.018, n * .055, .018], '#8b9495', [0, 0, -.18]);
    }
    dirty(rain);
  }
  function pose() {
    const span = n * (1.65 - amount * .65);
    const aspect = renderer.domElement.width / renderer.domElement.height;
    camera.left = -span * aspect / 2; camera.right = span * aspect / 2;
    camera.top = span / 2; camera.bottom = -span / 2;
    if (amount === 1) camera.zoom = 1;
    camera.updateProjectionMatrix();
    controls.enabled = amount === 0 && !transition && !recording;
    if (transition || amount === 1) {
      controls.maxPolarAngle = Math.PI / 2;
      controls.minPolarAngle = 0;
      treePosition.set(n, n * 1.4, n);
      flatPosition.set(0, n * 2, .00001);
      camera.position.lerpVectors(treePosition, flatPosition, amount);
      controls.target.set(0, n * .48 * (1 - amount), 0);
      camera.up.set(Math.sin(Math.PI * amount) * .34, 1, 0).normalize();
    } else {
      controls.minPolarAngle = Math.PI / 6;
      controls.maxPolarAngle = Math.PI * 65 / 180;
    }
  }
  // Every readback synchronously updates instances, controls, size and rendering.
  function sync(width, height, complete = true) {
    if (!q) return;
    const now = performance.now();
    if (transition) {
      const progress = clamp((now - transition.start) / transition.duration);
      amount = THREE.MathUtils.lerp(transition.from, target, ease(progress));
      if (progress === 1) { transition = null; controls.autoRotate = target === 0 && !touched; onFold?.(target === 1); }
    }
    animate(now / 1000, complete);
    const w = width || host.clientWidth || 512, h = height || host.clientHeight || 512;
    renderer.setSize(w, h, false);
    pose(); controls.update(); renderer.render(scene, camera);
  }
  function setFlat(flat, duration = 1400) {
    target = flat ? 1 : 0;
    controls.autoRotate = false;
    transition = {start: performance.now(), from: amount, duration};
    opening = 0;
    onFold?.(flat);
    return flat;
  }
  function toggle() { if (q && !recording) return setFlat(target !== 1); }
  function scan() {
    scanContext.drawImage(renderer.domElement, 0, 0, 512, 512);
    return verify(scanCanvas, text);
  }
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let down;
  renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', e => {
    if (!q || !down || recording || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    if (amount === 1) { toggle(); return; }
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    ray.setFromCamera(pointer, camera);
    if (ray.intersectObject(hit).length) toggle();
  });
  function loop(now) {
    requestAnimationFrame(loop);
    if (!q || document.hidden || !host.clientWidth || recording) return;
    if (opening && now >= opening) setFlat(false, 1800);
    sync(undefined, undefined, false);
    if (amount === 1 && !transition && now - lastScan >= 700) {
      lastScan = now; onScan?.(scan());
    }
  }
  requestAnimationFrame(loop);
  return {
    update, toggle,
    flatCanvas: () => renderFloor(q, colors),
    poster() {
      const saved = {amount, target, transition, position: camera.position.clone(), look: controls.target.clone(), up: camera.up.clone()};
      amount = target = 0; transition = null;
      camera.position.set(n, n * 1.4, n); controls.target.set(0, n * .48, 0); camera.up.set(0, 1, 0);
      sync();
      const poster = composePoster(renderer.domElement, renderFloor(q, colors), text);
      ({amount, target, transition} = saved);
      camera.position.copy(saved.position); controls.target.copy(saved.look); camera.up.copy(saved.up);
      sync();
      return poster;
    },
    async video() {
      if (recording) throw new Error('正在錄製');
      recording = true;
      const saved = {amount, target, transition, opening, zoom: camera.zoom, autoRotate: controls.autoRotate};
      amount = target = 1; transition = null; opening = 0; camera.zoom = 1; controls.autoRotate = false;
      const ratio = renderer.getPixelRatio(); renderer.setPixelRatio(1);
      const chunks = [];
      let recorder, stream;
      try {
        sync(1080, 1080);
        if (!scan().ok) throw new Error('錄製畫面掃不到');
        stream = renderer.domElement.captureStream(30);
        recorder = new MediaRecorder(stream);
        const completed = new Promise((resolve, reject) => {
          recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
          recorder.onstop = resolve;
          recorder.onerror = () => reject(new Error('影片編碼失敗'));
        });
        recorder.start();
        const start = performance.now();
        let checked = 0;
        while (performance.now() - start < 6000) {
          if (document.hidden) throw new Error('錄製中分頁不可隱藏，請重新錄製');
          sync(1080, 1080);
          if (performance.now() - checked >= 500) {
            checked = performance.now();
            if (!scan().ok) throw new Error('動態畫面驗證失敗，影片已丟棄');
          }
          await new Promise(resolve => setTimeout(resolve, 33));
        }
        sync(1080, 1080);
        if (!scan().ok) throw new Error('影片最後畫面掃不到');
        recorder.stop(); await completed;
        return new Blob(chunks, {type: recorder.mimeType});
      } finally {
        if (recorder?.state === 'recording') recorder.stop();
        stream?.getTracks().forEach(track => track.stop());
        ({amount, target, transition, opening} = saved);
        camera.zoom = saved.zoom; controls.autoRotate = saved.autoRotate;
        renderer.setPixelRatio(ratio); recording = false; sync();
      }
    }
  };
}
