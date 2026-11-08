import * as THREE from 'three';
import {FRESCO_POINTS} from './chapter3-logic.js';

// Original painted, antiqued frescoes rendered into a canvas texture.
// Visual storytelling follows the film's ominous Pale Man/children fresco
// without copying movie screenshots or flattening it into repeated cubes.
export const FRESCO_CAPTIONS=Object.freeze([
 Object.freeze({title:'噬童者的宴席',detail:'褪色的画面里，无眼的巨人俯身吞噬孩童。这里的食物不是为客人准备的。',number:'I · 饥饿的壁画'}),
 Object.freeze({title:'失踪者的回廊',detail:'瘦长的身影张开双臂，幼小的人影向石廊深处消失。画角还留着一双小鞋。',number:'II · 消失的名字'})
]);
function prng(seed){let x=seed|0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function stroke(ctx,color,w=2){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();}
function fillPath(ctx,color,points){
 ctx.beginPath();ctx.moveTo(...points[0]);
 for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);
 ctx.closePath();ctx.fillStyle=color;ctx.fill();
}
function ellipse(ctx,x,y,rx,ry,color,angle=0){
 ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,Math.PI*2);
 ctx.fillStyle=color;ctx.fill();
}
function child(ctx,x,y,scale=1){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 // A small anonymous silhouette, deliberately symbolic rather than gory.
 ellipse(ctx,0,-52,23,28,'#a28b73');
 ctx.beginPath();ctx.moveTo(-14,-29);
 ctx.quadraticCurveTo(-44,-7,-37,28);
 ctx.lineTo(-21,67);ctx.lineTo(0,52);ctx.lineTo(21,67);
 ctx.lineTo(34,25);ctx.quadraticCurveTo(42,-9,12,-29);
 ctx.closePath();ctx.fillStyle='#8d7564';ctx.fill();
 stroke(ctx,'#533f38',5);ctx.beginPath();ctx.moveTo(-14,65);ctx.lineTo(-18,103);
 ctx.moveTo(19,65);ctx.lineTo(25,103);ctx.stroke();
 ctx.restore();
}
function paintGiant(ctx,index){
 ctx.save();
 if(index===1){ctx.translate(720,0);ctx.scale(-1,1);}
 // A crouching faceless, long-fingered ogre; ochre flesh over soot.
 ctx.beginPath();ctx.moveTo(326,271);
 ctx.bezierCurveTo(270,278,245,371,285,455);
 ctx.bezierCurveTo(298,490,422,485,450,416);
 ctx.bezierCurveTo(492,333,459,265,418,259);
 ctx.closePath();ctx.fillStyle='#a89171';ctx.fill();
 ctx.beginPath();ctx.moveTo(315,299);ctx.bezierCurveTo(265,359,267,403,308,441);
 ctx.moveTo(428,290);ctx.bezierCurveTo(466,365,451,397,414,459);
 stroke(ctx,'#655142',8);
 // Ribcage: semi-opaque brush ridges rather than hard geometric slabs.
 for(let k=0;k<5;k++){
  ctx.beginPath();ctx.moveTo(309,330+k*21);
  ctx.quadraticCurveTo(367,348+k*20,432,321+k*20);
  stroke(ctx,'rgba(73,53,43,.58)',6);ctx.stroke();
 }
 // Narrow neck and a blank bone-colored head, no eye sockets.
 ctx.beginPath();ctx.moveTo(343,273);ctx.lineTo(333,226);
 ctx.lineTo(393,218);ctx.lineTo(399,275);ctx.closePath();
 ctx.fillStyle='#bba282';ctx.fill();
 ellipse(ctx,361,180,52,77,'#b8a081',-.04);
 ellipse(ctx,359,189,38,57,'#c3aa88');
 // One dark mouth; the face remains eyeless.
 ellipse(ctx,364,232,19,9,'#4d3530');
 // One long hand reaches toward a child; long claws frame the story.
 ctx.beginPath();ctx.moveTo(308,322);
 ctx.bezierCurveTo(242,332,230,395,176,386);
 ctx.quadraticCurveTo(157,385,152,373);
 stroke(ctx,'#bda583',21);ctx.stroke();
 for(let k=0;k<4;k++){
  ctx.beginPath();ctx.moveTo(157+k*4,377);
  ctx.quadraticCurveTo(120-k*7,351+k*17,107-k*5,372+k*15);
  stroke(ctx,'#c5af8b',7);ctx.stroke();
 }
 ctx.beginPath();ctx.moveTo(422,299);
 ctx.bezierCurveTo(478,290,515,322,527,361);
 stroke(ctx,'#b49b79',20);ctx.stroke();
 for(let k=0;k<4;k++){
  ctx.beginPath();ctx.moveTo(527,359);
  ctx.lineTo(525+k*10,395+k*10);
  stroke(ctx,'#c5ad86',5);ctx.stroke();
 }
 // The eye plate at the bottom, echoing the creature's disturbing identity.
 ellipse(ctx,366,491,91,18,'#6d4b3c');
 ellipse(ctx,366,488,75,11,'#c0a77c');
 ellipse(ctx,346,487,13,9,'#413b35');
 ellipse(ctx,386,487,13,9,'#413b35');
 ctx.restore();
}
export function paintFrescoCanvas(index=0){
 if(typeof document==='undefined')throw new Error('Fresco canvas requires a browser');
 const canvas=document.createElement('canvas');canvas.width=720;canvas.height=660;
 const c=canvas.getContext('2d',{alpha:false});
 const g=c.createLinearGradient(0,0,720,660);
 g.addColorStop(0,'#92745d');g.addColorStop(.45,'#745847');g.addColorStop(1,'#483f3c');
 c.fillStyle=g;c.fillRect(0,0,720,660);
 // Old plaster, an elliptical narrative field with a soot-darkened surround.
 c.beginPath();c.ellipse(360,323,306,279,0,0,Math.PI*2);
 c.fillStyle='#3c3c3d';c.fill();
 c.beginPath();c.ellipse(360,322,287,263,0,0,Math.PI*2);
 const bg=c.createLinearGradient(90,100,570,530);
 bg.addColorStop(0,'#697577');bg.addColorStop(.56,'#68706c');bg.addColorStop(1,'#5a5550');
 c.fillStyle=bg;c.fill();
 stroke(c,'#c7a27d',8);c.beginPath();c.ellipse(360,322,303,274,0,0,Math.PI*2);c.stroke();
 stroke(c,'rgba(44,35,31,.55)',4);c.beginPath();c.ellipse(360,322,274,251,0,0,Math.PI*2);c.stroke();
 // Ancient colonnade silhouettes form a readable architectural depth.
 for(let i=0;i<5;i++){
  const x=121+i*120;
  c.fillStyle='rgba(49,45,43,.28)';c.fillRect(x,185,17,312);
  c.beginPath();c.moveTo(x-22,196);c.lineTo(x+9,150);
  c.lineTo(x+39,196);stroke(c,'rgba(192,156,120,.28)',8);c.stroke();
 }
 // Fresco frieze and small watching figures (no graphic violence).
 for(let i=0;i<8;i++){
  const x=166+i*55;
  ellipse(c,x,104,8,7,'#aa8664');
  c.fillStyle='#9b7760';c.fillRect(x-5,113,10,12);
 }
 child(c,index===0?187:530,index===0?376:382,index===0?.92:.80);
 if(index===1)child(c,220,416,.62);
 paintGiant(c,index);
 // Frayed perimeter and spare ritual marks.
 for(const x of [87,634]){
  fillPath(c,'#b9976e',[[x,45],[x-16,91],[x+16,91]]);
  fillPath(c,'#8c654f',[[x,574],[x-16,613],[x+16,613]]);
 }
 c.save();c.globalCompositeOperation='multiply';
 const rand=prng(1049+index*993);
 // Faint pigment loss; no glitter or chaotic texture.
 for(let i=0;i<1100;i++){
  const x=rand()*720,y=rand()*660,r=.5+rand()*2.6;
  ellipse(c,x,y,r,r*.64,rand()>.5?'rgba(66,55,47,.20)':'rgba(218,202,171,.19)');
 }
 c.restore();
 // Hairline cracks over the ochre paint.
 for(let i=0;i<28;i++){
  const x=rand()*720,y=rand()*660;
  c.beginPath();c.moveTo(x,y);
  c.lineTo(x+7+rand()*17,y+14+rand()*14);
  c.lineTo(x+12+rand()*27,y+18+rand()*29);
  stroke(c,'rgba(39,34,34,.19)',1.25);c.stroke();
 }
 // Narrow ochre border, weathered without vintage-yellow paper aesthetics.
 c.strokeStyle='#a68b6c';c.lineWidth=6;c.strokeRect(14,14,692,632);
 c.strokeStyle='#4c4039';c.lineWidth=8;c.strokeRect(26,26,668,608);
 return canvas;
}
function block(parent,color,x,y,z,w,h,d){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
  new THREE.MeshLambertMaterial({color,flatShading:true}));
 m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
export function createFrescoes(scene){
 const root=new THREE.Group();scene.add(root);
 const targets=[],items=[];
 FRESCO_POINTS.forEach((entry,index)=>{
  const x=entry.x,y=2.32,back=-4.40;
  const group=new THREE.Group();root.add(group);
  block(group,0x403c36,x,y,back,2.12,2.06,.12);
  block(group,0x8c7861,x,y,-4.318,2.06,2.01,.045);
  const canvas=paintFrescoCanvas(index);
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.magFilter=THREE.NearestFilter;map.minFilter=THREE.LinearMipmapLinearFilter;
  const painting=new THREE.Mesh(new THREE.PlaneGeometry(1.93,1.86),
   new THREE.MeshLambertMaterial({map,side:THREE.FrontSide}));
  painting.position.set(x,y,-4.275);
  painting.userData={kind:'fresco',frescoIndex:index};
  group.add(painting);targets.push(painting);
  for(const dx of [-1.035,1.035]){
   block(group,0x716351,x+dx,y,-4.267,.10,2.10,.10);
   block(group,0x9d8972,x+dx,y,-4.205,.028,2.07,.017);
  }
  for(const dy of [-1.0,1.0]){
   block(group,0x716351,x,y+dy,-4.267,2.12,.10,.10);
   block(group,0xb09a7b,x,y+dy,-4.208,2.00,.024,.018);
  }
  // The fresco is a wall decal; nothing extends into the avatar path.
  items.push({index,point:entry,painting,canvas,group,...FRESCO_CAPTIONS[index]});
 });
 return {root,targets,items};
}
