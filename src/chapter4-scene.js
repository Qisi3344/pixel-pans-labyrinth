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
 // The ritual knife recovered from the Pale Man's chamber is genuinely
 // visible in the Faun's hand at the well, not merely described in UI.
 const ritualBlade=new THREE.Group();
 ritualBlade.position.set(.68,1.27,.37);
 ritualBlade.rotation.z=-.32;body.add(ritualBlade);
 box(ritualBlade,0x533d34,0,-.13,0,.10,.30,.09);
 box(ritualBlade,0xb7a16b,0,.045,0,.32,.067,.12);
 const blade=new THREE.Mesh(new THREE.ConeGeometry(.10,.54,4),
  mat(0xcbd0c8));blade.position.y=.32;ritualBlade.add(blade);
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
 // A genuine magical opening appears INSIDE the circular stone well.
 // Both variants use the same geometry, but each color tells a different fate.
 const portal=new THREE.Mesh(new THREE.CircleGeometry(1.40,28),
  new THREE.MeshBasicMaterial({
   color:0xb0d7c4,transparent:true,opacity:0,
   depthWrite:false,side:THREE.DoubleSide
  }));
 portal.rotation.x=-Math.PI/2;
 portal.position.set(0,.49,0);
 portal.visible=false;well.add(portal);
 const droplet=new THREE.Mesh(new THREE.IcosahedronGeometry(.18,0),
  new THREE.MeshBasicMaterial({color:0xa8484d,transparent:true,opacity:0}));
 droplet.position.set(0,.54,0);well.add(droplet);
 return {well,dark,droplet,portal};
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
  father,mother,faun,centerThrone,throneGroups,podium,columns,
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
  const portrait=aspect<.79;
  const scale=state.royalShown?(portrait?14.15:12.35):(portrait?10.8:8.6);
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
   hero.body.position.set(0,.13,6.00);hero.body.rotation.y=Math.PI;
   baby.visible=false;
   focus.lerp(temp.set(0,2.48,-3.40),Math.min(1,d*4.4));
  }else{
   hero.body.position.set(state.player.x,.13,state.player.z);
   hero.body.rotation.y=THREE.MathUtils.lerp(hero.body.rotation.y,
    state.phase==='cinematic'?2.3:hero.body.rotation.y,.12);
   baby.visible=state.brotherVisible;
   const lastLook=state.phase==='cinematic'&&!state.timeOut;
   focus.lerp(temp.set(lastLook?FINAL_ALTAR.x:state.player.x,
    state.phase==='cinematic'?1.24:.80,
    lastLook?FINAL_ALTAR.z:state.player.z),Math.min(1,d*4.8));
   // The captain arrives at the moment the 62-second clock expires, not
   // six seconds before it. On timeout he pursues Ofelia WHERE she stands.
   const localT=state.cinematicTime||0;
   const chase=state.phase==='cinematic'&&state.ending==='mercy';
   const p=chase?Math.min(1,localT/1.68):
    Math.max(0,Math.min(1,(CHAPTER4_TIME_LIMIT-state.timeLeft-22)/(CHAPTER4_TIME_LIMIT-22)));
   const pursuitTarget=state.timeOut?state.player:FINAL_ALTAR;
   vidal.root.position.set(
    THREE.MathUtils.lerp(VIDAL_START.x,pursuitTarget.x-.95,p),
    .10,THREE.MathUtils.lerp(VIDAL_START.z,pursuitTarget.z+.75,p));
   vidal.root.rotation.y=-.6;
   vidal.pistol.visible=chase&&localT>=1.48;
   vidal.arm.rotation.x=chase?-.72:0;
   vidalBaby.visible=chase&&localT>=1.6;
   const portalAt=state.ending==='mercy'?3.23:1.53;
   const portalDuration=state.ending==='mercy'?1.40:1.92;
   const pulse=Math.max(0,Math.min(1,(localT-portalAt)/portalDuration));
   maze.well.portal.visible=state.phase==='cinematic'&&localT>=portalAt;
   maze.well.portal.material.color.setHex(
    state.ending==='offering'?0x9d3f50:0xc5e8ca);
   maze.well.portal.material.opacity=maze.well.portal.visible?
    .15+.72*pulse:0;
   maze.well.portal.scale.setScalar(.78+.26*Math.sin(elapsed*2.7));
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
 function setZoom(value){zoom=Math.max(.78,Math.min(1.25,value));sceneWidth=0;resize();}
 function dispose(){renderer.dispose();}
 resize();
 return {renderer,scene,camera,hero,baby,vidal,maze,royal,throne,pick,resize,update,projectRoyalSpeaker,setZoom,dispose};
}
