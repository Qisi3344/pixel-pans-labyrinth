/** Shared diegetic 3D close-up for all three rune puzzles. No maze logic lives here. */
import * as THREE from 'three';
import {SYMBOLS} from './maze.js';
import {COMPASS_SYMBOLS,QUARTER_TURN,headingAngle,headingPosition} from './rune-orientation.js';

const $=id=>document.getElementById(id);
const COLORS=[0xa1d5b9,0x8bc9ba,0x8ab8a9];
const QUARTER=QUARTER_TURN;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const stone=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.88,metalness:.025,flatShading:true,...options});

function cylinder(parent,top,bottom,height,segments,y,material){
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,segments),material);
 mesh.position.y=y;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function torus(parent,radius,tube,y,color){
 const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,6,48),stone(color));
 mesh.rotation.x=Math.PI/2;mesh.position.y=y;parent.add(mesh);return mesh;
}
function createModel(scene){
 const root=new THREE.Group();scene.add(root);
 const dark=stone(0x34453e),medium=stone(0x63766a),light=stone(0x9ca99b);
 cylinder(root,1.12,1.20,.18,12,.08,dark);
 cylinder(root,1.04,1.12,.20,12,.25,medium);
 cylinder(root,.76,.91,.62,12,.65,stone(0x4c5e53));
 cylinder(root,.87,.89,.12,16,1.00,stone(0x8c9d8c));
 cylinder(root,.81,.83,.06,16,1.095,dark);
 cylinder(root,.69,.72,.06,16,1.145,light);
 torus(root,.75,.05,1.175,0xb8c5ad);
 torus(root,.55,.025,1.192,0x3c4a41);
 // FOUR engraved cardinal symbols are fixed to the stone itself; the
 // central pointer is the only rotating component. Never mark the target.
 for(let i=0;i<4;i++){
   const {x,z}=headingPosition(i,.955);
   const medallion=new THREE.Mesh(new THREE.CylinderGeometry(.195,.195,.018,12),
     stone(i===0?0x4a6353:0x30483d));
   medallion.position.set(x,1.195,z);root.add(medallion);
   const glyph=document.createElement('canvas');
   glyph.width=glyph.height=128;
   const ink=glyph.getContext('2d');
   ink.clearRect(0,0,128,128);
   ink.font='bold 94px "Arial Unicode MS","Segoe UI Symbol",sans-serif';
   ink.textAlign='center';ink.textBaseline='middle';
   ink.fillStyle=i===0?'#e6d9af':'#bad7c2';
   ink.fillText(COMPASS_SYMBOLS[i],64,67);
   const texture=new THREE.CanvasTexture(glyph);
   texture.colorSpace=THREE.SRGBColorSpace;
   texture.magFilter=THREE.NearestFilter;
   texture.minFilter=THREE.LinearFilter;
   const plaque=new THREE.Mesh(new THREE.PlaneGeometry(.32,.32),
     new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
   plaque.rotation.x=-Math.PI/2;
   plaque.position.set(x,1.212,z);
   root.add(plaque);
 }
 // The golden north marker distinguishes world bearings even in isometric view.
 const north=headingPosition(0,.735);
 const key=new THREE.Mesh(new THREE.OctahedronGeometry(.07,0),stone(0xe6d9af));
 key.position.set(north.x,1.235,north.z);key.scale.y=.25;root.add(key);
 const pointer=new THREE.Group();pointer.position.y=1.22;root.add(pointer);
 // Arrow points north (-Z) at phase 0. Rotating around Y yields four true headings.
 const arrow=new THREE.Shape();
 arrow.moveTo(0,.72);arrow.lineTo(.29,.22);arrow.lineTo(.11,.22);
 arrow.lineTo(.11,-.45);arrow.lineTo(-.11,-.45);arrow.lineTo(-.11,.22);
 arrow.lineTo(-.29,.22);arrow.closePath();
 const geometry=new THREE.ExtrudeGeometry(arrow,{depth:.075,bevelEnabled:false,curveSegments:1});
 geometry.rotateX(-Math.PI/2);
 const arrowMesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xd7e9d8,roughness:.35,metalness:.32,flatShading:true}));
 arrowMesh.castShadow=true;pointer.add(arrowMesh);
 cylinder(pointer,.14,.15,.10,10,.095,stone(0x253e34));
 const centerpiece=new THREE.Mesh(new THREE.IcosahedronGeometry(.14,0),new THREE.MeshStandardMaterial({color:0xc9ead6,emissive:0x254d3c,emissiveIntensity:.22}));
 centerpiece.position.y=.20;pointer.add(centerpiece);
 // Each rune changes the 3D carvings as well as the light and correct heading.
 const variants=[new THREE.Group(),new THREE.Group(),new THREE.Group()];
 for(const group of variants)root.add(group);
 for(let i=0;i<3;i++){
   const theta=i*2*Math.PI/3;
   const x=Math.cos(theta)*.93,z=Math.sin(theta)*.93;
   const leaf=new THREE.Mesh(new THREE.TetrahedronGeometry(.17,0),stone(0x96b69a));
   leaf.position.set(x,.50,z);leaf.rotation.set(.3,theta,.38);variants[0].add(leaf);
   const moon=new THREE.Mesh(new THREE.TorusGeometry(.13,.032,5,14,Math.PI*1.5),stone(0x8aafa2));
   moon.position.set(x,.50,z);moon.rotation.y=theta;variants[1].add(moon);
   const ember=new THREE.Mesh(new THREE.OctahedronGeometry(.15,0),stone(0x719b84));
   ember.position.set(x,.49,z);ember.scale.y=1.4;variants[2].add(ember);
 }
 const accentLight=new THREE.PointLight(0xa8dcc4,1.4,4);
 accentLight.position.set(0,2.4,0);root.add(accentLight);
 const stageGlow=new THREE.Mesh(new THREE.CylinderGeometry(1.37,1.37,.045,48),
   new THREE.MeshBasicMaterial({color:0x5a7a69,transparent:true,opacity:.22}));
 stageGlow.position.y=-.04;root.add(stageGlow);
 return {pointer,centerpiece,accentLight,variants,stageGlow};
}

export function createRuneInspector({onTurn,onClose}){
 const modal=$('rune-inspector');
 const canvas=$('rune-inspector-canvas');
 const view=$('rune-inspector-view');
 const marker=$('rune-inspector-orient');
 const hint=$('rune-inspector-soft-hint');
 const status=$('rune-inspector-status');
 const scene=new THREE.Scene();
 const camera=new THREE.OrthographicCamera(-2.25,2.25,2.05,-2.05,.1,40);
 camera.position.set(4.4,5.7,8.6);camera.lookAt(0,.76,0);
 scene.add(new THREE.HemisphereLight(0xe6f6ec,0x1b2924,2.0));
 const mainLight=new THREE.DirectionalLight(0xffffff,2.35);
 mainLight.position.set(-4,8,5);scene.add(mainLight);
 const rimLight=new THREE.DirectionalLight(0xaed4c0,1.15);
 rimLight.position.set(4,4,-6);scene.add(rimLight);
 const model=createModel(scene);
 let renderer=null,active=null,angle=0,targetAngle=0,drag=null,previousFocus=null,closeTimer=null;
 let solved=false;
 function ensureRenderer(){
   if(renderer)return;
   renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});
   renderer.setClearColor(0,0);
   renderer.outputColorSpace=THREE.SRGBColorSpace;
   renderer.toneMapping=THREE.NoToneMapping;
 }
 function resize(){
   if(!active)return;
   ensureRenderer();
   const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
   const resolution=.82;
   renderer.setPixelRatio(1);
   renderer.setSize(Math.round(w*resolution),Math.round(h*resolution),false);
   const aspect=w/h;
   camera.left=-2.12*aspect;camera.right=2.12*aspect;
   camera.top=2.12;camera.bottom=-2.12;
   camera.updateProjectionMatrix();
 }
 function updateMarker(){
   if(active)marker.textContent=SYMBOLS[active.phase];
 }
 function open(rune){
   if(!rune||rune.solved||active)return;
   clearTimeout(closeTimer);closeTimer=null;
   active=rune;solved=false;drag=null;
   previousFocus=document.activeElement;
   angle=targetAngle=headingAngle(rune.phase);
   model.pointer.rotation.y=angle;
   const color=COLORS[rune.index]??COLORS[0];
   model.accentLight.color.setHex(color);
   model.centerpiece.material.color.setHex(color);
   model.centerpiece.material.emissive.setHex(color);
   model.variants.forEach((group,index)=>{group.visible=index===rune.index;});
   status.textContent="观察石碑箭头，再旋转指针对准石盘上相同的方向刻度。";
   modal.classList.remove("is-hidden","is-solved");
   modal.setAttribute("aria-hidden","false");
   document.body.classList.add("rune-inspecting");
   updateMarker();resize();
   hint.style.animation="none";void hint.offsetWidth;hint.style.animation="";
   view.focus({preventScroll:true});
 }
 function close(){
   if(!active)return;
   clearTimeout(closeTimer);closeTimer=null;
   active=null;solved=false;drag=null;
   modal.classList.add("is-hidden");
   modal.classList.remove("is-solved");
   modal.setAttribute("aria-hidden","true");
   document.body.classList.remove("rune-inspecting");
   if(previousFocus&&document.contains(previousFocus))previousFocus.focus({preventScroll:true});
   previousFocus=null;
   onClose?.();
 }
 function rotate(direction){
   if(!active||solved||![-1,1].includes(direction))return false;
   const result=onTurn(active.index,direction);
   if(!result?.changed)return false;
   targetAngle-=direction*QUARTER;
   updateMarker();
   if(result.solved){
     solved=true;
     modal.classList.add("is-solved");
     status.textContent="封印归位。石门正在下沉。";
     closeTimer=setTimeout(close,1150);
   }else{
     status.textContent="符印转到"+SYMBOLS[active.phase]+"方向。";
   }
   return true;
 }
 function rotateByInput(direction){rotate(direction);}
 modal.querySelector(".rune-inspector-shade").addEventListener("click",close);
 let pointerId=null;
 view.addEventListener('pointerdown',event=>{
   if(!active||solved||event.button!==0)return;
   pointerId=event.pointerId;
   drag={startX:event.clientX,startAngle:targetAngle,dx:0};
   view.setPointerCapture(event.pointerId);
   view.classList.add('is-dragging');
 });
 view.addEventListener('pointermove',event=>{
   if(!drag||event.pointerId!==pointerId)return;
   drag.dx=event.clientX-drag.startX;
 });
 function endDrag(event){
   if(!drag||event.pointerId!==pointerId)return;
   const dx=drag.dx;
   drag=null;pointerId=null;
   view.classList.remove('is-dragging');
   if(view.hasPointerCapture(event.pointerId))view.releasePointerCapture(event.pointerId);
   if(event.type==='pointercancel')return;
   const steps=clamp(Math.round(dx/72),-3,3);
   for(let i=0;i<Math.abs(steps);i++){
     if(solved)break;
     rotate(Math.sign(steps));
   }
 }
 view.addEventListener('pointerup',endDrag);
 view.addEventListener('pointercancel',endDrag);
 function render(time,dt){
   if(!active||!renderer)return;
   // Directly follow the gesture, then smoothly spring to the nearest cardinal detent.
   const desired=drag?drag.startAngle-drag.dx*(QUARTER/72):targetAngle;
   const speed=drag?24:12;
   angle=THREE.MathUtils.damp(angle,desired,speed,Math.max(.001,dt));
   if(!drag&&Math.abs(angle-targetAngle)<.002)angle=targetAngle;
   model.pointer.rotation.y=angle;
   model.centerpiece.rotation.y=time*.25;
   const breath=.5+.5*Math.sin(time*1.9);
   model.accentLight.intensity=solved?3.8:1.05+breath*.42;
   model.centerpiece.material.emissiveIntensity=solved?2.6:.23+breath*.25;
   model.stageGlow.material.opacity=solved?.52:.13+breath*.09;
   renderer.render(scene,camera);
 }
 return {open,close,rotate:rotateByInput,render,resize,isOpen:()=>Boolean(active)};
}
