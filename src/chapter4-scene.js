import * as THREE from 'three';
import {createPlayer,animatePlayer} from './player.js';
import {FINAL_START,FINAL_ALTAR,FINAL_BLOOD_STAND,VIDAL_START,CHAPTER4_TIME_LIMIT,distance} from './chapter4-logic.js';
import {FINAL_FAUN_POSITION} from './chapter4-maze-layout.js';
import {buildFirstMazeCenterFragment} from './chapter4-maze-center.js';
import {buildFinalSpiralWell,createFinalStageWithCutout} from './chapter4-well.js';
import {FINAL_CUES,VIDAL_CINEMATIC_ENTRY,normalizedBeat} from './chapter4-cinematic.js';

const mat=(color,opt={})=>new THREE.MeshLambertMaterial({color,flatShading:true,...opt});
const box=(root,color,x,y,z,w,h,d,shadow=true)=>{
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));
 mesh.position.set(x,y,z);mesh.castShadow=shadow;mesh.receiveShadow=true;root.add(mesh);return mesh;
};
const stone=(root,color,x,y,z,r=1,detail=0)=>{
 const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,detail),mat(color));
 m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;
};
const cyl=(root,color,x,y,z,rt,rb,h,n=9)=>{
 const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),mat(color));
 m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;
};
function beam(root,color,a,b,width=.12,n=5){
 const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),axis=q.clone().sub(p);
 const m=new THREE.Mesh(new THREE.CylinderGeometry(width*.86,width,axis.length(),n),mat(color));
 m.position.copy(p).add(q).multiplyScalar(.5);
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());
 m.castShadow=true;root.add(m);return m;
}
const rand=(i,mod)=>((Math.sin(i*71.173+mod*13.11)*12571.19)%1+1)%1;
function buildFaun(root,x,y,z){
 const body=new THREE.Group();body.position.set(x,y,z);root.add(body);
 const bark=0x5c604c,horn=0x93937a;
 cyl(body,bark,0,1.28,0,.32,.45,1.43,7);
 cyl(body,0x77765b,0,2.23,0,.27,.37,.62,7);
 stone(body,0x827c63,0,2.61,.08,.32,0).scale.set(.85,1.04,.82);
 for(const sign of [-1,1]){
  // Rooted hooves and asymmetrical branches are the silhouette, not flat horns.
  beam(body,bark,[sign*.25,1.04,0],[sign*.47,.27,.18],.19,6);
  stone(body,0x484b40,sign*.49,.22,.34,.23,0).scale.set(1,.4,1.3);
  beam(body,bark,[sign*.29,1.93,.02],[sign*.59,1.33,.27],.11,5);
  beam(body,horn,[sign*.17,2.78,0],[sign*.60,3.19,-.12],.12,7);
  beam(body,horn,[sign*.60,3.19,-.12],[sign*.75,3.55,-.11],.09,6);
  beam(body,0x73765d,[sign*.30,2.95,-.02],[sign*.51,3.07,.18],.047,5);
 }
 stone(body,0x9e987c,0,2.53,.34,.11,0).scale.set(1,.46,.38);
 // The ritual knife recovered from the Pale Man's chamber is genuinely
 // visible in the Faun's hand at the well, not merely described in UI.
 const ritualBlade=new THREE.Group();
 ritualBlade.position.set(.68,1.27,.37);
 ritualBlade.rotation.z=-.32;body.add(ritualBlade);
 box(ritualBlade,0x533d34,0,-.13,0,.10,.30,.09);
 box(ritualBlade,0xb7a16b,0,.045,0,.32,.067,.12);
 const blade=new THREE.Mesh(new THREE.ConeGeometry(.10,.54,4),
  mat(0xcbd0c8));blade.position.y=.32;ritualBlade.add(blade);
 body.userData.ritualBlade=ritualBlade;
 body.rotation.y=-.22;
 return body;
}
export function buildVidal(root){
 const soldier=new THREE.Group();root.add(soldier);
 // A soldier with real articulated hips, knees and shoulder pivots.
 // Walking is distance-driven so he does not skate while approaching Ofelia.
 const torso=new THREE.Group();soldier.add(torso);
 cyl(torso,0x292e2d,0,1.24,0,.28,.36,.90,8);
 box(torso,0x344042,0,1.43,.075,.60,.83,.39);
 box(torso,0x726e57,0,1.81,.05,.37,.12,.29);
 stone(torso,0xbfa78f,0,2.08,.05,.22,0);
 cyl(torso,0x303535,0,2.32,.02,.33,.31,.26,9);
 cyl(torso,0x1e2425,0,2.17,.16,.38,.38,.07,10);
 const legs=[],knees=[],arms=[];
 for(const sign of [-1,1]){
  const hip=new THREE.Group();
  hip.position.set(sign*.17,.84,0);soldier.add(hip);
  beam(hip,0x353e3e,[0,0,0],[0,-.40,.06],.145,7);
  const knee=new THREE.Group();knee.position.set(0,-.42,.06);hip.add(knee);
  beam(knee,0x2b3233,[0,0,0],[0,-.33,.03],.116,7);
  box(knee,0x192122,0,-.37,.20,.27,.17,.43);
  legs.push(hip);knees.push(knee);
  const shoulder=new THREE.Group();shoulder.position.set(sign*.34,1.73,.06);
  torso.add(shoulder);
  beam(shoulder,0x303b3b,[0,0,0],[0,-.57,.14],.12,7);
  stone(shoulder,0xbba58e,0,-.64,.14,.11,0);
  arms.push(shoulder);
 }
 const arm=arms[1];
 // Pistol stays physically attached to the right hand and appears only
 // after Vidal confronts Ofelia, not as a floating independent mesh.
 const pistol=box(arm,0x1b2224,.04,-.65,.35,.13,.11,.35);
 pistol.visible=false;
 const model={root:soldier,torso,legs,knees,arms,arm,pistol,gaitPhase:0,walkBlend:0};
 return model;
}
export function animateVidal(model,dt,worldDistance,aim=false){
 const d=Math.max(0,Math.min(.1,Number(dt)||0));
 const walk=Math.max(0,Number(worldDistance)||0);
 model.gaitPhase+=walk*8.6;
 model.walkBlend=THREE.MathUtils.damp(model.walkBlend,walk>.0003?1:0,10,d);
 const w=model.walkBlend,p=model.gaitPhase;
 // Alternating footfalls, knee flexion, opposite shoulder swing and slight
 // weight transfer give the captain a deliberate marching silhouette.
 for(let i=0;i<2;i++){
  const side=i===0?1:-1,step=Math.sin(p+ i*Math.PI)*w;
  model.legs[i].rotation.x=step*.52;
  model.legs[i].rotation.z=side*Math.cos(p+i*Math.PI)*w*.06;
  model.knees[i].rotation.x=Math.max(0,-step)*.43;
  model.arms[i].rotation.x=aim&&i===1?-.90:-step*.32;
  model.arms[i].rotation.z=side*w*.045;
 }
 model.torso.position.y=w*(.012+.032*Math.cos(p*2));
 model.torso.rotation.z=w*.025*Math.sin(p);
 model.torso.rotation.y=w*.020*Math.sin(p);
 if(aim)model.arms[1].rotation.z=-.12;
}
function babyModel(root){
 const group=new THREE.Group();root.add(group);
 const wrap=new THREE.Mesh(new THREE.ConeGeometry(.25,.62,8),mat(0xf0e5cf));
 wrap.rotation.z=Math.PI;wrap.position.y=-.26;group.add(wrap);
 stone(group,0xd3b9a1,0,.1,.015,.16,1);
 const cap=new THREE.Mesh(new THREE.SphereGeometry(.177,9,5,0,Math.PI*2,0,Math.PI*.56),mat(0xd5d6cd));
 cap.position.y=.14;group.add(cap);
 box(group,0xc4a99a,0,-.075,.20,.2,.09,.08);
 return group;
}
function spiralWell(root){
 // Exact buildWell() from chapter 1; NEVER the old 20 floating faux steps.
 return buildFinalSpiralWell(root);
}
function buildMaze(root){
 // Round stone diorama, matching the first chapter's miniature footprint.
 // The central wall map, paving, ivy and hedge foliage are sampled from
 // generateMaze(132), not a newly randomized maze for this final trial.
 const {ground,cap}=createFinalStageWithCutout(root);
 // Both ground layers have a real cutout, exposing all 52 descending steps.
 const fragment=buildFirstMazeCenterFragment(root);
 const well=spiralWell(root);
 // Three broken stone arches lead toward the centre, framing the distant Faun.
 for(const [x,z,s] of [[-7,5,1],[-5,-5,.87],[7,4,1.02]]){
  const a=new THREE.Group();a.position.set(x,0,z);a.scale.setScalar(s);root.add(a);
  for(const sign of [-1,1]){
   cyl(a,0x59685f,sign*1.16,.93,0,.31,.4,1.78,7);
   stone(a,0x7f8a7f,sign*1.16,1.85,0,.44,0);
  }
  beam(a,0x6f796e,[-1.16,1.90,0],[-.36,2.60,0],.27,6);
  beam(a,0x626e65,[1.16,1.90,0],[.36,2.60,0],.27,6);
  beam(a,0x7d887d,[-.36,2.60,0],[.36,2.60,0],.20,6);
 }
 // The final altar is away from the well so Ofelia is never forced to overlap
 // the well mesh or the Faun's body to interact.
 const altar=stone(root,0x8f968a,FINAL_ALTAR.x,.16,FINAL_ALTAR.z,.77,0);
 altar.scale.set(1,.29,.90);
 const chalk=new THREE.Mesh(new THREE.TorusGeometry(.69,.035,5,18),
  new THREE.MeshBasicMaterial({color:0xc2c3a5}));
 chalk.position.set(FINAL_ALTAR.x,.33,FINAL_ALTAR.z);chalk.rotation.x=Math.PI/2;root.add(chalk);
 // No part of the Faun stands in the black well! The player talks to
 // him from an adjacent safe stone landing, then gets the fate choices.
 const faun=buildFaun(root,FINAL_FAUN_POSITION.x,.05,FINAL_FAUN_POSITION.z);
 const spot=new THREE.PointLight(0xa9d2c7,1.1,7,2);
 spot.position.set(FINAL_FAUN_POSITION.x+.4,2.35,FINAL_FAUN_POSITION.z-.2);root.add(spot);
 const seal=new THREE.Group();root.add(seal);
 seal.position.set(FINAL_ALTAR.x,.33,FINAL_ALTAR.z);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.76,.038,5,40),
  new THREE.MeshBasicMaterial({color:0x9abeb4,transparent:true,opacity:.18}));
 ring.rotation.x=Math.PI/2;seal.add(ring);
 for(let i=0;i<7;i++){
  const a=i/7*Math.PI*2;
  stone(seal,0xa6c7be,Math.cos(a)*.72,.06,Math.sin(a)*.72,.07,0);
 }
 return {ground,fragment,well,faun,altar,seal,spot};
}
// Film-inspired vast court, not the original 17x11 one-room stage.
// All architecture remains low-poly and viewed with the SAME fixed ISO camera.
function royalFigure(root,x,z,kind,red){
 const g=new THREE.Group();
 g.position.set(x,1.15,z);root.add(g);
 const gown=kind==='king'?0xcab08b:0xd5c0a0;
 const cloth=kind==='king'?0x855e52:0x9f786a;
 const mantle=kind==='king'?0x765346:0x8d685c;
 cyl(g,cloth,0,.73,-.08,.42,.65,1.11,9);
 cyl(g,gown,0,1.43,0,.30,.42,.70,8);
 cyl(g,mantle,0,1.71,-.13,.29,.36,.32,8);
 stone(g,0xd8c3a9,0,2.05,.09,.28,1);
 // A crowned seated monarch, feet tucked behind the throne dais.
 box(g,0x6f4d3f,0,.37,.34,.78,.17,.58);
 for(const sign of [-1,1]){
  beam(g,gown,[sign*.30,1.45,.02],[sign*.56,.90,.31],.105,6);
  stone(g,0xd4bda3,sign*.56,.91,.32,.11,0);
 }
 const crown=cyl(g,0xc6a46a,0,2.41,0,.34,.34,.14,10);
 for(let n=0;n<9;n++){
  const a=n/9*Math.PI*2;
  const point=new THREE.Mesh(new THREE.ConeGeometry(.063,.26,4),mat(0xe1c17d));
  point.position.set(Math.cos(a)*.28,2.57,Math.sin(a)*.28);g.add(point);
 }
 const gem=stone(g,kind==='king'?0x933f50:0x617a79,0,2.48,.32,.075,0);
 const speechAnchor=new THREE.Object3D();
 speechAnchor.position.set(0,3.24,.28);g.add(speechAnchor);
 g.userData.speechAnchor=speechAnchor;
 return g;
}
function royalThrone(root,x,z,central=false){
 const g=new THREE.Group();g.position.set(x,1.17,z);root.add(g);
 const width=central?2.25:2.03;
 const base=box(g,0x5f4339,0,.12,.05,width,.33,1.52);
 box(g,0xb69a69,0,.33,.06,width*.88,.12,1.23);
 // Tall Gothic seat with carved gold border and separate crown finials.
 box(g,0x503c37,0,1.49,-.60,width,2.75,.43);
 box(g,central?0x9a6b58:0xa68d65,0,1.50,-.34,width-.22,2.47,.08);
 box(g,0x5d4140,0,1.48,-.26,width-.44,2.18,.07);
 for(const sign of [-1,1]){
  box(g,0xbb9b66,sign*(width*.5-.08),1.59,-.30,.095,2.77,.17);
  box(g,0x675047,sign*(width*.5-.06),.67,.32,.21,.20,1.11);
  const finial=stone(g,0xd3ad6e,sign*(width*.5-.08),3.03,-.53,.19,0);
  finial.scale.y=1.6;
 }
 box(g,0xd3b379,0,2.85,-.37,width+.16,.20,.29);
 for(let n=0;n<5;n++){
  const t=n/4;
  const spike=new THREE.Mesh(new THREE.ConeGeometry(.14,.32,5),mat(0xd4b16f));
  spike.position.set((t-.5)*(width-.36),3.09,-.34);g.add(spike);
 }
 if(central){
  const crest=stone(g,0xe7c992,0,2.44,-.20,.25,0);
  crest.scale.set(.9,1.28,.40);
  // The centre throne is intentionally EMPTY: Ofelia's rightful place.
  const smallStep=box(g,0xdec08c,0,-.18,.98,1.66,.21,.82);
 }
 return g;
}
export function royalHall(root){
 const floor=box(root,0x423733,0,-.49,-.55,32.5,.94,25.25);
 const surface=box(root,0x846f58,0,.012,-.55,32.04,.085,24.76);
 for(let i=0;i<16;i++)for(let k=0;k<12;k++){
  const x=-14.97+i*2.0,z=-11.8+k*2.03;
  const tile=box(root,(i+k)%4===0?0xb59a73:(i+k)%3===0?0x9a836a:0xa58d6d,
   x,.068,z,1.96,.035,1.97,false);
  tile.receiveShadow=true;
 }
 // The central runner recedes into the throne dais, visually extending
 // the royal court far beyond the protagonist instead of ending at her feet.
 box(root,0x5a3842,0,.105,1.85,3.55,.035,15.9,false);
 for(const x of [-1.86,1.86])
  box(root,0xc39d70,x,.135,1.85,.11,.045,15.88,false);
 for(let k=0;k<10;k++)
  box(root,0xac8f73,0,.14,-5.3+k*1.55,1.0,.025,.035,false);
 // Deep raised ceremonial platform, four real risers.
 const podium=[];
 for(const [height,depth,width,z,color] of [
  [.28,8.0,19.0,-7.43,0x776044],
  [.55,7.0,17.5,-7.75,0x9e7951],
  [.83,5.7,16.2,-8.13,0xbb986a],
  [1.10,4.3,14.5,-8.53,0x7d5f48]
 ]){
  podium.push(box(root,color,0,height/2+.12,z,width,height,depth));
  box(root,0xddb77e,0,height+.19,z+depth/2,width,.07,.11,false);
 }
 // High rear wall and an immense stone arch with a shadowed royal alcove.
 box(root,0x382c30,0,4.40,-12.17,26.0,8.9,.90);
 box(root,0x655044,0,4.68,-11.66,18.2,7.9,.28);
 box(root,0x302b30,0,4.62,-11.45,15.75,7.26,.17);
 box(root,0x886c4e,0,7.85,-11.31,18.3,.25,.28);
 for(const sign of [-1,1]){
  box(root,0x85664f,sign*9.30,4.44,-11.23,.52,8.55,.70);
  box(root,0xb09164,sign*9.30,8.83,-11.23,1.12,.35,.89);
 }
 // An arch crown much higher than the three thrones.
 const archSegments=18;
 for(let i=0;i<archSegments;i++){
  const a=Math.PI*i/archSegments,b=Math.PI*(i+1)/archSegments;
  const x1=Math.cos(a)*8.8,y1=5.95+Math.sin(a)*3.95;
  const x2=Math.cos(b)*8.8,y2=5.95+Math.sin(b)*3.95;
  beam(root,i%4===0?0xc7a77b:0x80694e,
   [x1,y1,-11.05],[x2,y2,-11.05],.36,7);
 }
 // Five pairs of tall colonnades, pedestals and rearward shadows.
 const columns=[];
 for(const sign of [-1,1])for(const z of [-9.95,-5.6,-1.25,3.1,7.45]){
  const x=sign*12.20;
  box(root,0x655344,x,.22,z,1.58,.42,1.53);
  cyl(root,0xb5a07b,x,3.12,z,.47,.60,5.55,10);
  cyl(root,0x856d58,x,5.93,z,.64,.51,.34,9);
  box(root,0xc9ab7b,x,6.21,z,1.58,.34,1.49);
  for(let q=0;q<7;q++){
   const a=q/7*Math.PI*2;
   beam(root,0x806c54,
    [x+Math.cos(a)*.48,.59,z+Math.sin(a)*.48],
    [x+Math.cos(a)*.48,5.80,z+Math.sin(a)*.48],.035,4);
  }
  columns.push({x,z});
 }
 // Open side-gallery arcades. They stay at the back / sides, never
 // crossing the princess or interfering with actor speech anchors.
 for(const sign of [-1,1]){
  for(let i=0;i<4;i++){
   const z=-8.80+i*4.6;
   beam(root,0x8e755c,
    [sign*12.15,6.20,z],
    [sign*12.15,6.20,z+3.60],.24,6);
  }
  // Low-poly crimson banners, dim enough for the gold thrones to stand out.
  for(const z of [-9.20,-1.20,6.70]){
   const banner=box(root,0x6a3a42,sign*14.28,4.35,z,.13,2.66,1.26,false);
   box(root,0xb49873,sign*14.15,5.70,z,.17,.13,1.42,false);
   stone(root,0xc5a876,sign*14.15,4.37,z,.10,0).scale.y=1.3;
  }
 }
 // Three explicit, physically separate seats: parents flank the RESERVED
 // empty throne. Their own figures are fixed to the correct seat positions.
 const throneGroups=[];
 for(const [x,central] of [[-4.12,false],[0,true],[4.12,false]])
  throneGroups.push(royalThrone(root,x,-8.78,central));
 const father=royalFigure(root,-4.12,-8.33,'king',false);
 const mother=royalFigure(root,4.12,-8.33,'queen',false);
 const centerThrone=throneGroups[1];
 const faun=buildFaun(root,7.65,.12,-5.25);
 faun.scale.setScalar(.82);faun.rotation.y=.34;
 // Exactly ONE Faun on the royal stage. The distant accompanying creatures
 // in the film are FAIRIES, not more copies of the Faun. Keep them restrained.
 const fairies=[];
 for(let i=0;i<7;i++){
  const side=i%2?-1:1;
  const winged=new THREE.Group();
  winged.position.set(side*(3.6+i*.49),2.9+(i%3)*.45,
   -3.5+(i%4)*1.06);
  const light=new THREE.Mesh(new THREE.IcosahedronGeometry(.105,0),
   new THREE.MeshBasicMaterial({color:i%3?0xf1ddad:0xcde3d5}));
  winged.add(light);
  for(const wingSide of [-1,1]){
   const wing=new THREE.Mesh(new THREE.TetrahedronGeometry(.145,0),
    new THREE.MeshLambertMaterial({color:0xcabf9b,flatShading:true}));
   wing.position.set(wingSide*.15,.025,0);
   wing.scale.set(1.0,.55,.30);wing.rotation.z=wingSide*.42;
   winged.add(wing);
  }
  root.add(winged);fairies.push(winged);
 }
 // A handful of candles/sconces, no glitter or busy particles.
 for(const sign of [-1,1])for(const z of [-9.6,-3.6,3.1]){
  const lamp=stone(root,0xdec69a,sign*10.56,3.26,z,.16,0);
  lamp.material=new THREE.MeshBasicMaterial({color:0xffd6a0});
  const glow=new THREE.PointLight(0xf7c88f,.45,6.5,2);
  glow.position.set(sign*10.50,3.50,z);root.add(glow);
 }
 const light=new THREE.AmbientLight(0xffd59c,.42);root.add(light);
 const keyLight=new THREE.PointLight(0xffd6a0,1.15,17,2);
 keyLight.position.set(0,7.7,-5.7);root.add(keyLight);
 return {
  father,mother,faun,fairies,centerThrone,throneGroups,podium,columns,
  surface,floor,light,keyLight,
  speechAnchors:{father:father.userData.speechAnchor,mother:mother.userData.speechAnchor}
 };
}
export function createFinalScene(canvas,state){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(1.2,window.devicePixelRatio||1));
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene();
 scene.background=new THREE.Color(0xf8f8f5);
 scene.add(new THREE.HemisphereLight(0xf1f7f0,0x4f5750,2.1));
 const sun=new THREE.DirectionalLight(0xffffff,2.05);
 sun.position.set(-8,19,13);sun.castShadow=true;
 sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-37;
 sun.shadow.camera.right=37;sun.shadow.camera.top=37;sun.shadow.camera.bottom=-37;
 sun.shadow.bias=-.0008;scene.add(sun);
 const labyrinth=new THREE.Group();scene.add(labyrinth);
 const maze=buildMaze(labyrinth);
 const royal=new THREE.Group();scene.add(royal);royal.visible=false;
 const throne=royalHall(royal);
 const hero=createPlayer(scene,new THREE.Vector3(FINAL_START.x,.12,FINAL_START.z));
 // Keep the red-cloaked short-bob heroine from chapter three.
 const baby=babyModel(hero.rig);
 baby.position.set(.22,1.06,.33);baby.scale.setScalar(.78);
 hero.arms[0].rotation.x=-.57;hero.arms[1].rotation.x=-.48;
 // The alternate ending must SHOW the stolen ritual knife being raised.
 // Reuse the Faun's dagger design, attached to Ofelia's articulated hand.
 const ceremonyKnife=new THREE.Group();
 ceremonyKnife.name='Ofelia-held-ritual-knife';
 ceremonyKnife.position.set(.045,-.46,.15);
 ceremonyKnife.rotation.z=.18;
 hero.arms[1].add(ceremonyKnife);
 box(ceremonyKnife,0x533d34,0,-.10,0,.10,.28,.09);
 box(ceremonyKnife,0xb7a16b,0,.05,0,.29,.065,.13);
 const knifeBlade=new THREE.Mesh(new THREE.ConeGeometry(.12,.57,4),
  mat(0xc9d1cc));knifeBlade.position.y=.37;ceremonyKnife.add(knifeBlade);
 ceremonyKnife.visible=false;
 // A non-graphic ruby glow marks the moment the magic accepts a drop.
 // It is separate from, and followed by, the visible blood-to-stairs path.
 const ritualGlow=new THREE.Group();
 ritualGlow.name='ritual-at-well-lip';
 ritualGlow.position.set(FINAL_BLOOD_STAND.x,.25,FINAL_BLOOD_STAND.z);
 labyrinth.add(ritualGlow);
 const ritualRing=new THREE.Mesh(new THREE.TorusGeometry(.36,.052,5,24),
  new THREE.MeshBasicMaterial({color:0xc35b64,transparent:true,opacity:.6}));
 ritualRing.rotation.x=-Math.PI/2;ritualGlow.add(ritualRing);
 const ritualLight=new THREE.PointLight(0xae555e,0,3.1,2);
 ritualLight.position.y=.28;ritualGlow.add(ritualLight);
 ritualGlow.visible=false;
 const vidal=buildVidal(labyrinth);
 vidal.root.position.set(VIDAL_START.x,.10,VIDAL_START.z);
 vidal.root.rotation.y=2.4;
 const vidalBaby=babyModel(vidal.root);
 vidalBaby.position.set(-.30,1.30,.29);vidalBaby.scale.setScalar(.74);vidalBaby.visible=false;
 const camera=new THREE.OrthographicCamera(-10,10,7,-7,.1,140);
 const direction=new THREE.Vector3(1,1.14,1.30).normalize();
 const focus=new THREE.Vector3(FINAL_START.x,.8,FINAL_START.z);
 const temp=new THREE.Vector3();
 let sceneWidth=0,sceneHeight=0,zoom=1,wasRoyal=false,sceneViewMode='';
 let lastCutscenePosition=null;
 const pickPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 const ray=new THREE.Raycaster();const pointer=new THREE.Vector2();
 function resize(){
  const rect=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));
  const cinematic=state.phase==='cinematic'&&!state.royalShown;
  const mode=state.royalShown?'royal':cinematic?
   state.ending==='offering'?'ritual-closeup':'captain-two-shot':'explore';
  if(w===sceneWidth&&h===sceneHeight&&mode===sceneViewMode)return;
  sceneWidth=w;sceneHeight=h;sceneViewMode=mode;
  const aspect=w/h;
  // Keep the fixed original isometric angle; framing is now designed for
  // mobile: both actors in the refusal, close-up of the knife/shaft for ritual.
  const portrait=aspect<.79;
  const scale=state.royalShown?(portrait?14.15:12.35):
   mode==='ritual-closeup'?(portrait?7.0:6.25):
   mode==='captain-two-shot'?(portrait?9.6:8.75):
   (portrait?10.8:8.6);
  const view=Math.max(5,scale/zoom);
  camera.left=-view*aspect;camera.right=view*aspect;
  camera.top=view;camera.bottom=-view;
  camera.updateProjectionMatrix();
  renderer.setSize(Math.max(1,Math.round(w*.86)),Math.max(1,Math.round(h*.86)),false);
 }
 function pick(clientX,clientY){
  const rect=canvas.getBoundingClientRect();
  pointer.set((clientX-rect.left)/rect.width*2-1,-((clientY-rect.top)/rect.height*2-1));
  ray.setFromCamera(pointer,camera);
  const hit=ray.ray.intersectPlane(pickPlane,new THREE.Vector3());
  if(!hit)return null;
  return {x:hit.x,z:hit.z};
 }
 function update(dt,elapsed){
  const d=Math.max(0,Math.min(dt,.1));
  const isRoyal=Boolean(state.royalShown);
  if(isRoyal!==wasRoyal){
   wasRoyal=isRoyal;sceneWidth=0; // Recalculate orthographic framing for vast royal court.
   labyrinth.visible=!isRoyal;royal.visible=isRoyal;
   scene.background=new THREE.Color(isRoyal?
    (state.ending==='offering'?0x33262a:0xe0c79c):0xf8f8f5);
   throne.surface.material.color.setHex(state.ending==='offering'?0x856057:0xb29b75);
   throne.floor.material.color.setHex(state.ending==='offering'?0x423034:0x675340);
  }
  if(isRoyal){
   // The centre seat remains VACANT until after the parents' invitation.
   // Ofelia arrives at the red carpet first, and walks toward her seat
   // only during the mother's lines; she does not materialize sitting.
   const invitation=state.ending==='mercy'?14.75:14.10;
   const walkT=Math.max(0,Math.min(1,(state.cinematicTime-invitation)/4.6));
   const eased=walkT*walkT*(3-2*walkT);
   hero.body.position.set(0,.13,6.00-eased*8.0);
   hero.body.rotation.y=Math.PI;
   baby.visible=false;
   hero.walkDistance=eased>0&&eased<1?d*1.55:0;
   throne.fairies.forEach((f,i)=>{
    f.position.y=2.9+(i%3)*.45+.09*Math.sin(elapsed*1.65+i*1.1);
   });
   focus.lerp(temp.set(0,2.48,-3.40),Math.min(1,d*4.4));
  }else{
   const cinematic=state.phase==='cinematic';
   const localT=state.cinematicTime||0;
   const cues=FINAL_CUES[state.ending]||FINAL_CUES.mercy;
   const arriveSeconds=cues.approachEnd;
   const raw=cinematic?Math.max(0,Math.min(1,localT/arriveSeconds)):0;
   const eased=raw*raw*(3-2*raw);
   const sceneActor=cinematic
    ?{x:THREE.MathUtils.lerp(state.player.x,FINAL_BLOOD_STAND.x,eased),
      z:THREE.MathUtils.lerp(state.player.z,FINAL_BLOOD_STAND.z,eased)}
    :state.player;
   // All endings physically approach the edge BEFORE any drop falls. On
   // timeout the walk takes longer to avoid teleporting in from the maze.
   if(cinematic){
    const previous=lastCutscenePosition||state.player;
    hero.walkDistance=Math.hypot(sceneActor.x-previous.x,sceneActor.z-previous.z);
    lastCutscenePosition={...sceneActor};
   }else lastCutscenePosition=null;
   hero.body.position.set(sceneActor.x,.13,sceneActor.z);
   hero.body.rotation.y=THREE.MathUtils.lerp(hero.body.rotation.y,
    cinematic?2.3:hero.body.rotation.y,.12);
   baby.visible=state.brotherVisible;
   // During refusal, hold both the captain AND the well in the fixed
   // orthographic frame instead of tracking Ofelia so tightly he is unseen.
   // 0.21 of the captain's location left him wholly off camera on narrow
   // devices. A true two-shot follows the midpoint until he reaches her.
   const captainShare=cinematic&&state.ending==='mercy'
    ?.55-.25*normalizedBeat(localT,0,cues.approachEnd):0;
   const viewX=cinematic?THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(sceneActor.x,FINAL_WELL_CENTER.x,.22),
    VIDAL_CINEMATIC_ENTRY.x,captainShare):state.player.x;
   const viewZ=cinematic?THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(sceneActor.z,FINAL_WELL_CENTER.z,.22),
    VIDAL_CINEMATIC_ENTRY.z,captainShare):state.player.z;
   focus.lerp(temp.set(viewX,cinematic?1.20:.80,viewZ),Math.min(1,d*4.8));
   const chase=cinematic&&state.ending==='mercy';
   // Start Vidal ON the approach path. At refusal the model is visible
   // immediately and walks for a full 3.5 seconds before taking the infant.
   const lateApproach=['approach','dialogue','decision'].includes(state.phase)&&
    state.elapsed>=24;
   vidal.root.visible=chase||lateApproach;
   const prevProgress=Math.max(0,Math.min(1,(state.elapsed-24)/38));
   const chaseProgress=normalizedBeat(localT,0,cues.approachEnd);
   const p=chase?prevProgress+(1-prevProgress)*chaseProgress:prevProgress;
   const pursuitTarget=chase?FINAL_BLOOD_STAND:state.player;
   const beforeVidal=vidal.root.position.clone();
   vidal.root.position.set(
    THREE.MathUtils.lerp(VIDAL_CINEMATIC_ENTRY.x,pursuitTarget.x-.72,p),
    .10,THREE.MathUtils.lerp(VIDAL_CINEMATIC_ENTRY.z,pursuitTarget.z+.72,p));
   const vx=vidal.root.position.x-beforeVidal.x;
   const vz=vidal.root.position.z-beforeVidal.z;
   const strideDistance=Math.hypot(vx,vz);
   if(strideDistance>.0001)vidal.root.rotation.y=Math.atan2(vx,vz);
   const aiming=chase&&localT>=cues.aim;
   vidal.pistol.visible=aiming;
   animateVidal(vidal,d,strideDistance,aiming);
   vidalBaby.visible=chase&&localT>=cues.handOff;
   // Drip from Ofelia's feet, cross the lip and descend alongside the
   // genuine spiral steps. Portal opens BELOW them, not over the mouth.
   // Blood cannot fall before the baby handoff/shot in the mercy path
   // or before the knife gesture in the alternate path.
   maze.well.setBloodProgress(cinematic?
    normalizedBeat(localT,cues.bloodStart,cues.bloodEnd):0);
   const portalAt=cues.portalStart;
   const portalDuration=1.05;
   const alternate=cinematic&&state.ending==='offering';
   ceremonyKnife.visible=alternate&&localT>=cues.knifeStart&&
    localT<cues.portalStart;
   if(maze.faun.userData.ritualBlade)
    maze.faun.userData.ritualBlade.visible=!(alternate&&localT>=cues.knifeStart);
   ritualGlow.visible=alternate&&localT>=cues.bloodMoment&&localT<cues.royalAt;
   ritualLight.intensity=ritualGlow.visible?3.2+.7*Math.sin(elapsed*4):0;
   ritualRing.rotation.z=elapsed*.36;
   ritualRing.scale.setScalar(2.0+.28*Math.sin(elapsed*3));
   const pulse=Math.max(0,Math.min(1,(localT-portalAt)/portalDuration));
   maze.well.portal.visible=cinematic&&localT>=portalAt;
   maze.well.portal.material.color.setHex(
    state.ending==='offering'?0x9d3f50:0xc5e8ca);
   maze.well.portal.material.opacity=maze.well.portal.visible?
    .15+.70*pulse:0;
   maze.well.portal.scale.setScalar(.88+.10*Math.sin(elapsed*2.7));
   maze.spot.color.setHex(state.ending==='offering'?0xe0a09b:0xa9d2c7);
   maze.spot.intensity=state.phase==='cinematic'?2.35:1.10;
   maze.seal.rotation.y=elapsed*.15;
   if(chase&&localT>=cues.shot){
    hero.rig.rotation.z=THREE.MathUtils.lerp(0,-1.13,Math.min(1,(localT-cues.shot)*.85));
    hero.body.position.y=.13-Math.min(.18,(localT-cues.shot)*.10);
   }else hero.rig.rotation.z=0;
  }
  animatePlayer(hero,d,Math.max(0,hero.walkDistance||0),Boolean(hero.walkDistance));
  // The existing walk animator resets arm and torso pivots each frame. Apply
  // carrying and the brief non-graphic fall AFTER walking, or they disappear.
  if(isRoyal){
   hero.rig.rotation.z=0;
   hero.arms[0].rotation.x=0;hero.arms[1].rotation.x=0;
  }else if(state.phase==='cinematic'&&state.ending==='mercy'&&state.cinematicTime>=FINAL_CUES.mercy.shot){
   hero.rig.rotation.z=-1.13*Math.min(1,(state.cinematicTime-FINAL_CUES.mercy.shot)*.85);
   hero.arms[0].rotation.x=-.22;hero.arms[1].rotation.x=-.42;
  }else{
   hero.arms[0].rotation.x=-.50;
   hero.arms[1].rotation.x=-.45;
   if(state.phase==='cinematic'&&state.ending==='offering'){
    const c=FINAL_CUES.offering,t=state.cinematicTime;
    // Bring the sacred dagger up in a clearly readable held pose, then
    // lower it towards the well as the ruby pulse appears.
    const lift=normalizedBeat(t,c.knifeStart,c.knifeLiftEnd);
    const lower=normalizedBeat(t,c.knifeLiftEnd,c.bloodMoment);
    hero.arms[1].rotation.x=-.45-1.45*lift+1.25*lower;
    hero.arms[1].rotation.z=-.20*lift;
   }else hero.arms[1].rotation.z=0;
  }
  hero.walkDistance=0;
  const onRoyal=isRoyal;
  camera.position.copy(focus).addScaledVector(direction,onRoyal?35:32);
  camera.lookAt(focus);
  camera.updateMatrixWorld(true);
  resize();
  renderer.render(scene,camera);
 }
 // Anchor the speech to the ACTUAL king/queen mesh, using the same
 // orthographic projection as the renderer (even after resize).
 function projectRoyalSpeaker(speaker){
  if(!state.royalShown)return null;
  const anchor=throne.speechAnchors[speaker];
  if(!anchor)return null;
  const projected=anchor.getWorldPosition(new THREE.Vector3()).project(camera);
  const rect=canvas.getBoundingClientRect();
  return {
   x:(projected.x*.5+.5)*rect.width,
   y:(.5-projected.y*.5)*rect.height,
   visible:projected.z>=-1&&projected.z<=1
  };
 }
 function getQAFrame(){
  const project=obj=>{
   const p=obj.getWorldPosition(new THREE.Vector3());p.y+=1.25;
   const projected=p.project(camera);
   return {u:(projected.x+1)*.5,v:(1-projected.y)*.5,z:projected.z,
    inside:Math.abs(projected.x)<=.96&&Math.abs(projected.y)<=.96&&
     projected.z>=-1&&projected.z<=1};
  };
  return {viewMode:sceneViewMode,cameraType:camera.type,
   royalVisible:royal.visible,labyrinthVisible:labyrinth.visible,
   captainVisible:vidal.root.visible&&labyrinth.visible,
   captain:project(vidal.root),hero:project(hero.body),
   knifeVisible:ceremonyKnife.visible,ritualGlowVisible:ritualGlow.visible,
   portalVisible:maze.well.portal.visible,
   bloodSegmentsVisible:maze.well.bloodSegments.filter(x=>x.visible).length,
   captainPosition:vidal.root.position.toArray(),heroPosition:hero.body.position.toArray()};
 }
 function setZoom(value){zoom=Math.max(.78,Math.min(1.25,value));sceneWidth=0;resize();}
 function dispose(){renderer.dispose();}
 resize();
 return {renderer,scene,camera,hero,baby,vidal,maze,royal,throne,pick,resize,update,projectRoyalSpeaker,getQAFrame,setZoom,dispose};
}
