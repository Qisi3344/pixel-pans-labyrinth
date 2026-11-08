import * as THREE from 'three';
import {createPlayer,animatePlayer} from './player.js';
import {HALL,CORRIDOR,TABLE,START,FOOD,DOOR,MONSTER_START,DOOR_POLYLINE,AWAKEN_SECONDS,SEAL_SECONDS,zone} from './chapter3-logic.js';
import {createProcessionalPassage,enrichForbiddenFeast} from './chapter3-passage.js';

// All props are real meshes in the same orthographic 3D world.
// No external textures, models, assets or full-screen 2D fake scenery.
const MAT=new Map(), BOX=new THREE.BoxGeometry(1,1,1);
const color=c=>{if(!MAT.has(c))MAT.set(c,new THREE.MeshLambertMaterial({color:c,flatShading:true}));return MAT.get(c);};
const ink=c=>new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide});
// Three.MathUtils has damp() but NO dampAngle(). Interpolate the wrapped
// shortest angular arc ourselves; keep this browser-safe on every frame.
export function dampHeading(current,target,lambda,dt){
 const delta=Math.atan2(Math.sin(target-current),Math.cos(target-current));
 return current+delta*(1-Math.exp(-lambda*Math.max(0,dt)));
}
const clamp=(n)=>Math.max(0,Math.min(1,n));
const smooth=(t)=>{const x=clamp(t);return x*x*(3-2*x);};
const rnd=n=>{const v=Math.sin(n*127.17+87.1)*43758.54;return v-Math.floor(v)};
function box(parent,c,x,y,z,w,h,d,cast=true){
 const m=new THREE.Mesh(BOX,color(c));m.position.set(x,y,z);m.scale.set(w,h,d);
 m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;
}
function ico(parent,c,x,y,z,sx,sy=sx,sz=sx,detail=0){
 const m=new THREE.Mesh(new THREE.IcosahedronGeometry(1,detail),color(c));
 m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;
 parent.add(m);return m;
}
function cylinder(parent,c,x,y,z,top,bottom,height,segments=7){
 const m=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,segments),color(c));
 m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function beam(parent,c,a,b,r=.1,segments=7){
 const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
 const m=new THREE.Mesh(new THREE.CylinderGeometry(r*.8,r,delta.length(),segments),color(c));
 m.position.copy(start.add(end).multiplyScalar(.5));
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function torus(parent,c,x,y,z,r,tube=.045){
 const m=new THREE.Mesh(new THREE.TorusGeometry(r,tube,5,24),ink(c));
 m.position.set(x,y,z);parent.add(m);return m;
}
function banquetHall(scene){
 const hall=new THREE.Group();scene.add(hall);
 // Thick stone diorama cutaway with carefully offset strata.
 box(hall,0x282b2d,0,-1.08,0,20.4,1.05,11.7);
 box(hall,0x54534f,0,-.53,0,20.15,.15,11.4);
 box(hall,0x727167,0,-.43,0,19.9,.085,11.2);
 for(let i=0;i<12;i++)for(let j=0;j<7;j++){
  const x=-9.16+i*1.65,z=-4.7+j*1.54;
  const pal=[0x686960,0x64675e,0x76756a,0x5c6159,0x6f7064][Math.floor(rnd(i*19+j*7)*5)];
  box(hall,pal,x,-.345,z,1.59,.11,1.48,false);
  if(rnd(i*31+j*23)>.68){
   box(hall,0x828177,x+.42,-.275,z-.33,.26,.027,.07,false);
  }
 }
 // Rear wall: stone columns, Gothic ribs, niches and reliefs; front is open.
 box(hall,0x43423f,0,1.85,-5.10,20,4.45,.66);
 box(hall,0x747366,0,4.13,-4.81,20,.18,.79);
 box(hall,0x343934,0,.18,-4.74,19.9,.4,.28);
 const posts=[-9.05,-6.40,-3.75,-1.10,1.55,4.20,6.85,9.1];
 for(let k=0;k<posts.length;k++){
  const x=posts[k];
  cylinder(hall,0x666861,x,1.88,-4.61,.25,.32,3.77,9);
  box(hall,0x9a9785,x,3.82,-4.60,.74,.24,.59);
  box(hall,0x3e413b,x,.33,-4.60,.72,.53,.64);
  if(k<posts.length-1){
   const next=posts[k+1],cx=(x+next)/2;
   // High stone pointed-arch impression, with actual ribs and inset blocks.
   beam(hall,0x88877b,[x+.35,3.36,-4.47],[cx,4.03,-4.39],.14);
   beam(hall,0x88877b,[cx,4.03,-4.39],[next-.35,3.36,-4.47],.14);
   box(hall,0x363731,cx,2.08,-4.71,1.77,2.4,.045,false);
   if(k===2||k===5){
    const medallion=torus(hall,0xa69a75,cx,2.42,-4.39,.45,.065);
    medallion.rotation.y=.05;
    ico(hall,0x908778,cx,2.42,-4.33,.22,.32,.12);
    for(let n=0;n<5;n++){
     const a=n*Math.PI*2/5;
     ico(hall,0x4b4b40,cx+Math.cos(a)*.31,2.43+Math.sin(a)*.31,-4.29,.10,.11,.05);
    }
   }
  }
 }
 // Left side broken stone supports, no occluding full side wall.
 for(const [x,z,h] of [[-9.55,4.45,1.2],[-9.55,1.72,1.4],[9.55,3.95,1.5],[9.55,1.2,1.35]]){
  box(hall,0x50534d,x,h/2-.28,z,.85,h,.95);
  box(hall,0x7a796e,x,h-.20,z,1.08,.17,1.05);
 }
 // Two warm sconces make the room lit, not a featureless black void.
 for(const x of [-6.1,6.9]){
  box(hall,0x6a5744,x,2.45,-4.30,.40,.13,.29);
  ico(hall,0xe7a65b,x,2.72,-4.26,.11,.31,.12);
  const point=new THREE.PointLight(0xf9b36b,.65,8,2);
  point.position.set(x,2.93,-3.9);hall.add(point);
 }
 // Intricate stone pattern on the stage rim; no uniform giant flat slab.
 for(let x=-9.4;x<9.5;x+=1.3){
  const m=box(hall,0x434943,x,-.71,5.72,1.15,.25,.19);
  m.rotation.z=Math.sin(x*5)*.035;
 }
 return hall;
}
function buildTable(scene){
 const group=new THREE.Group();scene.add(group);
 const cx=(TABLE.minX+TABLE.maxX)/2,length=TABLE.maxX-TABLE.minX;
 box(group,0x3d2725,cx,.95,0,length,1.05,2.40);
 box(group,0x8c6044,cx,1.49,0,length+.36,.17,2.61);
 box(group,0x422d2d,cx,1.57,0,length+.17,.045,2.47);
 box(group,0x602b31,cx,1.59,0,length-.08,.055,2.33);
 box(group,0x9b4b51,cx,1.62,0,length-.15,.035,.54);
 for(const x of [TABLE.minX+.40,TABLE.maxX-.45]){
  for(const z of [-.89,.89]){
   const leg=cylinder(group,0x77563f,x,.59,z,.17,.23,1.08,7);
   leg.rotation.y=.2;
   box(group,0x4c332f,x,1.10,z,.32,.13,.32);
  }
 }
 // Carved white plates, roast birds, grapes, breads, fruit, wine and goblets.
 const food=[];
 const plates=[-3.52,-2.48,-1.52,-.30,.92,2.10,3.32,4.55];
 for(let i=0;i<plates.length;i++){
  const x=plates[i],z=i%2?-.54:.60;
  const plate=cylinder(group,0xbdb2a0,x,1.68,z,.39,.43,.055,12);
  cylinder(group,0x686054,x,1.716,z,.27,.28,.018,12);
  if(i%4===0){
   ico(group,0xd3ac6a,x,1.83,z,.32,.20,.24,1);
   for(let k=0;k<3;k++)ico(group,0x739365,x-.13+k*.12,1.91,z-.04,.07,.09,.04);
  } else if(i%4===1){
   for(let n=0;n<6;n++){
    const a=n*2.39;
    ico(group,0x683951,x+Math.cos(a)*.18,1.84,z+Math.sin(a)*.13,.115,.12,.125,1);
   }
  }else if(i%4===2){
   ico(group,0xa87350,x,1.84,z,.31,.19,.22);
   for(let n=0;n<3;n++)box(group,0xe0c291,x-.18+n*.18,1.91,z,.05,.07,.31);
  }else{
   ico(group,0xb9473c,x,1.86,z,.23,.24,.24,1);
   beam(group,0x56724c,[x,2.06,z],[x+.05,2.20,z-.03],.035);
  }
  food.push({x,z});
 }
 for(const x of [-3.15,-.55,1.75,4.02]){
  for(const z of [-.95,.95]){
   const candle=cylinder(group,0xb5a68f,x,1.83,z,.06,.075,.43,7);
   ico(group,0xffdf88,x,2.09,z,.060,.13,.050);
   const light=new THREE.PointLight(0xffbd70,.46,3.8,2);light.position.set(x,2.17,z);group.add(light);
  }
 }
 // Grapes are a deliberate temptingly lit interactive item at the NEAR edge.
 const grapes=new THREE.Group();grapes.position.set(FOOD.x,1.71,.97);group.add(grapes);
 cylinder(grapes,0xe1d0a8,0,0,0,.40,.40,.035,12);
 for(let row=0;row<3;row++)for(let k=0;k<4-row;k++){
  const berry=ico(grapes,k%2?0x56325e:0x753c67,(k-(3-row)/2)*.16,.13+row*.12,(-.2+row*.16),.112,.114,.113,1);
  berry.userData.kind='food';
 }
 beam(grapes,0x78906a,[-.14,.35,-.04],[.14,.58,.04],.035,5);
 const clickables=[];
 grapes.traverse(m=>{if(m.isMesh){m.userData.kind='food';clickables.push(m);}});
 const rest=box(group,0x6a3f38,6.52,.45,-.25,.89,.7,.88);
 box(group,0x684842,6.66,1.17,-.58,.88,1.55,.27);
 for(let i=0;i<5;i++){
  beam(group,0xa18e73,[6.38+i*.13,.83,-.42],[6.38+i*.13,1.78,-.42],.04);
 }
 return {group,grapes,clickables};
}
// The iris must sit on the UPPER HALF of the faceless head, not by its mouth.
export const PALE_UPPER_FACE_Y=2.67;
export function palmEyePosition(sign,awakened){
 return {x:sign*(.64-(.64-.285)*awakened),
  y:1.0+(PALE_UPPER_FACE_Y-1.0)*awakened,
  z:.55-(.55-.47)*awakened};
}
function buildPaleMan(scene){
 const root=new THREE.Group();root.position.set(MONSTER_START.x,0,MONSTER_START.z);scene.add(root);
 const rig=new THREE.Group();root.add(rig);
 const bone=0xd8c4ab,fold=0xb7a38c,shade=0x8a7f6e;
 const limbs=[];
 for(const sign of [-1,1]){
  const leg=new THREE.Group();leg.position.set(sign*.21,.90,0);rig.add(leg);
  beam(leg,fold,[0,0,0],[sign*.03,-.63,.10],.14,7);
  ico(leg,bone,sign*.015,-.69,.31,.18,.10,.40,0);
  limbs.push(leg);
 }
 // A gaunt elongated pale torso, sagging skin fold silhouettes.
 const torso=ico(rig,bone,0,1.47,0,.44,.80,.34,1);
 torso.scale.x=.66;
 for(let i=0;i<5;i++){
  beam(rig,shade,[-.33,1.25+i*.12,.14],[.32,1.25+i*.12,.14],.031,5);
 }
 for(const sign of [-1,1]){
  ico(rig,fold,sign*.43,1.48,.06,.20,.34,.29);
 }
 const neck=beam(rig,bone,[0,1.80,0],[0,2.32,-.06],.16,7);
 const head=ico(rig,0xd8c5b0,0,2.53,-.03,.35,.49,.33,1);
 // No face eyes. A long, unsettling mouth cleft occupies their place.
 ico(rig,0x403b35,0,2.31,.309,.11,.23,.025);
 const hands=[],arms=[];
 for(const sign of [-1,1]){
  const hand=new THREE.Group();rig.add(hand);
  const palm=ico(hand,bone,0,0,0,.23,.35,.095,1);
  const thumb=ico(hand,fold,sign*.21,-.045,.04,.115,.18,.10);
  for(let j=0;j<3;j++){
   const finger=ico(hand,bone,(j-1)*.115,-.37,.01,.055,.22,.065);
   finger.rotation.z=(j-1)*.12;
  }
  torus(hand,0x46362f,0,.035,.111,.155,.039);
  torus(hand,0xcfb37a,0,.035,.156,.091,.025);
  const iris=ico(hand,0x7b4939,0,.035,.182,.062,.065,.035,1);
  ico(hand,0x1e2221,0,.035,.217,.031,.040,.016,1);
  hand.userData.handEye=true;hands.push(hand);
  // Arm cylinder updated each frame from shoulder to hand for real posing.
  const arm=beam(rig,fold,[sign*.38,1.78,0],[sign*.50,.97,.3],.135,7);
  arms.push(arm);
 }
 function positionArm(mesh,shoulder,target){
  const delta=target.clone().sub(shoulder),length=delta.length();
  mesh.position.copy(shoulder).addScaledVector(delta,.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  // Scale from initial cylinder length (~.86).
  mesh.scale.y=length/.88;
 }
 function pose(state,time,dt){
  root.position.set(state.monster.x,0,state.monster.z);
  const active=['chase','drawing','caught','escape'].includes(state.phase);
  const awakening=state.phase==='awakening'?smooth(state.awakeTime/AWAKEN_SECONDS):active?1:0;
  const bob=active&&state.phase!=='caught'?Math.sin(time*8)*.070:0;
  // Slow rise from the chair AFTER hands have started seeking the eye sockets.
  const standing=smooth((awakening-.28)/.65);
  rig.position.y=-.28+standing*.39+bob;
  rig.rotation.z=active?Math.sin(time*6)*.065:Math.sin(time*1.0)*.014;
  const dx=state.player.x-state.monster.x,dz=state.player.z-state.monster.z;
  if(active||awakening>.3){
   root.rotation.y=dampHeading(root.rotation.y,Math.atan2(dx,dz),5,dt);
  }else root.rotation.y=-1.25;
  for(let k=0;k<2;k++){
   const sign=k===0?-1:1;
   const up=palmEyePosition(sign,awakening);
   const aim=new THREE.Vector3(up.x,up.y,up.z);
   // Palms remain centered at forehead/eye height while stalking.
   aim.y+=(active?Math.sin(time*5.2+sign)*.018:0);
   hands[k].position.copy(aim);
   hands[k].rotation.z=sign*(.08+awakening*.09);
   const shoulder=new THREE.Vector3(sign*.40,1.82,0);
   positionArm(arms[k],shoulder,aim.clone().add(new THREE.Vector3(0,.25,-.08)));
   limbs[k].rotation.x=THREE.MathUtils.lerp(-.95,active?Math.sin(time*8+k*Math.PI)*.33:0,standing);
  }
 }
 return {root,rig,hands,pose};
}
function chalkPortal(scene){
 // The original entry portal is at the FAR END of the vaulted passage.
 // When its hourglass expires it fades; the player must draw a new doorway.
 const parent=new THREE.Group();scene.add(parent);
 const cx=DOOR.x,z=-1.72;
 const left=cx-.76,right=cx+.76;
 const points=[[left,.08,z],[left,2.74,z],[right,2.74,z],[right,.08,z]];
 for(const [x,y] of points){
  ico(parent,0xd1c9b2,x,y,z+.08,.075,.075,.065,0);
 }
 const portal=box(parent,0x172838,cx,1.43,z+.06,1.44,2.56,.040,false);
 portal.material=new THREE.MeshBasicMaterial({
  color:0x4f8292,transparent:true,opacity:.34,depthWrite:false,side:THREE.DoubleSide
 });
 // The former chalk lines vanish, until the player draws a new doorway.
 const linePieces=[];
 for(let i=0;i<3;i++){
  const a=new THREE.Vector3(...points[i]),b=new THREE.Vector3(...points[i+1]);
  const segment=new THREE.Mesh(new THREE.CylinderGeometry(.044,.044,1,7),
   new THREE.MeshBasicMaterial({color:0xf4e9cc}));
  segment.visible=false;segment.userData={a,b,distance:a.distanceTo(b)};
  parent.add(segment);linePieces.push(segment);
 }
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.55,.035,5,28),
  new THREE.MeshBasicMaterial({color:0x9bc9c9,transparent:true,opacity:.55}));
 ring.position.set(cx,1.43,z+.13);parent.add(ring);
 const glow=new THREE.PointLight(0x9fcee0,0,6,2);
 glow.position.set(cx,1.32,z+.55);parent.add(glow);
 function update(progress,time,state){
  for(let i=0;i<3;i++){
   const segment=linePieces[i],{a,b,distance}=segment.userData;
   const amount=clamp(progress*3-i);
   segment.visible=amount>.001;
   segment.position.copy(a).lerp(b,amount*.5);
   segment.scale.set(1,Math.max(.001,distance*amount),1);
   segment.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),
    b.clone().sub(a).normalize());
  }
  const ready=['escape','escaped'].includes(state.phase);
  const unsealed=!state.sealed&&!ready;
  const fading=state.phase==='awakening'?.72:
   state.phase==='invitation'?.85:clamp(1-state.chaseTime/SEAL_SECONDS);
  portal.visible=ready||unsealed;
  portal.material.opacity=ready?.78:(unsealed?.26*fading:0);
  ring.visible=portal.visible;ring.material.opacity=ready?.74:.22*fading;
  ring.rotation.z=time*.12;
  glow.intensity=ready?1.8:unsealed?.45*fading:.05;
 }
 const target=box(parent,0xffffff,cx,1.4,z+.35,2.12,3.10,.08,false);
 target.material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
 target.userData.kind='door';
 return {parent,portal,update,target};
}
export function createBanquetScene(canvas,state){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
 renderer.setClearColor(0xffffff);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
 const camera=new THREE.OrthographicCamera(-15,15,10,-10,.1,100);
 const ambient=new THREE.HemisphereLight(0xece7db,0x4b4d4a,2.10);scene.add(ambient);
 const sun=new THREE.DirectionalLight(0xf3e7d5,2.4);
 sun.position.set(-12,25,14);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22});
 sun.shadow.bias=-.0005;scene.add(sun);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(120,120),color(0xffffff));
 ground.rotation.x=-Math.PI/2;ground.position.y=-1.62;ground.receiveShadow=true;scene.add(ground);
 const hall=banquetHall(scene),passage=createProcessionalPassage(scene),table=buildTable(scene);
 const details=enrichForbiddenFeast(scene),pale=buildPaleMan(scene);
 const chalk=chalkPortal(scene);
 const player=createPlayer(scene,new THREE.Vector3(START.x,.03,START.z));
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 // The orthographic projection and follow-camera keep mobile player visible.
 const focus=new THREE.Vector3(-1,1,0);
 const angle=new THREE.Vector3(-1.0,1.24,1.18).normalize();
 let w=0,h=0,portrait=false,zoom=1;
 function resize(force=false){
  const rect=canvas.parentElement?.getBoundingClientRect();
  const width=Math.max(1,Math.round(rect?.width||window.innerWidth));
  const height=Math.max(1,Math.round(rect?.height||window.innerHeight));
  const isPortrait=width/height<.83;
  if(force||w!==width||h!==height||portrait!==isPortrait){
   w=width;h=height;portrait=isPortrait;
   const divisor=isPortrait?2.0:2.15;
   renderer.setPixelRatio(1);
   renderer.setSize(Math.max(144,Math.round(w/divisor)),Math.max(144,Math.round(h/divisor)),false);
   canvas.style.width='100%';canvas.style.height='100%';
   // Recenter at resize so mobile view doesn't drift into blank white space.
   const p=state.player;
   focus.set(p.x,1.4,p.z);
  }
  // Ease in for the palm-eye reveal, ease out before the chase starts.
  const reveal=state.phase==='awakening'
   ? Math.sin(Math.PI*clamp(state.awakeTime/AWAKEN_SECONDS)) : 0;
  const cinematicZoom=1+Math.max(0,reveal)*(portrait?1.05:1.55);
  const halfV=(portrait?17.6:19.7)/(2*zoom*cinematicZoom);
  camera.left=-halfV*w/h;camera.right=halfV*w/h;
  camera.top=halfV;camera.bottom=-halfV;
  camera.updateProjectionMatrix();
 }
 function setZoom(delta){zoom=THREE.MathUtils.clamp(zoom+delta,.85,1.42);resize(true);}
 function pick(cx,cy){
  const b=canvas.getBoundingClientRect();
  pointer.set(((cx-b.left)/b.width)*2-1,1-((cy-b.top)/b.height)*2);
  ray.setFromCamera(pointer,camera);
  const targets=[...table.clickables,chalk.target];
  // Invisible floor collider at y=0 intercepts all unobstructed floor taps.
  const floorHit=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const world=new THREE.Vector3();
  const foodHit=ray.intersectObjects(table.clickables,false)[0];
  if(foodHit)return {kind:'food'};
  const doorHit=ray.intersectObject(chalk.target,false)[0];
  if(doorHit)return {kind:'door'};
  if(ray.ray.intersectPlane(floorHit,world)){
   if(zone(world)!=='outside')return {kind:'floor',x:world.x,z:world.z};
  }
  return null;
 }
 function draw(now,dt,distance=0){
  resize();
  const p=player.body.position;
  p.set(state.player.x,.03,state.player.z);
  player.body.rotation.y=dampHeading(player.body.rotation.y,
    state.face??player.body.rotation.y,12,dt);
  animatePlayer(player,dt,distance,distance>.0001);
  if(state.phase==='caught'){
   const t=smooth(state.deathTime/1.0);
   player.body.scale.setScalar(Math.max(.01,1-t));
   player.body.position.y+=t*.85;
  }else player.body.scale.setScalar(1);
  pale.pose(state,now,dt);
  table.grapes.scale.setScalar(state.eaten?.01:1);
  chalk.update(state.doorProgress,now,state);
  let target;
  if(state.phase==='awakening'){
   const t=smooth(state.awakeTime/AWAKEN_SECONDS);
   target=new THREE.Vector3(THREE.MathUtils.lerp(state.player.x,6.25,Math.sin(Math.PI*t)*.94),
    1.48+Math.sin(Math.PI*t)*.66,THREE.MathUtils.lerp(state.player.z,0,Math.sin(Math.PI*t)*.80));
  } else if(state.phase==='escape'){
   target=new THREE.Vector3(DOOR.x,1.45,DOOR.z);
  }else{
   // A long route cannot share the fixed camera used for the old square room.
   // Track the avatar on BOTH desktop and mobile while retaining a little
   // look-ahead into the corridor and a view of the approaching pursuer.
   const toward=state.phase==='chase'?-1:1;
   const lead=zone(state.player)==='passage'?toward*(portrait?.36:2.1):0;
   target=new THREE.Vector3(state.player.x+lead,1.38,state.player.z);
   if(state.phase==='chase'&&zone(state.player)==='feast'&&!portrait){
    target.x=state.player.x*.86+state.monster.x*.14;
    target.z=state.player.z*.86+state.monster.z*.14;
   }
  }
  focus.lerp(target,1-Math.exp(-Math.max(.015,dt)*(portrait?5.5:3.1)));
  camera.position.copy(focus).addScaledVector(angle,37);camera.lookAt(focus);
  renderer.render(scene,camera);
 }
 resize(true);draw(0,.016,0);
 return {scene,renderer,camera,player,monster:pale,draw,resize,pick,setZoom,
  dispose:()=>renderer.dispose()};
}
