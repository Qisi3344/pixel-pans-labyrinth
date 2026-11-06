import * as THREE from 'three';
import {CELL,SIZE,CENTER,RUIN_RADIUS,withinRuin} from './maze.js';

const PALETTE = {
  rock: [0x55615d,0x65726a,0x78857b,0x47524f,0x5d685f],
  floor: [0x34423f,0x43534d,0x3d4b47,0x4c5c53,0x394944],
  moss: [0x39594d,0x48674f,0x62785b,0x314b43],
  glass: 0xb8e9db,
};
const origin = CENTER;
// A cutaway sunken court: its last steps sink toward the sacred centre.
export const terrainY = ({x,z}) => {
  const d=Math.hypot(x-CENTER,z-CENTER);
  return d < .6 ? -.76 : d < 1.3 ? -.43 : d < 1.8 ? -.20 : 0;
};
export const world = ({x,z}) => new THREE.Vector3((x-origin)*CELL,terrainY({x,z}),(z-origin)*CELL);
function hash(x,z,seed=31) { const n=Math.sin((x+seed)*127.1+(z-seed)*311.7)*43758.5453;return n-Math.floor(n); }
function mat(hex,extra={}) {return new THREE.MeshLambertMaterial({color:hex,...extra});}
const cube = new THREE.BoxGeometry(1,1,1);
function box(parent,color,where,scale,cast=true){
  const m = new THREE.Mesh(cube,typeof color==='number'?mat(color):color);
  m.position.set(...where);m.scale.set(...scale);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;
}
function cylinder(parent, material, radiusTop, radiusBottom, height, segments, y){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,height,segments),material);
  m.position.y=y;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function makeGlow(parent,color,rad,pos){
  const sphere=new THREE.Mesh(new THREE.IcosahedronGeometry(rad,1),new THREE.MeshBasicMaterial({color}));
  sphere.position.set(...pos);parent.add(sphere);return sphere;
}
function tuft(parent,x,z,size,shade) {
  const grass=new THREE.Group();grass.position.set(x,.10,z);parent.add(grass);
  const material=mat(shade);
  for(let k=0;k<3;k++){
    const blade=new THREE.Mesh(new THREE.ConeGeometry(size*.27,size,3),material);
    blade.position.set((k-1)*size*.16,size*.36,Math.sin(k*3)*size*.1);
    blade.rotation.z=(k-1)*.3;grass.add(blade);
  }
}
function root(parent, start, end, radius=.17, color=0x2e3737) {
  const dir=new THREE.Vector3().subVectors(end,start);
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius*.68,radius,dir.length(),5),mat(color));
  mesh.position.copy(start).addScaledVector(dir,.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
  mesh.castShadow=true;parent.add(mesh);
}
function twistedTree(parent,x,z,seed=0) {
  const tree=new THREE.Group();tree.position.set(x,-.05,z);parent.add(tree);
  const bark=seed%2?0x353a3b:0x424342;
  root(tree,new THREE.Vector3(0,0,0),new THREE.Vector3(.05,1.1,0),.30,bark);
  root(tree,new THREE.Vector3(.05,1.1,0),new THREE.Vector3(-.15,2.1,.12),.24,bark);
  root(tree,new THREE.Vector3(-.15,2.1,.12),new THREE.Vector3(-.46,3.0,-.12),.16,bark);
  root(tree,new THREE.Vector3(-.1,1.9,.10),new THREE.Vector3(.95,2.78,.18),.13,bark);
  root(tree,new THREE.Vector3(.85,2.7,.18),new THREE.Vector3(1.32,3.23,.40),.08,bark);
  root(tree,new THREE.Vector3(-.32,2.6,-.10),new THREE.Vector3(-1.03,2.98,-.6),.08,bark);
  for (let i=0;i<3;i++) {
    const s=new THREE.Mesh(new THREE.IcosahedronGeometry(.45+i*.12,0),mat(i===1?0x536c62:0x405951));
    s.scale.set(1.3,.55,.9);
    s.position.set(i===0?-.53:i===1?.88:-.19,3.15+(i%2)*.28,i===1?.23:-.2);
    s.castShadow=true;tree.add(s);
  }
  return tree;
}
// Circular stone architecture is modeled in three dimensions, not flattened onto textures.
function stoneArc(parent,radius,theta,arc,height,thickness,tint,base=-.08) {
  const g=new THREE.Group();
  g.position.set(Math.cos(theta)*radius,0,Math.sin(theta)*radius);
  g.rotation.y=-theta-Math.PI/2;
  parent.add(g);
  const core=box(g,tint,[0,base+height/2,0],[arc,height,thickness]);
  core.rotation.z=(hash(theta*73,radius) - .5)*.035;
  box(g,0x879389,[0,base+height-.035,0],[arc*1.03,.10,thickness*1.13],false);
  if(hash(theta*23,radius,6)>.34) box(g,0x384d42,[arc*.24,base+height+.016,thickness*.2],[arc*.28,.035,thickness*.42],false);
  return g;
}
function ruinPerimeter(parent,radius){
  const entrance=Math.atan2((15-CENTER),(3-CENTER));
  const count=52, arc=Math.PI*2*radius/count;
  for(let i=0;i<count;i++){
    const a=(i+.5)*2*Math.PI/count;
    const delta=Math.atan2(Math.sin(a-entrance),Math.cos(a-entrance));
    if(Math.abs(delta)<.19)continue; // Physical breach in the south-western entrance.
    const h=1.16+.82*hash(i,18);
    stoneArc(parent,radius,a,arc*.87,h,.74,PALETTE.rock[(i*7)%PALETTE.rock.length]);
    if(i%9===0){
      const p=new THREE.Group();p.position.set(Math.cos(a)*(radius+.64),-.12,Math.sin(a)*(radius+.64));parent.add(p);
      box(p,0x586a5e,[0,.20,0],[.85,.47,.77]);
    }
  }
  // Two tall guardians mark the entrance. From above the circular floor plan stays legible.
  for(const sign of [-1,1]){
    const a=entrance+sign*.218;
    const x=Math.cos(a)*radius,z=Math.sin(a)*radius;
    const plinth=new THREE.Group();plinth.position.set(x,0,z);parent.add(plinth);
    cylinder(plinth,mat(0x44534f),.53,.66,2.2,7,1.05);
    cylinder(plinth,mat(0x829186),.62,.54,.19,7,2.22);
    const face=box(plinth,0x283c38,[0,1.51,.52],[.24,.54,.035],false);
    face.rotation.y=-a;
  }
}
function buildWell(parent){
  const group=new THREE.Group();parent.add(group);
  const outer=2.52;
  // An actual hollow, downward-flaring stone shaft (top is narrower than bottom).
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(outer,3.05,2.7,28,1,true),mat(0x394641,{side:THREE.DoubleSide}));
  wall.position.y=-1.51;wall.receiveShadow=true;wall.castShadow=true;group.add(wall);
  cylinder(group,mat(0x1b2929),2.91,2.91,.09,28,-2.91);
  // Visible horizontal strata inside the well, and a carved circular stone lip.
  for(let i=0;i<4;i++){
    const r=outer+.09+i*.085;
    const torus=new THREE.Mesh(new THREE.TorusGeometry(r,.07,5,48),mat(i%2?0x718077:0x596960));
    torus.rotation.x=Math.PI/2;torus.position.y=-.20-i*.63;group.add(torus);
  }
  const lip=new THREE.Mesh(new THREE.TorusGeometry(outer,.21,6,48),mat(0x89958a));
  lip.rotation.x=Math.PI/2;lip.position.y=-.20;lip.receiveShadow=true;group.add(lip);
  // Twelve wedge-shaped stone steps trace a genuine 3D descending spiral.
  const steps=16,inner=.67,outerStep=2.30;
  for(let i=0;i<steps;i++){
    const a=Math.PI/2 + i*2*Math.PI/steps, b=a+Math.PI*2/steps*.92;
    const shape=new THREE.Shape();
    shape.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);
    shape.lineTo(Math.cos(a)*outerStep,Math.sin(a)*outerStep);
    for(let k=1;k<=3;k++) {const t=a+(b-a)*k/3;shape.lineTo(Math.cos(t)*outerStep,Math.sin(t)*outerStep);}
    shape.lineTo(Math.cos(b)*inner,Math.sin(b)*inner);
    for(let k=2;k>=0;k--) {const t=a+(b-a)*k/3;shape.lineTo(Math.cos(t)*inner,Math.sin(t)*inner);}
    shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.17,bevelEnabled:false,curveSegments:2});
    geometry.rotateX(-Math.PI/2);
    const mesh=new THREE.Mesh(geometry,mat(i%3===0?0x8c9c8e:0x738277,{side:THREE.DoubleSide}));
    mesh.position.y=-.18-i*.072;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  }
  // Central monolith: the single readable silhouette at the end of the labyrinth.
  const island=cylinder(group,mat(0x56645c),.72,.84,.24,9,-.78);
  cylinder(group,mat(0x919e90),.66,.74,.08,9,-.62);
  const monolith=new THREE.Mesh(new THREE.CylinderGeometry(.22,.38,2.75,5),mat(0x4d5c57));
  monolith.position.set(0,.62,-.19);monolith.castShadow=true;group.add(monolith);
  const cap=new THREE.Mesh(new THREE.ConeGeometry(.31,.52,5),mat(0x7f8b81));
  cap.position.set(0,2.17,-.19);cap.castShadow=true;group.add(cap);
  // Small luminous mark on the monolith, original geometry (not film texture).
  const sigil=new THREE.Mesh(new THREE.TorusGeometry(.14,.028,4,16),new THREE.MeshBasicMaterial({color:0xb2e2d0}));
  sigil.position.set(0,1.2,.057);group.add(sigil);
  return group;
}
function makeRune(parent,rune,clickables){
  const pivot=new THREE.Group();pivot.position.copy(world(rune));pivot.position.x+=.16;pivot.position.z-=.13;parent.add(pivot);
  cylinder(pivot,mat(0x303d3a),.38,.45,.16,8,.16);
  cylinder(pivot,mat(0x7f8582),.25,.30,.55,6,.42);
  cylinder(pivot,mat(0x313c39),.36,.36,.12,8,.74);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.27,.033,5,24),new THREE.MeshBasicMaterial({color:rune.color}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.86;pivot.add(ring);
  // A clear, raised compass pointer whose rotation is tied to the logical puzzle state.
  const arrow=new THREE.Shape();
  arrow.moveTo(0,.25);arrow.lineTo(.16,.02);arrow.lineTo(.065,.02);
  arrow.lineTo(.065,-.19);arrow.lineTo(-.065,-.19);arrow.lineTo(-.065,.02);
  arrow.lineTo(-.16,.02);arrow.closePath();
  const pointer=new THREE.Mesh(new THREE.ShapeGeometry(arrow),new THREE.MeshBasicMaterial({color:rune.color,side:THREE.DoubleSide,depthTest:true}));
  pointer.rotation.x=-Math.PI/2;pointer.position.y=.885;pivot.add(pointer);
  const gem=makeGlow(pivot,rune.color,.115,[0,1.18,0]);
  const light=new THREE.PointLight(rune.color,1.1,3.5,2);light.position.y=1.25;pivot.add(light);
  pivot.traverse(o=>{if(o.isMesh){o.userData={kind:'rune',index:rune.index};clickables.push(o);}});
  return {pivot,ring,pointer,gem,light};
}
function makeGate(parent,gate,clickables){
  const position=world(gate);
  const group=new THREE.Group();group.position.set(position.x,0,position.z);parent.add(group);
  box(group,0x34443f,[0,.72,0],[CELL*.94,1.46,CELL*.94]);
  box(group,0x818b80,[0,1.49,0],[CELL*1.01,.16,CELL*1.01]);
  box(group,0x9aa69b,[0,1.53,0],[CELL*.71,.06,CELL*.71],false);
  const symbol=new THREE.Mesh(new THREE.TorusGeometry(.18,.032,4,16),new THREE.MeshBasicMaterial({color:0xa8e0cc}));
  symbol.rotation.x=-Math.PI/2;symbol.position.y=1.595;group.add(symbol);
  group.traverse(o=>{if(o.isMesh){o.userData={kind:'gate',index:gate.index};clickables.push(o);}});
  return {group, symbol};
}
function makeExit(parent, cell){
  const p=world(cell);const group=new THREE.Group();group.position.set(p.x,0,p.z);parent.add(group);
  cylinder(group,mat(0x495752),.46,.53,.23,10,.19);
  cylinder(group,mat(0xa4aea3),.39,.44,.12,10,.35);
  cylinder(group,mat(0x283e3c),.29,.32,.12,12,.44);
  const flame=makeGlow(group,0xd1f6e4,.23,[0,.9,0]);
  const light=new THREE.PointLight(0xb0e8dc,1.8,4,2);light.position.y=1.1;group.add(light);
  const circle=new THREE.Mesh(new THREE.TorusGeometry(.35,.028,5,30),new THREE.MeshBasicMaterial({color:0xa9dacd}));
  circle.rotation.x=-Math.PI/2;circle.position.y=.54;group.add(circle);
  return {group,flame,circle,light};
}
function makePlayer(parent,initial){
  const body=new THREE.Group();body.position.copy(world(initial));body.position.y=.13;parent.add(body);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.29,16),new THREE.MeshBasicMaterial({color:0x182c2c,transparent:true,opacity:.40,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-.065;body.add(shadow);
  const cape=new THREE.Mesh(new THREE.ConeGeometry(.30,.78,6),mat(0x556a87));cape.position.y=.48;cape.rotation.y=Math.PI/6;cape.castShadow=true;body.add(cape);
  box(body,0x25333a,[0,.22,.14],[.16,.37,.14]);
  const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.24,1),mat(0xcebcae));head.position.y=.92;head.castShadow=true;body.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.245,8,5,0,Math.PI*2,0,Math.PI*.58),mat(0x272a2e));
  hair.position.y=1.03;hair.castShadow=true;body.add(hair);
  box(body,0x25343b,[-.12,.13,.05],[.13,.24,.17]);
  box(body,0x25343b,[.12,.13,.05],[.13,.24,.17]);
  // Small lantern with an actual luminous mesh, not a billboard/sprite.
  const lantern=box(body,0x2b3436,[.30,.48,-.08],[.22,.31,.20]);
  lantern.material=mat(0x2d3a39);
  makeGlow(body,0xf4d6a3,.082,[.30,.48,-.08]);
  const light=new THREE.PointLight(0xe2c69c,.7,2.5,2);light.position.set(.3,.52,-.08);body.add(light);
  return {body,cape,head,light};
}

export function createDiorama(canvas,maze) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
  renderer.setClearColor(0xffffff,1);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NoToneMapping;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
  const camera=new THREE.OrthographicCamera(-16,16,12,-12,.1,130);
  camera.position.set(29,35,29);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xeaf9f5,0x4b514b,2.0));
  const sun=new THREE.DirectionalLight(0xffffff,2.6);
  sun.position.set(-12,27,17);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-23;sun.shadow.camera.right=23;sun.shadow.camera.top=23;sun.shadow.camera.bottom=-23;
  sun.shadow.camera.near=1;sun.shadow.camera.far=70;sun.shadow.bias=-.0005;scene.add(sun);
  const table=new THREE.Mesh(new THREE.PlaneGeometry(150,150),mat(0xffffff));
  table.rotation.x=-Math.PI/2;table.position.y=-1.55;table.receiveShadow=true;scene.add(table);
  const stage=new THREE.Group();scene.add(stage);
  const boardSize=(RUIN_RADIUS+.55)*CELL;
  // Circular cutaway: a thick annular island; the open centre exposes the spiral shaft.
  const annulus=new THREE.Shape();annulus.absarc(0,0,boardSize,0,Math.PI*2,false);
  const hole=new THREE.Path();hole.absarc(0,0,2.37,0,Math.PI*2,true);annulus.holes.push(hole);
  const strata=new THREE.ExtrudeGeometry(annulus,{depth:1.03,bevelEnabled:false,curveSegments:48});
  strata.rotateX(-Math.PI/2);
  const island=new THREE.Mesh(strata,mat(0x46554f,{side:THREE.DoubleSide}));
  island.position.y=-1.27;island.castShadow=true;island.receiveShadow=true;stage.add(island);
  const bottomLip=new THREE.Mesh(new THREE.TorusGeometry(boardSize,.21,5,58),mat(0x283b36));
  bottomLip.rotation.x=Math.PI/2;bottomLip.position.y=-1.16;stage.add(bottomLip);
  ruinPerimeter(stage,RUIN_RADIUS*CELL+.43);
  buildWell(stage);
  const clickables=[];
  const tiles=[];
  for(let z=0;z<SIZE;z++) for(let x=0;x<SIZE;x++){
    if(!withinRuin(x,z))continue;
    const p=world({x,z});const h=hash(x,z);
    const solid=!maze.grid[z][x];
    const inner=Math.hypot(p.x,p.z)<2.45;
    if(solid){
      // Low broken stones near the well preserve the central circular silhouette.
      if(inner) {
        // A broken block on the stair is a visible collision boundary, never an invisible wall.
        box(stage,0x3f534a,[p.x,-.36,p.z],[CELL*.73,.48,CELL*.73]);
        continue;
      }
      const height=1.18+h*.64;
      const column=box(stage,PALETTE.rock[Math.floor(h*5)], [p.x,height/2-.08,p.z],[CELL*.99,height,CELL*.99]);
      if(hash(z,x,7)>.42){
        box(stage,0x849187,[p.x,height-.055,p.z],[CELL*1.015,.105,CELL*1.015],false);
      }
      if(hash(x,z,54)>.59){
        box(stage,0x334b41,[p.x+CELL*.23,height+.012,p.z-CELL*.23],[CELL*.26,.045,CELL*.22],false);
      }
      column.userData.kind='wall';
    } else {
      const floorMaterial=inner?mat(0x596f65,{transparent:true,opacity:0,depthWrite:false}):PALETTE.floor[Math.floor(h*5)];
      const slab=box(stage,floorMaterial,[p.x,inner?.09:p.y-.105,p.z],[CELL*.965,inner?.025:.22,CELL*.965],false);
      slab.userData={kind:'tile',x,z};clickables.push(slab);tiles.push(slab);
      if(!inner && hash(x,z,9)>.76 && !maze.runes.some(r=>r.x===x&&r.z===z)){
        tuft(stage,p.x+(h-.5)*.65,p.z+(hash(z,x)-.5)*.6,.19,PALETTE.moss[Math.floor(h*4)]);
      }
      if(!inner && hash(x,z,55)>.93) {
        box(stage,0x93a69b,[p.x-.27,.016,p.z+.26],[.23,.03,.06],false);
      }
    }
  }
  // Sparse ruins and three old trees outside the footprint; no square border corners.
  for(let k=0;k<36;k++){
    const a=k*2.399963, radius=RUIN_RADIUS*CELL+.95+hash(k,11)*.75;
    const x=Math.cos(a)*radius,z=Math.sin(a)*radius;
    box(stage,PALETTE.rock[k%PALETTE.rock.length],[x,-.41,z],[.20+hash(k,2)*.42,.12+hash(k,3)*.32,.22],false);
  }
  [[-8.9,-6.2],[9.0,-5.5],[-5.5,-9.25]].forEach(([x,z],index)=>twistedTree(stage,x,z,index));
  const visuals={gates:maze.gates.map(g=>makeGate(stage,g,clickables)),runes:maze.runes.map(r=>makeRune(stage,r,clickables))};
  const exit=makeExit(stage,maze.exit);
  const player=makePlayer(stage,maze.start);
  const ray=new THREE.Raycaster();
  const mouse=new THREE.Vector2();
  let zoom=1;
  let screenWidth=0,screenHeight=0;
  const target=new THREE.Vector3();const lookAt=new THREE.Vector3();
  const direction=new THREE.Vector3(1,1.18,1).normalize();
  function resize(){
    const w=canvas.clientWidth||window.innerWidth,h=canvas.clientHeight||window.innerHeight;
    if(w===screenWidth&&h===screenHeight)return;
    screenWidth=w;screenHeight=h;
    const aspect=w/h,portrait=aspect<.85;
    // Desktop sees the entire model; portrait uses an isometric follow-camera.
    const vertical=portrait?18:26;
    camera.left=-vertical*aspect/(2*zoom);camera.right=vertical*aspect/(2*zoom);
    camera.top=vertical/(2*zoom);camera.bottom=-vertical/(2*zoom);
    camera.updateProjectionMatrix();
    const factor=portrait?2.05:2.75;
    renderer.setPixelRatio(1);
    renderer.setSize(Math.max(160,Math.floor(w/factor)),Math.max(170,Math.floor(h/factor)),false);
    renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';
  }
  function setZoom(next){zoom=THREE.MathUtils.clamp(next,.72,1.65);screenWidth=0;resize();return zoom;}
  function pick(clientX,clientY){
    const rect=canvas.getBoundingClientRect();
    mouse.set(((clientX-rect.left)/rect.width)*2-1,-((clientY-rect.top)/rect.height)*2+1);
    ray.setFromCamera(mouse,camera);
    const hit=ray.intersectObjects(clickables,false)[0];
    return hit?.object.userData||null;
  }
  function draw(now,dt,cell,moving){
    resize();
    const pos=player.body.position;
    if(!moving){pos.y=terrainY(cell)+.13+Math.sin(now*1.8)*.012;}
    player.cape.rotation.z=moving?Math.sin(now*13)*.035:Math.sin(now*2)*.012;
    for(let i=0;i<3;i++){
      const rune=maze.runes[i], v=visuals.runes[i],gate=visuals.gates[i];
      v.pointer.rotation.z=-(rune.phase*Math.PI/2);
      v.gem.position.y=1.18+Math.sin(now*2.7+i)*.10;
      v.gem.rotation.y+=dt*.6;
      v.ring.material.color.setHex(rune.solved?0x75a092:rune.color);
      v.light.intensity=rune.solved?.35:1.1;
      const y=rune.solved?-2.2:0;
      gate.group.position.y=THREE.MathUtils.damp(gate.group.position.y,y,5,dt);
    }
    exit.flame.position.y=.9+Math.sin(now*2.3)*.12;
    exit.flame.rotation.y+=dt*.35;
    exit.circle.rotation.z=now*.3;
    const portrait=screenWidth/screenHeight<.85;
    const focal=portrait?new THREE.Vector3(pos.x,.15,pos.z):new THREE.Vector3(0,0,0);
    target.lerp(focal,Math.min(1,dt*(portrait?4:2)));
    camera.position.copy(target).addScaledVector(direction,43);
    lookAt.copy(target);camera.lookAt(lookAt);
    renderer.render(scene,camera);
  }
  resize();draw(0,.016,maze.start,false);
  return { renderer,scene,camera,player,visuals,draw,pick,setZoom,getZoom:()=>zoom,resize,dispose:()=>renderer.dispose() };
}