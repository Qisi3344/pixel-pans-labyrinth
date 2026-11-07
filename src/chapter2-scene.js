import * as THREE from 'three';
import {createExterior} from './chapter2-exterior.js';
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
 const focus=new THREE.Vector3(0,-1.7,0);let width=-1,height=-1,zoom=1,portrait=false;
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(120,120),mat(0xffffff));ground.rotation.x=-Math.PI/2;ground.position.y=-5.7;ground.receiveShadow=true;scene.add(ground);
 const stage=new THREE.Group();scene.add(stage);
 // Cutaway earth: uninterrupted back shell, open front, no occluding fake facade.
 block(stage,0x313d39,[0,-4.25,0],[21.2,2.2,10.2]);
 // The original two giant opaque slabs covered every playable tunnel and avatar.
 // Remove both: underground is entered later as a separately revealed diorama.
 for(let i=0;i<39;i++){
  const x=-10.2+(i%13)*1.68,z=4.65-(Math.floor(i/13))*.56;
  block(stage,[0x4c5d4c,0x596759,0x3e4e47][i%3],[x,-2.25,z],[1.58,2.2,.53],(i%3-1)*.05);
 }
 // Numerous true 3D wooden roots extend from canopy through the soil cut.
 const trunk=new THREE.Group();trunk.position.set(-.6,0,0);stage.add(trunk);
 const bark=0x41423c;
 const trunkSections=[
  [[0,-.55,0],[.07,1.6,.04],1.45,1.12],
  [[.07,1.6,.04],[-.5,3.75,-.15],1.12,.82],
  [[-.5,3.75,-.15],[-.7,5.7,-.25],.84,.52],
  [[-.15,3.1,-.06],[-3.6,5.3,.20],.54,.23],
  [[-.2,3.6,-.12],[3.35,5.8,-.35],.57,.28],
  [[-.65,5.35,-.25],[-2.0,7.8,-1.2],.5,.24],
  [[-.65,5.35,-.25],[1.35,8.4,.3],.47,.18],
  [[-3.4,5.2,.2],[-4.5,6.7,.75],.22,.12],
  [[3.1,5.65,-.35],[4.9,7,.1],.26,.11]
 ];
 for(const [a,b,r1,r2] of trunkSections)rod(trunk,bark,a,b,r1,r2,8);
 trunk.visible=false; // inside: no decorative canopy occluding the tunnel.
 for(let k=0;k<14;k++){
  const a=k*2.39996,r=2.2+(k%4)*.62;
  leaf(trunk,Math.cos(a)*r,6.5+(k%5)*.34,Math.sin(a)*1.4,.75+(k%3)*.13,[0x435a4b,0x536c58,0x64785a][k%3]);
 }
 // Tree roots are bundled at multiple depths; the main cavity remains readable.
 for(let i=0;i<14;i++){
  const a=i*2.399963,side=i%2?1:-1,x=side*(1.1+i*.38),z=2.4+Math.sin(a)*1.8;
  rod(stage,[0x3a3d37,0x515347,0x333a34][i%3],[Math.sin(a)*.62,-.7,.3],[x,-3.4,z],.19+(i%3)*.09,.07);
 }
 // Winding stone-and-mud route is a continuous excavated tunnel, not floating markers.
 for(const [a,b] of EDGES){
  const p=pos(a),q=pos(b),delta=q.clone().sub(p),len=delta.length();
  const tile=block(stage,0x35483f,[(p.x+q.x)/2,-3.02,(p.z+q.z)/2],[len+.7,.24,1.25],-Math.atan2(delta.z,delta.x));
  tile.material=mat([0x435449,0x4c5e51,0x3b4b42][(a+b)%3]);
  for(let t=0;t<3;t++){
   const at=p.clone().lerp(q,(t+.3)/3);
   block(stage,0x607166,[at.x,-2.86,at.z+.37],[.42,.04,.16],.11*t);
  }
 }
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
 // Three luminous stones stand on distinct side passages.
 const stoneModels=STONE_NODES.map((n,i)=>{
  const p=pos(n),group=new THREE.Group();group.position.set(p.x,-2.37,p.z);stage.add(group);
  disk(group,0x62695a,0,-.31,0,.52);
  const gem=sphere(group,[0xb5dfc2,0xc2b2e8,0xe4c88e][i],.29,[0,.28,0],0);
  const halo=new THREE.PointLight([0xa9e2bc,0xb8a6e5,0xe4c487][i],1.3,3);halo.position.y=.44;group.add(halo);
  group.traverse(o=>{if(o.isMesh){o.userData={kind:'stone',index:i};clickable.push(o);}});
  return {group,gem,halo};
 });
 // The ancient toad is a volumetric low-poly creature with articulated mouth.
 const toad=new THREE.Group();toad.position.set(8.7,-2.5,1);toad.rotation.y=-.4;stage.add(toad);
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
 // Chapter II: Ofelia-inspired black dress, pale apron straps and a tiny storybook.
 // Reparent the avatar to scene, so it remains visible when the two worlds switch.
 const player=new THREE.Group();player.position.copy(pos(0));scene.add(player);
 const rig=new THREE.Group();player.add(rig);
 const legs=[-.12,.12].map(x=>{
  const leg=block(rig,0x313334,[x,.32,0],[.14,.59,.19]);return leg;
 });
 const skirt=new THREE.Mesh(new THREE.ConeGeometry(.42,.8,7),mat(0x272d30));skirt.position.y=.83;skirt.rotation.y=.5;skirt.castShadow=true;rig.add(skirt);
 const torso=block(rig,0x2a3031,[0,1.18,0],[.36,.53,.26]);
 const head=sphere(rig,0xd0b7a8,.24,[0,1.64,0],1);
 const hair=sphere(rig,0x292a2b,.27,[0,1.79,.07],1);hair.scale.set(1.12,.63,1);
 const arms=[-.28,.28].map(x=>block(rig,0x31383a,[x,1.1,0],[.16,.5,.17]));
 // Small costume details are actual meshes, not painted sprite planes.
 block(rig,0xd6d9c9,[-.15,1.2,.144],[.105,.45,.06],-.12);
 block(rig,0xd6d9c9,[.15,1.2,.144],[.105,.45,.06],.12);
 block(rig,0xe7e5d9,[0,1.41,.158],[.33,.085,.08]);
 block(rig,0xe3e3d8,[0,1.07,.17],[.17,.30,.04]);
 // A small dark-blue book held in front of the character, matching the still.
 const book=block(rig,0x596c78,[.36,.87,.26],[.28,.35,.08],-.25);
 book.rotation.x=-.23;
 const lantern=sphere(rig,0xf3d6a3,.07,[-.35,.77,.08],0);
 const glow=new THREE.PointLight(0xf2d5a3,.7,3);glow.position.set(.37,.72,0);rig.add(glow);
 const exterior=createExterior(scene);
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
 function resize(){
  const w=canvas.clientWidth||window.innerWidth,h=canvas.clientHeight||window.innerHeight;
  if(w===width&&h===height)return;
  width=w;height=h;portrait=w/h<.85;
  const vertical=area==='exterior'?(portrait?19.5:20.7):(portrait?15:20);
  camera.left=-vertical*w/h/(2*zoom);camera.right=vertical*w/h/(2*zoom);
  camera.top=vertical/(2*zoom);camera.bottom=-vertical/(2*zoom);camera.updateProjectionMatrix();
  const factor=portrait?2.15:2.05;renderer.setSize(Math.max(160,Math.floor(w/factor)),Math.max(160,Math.floor(h/factor)),false);
  canvas.style.width='100%';canvas.style.height='100%';
 }
 function setZoom(n){zoom=THREE.MathUtils.clamp(n,.8,1.7);width=-1;resize();}
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
  resize();
  rootPivot.rotation.z=rootOpen(state.time)?-.62:0;
  rootGate.scale.y=rootOpen(state.time)?.28:1;
  boulder.position.x=state.boulderMoved?7.5:5;
  boulder.rotation.z=state.boulderMoved?-.65:0;
  stoneModels.forEach((s,i)=>{
   s.group.visible=!state.stones[i];s.gem.rotation.y=seconds*.6;
   s.gem.position.y=.28+Math.sin(seconds*2+i)*.075;
  });
  toad.position.y=-2.5+Math.sin(seconds*1.6)*.065;
  jaw.rotation.z=state.offerings?Math.sin(seconds*3)*.19:Math.sin(seconds*1.4)*.035;
  goldKey.visible=state.won;goldKey.rotation.y+=dt*.55;
  const walking=travel>.0001;
  const gait=seconds*10;
  legs[0].rotation.x=walking?Math.sin(gait)*.45:0;
  legs[1].rotation.x=walking?-Math.sin(gait)*.45:0;
  arms[0].rotation.x=walking?-Math.sin(gait)*.33:0;
  arms[1].rotation.x=walking?Math.sin(gait)*.33:0;
  rig.position.y=walking?Math.abs(Math.sin(gait))*.055:0;
  const point=area==='exterior'
    ? (portrait?new THREE.Vector3(player.position.x*.39,1.8,player.position.z*.31):new THREE.Vector3(0,1.85,0))
    : (portrait?new THREE.Vector3(player.position.x,-1.3,player.position.z):new THREE.Vector3(0,-.9,0));
  focus.lerp(point,1-Math.exp(-dt*(portrait?5:2.5)));
  camera.position.copy(focus).addScaledVector(direction,33);camera.lookAt(focus);
  renderer.render(scene,camera);
 }
 resize();draw(0,.016,0);
 return {renderer,scene,camera,player,pos,pick,draw,resize,setZoom,setArea,exterior,dispose(){renderer.dispose();}};
}