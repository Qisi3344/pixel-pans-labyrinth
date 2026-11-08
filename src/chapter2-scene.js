import * as THREE from 'three';
import {createPlayer,animatePlayer} from './player.js';
import {chapterFraming} from './chapter2-camera.js';
import {createExterior} from './chapter2-exterior.js';
import {createChapter2Ending} from './chapter2-ending.js';
import {createCavern} from './chapter2-cavern.js';
import {NODES,EDGES,STONE_NODES,rootOpen} from './chapter2-logic.js';
const mat=(c,extra={})=>new THREE.MeshLambertMaterial({color:c,flatShading:true,...extra});
const geoBox=new THREE.BoxGeometry(1,1,1);
function block(parent,c,pos,size,rotation=0){
 const mesh=new THREE.Mesh(geoBox,mat(c));mesh.position.set(...pos);mesh.scale.set(...size);mesh.rotation.y=rotation;
 mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function sphere(parent,c,r,pos,detail=0){
 const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,detail),mat(c));m.position.set(...pos);
 m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function rod(parent,c,from,to,ra=.14,rb=ra,segments=6){
 const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),delta=b.clone().sub(a);
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rb,ra,delta.length(),segments),mat(c));
 mesh.position.copy(a).add(b).multiplyScalar(.5);
 mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function disk(parent,c,x,y,z,r=.45){
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.08,10),mat(c));
 mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function leaf(parent,x,y,z,s,c) {
 const o=sphere(parent,c,s,[x,y,z],0);o.scale.set(1.4,.65,.75);
 return o;
}
const pos=n=>new THREE.Vector3(NODES[n].x,-2.75,NODES[n].z);
export function createTreeScene(canvas,state){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.setClearColor(0xffffff);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
 scene.add(new THREE.HemisphereLight(0xf5fff9,0x53685c,2.25));
 const key=new THREE.DirectionalLight(0xf8fff9,2.3);key.position.set(-12,23,11);key.castShadow=true;
 key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-20;key.shadow.camera.right=20;
 key.shadow.camera.top=20;key.shadow.camera.bottom=-20;key.shadow.bias=-.0006;scene.add(key);
 const fill=new THREE.PointLight(0xaab9a6,1.6,18);fill.position.set(2,-.4,8);scene.add(fill);
 const camera=new THREE.OrthographicCamera(-13,13,9,-9,.1,120);
 const direction=new THREE.Vector3(1,1.05,1.3).normalize();
 // Rotate only the underground view; the ground-level tree keeps its camera.
 // The frog's face, mouth and three offerings now face the player.
 const cavernDirection=new THREE.Vector3(-.60,1.24,1.54).normalize();
 const focus=new THREE.Vector3(0,-1.7,0);
 let width=-1,height=-1,zoom=1,portrait=false,cameraReady=false;
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(120,120),mat(0xffffff));ground.rotation.x=-Math.PI/2;ground.position.y=-5.7;ground.receiveShadow=true;scene.add(ground);
 const stage=new THREE.Group();scene.add(stage);
 // The underground is a real organic miniature cave, not a giant box.
 // The open upper/front side keeps Ofelia and all three passage branches visible.
 const cavern=createCavern(stage);
 const clickable=[];
 for(let i=0;i<NODES.length;i++){
  const p=pos(i);
  const marker=disk(stage,[0x82988a,0x788d81][i%2],p.x,-2.82,p.z,.46);
  marker.userData={kind:'node',index:i};clickable.push(marker);
  if(i!==0&&i!==10&&i%3===0)rod(stage,0x4d604f,[p.x+.52,-2.8,p.z+.38],[p.x+.62,-2.05,p.z+.4],.09,.04);
 }
 // Breathing root blocks the passage between 4 and 5.
 const rootPivot=new THREE.Group();rootPivot.position.set(-1,-1.2,1);stage.add(rootPivot);
 const rootGate=rod(rootPivot,0x3c3835,[0,.6,-1.3],[0,-1.65,1.3],.28,.19,8);
 rod(rootPivot,0x555246,[0,.4,-1],[.36,-.5,.5],.12,.07);
 const boulder=new THREE.Group();boulder.position.set(5,-2.33,1);stage.add(boulder);
 const rock=sphere(boulder,0x77796b,.67,[0,0,0],0);rock.scale.set(1.15,.86,.9);
 const rockCap=block(boulder,0x4f5c53,[.15,.53,-.09],[.6,.14,.37],.2);
 // Three distinct side grottoes. The amber gem is at node #11 (4,3),
 // branching off the junction BEFORE the boulder/toad, not behind the boss.
 const stoneModels=STONE_NODES.map((n,i)=>{
  const p=pos(n),group=new THREE.Group();
  group.position.set(p.x,-2.55,p.z);stage.add(group);
  const color=[0x9edeb5,0xbcb0f5,0xffd077][i];
  disk(group,0x5d6758,0,-.25,0,.75);
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.33,.41,.55,7),mat(0x748073));
  plinth.position.y=.07;plinth.castShadow=true;group.add(plinth);
  const gem=new THREE.Mesh(new THREE.OctahedronGeometry(i===2?.55:.43,0),
    new THREE.MeshBasicMaterial({color}));
  gem.position.set(0,.74,0);group.add(gem);
  const collar=new THREE.Mesh(new THREE.TorusGeometry(i===2?.70:.54,.045,6,28),
    new THREE.MeshBasicMaterial({color}));
  collar.rotation.x=-Math.PI/2;collar.position.y=.35;group.add(collar);
  const halo=new THREE.PointLight(color,i===2?2.0:1.35,i===2?6.5:4,2);
  halo.position.set(0,.88,0);group.add(halo);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.18,.42,i===2?3.2:2.0,10,1,true),
    new THREE.MeshBasicMaterial({color,transparent:true,opacity:i===2?.19:.10,
      depthWrite:false,depthTest:true,side:THREE.DoubleSide}));
  beam.position.y=i===2?2.05:1.6;group.add(beam);
  const star=new THREE.Mesh(new THREE.OctahedronGeometry(i===2?.19:.13,0),
    new THREE.MeshBasicMaterial({color}));
  star.position.y=i===2?3.65:2.70;group.add(star);
  group.traverse(o=>{
    if(o.isMesh){o.userData={kind:'stone',index:i};clickable.push(o);}
  });
  return {group,gem,collar,halo,beam,star};
 });
 // The ancient toad is a volumetric low-poly creature with articulated mouth.
 const toad=new THREE.Group();toad.position.set(8.7,-2.5,1);
 // Original model's mouth points along -X. Turn the whole toad to
 // face the new near-front orthographic camera rather than showing its flank.
 toad.rotation.y=1.08;stage.add(toad);
 const body=sphere(toad,0x586b4f,1.25,[0,.53,0],1);body.scale.set(1.14,.75,1.0);
 const belly=sphere(toad,0x9b9c72,.89,[-.62,.39,.12],1);belly.scale.set(.59,.53,.94);
 for(const z of [-.69,.69]){
  const leg=sphere(toad,0x4c614a,.48,[.63,.13,z],0);leg.scale.set(1.12,.7,.78);
  sphere(toad,0x748360,.37,[-.72,.98,z*.85],0);
  sphere(toad,0xc9bb8d,.23,[-.83,1.05,z*.85],1);
  sphere(toad,0x202b25,.095,[-1.012,1.06,z*.85],1);
 }
 const jaw=new THREE.Group();jaw.position.set(-1.04,.29,0);toad.add(jaw);
 const mouth=sphere(jaw,0x2f2928,.48,[-.04,0,0],1);mouth.scale.set(.34,.13,1.24);
 const lip=rod(jaw,0x9c9274,[-.18,.10,-.48],[-.18,.10,.48],.075,.07);
 for(let i=0;i<9;i++){
  const a=i*2.3;
  sphere(toad,0x667b56,.14,[Math.cos(a)*.72,1.04+(i%2)*.08,Math.sin(a)*.75],0);
 }
 toad.traverse(o=>{if(o.isMesh){o.userData={kind:'toad',index:10};clickable.push(o);}});
 const goldKey=new THREE.Group();goldKey.position.set(8.2,-1.7,.8);goldKey.visible=false;stage.add(goldKey);
 const keyring=new THREE.Mesh(new THREE.TorusGeometry(.26,.065,5,14),mat(0xe7c986));keyring.rotation.x=Math.PI/2;goldKey.add(keyring);
 rod(goldKey,0xe7c986,[0,-.26,0],[0,-1.0,0],.065,.065);
 block(goldKey,0xe7c986,[.14,-.82,0],[.24,.12,.13]);
 block(goldKey,0xe7c986,[.14,-.61,0],[.24,.12,.13]);
 // One shared character and walking rig across both chapters.
 const avatar=createPlayer(scene,pos(0));
 const player=avatar.body;
 const exterior=createExterior(scene);
 const ending=createChapter2Ending({
   stage,toad,jaw,belly,goldKey,player,exterior,
   onExterior:()=>setArea('exterior')
 });
 let area='exterior';
 stage.visible=false;
 player.position.set(exterior.spawn.x,exterior.height(exterior.spawn.x,exterior.spawn.z)+.035,exterior.spawn.z);
 player.rotation.y=1.95;
 function setArea(next){
  if(next===area)return;
  if(next!=='exterior'&&next!=='interior')throw new Error('Unknown area '+next);
  area=next;
  stage.visible=area==='interior';
  exterior.group.visible=area==='exterior';
  if(area==='interior')player.position.copy(pos(state.node));
  else player.position.set(exterior.spawn.x,exterior.height(exterior.spawn.x,exterior.spawn.z)+.035,exterior.spawn.z);
  focus.set(0,area==='exterior'?1.8:-1,0);
  width=-1;resize();
 }
 const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
 // Read CSS viewport dimensions from the parent rather than from a canvas
 // whose internal pixel resolution is deliberately reduced for pixel art.
 function resize(){
  const holder=canvas.parentElement;
  const rect=holder?.getBoundingClientRect();
  const w=Math.max(1,Math.round(rect?.width||window.innerWidth));
  const h=Math.max(1,Math.round(rect?.height||window.innerHeight));
  const resized=w!==width||h!==height;
  let framing=chapterFraming({
    width:w,height:h,area,zoom,hero:player.position,entrance:exterior.entrance
  });
  // Reframe on the toad's face and the physical golden key during the finale.
  // The portrait formula reserves enough horizontal space for both.
  const cinematic=ending.state();
  if(cinematic.active&&area==='interior'){
    const aspect=w/h,vertical=Math.max(13.6,8.8/aspect);
    const halfY=vertical/(2*zoom),halfX=halfY*aspect;
    framing={...framing,left:-halfX,right:halfX,top:halfY,bottom:-halfY,
      focus:{x:7.25,y:-1.25,z:1}};
  }
  const rotated=framing.portrait!==portrait;
  portrait=framing.portrait;
  if(resized||rotated||!cameraReady){
   width=w;height=h;
   // Recenter immediately across desktop/mobile transitions. Otherwise the
   // easing camera can point at empty space for several frames on orientation change.
   focus.set(framing.focus.x,framing.focus.y,framing.focus.z);
   cameraReady=true;
   const divisor=portrait?2.05:2.10;
   renderer.setPixelRatio(1);
   renderer.setSize(
    Math.max(128,Math.round(w/divisor)),
    Math.max(128,Math.round(h/divisor)),false
   );
   canvas.style.width='100%';canvas.style.height='100%';
  }
  // Recompute the world-space view as the player travels. Dynamic orthographic
  // bounds keep the player and tree entrance visible in any portrait aspect.
  if(Math.abs(camera.left-framing.left)>.02||Math.abs(camera.top-framing.top)>.02){
   camera.left=framing.left;camera.right=framing.right;
   camera.top=framing.top;camera.bottom=framing.bottom;
   camera.updateProjectionMatrix();
  }
  return framing;
 }
 function setZoom(n){zoom=THREE.MathUtils.clamp(n,.8,1.7);resize();}
 function pick(x,y){
  const rect=canvas.getBoundingClientRect();
  mouse.set((x-rect.left)*2/rect.width-1,1-(y-rect.top)*2/rect.height);
  ray.setFromCamera(mouse,camera);
  const hit=ray.intersectObjects(area==='exterior'?[exterior.hit,exterior.floor]:clickable,false)[0];
  if(!hit)return null;
  if(area==='exterior'&&hit.object===exterior.floor)
    return {kind:'ground',x:hit.point.x,z:hit.point.z};
  return hit.object.userData??null;
 }
 function draw(seconds,dt,travel){
  rootPivot.rotation.z=rootOpen(state.time)?-.62:0;
  rootGate.scale.y=rootOpen(state.time)?.28:1;
  // Push laterally into an unused wall recess. Never slide the boulder
  // along the main route into the frog's face.
  const lateral=state.boulderMoved?1:0;
  boulder.position.x=THREE.MathUtils.damp(boulder.position.x,5.05*lateral+5*(1-lateral),5,dt);
  boulder.position.z=THREE.MathUtils.damp(boulder.position.z,1-2.20*lateral,5,dt);
  boulder.rotation.x=THREE.MathUtils.damp(boulder.rotation.x,-.28*lateral,4,dt);
  boulder.rotation.z=THREE.MathUtils.damp(boulder.rotation.z,-.31*lateral,4,dt);
  stoneModels.forEach((stone,i)=>{
   stone.group.visible=!state.stones[i];
   stone.gem.rotation.y=seconds*.7+i;
   stone.gem.position.y=.74+.10*Math.sin(seconds*2+i);
   stone.collar.rotation.z=seconds*.23;
   stone.star.rotation.y=seconds*.65;
   stone.star.position.y=(i===2?3.65:2.70)+Math.sin(seconds*1.7+i)*.12;
   stone.halo.intensity=(i===2?2.1:1.4)+Math.sin(seconds*2.2+i)*.2;
  });
  toad.position.y=-2.5+Math.sin(seconds*1.6)*.065;
  jaw.rotation.z=state.offerings?Math.sin(seconds*3)*.19:Math.sin(seconds*1.4)*.035;
  // The ending owns the key, jaw and revival animations; the ordinary game
  // must not accidentally reveal the key immediately when state.won flips.
  const cinematic=ending.update(dt);
  const framing=resize();
  animatePlayer(avatar,dt,travel);
  const point=new THREE.Vector3(
    framing.focus.x,framing.focus.y,framing.focus.z
  );
  focus.lerp(point,1-Math.exp(-Math.max(dt,.016)*(portrait?8:3.8)));
  camera.position.copy(focus).addScaledVector(
   area==='interior'?cavernDirection:direction,33);
  camera.lookAt(focus);
  renderer.render(scene,camera);
  return cinematic;
 }
 resize();draw(0,.016,0);
 function stoneScreenPosition(index){
  const gem=stoneModels[index];
  if(!gem||!gem.group.visible||area!=='interior')return null;
  const p=gem.star.getWorldPosition(new THREE.Vector3());
  camera.updateMatrixWorld();
  p.project(camera);
  if(p.z>=1||p.z<=-1)return null;
  const rect=canvas.getBoundingClientRect();
  return {x:(p.x+1)*rect.width*.5,y:(1-p.y)*rect.height*.5,
    onScreen:Math.abs(p.x)<.94&&Math.abs(p.y)<.83};
 }
 return {renderer,scene,camera,player,toad,boulder,pos,pick,draw,resize,setZoom,setArea,
  exterior,stoneScreenPosition,
  playOffering:index=>ending.playOffering(index),
  startFinale:()=>ending.start(),
  getFinale:()=>ending.state(),
  dispose(){renderer.dispose();}
 };
}
