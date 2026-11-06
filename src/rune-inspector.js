/** Shared diegetic 3D close-up for all three rune puzzles. No maze logic lives here. */
import * as THREE from 'three';
import {DIRECTIONS,SYMBOLS} from './maze.js';

const $=id=>document.getElementById(id);
const COLORS=['#a8dcc4','#c6b1f1','#ebce95'];
const NAMES=['苔之印','月之印','灰烬印'];
const QUARTER=Math.PI/2;
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
 // Physical compass markers stay stationary while the arrow rotates.
 const marks=[];
 for(let i=0;i<4;i++){
   const a=i*QUARTER;
   const marker=new THREE.Mesh(new THREE.OctahedronGeometry(i===0?.086:.055,0),
     stone(i===0?0xf6dfb3:0x536459));
   marker.position.set(Math.sin(a)*.65,1.23,-Math.cos(a)*.65);
   marker.scale.y=.33;root.add(marker);marks.push(marker);
 }
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
   const moon=new THREE.Mesh(new THREE.TorusGeometry(.13,.032,5,14,Math.PI*1.5),stone(0xc5b6de));
   moon.position.set(x,.50,z);moon.rotation.y=theta;variants[1].add(moon);
   const ember=new THREE.Mesh(new THREE.OctahedronGeometry(.15,0),stone(0xd6b879));
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
 const closeButton=$('rune-inspector-close');
 const leftButton=$('rune-left');
 const rightButton=$('rune-right');
 const currentLabel=$('rune-current');
 const targetLabel=$('rune-target');
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
 let lastButtonTime=0,solved=false;
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
 function updateLabels(){
   if(!active)return;
   const phase=active.phase;
   currentLabel.textContent=`${SYMBOLS[phase]} ${DIRECTIONS[phase]}`;
   targetLabel.textContent=`${SYMBOLS[active.target]} ${DIRECTIONS[active.target]}`;
   $('rune-inspector-orient').textContent=SYMBOLS[phase];
 }
 function open(rune){
   if(!rune||rune.solved||active)return;
   clearTimeout(closeTimer);
   active=rune;solved=false;drag=null;
   previousFocus=document.activeElement;
   angle=targetAngle=-rune.phase*QUARTER;
   model.pointer.rotation.y=angle;
   model.accentLight.color.setHex(rune.color);
   model.centerpiece.material.color.setHex(rune.color);
   model.centerpiece.material.emissive.setHex(rune.color);
   model.variants.forEach((group,index)=>{group.visible=index===rune.index;});
   const hex=COLORS[rune.index]||COLORS[0];
   modal.style.setProperty('--rune-accent',hex);
   $('rune-inspector-title').textContent=NAMES[rune.index]||'古老符印';
   $('rune-inspector-number').textContent=`0${rune.index+1} / 03`;
   status.textContent='触摸符印，或拖动石盘，让指针转向石碑指示的方向。';
   modal.classList.remove('is-hidden','is-solved');
   modal.setAttribute('aria-hidden','false');
   document.body.classList.add('rune-inspecting');
   leftButton.disabled=false;rightButton.disabled=false;
   updateLabels();resize();
   closeButton.focus({preventScroll:true});
 }
 function close(){
   if(!active)return;
   clearTimeout(closeTimer);closeTimer=null;
   active=null;solved=false;drag=null;
   modal.classList.add('is-hidden');
   modal.classList.remove('is-solved');
   modal.setAttribute('aria-hidden','true');
   document.body.classList.remove('rune-inspecting');
   if(previousFocus&&document.contains(previousFocus))previousFocus.focus({preventScroll:true});
   previousFocus=null;
   onClose?.();
 }
 function rotate(direction){
   if(!active||solved||![-1,1].includes(direction))return false;
   const result=onTurn(active.index,direction);
   if(!result?.changed)return false;
   targetAngle-=direction*QUARTER;
   updateLabels();
   if(result.solved){
     solved=true;
     modal.classList.add('is-solved');
     leftButton.disabled=true;rightButton.disabled=true;
     status.textContent='✦ 封印归位，石门正在沉入地下……';
     closeTimer=setTimeout(close,1450);
   }else{
     status.textContent=`咔哒——符印指向${DIRECTIONS[active.phase]}。继续寻找正确方向。`;
   }
   return true;
 }
 function rotateByButton(direction){
   if(performance.now()-lastButtonTime<120)return;
   lastButtonTime=performance.now();rotate(direction);
 }
 leftButton.addEventListener('click',()=>rotateByButton(-1));
 rightButton.addEventListener('click',()=>rotateByButton(1));
 closeButton.addEventListener('click',close);
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
   model.stageGlow.material.opacity=.15+.06*Math.sin(time*2.2);
   renderer.render(scene,camera);
 }
 return {open,close,rotate:rotateByButton,render,resize,isOpen:()=>Boolean(active)};
}
