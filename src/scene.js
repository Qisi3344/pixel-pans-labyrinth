import * as THREE from 'three';
import {CELL,SIZE,id} from './maze.js';

const PALETTE = {
  rock: [0x55615d,0x65726a,0x78857b,0x47524f,0x5d685f],
  floor: [0x34423f,0x43534d,0x3d4b47,0x4c5c53,0x394944],
  moss: [0x39594d,0x48674f,0x62785b,0x314b43],
  glass: 0xb8e9db,
};
const origin = (SIZE-1)/2;
export const world = ({x,z}) => new THREE.Vector3((x-origin)*CELL,0,(z-origin)*CELL);
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
  const boardSize=SIZE*CELL+.8;
  box(stage,0x293633,[0,-.92,0],[boardSize+.55,.95,boardSize+.55]);
  box(stage,0x526059,[0,-.39,0],[boardSize,.20,boardSize]);
  box(stage,0x68776c,[0,-.265,0],[boardSize-.32,.10,boardSize-.32]);
  const clickables=[];
  const tiles=[];
  for(let z=0;z<SIZE;z++) for(let x=0;x<SIZE;x++){
    const p=world({x,z});const h=hash(x,z);
    const solid=!maze.grid[z][x];
    if(solid){
      const height=1.35+h*.56;
      const column=box(stage,PALETTE.rock[Math.floor(h*5)], [p.x,height/2-.08,p.z],[CELL*.99,height,CELL*.99]);
      if(hash(z,x,7)>.42){
        box(stage,0x849187,[p.x,height-.055,p.z],[CELL*1.015,.105,CELL*1.015],false);
      }
      if(hash(x,z,54)>.59){
        box(stage,0x334b41,[p.x+CELL*.23,height+.012,p.z-CELL*.23],[CELL*.26,.045,CELL*.22],false);
      }
      column.userData.kind='wall';clickables.push(column);
    } else {
      const slab=box(stage,PALETTE.floor[Math.floor(h*5)],[p.x,-.105,p.z],[CELL*.965,.22,CELL*.965],false);
      slab.userData={kind:'tile',x,z};clickables.push(slab);tiles.push(slab);
      if(hash(x,z,9)>.76 && !maze.runes.some(r=>r.x===x&&r.z===z)){
        tuft(stage,p.x+(h-.5)*.65,p.z+(hash(z,x)-.5)*.6,.19,PALETTE.moss[Math.floor(h*4)]);
      }
      if(hash(x,z,55)>.93) {
        box(stage,0x93a69b,[p.x-.27,.016,p.z+.26],[.23,.03,.06],false);
      }
    }
  }
  // Stray stones and roots along the cut edge help this read as a real tabletop diorama.
  for(let k=0;k<42;k++){
    const angle=k*2.399963, radius=boardSize/2+.2+hash(k,11)*.45;
    const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
    box(stage,PALETTE.rock[k%PALETTE.rock.length],[x,-.27,z],[.24+hash(k,2)*.25,.18+hash(k,3)*.29,.27],false);
  }
  [[-boardSize/2-.5,-boardSize/2+.3],[boardSize/2+.25,-boardSize/2+.1],[-boardSize/2+.1,boardSize/2+.25],[boardSize/2+.2,boardSize/2+.35]]
    .forEach(([x,z],index)=>twistedTree(stage,x,z,index));
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
    if(!moving){pos.y=.13+Math.sin(now*1.8)*.012;}
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
