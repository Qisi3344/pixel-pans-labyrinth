import * as THREE from 'three';

export const ENDING_SECONDS = 10.4;
export function endingPhase(time){
 const t=Math.max(0,Number.isFinite(time)?time:0);
 if(t<1.45)return {step:'swallow',caption:'第三颗魔石被吞入黑暗',exterior:false,done:false};
 if(t<3.20)return {step:'awaken',caption:'某种古老的力量正在苏醒',exterior:false,done:false};
 if(t<5.10)return {step:'key',caption:'金色钥匙从蟾蜍口中升起',exterior:false,done:false};
 if(t<5.65)return {step:'transition',caption:'根须深处传来了春天的声音',exterior:true,done:false};
 if(t<ENDING_SECONDS)return {step:'spring',caption:'枯木复苏，新的枝叶舒展开来',exterior:true,done:false};
 return {step:'complete',caption:'获得黄金钥匙 · 第二章完成',exterior:true,done:true};
}
const clamp=(n)=>Math.min(1,Math.max(0,n));
const smooth=(n)=>{const u=clamp(n);return u*u*(3-2*u);};
const palette=[0x9edeb5,0xc6b3ff,0xffd37b];
const leafColors=[0x668d69,0x759e72,0x8ba978,0x4f785f,0x9bb486];
const lightMat=(color)=>new THREE.MeshBasicMaterial({color,depthWrite:false});

function makeSpring(exterior){
 const group=new THREE.Group();group.visible=false;exterior.group.add(group);
 const leaves=[],sprouts=[];
 const geoLeaf=new THREE.IcosahedronGeometry(1,0);
 // All new foliage starts at scale zero. The tree stays dead while the player
 // explores it; leaves only emerge after the golden key is recovered.
 const tips=[
  [-6.35,5.30,-.20],[-5.0,5.15,-.42],[-4.4,6.5,-.74],
  [-3.7,5.0,-.26],[-2.1,7.32,-1.03],[-1.7,8.0,-1.30],
  [1.7,7.55,-.78],[2.5,6.73,-.80],[3.8,5.4,-.14],
  [4.8,5.0,.01],[5.3,6.38,-.34],[5.9,5.26,.20],
  [-1.75,5.2,-.71],[1.65,4.95,-.45]
 ];
 for(let i=0;i<tips.length;i++){
  const [x,y,z]=tips[i];
  for(let n=0;n<3;n++){
   const a=(i*1.73+n*2.094),delta=.33+(n%2)*.17;
   const leaf=new THREE.Mesh(geoLeaf,new THREE.MeshLambertMaterial({
    color:leafColors[(i+n)%leafColors.length],flatShading:true
   }));
   leaf.position.set(x+Math.cos(a)*delta,y+.19*Math.sin(a*1.8),z+Math.sin(a)*delta*.75);
   leaf.rotation.set(.14*n,a*.22,.35);
   leaf.scale.setScalar(.001);
   leaf.castShadow=true;leaf.receiveShadow=true;group.add(leaf);
   leaves.push({mesh:leaf,delay:i*.042+n*.075,scale:.36+((i+n)%4)*.08});
  }
 }
 const stemGeo=new THREE.ConeGeometry(.18,.72,5);
 for(let i=0;i<26;i++){
  const theta=i*2.399963,dist=1.85+(i%5)*.72;
  const x=Math.cos(theta)*dist,z=Math.sin(theta)*dist;
  const sprout=new THREE.Mesh(stemGeo,new THREE.MeshLambertMaterial({
   color:leafColors[i%leafColors.length],flatShading:true
  }));
  // The base is near the irregular forest ground; sprout upward from it.
  sprout.position.set(x,-.05,z);
  sprout.scale.set(.001,.001,.001);
  sprout.castShadow=true;group.add(sprout);
  sprouts.push({mesh:sprout,delay:(i%9)*.1,scale:.45+(i%4)*.15});
 }
 const rings=[];
 for(const [x,z] of [[-2,1.5],[.5,2.5],[2.3,-1.5]]){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.46,.038,4,24),
   new THREE.MeshBasicMaterial({color:0x9bcfa5,transparent:true,opacity:.32,depthWrite:false}));
  ring.rotation.x=-Math.PI/2;ring.position.set(x,.24,z);group.add(ring);
  rings.push(ring);
 }
 const warm=new THREE.PointLight(0xa6dbab,0,13,2);
 warm.position.set(0,3.3,.7);group.add(warm);
 function update(time){
  const progress=smooth((time-5.35)/4.6);
  group.visible=time>=5.1;
  for(const {mesh,delay,scale} of leaves){
   const u=smooth((progress*1.38-delay)/.53);
   mesh.scale.set(scale*u,scale*.60*u,scale*.80*u);
  }
  for(const {mesh,delay,scale} of sprouts){
   const u=smooth((progress*1.44-delay)/.5);
   mesh.scale.set(scale*u,scale*u,scale*u);
  }
  rings.forEach((ring,i)=>{
   const u=smooth((progress*1.35-i*.18)/.7);
   ring.scale.setScalar(.2+u*2.2);
   ring.material.opacity=(1-u)*.32;
  });
  warm.intensity=progress*1.3;
 }
 return {group,update,leaves,sprouts};
}

/** A timed 3D cutscene that uses the same Three.js scene and camera as gameplay.
 * Three distinct flying jewels are animated on each offering; the third jewel
 * begins a scripted toad reaction, key reveal and tree revival.
 */
export function createChapter2Ending({stage,toad,jaw,belly,goldKey,player,exterior,onExterior}){
 let active=false,elapsed=0,cut=false,offering=null;
 const jewelGeo=new THREE.OctahedronGeometry(.18,0);
 const jewels=palette.map(color=>{
  const mesh=new THREE.Mesh(jewelGeo,lightMat(color));
  mesh.visible=false;stage.add(mesh);
  const light=new THREE.PointLight(color,0,2.5,2);stage.add(light);
  return {mesh,light};
 });
 const glow=new THREE.PointLight(0xf1d58b,0,6,2);
 glow.position.set(-.92,.61,0);toad.add(glow);
 const bellyGlow=new THREE.Mesh(new THREE.IcosahedronGeometry(.47,1),
  new THREE.MeshBasicMaterial({color:0xe4ce88,transparent:true,opacity:0,depthWrite:false}));
 bellyGlow.position.set(-.73,.45,.09);bellyGlow.scale.set(.58,.52,.8);toad.add(bellyGlow);
 const keyLight=new THREE.PointLight(0xf7d98a,0,6.2,2);
 stage.add(keyLight);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(.51,.025,4,30),
  new THREE.MeshBasicMaterial({color:0xf0d19a,transparent:true,opacity:.55,depthWrite:false}));
 halo.visible=false;stage.add(halo);
 const spring=makeSpring(exterior);
 // An upright, unmistakable 3D golden key persists in the revived forest.
 // It is separate from the underground key reveal, so the reward isn't lost
 // the instant the camera cuts back to the exterior.
 const exteriorKey=new THREE.Group();exteriorKey.visible=false;
 exterior.group.add(exteriorKey);
 exteriorKey.position.set(-2.7,2.25,3.15);
 const golden=new THREE.MeshBasicMaterial({color:0xf9d17a,side:THREE.DoubleSide});
 const keyRing=new THREE.Mesh(new THREE.TorusGeometry(.47,.095,8,24),golden);
 keyRing.position.y=.37;exteriorKey.add(keyRing);
 const keyShaft=new THREE.Mesh(new THREE.CylinderGeometry(.082,.095,1.3,8),golden);
 keyShaft.position.y=-.56;exteriorKey.add(keyShaft);
 const toothA=new THREE.Mesh(new THREE.BoxGeometry(.41,.15,.17),golden);
 toothA.position.set(.18,-.90,0);exteriorKey.add(toothA);
 const toothB=new THREE.Mesh(new THREE.BoxGeometry(.35,.15,.17),golden);
 toothB.position.set(.16,-1.16,0);exteriorKey.add(toothB);
 const amulet=new THREE.Mesh(new THREE.OctahedronGeometry(.19,0),
  new THREE.MeshBasicMaterial({color:0xffedaf}));
 amulet.position.y=.37;exteriorKey.add(amulet);
 const trophyLight=new THREE.PointLight(0xffd784,0,5.4,2);
 trophyLight.position.y=.20;exteriorKey.add(trophyLight);
 let ambient=0;
 function playOffering(index){
  if(index<0||index>2||active&&index!==2)return;
  if(offering&&offering.index===index)return;
  offering={index,time:0};
  const item=jewels[index];item.mesh.visible=true;item.light.intensity=1;
 }
 function start(){
  if(active)return;
  active=true;elapsed=0;cut=false;playOffering(2);
 }
 function state(){return active?{active:true,time:elapsed,...endingPhase(elapsed)}:
  {active:false,time:0,step:'idle',caption:'',exterior:false,done:false};}
 function update(dt){
  const delta=Math.min(.10,Math.max(0,Number(dt)||0));
  ambient+=delta;
  if(offering){
   offering.time+=delta;
   const {index,time}=offering,part=jewels[index];
   const u=smooth(time/1.25),start=player.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,1.15,0));
   const mouth=toad.localToWorld(new THREE.Vector3(-1.20,.39,0));
   part.mesh.position.copy(start).lerp(mouth,u);
   part.mesh.position.y+=Math.sin(Math.PI*u)*(.75+index*.09);
   part.mesh.rotation.set(u*6,u*8,u*3);
   part.mesh.scale.setScalar(Math.max(.04,1-u*.88));
   part.light.position.copy(part.mesh.position);
   part.light.intensity=(1-u)*1.5;
   if(time>=1.25){
    part.mesh.visible=false;part.light.intensity=0;offering=null;
   }
  }
  if(!active){
   goldKey.visible=false;halo.visible=false;exteriorKey.visible=false;
   glow.intensity=0;bellyGlow.material.opacity=0;keyLight.intensity=0;
   return state();
  }
  elapsed=Math.min(ENDING_SECONDS+1,elapsed+delta);
  const phase=endingPhase(elapsed);
  const swelling=smooth((elapsed-.65)/1.0)*(1-smooth((elapsed-3.45)/.95));
  belly.scale.set(.59*(1+swelling*.22),.53*(1+swelling*.16),.94*(1+swelling*.15));
  bellyGlow.material.opacity=swelling*.53;
  glow.intensity=swelling*2.25;
  jaw.rotation.z=elapsed<1.6?-.36*Math.sin(Math.PI*smooth(elapsed/1.6)):
   elapsed<3.8?-.08*Math.sin(elapsed*8):0;
  const keyStart=1.8,keyEnd=5.10;
  const reveal=smooth((elapsed-keyStart)/1.55);
  goldKey.visible=elapsed>=keyStart&&elapsed<keyEnd;
  goldKey.position.set(8.15,-2.28+reveal*3.45,2.18);
  goldKey.rotation.y=elapsed*1.10;
  goldKey.scale.setScalar(.3+reveal*1.65);
  keyLight.position.copy(goldKey.position);
  keyLight.intensity=(1-smooth((elapsed-4.50)/.5))*reveal*2.2;
  halo.visible=goldKey.visible;halo.position.copy(goldKey.position);
  halo.rotation.x=-Math.PI/2;halo.scale.setScalar(.65+reveal*.65);
  if(phase.exterior&&!cut){cut=true;onExterior();}
  spring.update(elapsed);
  const showTrophy=phase.exterior;
  exteriorKey.visible=showTrophy;
  if(showTrophy){
   const grow=smooth((elapsed-5.2)/1.5);
   exteriorKey.position.y=1.8+.8*grow+.10*Math.sin(ambient*2.6);
   exteriorKey.rotation.y=ambient*.92;
   exteriorKey.scale.setScalar(.25+grow*1.18);
   trophyLight.intensity=.6+grow*1.8;
  } else trophyLight.intensity=0;
  return state();
 }
 return {playOffering,start,update,state,spring,exteriorKey};
}
