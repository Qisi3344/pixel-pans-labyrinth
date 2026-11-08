import * as THREE from 'three';
import {createPlayer,animatePlayer} from './player.js';
import {HALL,CORRIDOR,TABLE,START,FOOD,DOOR,MONSTER_START,DOOR_POLYLINE,AWAKEN_SECONDS,SEAL_SECONDS,CHAIR_CLIMB_SECONDS,ESCAPE_CLIMB_SECONDS,zone} from './chapter3-logic.js';
import {createProcessionalPassage,enrichForbiddenFeast} from './chapter3-passage.js';
import {createChildShoePile} from './chapter3-shoes.js';
import {createFrescoes} from './chapter3-fresco.js';
import {createDaggerNiche} from './chapter3-dagger.js';
import {deathBeat} from './chapter3-devour.js';

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
// Anatomical base dimensions for the head mesh (unit icosahedron).
// The Pale Man has an elongated, near-human skull, not a giant round bobblehead.
export const PALE_HEAD_BASE_SCALE=Object.freeze({x:.32,y:.46,z:.29});
export const PALE_UPPER_FACE_Y=2.67;
export function palmEyePosition(sign,awakened){
 return {x:sign*(.64-(.64-.285)*awakened),
  y:1.0+(PALE_UPPER_FACE_Y-1.0)*awakened,
  z:.55-(.55-.47)*awakened};
}
export function buildPaleMan(scene){
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
 // Preserve the narrow ribcage. A giant torso makes the head appear even more doll-like.
 torso.scale.x=.43;
 for(let i=0;i<5;i++){
  beam(rig,shade,[-.33,1.25+i*.12,.14],[.32,1.25+i*.12,.14],.031,5);
 }
 for(const sign of [-1,1]){
  ico(rig,fold,sign*.43,1.48,.06,.20,.34,.29);
 }
 const neck=beam(rig,bone,[0,1.80,0],[0,2.32,-.06],.16,7);
 // All facial features must share ONE local skull coordinate system.
 // The previous independent rig parts were placed as far as z=.67 and
 // the chin translated -.45 vertically, making a detached two-piece head.
 const skull=new THREE.Group();
 skull.position.set(0,2.53,-.03);rig.add(skull);
 const head=ico(skull,0xd8c5b0,0,0,0,
  PALE_HEAD_BASE_SCALE.x,PALE_HEAD_BASE_SCALE.y,PALE_HEAD_BASE_SCALE.z,1);
 // Small closed cleft belongs to the face, rather than being an
 // independent large dark rectangle hanging in front of the character.
 const closedMouth=ico(skull,0x4c3430,0,-.21,.261,.087,.018,.016,0);
 const maw=ico(skull,0x251419,0,-.22,.260,.145,.025,.027,1);
 maw.visible=false;
 maw.material=new THREE.MeshBasicMaterial({color:0x251419,side:THREE.DoubleSide});
 const mouthShadow=ico(skull,0x713c42,0,-.22,.278,.110,.024,.018,1);
 mouthShadow.visible=false;
 const lip=new THREE.Mesh(new THREE.TorusGeometry(.145,.014,5,20),
  new THREE.MeshLambertMaterial({color:bone,flatShading:true}));
 lip.position.set(0,-.21,.279);
 lip.scale.set(1,.22,1);lip.visible=false;lip.castShadow=true;skull.add(lip);
 // Jaw hinge and chin are attached to the cheek/skull, not to the root
 // world space. A modest 0.42-radian hinge makes the mouth readable without
 // breaking the facial silhouette or creating a giant hollow wedge.
 const jawPivot=new THREE.Group();
 jawPivot.position.set(0,-.26,.074);skull.add(jawPivot);
 const lowerJaw=ico(jawPivot,bone,0,-.058,.073,.229,.117,.185,1);
 jawPivot.visible=false;
 const tongue=ico(jawPivot,0x79434a,0,.017,.216,.105,.021,.024,0);
 tongue.visible=false;
 const biteLight=new THREE.PointLight(0xffe8cc,0,1.6,2);
 biteLight.position.set(0,-.19,.46);skull.add(biteLight);
 const teeth=[];
 for(let k=-2;k<=2;k++){
  const x=k*.046;
  const upper=new THREE.Mesh(new THREE.ConeGeometry(.015,.065,5),
   new THREE.MeshLambertMaterial({color:0xf0e4d0,flatShading:true}));
  upper.position.set(x,-.135,.298);upper.rotation.z=Math.PI;
  upper.visible=false;upper.castShadow=true;skull.add(upper);teeth.push(upper);
  const lower=new THREE.Mesh(new THREE.ConeGeometry(.014,.055,5),
   new THREE.MeshLambertMaterial({color:0xf0e4d0,flatShading:true}));
  lower.position.set(x,-.029,.215);
  lower.visible=false;lower.castShadow=true;jawPivot.add(lower);teeth.push(lower);
 }
 // Small pieces of red dress cloth register contact in the stylized cutscene.
 const scraps=[];
 for(let i=0;i<6;i++){
  const fragment=ico(rig,i%2?0x6a2a34:0xa2484d,
   0,2.28,.52,.045+(i%2)*.018,.040,.045,0);
  fragment.visible=false;scraps.push(fragment);
 }
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
  if(state.phase==='caught'){
   const beat=deathBeat(state.deathTime);
   const open=beat.jawOpen;
   // Hands hold the dress at the sides and BELOW the creature's face.
   // No bony forearm may cross the black mouth during the close-up.
   for(let k=0;k<2;k++){
    const sign=k===0?-1:1,hand=hands[k];
    hand.position.set(sign*.43+.31*beat.grip,
     1.34+.36*beat.lift,.52+.20*beat.grip);
    hand.rotation.z=sign*(.30+.14*beat.grip);
    positionArm(arms[k],new THREE.Vector3(sign*.40,1.82,0),
     hand.position.clone().add(new THREE.Vector3(0,.02,-.04)));
   }
   rig.rotation.x=-.055*beat.grip-.065*open;
   skull.position.y=2.53-Math.min(.11,beat.headLower*.42);
   skull.rotation.x=-open*.055;
   head.scale.set(
    PALE_HEAD_BASE_SCALE.x*(1+open*.015),
    PALE_HEAD_BASE_SCALE.y*(1+open*.015),
    PALE_HEAD_BASE_SCALE.z
   );
   // Keep every mouth part bounded within the head's .46-unit half-height.
   // The dark gap widens; the skull NEVER splits into floating layers.
   closedMouth.visible=false;
   maw.visible=true;mouthShadow.visible=true;
   lip.visible=true;
   jawPivot.visible=true;
   tongue.visible=open>.12;
   teeth.forEach(tooth=>{tooth.visible=open>.11;});
   jawPivot.rotation.x=open*.42;
   jawPivot.position.set(0,-.26-open*.065,.074);
   maw.scale.set(.145,.025+open*.118,.027);
   mouthShadow.scale.set(.110,.023+open*.103,.018);
   lip.scale.set(1,.22+open*.63,1);
   lip.position.set(0,-.21,.279);
   biteLight.intensity=.18+open*.64;
   rig.rotation.z=Math.sin(beat.time*10)*open*.028;
   scraps.forEach((fragment,i)=>{
    const elapsed=beat.time-1.58-i*.055;
    fragment.visible=elapsed>0&&elapsed<1.55;
    const a=i*2.39996;
    fragment.position.set(Math.cos(a)*(.10+elapsed*.22),
     2.20+.09*Math.sin(a)-elapsed*.20,.51+elapsed*.13);
    fragment.rotation.set(elapsed*4+i,elapsed*5,elapsed*2);
   });
  }else{
   jawPivot.visible=false;maw.visible=false;mouthShadow.visible=false;
   lip.visible=false;tongue.visible=false;closedMouth.visible=true;
   biteLight.intensity=0;
   teeth.forEach(tooth=>{tooth.visible=false;});
   scraps.forEach(fragment=>{fragment.visible=false;});
   skull.position.y=2.53;skull.rotation.x=0;
   head.scale.set(PALE_HEAD_BASE_SCALE.x,PALE_HEAD_BASE_SCALE.y,PALE_HEAD_BASE_SCALE.z);
   rig.rotation.x=0;
  }
 }
 return {root,rig,hands,skull,head,closedMouth,jawPivot,lowerJaw,maw,mouthShadow,lip,teeth,pose};
}
export function chalkPortal(scene){
 // The existing attic entrance has CLOSED: its old chalk trace stays flush
 // with masonry. Escape instead uses a CHAIR and a CEILING trapdoor.
 const parent=new THREE.Group();scene.add(parent);
 const cx=DOOR.x,oldX=-31.62,roofY=3.80,roofZ=-.92;
 const oldTrace=new THREE.Group();parent.add(oldTrace);
 // Thin wall traces, not a floating solid plane clipping the stone wall.
 const traces=[
  [[oldX-.67,.22,-1.724],[oldX-.67,2.52,-1.724]],
  [[oldX-.67,2.52,-1.724],[oldX+.67,2.52,-1.724]],
  [[oldX+.67,2.52,-1.724],[oldX+.67,.22,-1.724]]
 ];
 for(const [p1,p2] of traces){
  const a=new THREE.Vector3(...p1),b=new THREE.Vector3(...p2);
  const d=b.clone().sub(a);
  const m=new THREE.Mesh(new THREE.CylinderGeometry(.017,.017,d.length(),5),
   new THREE.MeshBasicMaterial({color:0xc2b6a2,transparent:true,opacity:.24,depthWrite:false}));
  m.position.copy(a).add(b).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  oldTrace.add(m);
 }
 // Four-legged worn wooden chair, with backrest and bracing.
 const stool=new THREE.Group();stool.position.set(cx,0,-.92);parent.add(stool);
 box(stool,0x674939,0,.66,0,.9,.15,.86);
 box(stool,0x987454,0,.74,0,.96,.055,.90);
 for(const x of [-.35,.35])for(const z of [-.32,.32])
  box(stool,0x47362d,x,.31,z,.13,.62,.13);
 for(const z of [-.26,.26])box(stool,0x8c6346,0,.30,z,.73,.095,.09);
 for(const x of [-.34,.34])
  beam(stool,0x6c4d39,[x,.66,-.32],[x,1.60,-.48],.073,6);
 box(stool,0x745341,0,1.52,-.48,.78,.22,.12);
 // Partial ceiling around a rectangular hatch: open cutaway center keeps
 // the protagonist visible from the orthographic camera above the model.
 const roof=new THREE.Group();roof.position.set(cx,roofY,roofZ);parent.add(roof);
 for(const x of [-1.04,1.04]){
  box(roof,0x585c55,x,-.09,0,.34,.28,2.33);
  box(roof,0xa39479,x,.055,0,.10,.04,2.20,false);
 }
 for(const z of [-1.0,1.0]){
  box(roof,0x585c55,0,-.09,z,2.06,.28,.34);
  box(roof,0xa39479,0,.055,z,2.16,.04,.10,false);
 }
 const ceiling=box(roof,0x575b55,0,-.003,0,1.79,.045,1.76,false);
 ceiling.material=new THREE.MeshBasicMaterial({
  color:0x575b55,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide
 });
 const darkOpening=box(roof,0x172935,0,-.016,0,1.82,.06,1.79,false);
 darkOpening.material=new THREE.MeshBasicMaterial({
  color:0x152634,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide
 });
 darkOpening.visible=false;
 const glyphPoints=[
  [-.73,.10,.69],[-.73,.10,-.69],[.73,.10,-.69],
  [.73,.10,.69],[-.73,.10,.69]
 ].map(v=>new THREE.Vector3(...v));
 const lines=[];
 for(let k=0;k<4;k++){
  const a=glyphPoints[k],b=glyphPoints[k+1],d=b.clone().sub(a);
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.04,.045,1,6),
   new THREE.MeshBasicMaterial({color:0xf5ead6}));
  mesh.visible=false;mesh.userData={a,b,length:d.length()};
  roof.add(mesh);lines.push(mesh);
 }
 const glow=new THREE.PointLight(0xb2d7e2,0,5,2);
 glow.position.set(cx,roofY-.36,roofZ);parent.add(glow);
 // Click on the CHAIR, not a fake floor-to-ceiling wall panel.
 const target=box(parent,0xffffff,cx,.98,-.88,1.62,1.82,1.60,false);
 target.material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
 target.userData.kind='door';
 function update(progress,time,state){
  const climb=['climbing','drawing'].includes(state.phase);
  stool.rotation.z=climb?Math.sin(time*11)*.024:0;
  stool.rotation.x=climb?Math.sin(time*9)*.012:0;
  const beforeSeal=!state.sealed;
  oldTrace.children.forEach(m=>{
   m.material.opacity=beforeSeal?.24*Math.max(0,1-state.chaseTime/SEAL_SECONDS):.025;
  });
  for(let k=0;k<4;k++){
   const line=lines[k],amount=clamp(progress*4-k),{a,b,length}=line.userData;
   line.visible=amount>.001;
   line.scale.set(1,Math.max(.001,length*amount),1);
   line.position.copy(a).lerp(b,amount*.5);
   line.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
  }
  const open=['escape','escaped'].includes(state.phase);
  ceiling.material.opacity=open?Math.max(0,.14-state.winTime*.20):.14;
  darkOpening.visible=open;
  darkOpening.material.opacity=open?Math.min(.93,.12+state.winTime*.65):0;
  glow.intensity=open?2.1:climb?.48:.10;
 }
 return {parent,stool,roof,ceiling,darkOpening,lines,target,update};
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
 const details=enrichForbiddenFeast(scene),shoePile=createChildShoePile(scene),pale=buildPaleMan(scene);
 const fresco=createFrescoes(scene);
 const daggerNiche=createDaggerNiche(scene);
 const chalk=chalkPortal(scene);
 const player=createPlayer(scene,new THREE.Vector3(START.x,.03,START.z));
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 // The orthographic projection and follow-camera keep mobile player visible.
 const focus=new THREE.Vector3(-1,1,0);
 const angle=new THREE.Vector3(-1.0,1.24,1.18).normalize();
 // The ordinary game stays isometric. Only the 4-second devour cutscene
 // uses a low frontal orthographic camera so the mouth cannot be hidden.
 const deathCameraAngle=new THREE.Vector3(.05,.42,1.78).normalize();
 const upAxis=new THREE.Vector3(0,1,0);
 const biteAngle=new THREE.Vector3();
 let w=0,h=0,portrait=false,zoom=1,captureOrigin=null;
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
  const caughtZoom=state.phase==='caught'?
   (portrait?1.85:3.15)*deathBeat(state.deathTime).grip:0;
  const ceilingZoom=['climbing','drawing','escape','escaped'].includes(state.phase)?(portrait?.04:.86):0;
  const cinematicZoom=1+Math.max(0,reveal)*(portrait?1.05:1.55)+caughtZoom+ceilingZoom;
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
  // Invisible floor collider at y=0 intercepts unobstructed floor taps.
  const floorHit=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const world=new THREE.Vector3();
  const foodHit=ray.intersectObjects(table.clickables,false)[0];
  const daggerHit=state.phase==='invitation'&&!state.hasDagger?
    ray.intersectObject(daggerNiche.target,false)[0]:null;
  // Frescoes are clickable painted planes. Inspect only while the room is
  // calm; during the chase, clicking must never interrupt player movement.
  const frescoHit=state.phase==='invitation'?
   ray.intersectObjects(fresco.targets,false)[0]:null;
  // Directly clicking the creature is an investigation, not a command to
  // walk to the dinner table or a second way to awaken it.
  // Compare depths so table food in front of the monster remains selectable.
  const monsterHit=state.phase==='invitation'?
   ray.intersectObject(pale.root,true)[0]:null;
  if(daggerHit&&(!foodHit||daggerHit.distance<foodHit.distance))return {kind:'dagger'};
  if(frescoHit&&(!foodHit||frescoHit.distance<foodHit.distance)&&
     (!monsterHit||frescoHit.distance<monsterHit.distance))
   return {kind:'fresco',index:frescoHit.object.userData.frescoIndex};
  if(monsterHit&&(!foodHit||monsterHit.distance<foodHit.distance))
   return {kind:'monster'};
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
  // Animation poses are evaluated in world-space after the creature faces
  // the captured avatar, avoiding the original scale-to-zero fake death.
  pale.pose(state,now,dt);
  const p=player.body.position;
  p.set(state.player.x,.03,state.player.z);
  player.body.rotation.y=dampHeading(player.body.rotation.y,
    state.face??player.body.rotation.y,12,dt);
  animatePlayer(player,dt,distance,distance>.0001);
  const devour=state.phase==='caught'?deathBeat(state.deathTime):null;
  if(devour){
   // The hero stays full-sized through the grab, lift, bite and chewing.
   // She is only hidden AFTER the scene itself has faded into black.
   if(!captureOrigin)captureOrigin=new THREE.Vector3(
    state.player.x,.03,state.player.z);
   pale.root.updateWorldMatrix(true,true);
   const held=pale.root.localToWorld(new THREE.Vector3(
    .52+.10*devour.jawOpen,devour.heroLift,.72-devour.yank*.08));
   p.copy(captureOrigin).lerp(held,devour.grip);
   p.y+=Math.sin(devour.time*19)*devour.shake;
   player.body.rotation.x=-devour.heroLean;
   player.body.rotation.z=Math.sin(devour.time*15)*devour.shake;
   player.body.scale.setScalar(1);
   player.body.visible=devour.fade<.97;
   player.arms[0].rotation.x=-.30-devour.grip*.85+devour.shake*3;
   player.arms[1].rotation.x=.25+devour.grip*.70-devour.shake*2;
   player.legs[0].rotation.x=devour.lift*Math.sin(devour.time*9)*.24;
   player.legs[1].rotation.x=-devour.lift*Math.sin(devour.time*9)*.24;
  }else{
   captureOrigin=null;player.body.visible=true;player.body.scale.setScalar(1);
   player.body.rotation.x=0;player.body.rotation.z=0;
  }
  // Real climb sequence: step onto stool, stand, trace ceiling, pull upward.
  if(['climbing','drawing','escape','escaped'].includes(state.phase)){
   const step=state.phase==='climbing'?smooth(state.climbTime/CHAIR_CLIMB_SECONDS):1;
   const up=['escape','escaped'].includes(state.phase)
    ?smooth(state.winTime/ESCAPE_CLIMB_SECONDS):0;
   p.set(
    THREE.MathUtils.lerp(state.player.x,DOOR.x,step),
    .03+step*.72+up*2.72,
    THREE.MathUtils.lerp(state.player.z,DOOR.z-.92,step)-up*.08
   );
   player.body.rotation.y=dampHeading(player.body.rotation.y,Math.PI,10,dt);
   player.arms[0].rotation.x=-1.17;
   player.arms[1].rotation.x=state.phase==='climbing'?- .42:-1.30;
   player.legs[0].rotation.x=state.phase==='climbing'?.55*Math.sin(step*Math.PI):-.12;
   player.legs[1].rotation.x=state.phase==='climbing'?.4*Math.sin(step*Math.PI):.09;
   player.body.visible=up<.985;
  }
  daggerNiche.update(dt,Boolean(state.hasDagger),now);
  table.grapes.scale.setScalar(state.eaten?.01:1);
  chalk.update(state.doorProgress,now,state);
  let target;
  if(state.phase==='awakening'){
   const t=smooth(state.awakeTime/AWAKEN_SECONDS);
   target=new THREE.Vector3(THREE.MathUtils.lerp(state.player.x,6.25,Math.sin(Math.PI*t)*.94),
    1.48+Math.sin(Math.PI*t)*.66,THREE.MathUtils.lerp(state.player.z,0,Math.sin(Math.PI*t)*.80));
  } else if(state.phase==='caught'){
   // The fatal scene is a tight two-character shot, not an off-screen scale.
   target=new THREE.Vector3(state.monster.x+.16,1.92,state.monster.z+.30);
  } else if(['climbing','drawing','escape','escaped'].includes(state.phase)){
   // Raise the actual chair/hatch into the clear TOP portion of a portrait
   // viewport: the chalk drawing sheet now lives at the BOTTOM.
   const verticalTarget=portrait&&state.phase==='drawing'?-2.2:
    portrait&&state.phase==='climbing'?.7:1.65;
   target=new THREE.Vector3(DOOR.x,verticalTarget,DOOR.z-.42);
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
  // Match the creature's own forward vector, so the bite is photographed
  // from its FRONT instead of from the side with a column through the frame.
  biteAngle.copy(deathCameraAngle).applyAxisAngle(upAxis,pale.root.rotation.y);
  camera.position.copy(focus).addScaledVector(state.phase==='caught'?biteAngle:angle,37);
  camera.lookAt(focus);
  renderer.render(scene,camera);
  return devour;
 }
 resize(true);draw(0,.016,0);
 return {scene,renderer,camera,player,monster:pale,shoePile,fresco,daggerNiche,chalk,draw,resize,pick,setZoom,
  dispose:()=>renderer.dispose()};
}
