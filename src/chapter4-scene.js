import * as THREE from 'three';
import {createPlayer,animatePlayer} from './player.js';
import {FINAL_START,FINAL_ALTAR,VIDAL_START,CHAPTER4_TIME_LIMIT,distance} from './chapter4-logic.js';

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
 body.rotation.y=-.22;
 return body;
}
function buildVidal(root){
 const soldier=new THREE.Group();root.add(soldier);
 cyl(soldier,0x242928,0,1.13,0,.27,.38,1.05,7);
 const uniform=box(soldier,0x303b3d,0,1.3,.08,.6,.87,.38);
 const collar=box(soldier,0x67664a,0,1.70,.04,.33,.12,.29);
 stone(soldier,0xbca58a,0,1.99,.05,.22,0);
 cyl(soldier,0x303333,0,2.25,.01,.33,.31,.26,9);
 cyl(soldier,0x222726,0,2.11,.15,.38,.37,.07,10);
 for(const sign of [-1,1]){
  beam(soldier,0x222828,[sign*.30,1.58,0],[sign*.42,.91,.22],.13);
  beam(soldier,0x303838,[sign*.17,.72,0],[sign*.17,.11,.07],.15);
  box(soldier,0x1b2224,sign*.19,.14,.18,.28,.18,.40);
 }
 const arm=new THREE.Group();arm.position.set(.34,1.57,.18);soldier.add(arm);
 beam(arm,0x303a39,[0,0,0],[.28,-.21,.37],.11);
 const pistol=box(arm,0x222627,.34,-.25,.53,.14,.10,.36);
 pistol.visible=false;
 return {root:soldier,arm,pistol};
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
 const well=new THREE.Group();root.add(well);
 well.position.set(2.17,.07,-2.06);
 cyl(well,0x454e4b,0,.03,0,2.06,2.12,.4,24);
 const dark=cyl(well,0x111e22,0,.275,0,1.60,1.60,.016,28);
 dark.material=new THREE.MeshBasicMaterial({color:0x101f24});
 const inner=new THREE.Mesh(new THREE.TorusGeometry(1.76,.11,5,28),mat(0x78847a));
 inner.rotation.x=Math.PI/2;inner.position.y=.33;well.add(inner);
 // Circular stairs fold down toward an empty black centre.
 for(let i=0;i<20;i++){
  const angle=i/20*Math.PI*2,rr=1.22-(i%4)*.13;
  const step=box(well,i%4===0?0x829085:0x6f7a70,
   Math.cos(angle)*rr,.295-(i%4)*.055,Math.sin(angle)*rr,
   .52,.18,.26);
  step.rotation.y=-angle;
 }
 for(let i=0;i<18;i++){
  const a=i/18*Math.PI*2,rr=1.92+(i%3)*.025;
  const tile=box(well,i%4?0x778279:0x8c9688,
   Math.cos(a)*rr,.40,Math.sin(a)*rr,.76,.23,.48);
  tile.rotation.y=-a;
 }
 const droplet=new THREE.Mesh(new THREE.IcosahedronGeometry(.18,0),
  new THREE.MeshBasicMaterial({color:0xa8484d,transparent:true,opacity:0}));
 droplet.position.set(0,.48,0);well.add(droplet);
 return {well,dark,droplet};
}
function buildMaze(root){
 const ground=box(root,0x383f3c,-.1,-.64,.20,27.7,1.1,27.2);
 const cap=box(root,0x69766e,-.1,-.075,.20,27.35,.22,26.85);
 for(let i=0;i<24;i++){
  const a=i/24*Math.PI*2,rr=12.15;
  const stoneTile=box(root,i%4?0x66746e:0x859084,
   Math.cos(a)*rr-.18,.077,Math.sin(a)*rr+.20,
   2.02,.16,1.12);
  stoneTile.rotation.y=-a+.05;
 }
 // Organic ruined arcs and moss-clothed stones create a miniature labyrinth
 // without filling the safe movement corridor with invisible walls.
 for(let i=0;i<14;i++){
  const a=i/14*Math.PI*2+.06,rr=11.35,px=Math.cos(a)*rr,pz=Math.sin(a)*rr;
  const p=stone(root,i%3?0x5e6d63:0x829084,px,.36,pz,.79+(i%3)*.12);
  p.scale.set(1,.75,.92);
  if(i%3===0){
   const pillar=cyl(root,0x78847a,px,1.15,pz,.32,.43,1.95,6);
   stone(root,0x535d53,px,2.14,pz,.47,0).scale.y=.35;
  }
 }
 for(let i=0;i<22;i++){
  const a=rand(i,0)*Math.PI*2,rr=4.1+rand(i,1)*6.5;
  const x=Math.cos(a)*rr,z=Math.sin(a)*rr;
  const m=stone(root,i%2?0x515f55:0x738079,x,.20,z,.23+rand(i,4)*.4);
  m.scale.y=.43;
  if(i%3===0){
   for(let q=0;q<3;q++){
    const angle=q*2.1;
    beam(root,0x4e5f50,[x,.22,z],[x+.2*Math.cos(angle),.65+q*.10,z+.20*Math.sin(angle)],.05);
   }
  }
 }
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
 const faun=buildFaun(root,FINAL_ALTAR.x+1.55,.05,FINAL_ALTAR.z-1.20);
 const spot=new THREE.PointLight(0xa9d2c7,1.1,7,2);
 spot.position.set(FINAL_ALTAR.x+.5,2.35,FINAL_ALTAR.z-.4);root.add(spot);
 const seal=new THREE.Group();root.add(seal);
 seal.position.set(FINAL_ALTAR.x,.33,FINAL_ALTAR.z);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.76,.038,5,40),
  new THREE.MeshBasicMaterial({color:0x9abeb4,transparent:true,opacity:.18}));
 ring.rotation.x=Math.PI/2;seal.add(ring);
 for(let i=0;i<7;i++){
  const a=i/7*Math.PI*2;
  stone(seal,0xa6c7be,Math.cos(a)*.72,.06,Math.sin(a)*.72,.07,0);
 }
 return {ground,well,faun,altar,seal,spot};
}
function royalFigure(root,x,z,kind,red){
 const g=new THREE.Group();g.position.set(x,0,z);root.add(g);
 const c=kind==='king'?0xe0c798:0xe0c9a1;
 cyl(g,c,0,1.16,0,.31,.52,1.55,8);
 cyl(g,kind==='king'?0x8f5a40:0x997f66,0,2.03,0,.22,.34,.40,8);
 stone(g,0xd6bfa2,0,2.38,.02,.26,1);
 const crown=cyl(g,0xb99b57,0,2.72,0,.31,.31,.13,9);
 for(let i=0;i<7;i++){
  const a=i/7*Math.PI*2;
  const tooth=new THREE.Mesh(new THREE.ConeGeometry(.075,.26,4),mat(0xd7b56d));
  tooth.position.set(Math.cos(a)*.27,2.86,Math.sin(a)*.27);g.add(tooth);
 }
 for(const sign of [-1,1]){
  beam(g,c,[sign*.28,1.74,0],[sign*.44,.96,.35],.11,6);
 }
 const robe=box(g,red?0x6b303a:0x8b604a,0,.64,-.11,1.08,.18,.7);
 return g;
}
function royalHall(root){
 const floor=box(root,0x534a3c,0,-.32,0,17.7,.58,11.5);
 const surface=box(root,0x9f8a68,0,-.022,0,17.3,.05,11.1);
 for(let i=0;i<9;i++)for(let j=0;j<6;j++)
  box(root,(i+j)%3===0?0xb79b75:0xa68a62,-7.9+i*1.97,.022,-4.7+j*1.88,1.9,.055,1.8,false);
 const columnColor=0xc2a16a;
 for(const sign of [-1,1])for(const z of [-3.85,0,3.85]){
  cyl(root,0x8d7254,sign*7.25,1.64,z,.46,.57,3.30,10);
  box(root,columnColor,sign*7.25,3.40,z,1.15,.34,1.12);
  box(root,0x66503c,sign*7.25,.11,z,1.22,.23,1.17);
 }
 box(root,0x6a4d3c,0,1.20,-4.65,9.80,3.28,.75);
 box(root,0xc5a367,0,3.31,-4.46,9.98,.24,.93);
 const back=cyl(root,0x76553c,0,2.15,-4.15,3.3,3.3,3.45,12);
 back.rotation.x=Math.PI/2;back.scale.y=.13;
 box(root,0x997850,0,.27,-2.6,6.75,.50,4.80);
 box(root,0x836543,0,.58,-3.35,6.4,.43,3.10);
 for(const x of [-2.05,2.05]){
  box(root,0x76533e,x,1.31,-3.51,1.34,1.82,.76);
  box(root,0xb49b6a,x,2.06,-3.35,1.50,.22,.85);
  box(root,0x69513e,x,.50,-3.09,1.35,.26,1.1);
 }
 const father=royalFigure(root,-2.05,-3.25,'king',false);
 const mother=royalFigure(root,2.05,-3.25,'queen',false);
 const faun=buildFaun(root,4.78,.08,-1.83);
 faun.scale.setScalar(.79);faun.rotation.y=.48;
 for(let i=0;i<6;i++){
  const torch=stone(root,0xb28b56,-5.2+i*2.1,2.54,-4.2,.14);
  torch.material=new THREE.MeshBasicMaterial({color:0xffd29a});
 }
 const light=new THREE.AmbientLight(0xffd59c,.45);root.add(light);
 return {father,mother,faun,surface,floor,light};
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
 sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-24;
 sun.shadow.camera.right=24;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;
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
 const vidal=buildVidal(labyrinth);
 vidal.root.position.set(VIDAL_START.x,.10,VIDAL_START.z);
 vidal.root.rotation.y=2.4;
 const vidalBaby=babyModel(vidal.root);
 vidalBaby.position.set(-.30,1.30,.29);vidalBaby.scale.setScalar(.74);vidalBaby.visible=false;
 const camera=new THREE.OrthographicCamera(-10,10,7,-7,.1,140);
 const direction=new THREE.Vector3(1,1.14,1.30).normalize();
 const focus=new THREE.Vector3(FINAL_START.x,.8,FINAL_START.z);
 const temp=new THREE.Vector3();
 let sceneWidth=0,sceneHeight=0,zoom=1,wasRoyal=false;
 const pickPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 const ray=new THREE.Raycaster();const pointer=new THREE.Vector2();
 function resize(){
  const rect=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));
  if(w===sceneWidth&&h===sceneHeight)return;
  sceneWidth=w;sceneHeight=h;
  const aspect=w/h;
  // Fixed orthographic ISO micro-world, no orbit controls.
  const portrait=aspect<.79,scale=portrait?10.8:8.6;
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
   wasRoyal=isRoyal;labyrinth.visible=!isRoyal;royal.visible=isRoyal;
   scene.background=new THREE.Color(isRoyal?
    (state.ending==='offering'?0x33262a:0xe0c79c):0xf8f8f5);
   throne.surface.material.color.setHex(state.ending==='offering'?0x856057:0xb29b75);
   throne.floor.material.color.setHex(state.ending==='offering'?0x423034:0x675340);
  }
  if(isRoyal){
   hero.body.position.set(0,.13,2.90);hero.body.rotation.y=Math.PI;
   baby.visible=false;
   focus.lerp(temp.set(0,1.50,-1.8),Math.min(1,d*5));
  }else{
   hero.body.position.set(state.player.x,.13,state.player.z);
   hero.body.rotation.y=THREE.MathUtils.lerp(hero.body.rotation.y,
    state.phase==='cinematic'?2.3:hero.body.rotation.y,.12);
   baby.visible=state.brotherVisible;
   focus.lerp(temp.set(state.phase==='cinematic'?FINAL_ALTAR.x:state.player.x,
    state.phase==='cinematic'?1.24:.80,
    state.phase==='cinematic'?FINAL_ALTAR.z:state.player.z),Math.min(1,d*4.8));
   const approaching=1-Math.max(0,Math.min(1,(state.timeLeft-3)/CHAPTER4_TIME_LIMIT));
   // Vidal is on his own approach; during the refusal he suddenly reaches
   // Ofelia at the altar and visibly carries away the baby.
   const localT=state.cinematicTime||0;
   const chase=state.phase==='cinematic'&&state.ending==='mercy';
   const p=chase?Math.min(1,localT/1.68):
    Math.max(0,Math.min(1,(CHAPTER4_TIME_LIMIT-state.timeLeft-24)/32));
   vidal.root.position.set(
    THREE.MathUtils.lerp(VIDAL_START.x,FINAL_ALTAR.x-.95,p),
    .10,THREE.MathUtils.lerp(VIDAL_START.z,FINAL_ALTAR.z+.75,p));
   vidal.root.rotation.y=-.6;
   vidal.pistol.visible=chase&&localT>=1.48;
   vidal.arm.rotation.x=chase?-.72:0;
   vidalBaby.visible=chase&&localT>=1.6;
   maze.well.droplet.visible=state.phase==='cinematic'&&
    state.cinematicTime>(state.ending==='mercy'?3.25:1.55);
   maze.well.droplet.material.opacity=maze.well.droplet.visible?.82:0;
   maze.well.droplet.position.y=.48+
    Math.sin(elapsed*2)*.065-(state.ending==='mercy'?Math.max(0,localT-3.25)*.07:0);
   maze.well.droplet.material.color.setHex(state.ending==='offering'?0xa3414b:0x9e5555);
   maze.spot.color.setHex(state.ending==='offering'?0xe0a09b:0xa9d2c7);
   maze.spot.intensity=state.phase==='cinematic'?2.35:1.10;
   maze.seal.rotation.y=elapsed*.15;
   if(chase&&localT>=2.17){
    hero.rig.rotation.z=THREE.MathUtils.lerp(0,-1.13,Math.min(1,(localT-2.17)*1.20));
    hero.body.position.y=.13-Math.min(.18,(localT-2.17)*.10);
   }else hero.rig.rotation.z=0;
  }
  animatePlayer(hero,d,Math.max(0,hero.walkDistance||0),Boolean(hero.walkDistance));
  // The existing walk animator resets arm and torso pivots each frame. Apply
  // carrying and the brief non-graphic fall AFTER walking, or they disappear.
  if(isRoyal){
   hero.rig.rotation.z=0;
   hero.arms[0].rotation.x=0;hero.arms[1].rotation.x=0;
  }else if(state.phase==='cinematic'&&state.ending==='mercy'&&state.cinematicTime>=2.17){
   hero.rig.rotation.z=-1.13*Math.min(1,(state.cinematicTime-2.17)*1.2);
   hero.arms[0].rotation.x=-.22;hero.arms[1].rotation.x=-.42;
  }else{
   hero.arms[0].rotation.x=-.50;
   hero.arms[1].rotation.x=-.45;
  }
  hero.walkDistance=0;
  const onRoyal=isRoyal;
  camera.position.copy(focus).addScaledVector(direction,onRoyal?35:32);
  camera.lookAt(focus);
  camera.updateMatrixWorld(true);
  resize();
  renderer.render(scene,camera);
 }
 function setZoom(value){zoom=Math.max(.78,Math.min(1.25,value));sceneWidth=0;resize();}
 function dispose(){renderer.dispose();}
 resize();
 return {renderer,scene,camera,hero,baby,vidal,maze,royal,throne,pick,resize,update,setZoom,dispose};
}
