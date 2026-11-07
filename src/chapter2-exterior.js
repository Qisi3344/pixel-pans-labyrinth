import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// CHAPTER II · A real forest-floor diorama. No image planes or foliage balls.
// Everything here is geometry: irregular soil strata, moss, roots, bark,
// fallen wood, loose stones, ferns and an actually hollow-looking tree mouth.
const BARK=[0x292f2c,0x343a35,0x414943,0x4d544b,0x5c6054];
const EARTH=[0x373e36,0x465043,0x526050,0x596452,0x3c493c];
const MOSS=[0x526b4e,0x617759,0x435c48,0x738266];
const STONE=[0x5e6b61,0x7b8478,0x4d5b55,0x929688];
const cube=new THREE.BoxGeometry(1,1,1);
const materials=new Map();
function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshLambertMaterial({color,flatShading:true,side:THREE.DoubleSide}));return materials.get(color);}
function random(n){const x=Math.sin(n*127.1+48.31)*43758.5453;return x-Math.floor(x);}
function h(x,z){
 const m=Math.exp(-((x+1.0)**2+(z+.5)**2)/28);
 return .05 + .20*Math.sin(x*.57+z*.18)+.16*Math.cos(z*.63-x*.16)+.35*m +
   .08*Math.sin(x*1.66)*Math.cos(z*1.32);
}
function box(parent,color,p,size,rot=0){
 const mesh=new THREE.Mesh(cube,material(color));mesh.position.set(...p);mesh.scale.set(...size);
 mesh.rotation.y=rot;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function shard(parent,color,p,s,detail=0){
 const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(1,detail),material(color));
 mesh.position.set(...p);mesh.scale.set(...s);mesh.rotation.y=random(p[0]*17+p[2]*8)*6.28;
 mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function twig(parent,a,b,r1,r2,color,segments=7){
 const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);
 const delta=end.clone().sub(start);
 const obj=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,delta.length(),segments,1),material(color));
 obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
 obj.position.copy(start.add(end).multiplyScalar(.5));obj.castShadow=true;obj.receiveShadow=true;parent.add(obj);
 return obj;
}
function bent(parent,points,radii,colors){
 for(let i=0;i<points.length-1;i++)twig(parent,points[i],points[i+1],radii[i],radii[i+1],colors[i%colors.length],8);
}
function surface(parent){
 const N=64,R=8;
 const positions=[],colors=[];
 const c=new THREE.Color();
 const add=(a,b,d,color)=>{
  for(const v of [a,b,d])positions.push(...v);
  c.setHex(color);for(let k=0;k<3;k++)colors.push(c.r,c.g,c.b);
 };
 function ring(i,j){
  const a=j/N*2*Math.PI;
  const r=i/R;
  const wobble=1+.055*Math.sin(a*5+.5)+.035*Math.sin(a*11+.7)+.035*Math.cos(a*17);
  const x=Math.cos(a)*9.65*r*wobble,z=Math.sin(a)*7.05*r*wobble;
  return [x,h(x,z)*(1-.13*r)+.03,z];
 }
 for(let i=0;i<R;i++)for(let j=0;j<N;j++){
  const a=ring(i,j),b=ring(i+1,j),c=ring(i+1,(j+1)%N),d=ring(i,(j+1)%N);
  add(a,b,c,EARTH[Math.floor(random(j*11+i*41)*EARTH.length)]);
  add(a,c,d,EARTH[Math.floor(random(j*13+i*19+2)*EARTH.length)]);
 }
 // A cutaway cross-section with a *ragged* footprint, not a rectangular box.
 for(let j=0;j<N;j++){
  const a=ring(R,j),b=ring(R,(j+1)%N);
  const lip=[a[0]*1.015,-.40,a[2]*1.015],below=[a[0]*1.028,-1.35-random(j)*.35,a[2]*1.028];
  const lipB=[b[0]*1.015,-.4,b[2]*1.015],belowB=[b[0]*1.028,-1.35-random((j+1)%N)*.35,b[2]*1.028];
  const soil=EARTH[j%EARTH.length],rock=BARK[(j+2)%BARK.length];
  add(a,lip,lipB,soil);add(a,lipB,b,soil);add(lip,below,belowB,rock);add(lip,belowB,lipB,rock);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geo.computeVertexNormals();
 const mesh=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true,side:THREE.DoubleSide}));
 mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 return mesh;
}
function mossPatch(parent,x,z,s,seed){
 const y=h(x,z)+.055;
 const points=[];const N=8;
 for(let k=0;k<N;k++){
  const a=2*Math.PI*k/N,r=s*(.70+.35*random(seed+k*7));
  points.push([x+Math.cos(a)*r,y+.02*Math.sin(k*2),z+Math.sin(a)*r*.67]);
 }
 const vertices=[];
 for(let k=0;k<N;k++)vertices.push(x,y+.015,z,...points[k],...points[(k+1)%N]);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();
 const patch=new THREE.Mesh(geo,material(MOSS[seed%MOSS.length]));patch.receiveShadow=true;parent.add(patch);
}
function fern(parent,x,z,s,seed){
 const y=h(x,z)+.08;
 const center=[x,y,z];
 for(let k=0;k<5;k++){
  const a=k*2.39996+seed,dx=Math.cos(a),dz=Math.sin(a);
  const end=[x+dx*s,y+.15+s*.2,z+dz*s];
  twig(parent,center,end,.035,.009,0x465f48,4);
  for(let j=1;j<=4;j++){
   const q=j/5,at=[x+dx*s*q,y+(.15+s*.2)*q,z+dz*s*q];
   const span=.09*s*(1-q*.7), sideX=-dz,sideZ=dx;
   for(const side of [-1,1])twig(parent,at,[at[0]+side*sideX*span,at[1]+.045,at[2]+side*sideZ*span],.017,.004,MOSS[(k+j+seed)%MOSS.length],3);
  }
 }
}
function woodlandFloor(group){
 const earth=surface(group);
 // Organic earth, no big clean empty green tabletop. A walkable worn trail
 // approaches the split trunk; material patches mix soil, stones, roots and moss.
 const trail=[[-5.0,5.0],[-4.0,4.35],[-2.9,3.7],[-1.8,3.0],[-.75,2.4],[0,2.05]];
 for(let i=0;i<trail.length-1;i++){
  const a=trail[i],b=trail[i+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
  const center=[(a[0]+b[0])/2,Math.min(h(...a),h(...b))+.06,(a[1]+b[1])/2];
  box(group,i%2?0x685f4e:0x716b55,center,[len+.30,.065,1.14],-Math.atan2(dz,dx));
 }
 // Deep, projecting exterior roots with multi-section twists.
 const rootPaths=[
  [[-1.2,.35,0],[-2.4,.25,1.1],[-3.8,.24,2.65],[-5.4,.20,3.45]],
  [[-1.3,.45,.1],[-2.6,.28,-1.5],[-4.2,.27,-3.25],[-5.8,.20,-4.7]],
  [[1.1,.45,-.15],[2.85,.27,.8],[4.1,.24,2.1],[6.4,.22,2.8]],
  [[1.2,.50,-.25],[3.2,.25,-2.1],[4.3,.25,-3.7],[5.2,.19,-5.0]],
  [[-.5,.36,-1.2],[-.3,.30,-2.4],[-1.15,.27,-4.0],[-2.3,.21,-5.7]],
  [[.6,.40,-.9],[1.0,.30,-2.4],[.35,.27,-4.3],[.5,.21,-5.95]],
  [[-1.6,.40,.25],[-2.1,.26,2.3],[-3.5,.23,4.45]],
  [[1.7,.42,.2],[2.2,.29,1.85],[3.5,.23,4.45]]
 ];
 for(let i=0;i<rootPaths.length;i++){
  const path=rootPaths[i].map(([x,y,z])=>[x,h(x,z)+y,z]);
  bent(group,path,[.68,.43,.23,.075].slice(0,path.length),[BARK[i%5],BARK[(i+1)%5],BARK[(i+2)%5]]);
  for(let k=1;k<path.length-1;k++)shard(group,0x4d5947,[path[k][0]+.12,path[k][1]-.16,path[k][2]], [.44,.15,.34],0);
 }
 // Varied forest ecology with exclusions around the playable entrance and path.
 for(let i=0;i<230;i++){
  const x=(random(i*2+11)-.5)*17.3,z=(random(i*2+71)-.5)*12.3;
  if((x/9.0)**2+(z/6.5)**2>.95)continue;
  const nearTrunk=Math.hypot(x,z)<2.5;
  const nearPath=z>2&&x<1&&x>-6&&Math.abs(z-(2.05-.54*x))<.78;
  if(nearPath&&i%3!==0)continue;
  const r=.12+random(i*13)*.52;
  if(i%5===0)fern(group,x,z,.23+r*.6,i);
  else if(i%5===1)mossPatch(group,x,z,r+.15,i);
  else if(i%5===2){
   shard(group,STONE[i%STONE.length],[x,h(x,z)+.09+r*.11,z],[r,.11+r*.3,r*.7],0);
   if(i%4===2)shard(group,STONE[(i+1)%STONE.length],[x+.17,h(x+.17,z)+.08,z-.1],[r*.47,.10,r*.55]);
  }else if(i%5===3){
   // Broken twigs / litter lying with the contour, never particle confetti.
   const len=.38+random(i*19)*.9, a=random(i*17)*Math.PI*2;
   twig(group,[x,h(x,z)+.07,z],[x+Math.cos(a)*len,h(x,z)+.08,z+Math.sin(a)*len],.04,.012,BARK[i%5],5);
  }else{
   const a=random(i*19)*6.28;
   shard(group,i%3===0?0x786a50:0x565848,[x,h(x,z)+.04,z],[.16,.022,.07],0).rotation.y=a;
  }
  if(nearTrunk&&i%8===0)fern(group,x,z,.42,i+5);
 }
 // A few full-size rotting logs (not uniform decorative logs).
 for(const [x,z,angle,length] of [[-5,-2,.36,2.0],[5,4,-.7,1.4],[-3.7,-4.8,1.1,2.1]]){
  const dx=Math.cos(angle)*length*.5,dz=Math.sin(angle)*length*.5;
  const a=[x-dx,h(x-dx,z-dz)+.16,z-dz],b=[x+dx,h(x+dx,z+dz)+.15,z+dz];
  twig(group,a,b,.23,.17,0x383a34,8);
  shard(group,0x505849,[x+.35,h(x+.35,z)+.18,z],[.21,.13,.15]);
 }
 // Fungus brackets around fallen wood, scale intentionally small.
 for(let i=0;i<19;i++){
  const a=i*2.39996,rr=2.1+random(i*3)*4.8,x=Math.cos(a)*rr,z=Math.sin(a)*rr;
  if(Math.hypot(x/9.4,z/7.0)>1)continue;
  const y=h(x,z)+.08;
  const stem=twig(group,[x,y,z],[x,y+.12,z],.035,.028,0x8c8a74,5);
  const cap=shard(group,0x9f9276,[x,y+.15,z],[.15,.065,.13],0);
 }
 return earth;
}
function hollowAncientTree(group){
 const tree=new THREE.Group();tree.position.y=h(0,0);group.add(tree);
 // Two enormous split trunk lobes and torn crown; intentionally NO leaf canopy.
 // Their gap forms the actual physical entry. The black depth is behind the rim.
 const left=[[-1.4,0,-.48],[-1.48,1.5,-.44],[-1.7,3.5,-.60],[-2.1,5.2,-.79],[-2.16,6.55,-.92]];
 const right=[[1.3,0,-.35],[1.48,1.8,-.42],[1.56,3.6,-.45],[1.75,5.1,-.60],[2.0,6.05,-.6]];
 bent(tree,left,[1.55,1.29,1.06,.84,.66],[BARK[1],BARK[2],BARK[0],BARK[1]]);
 bent(tree,right,[1.6,1.3,1.02,.85,.62],[BARK[0],BARK[2],BARK[1],BARK[3]]);
 for(const [points,rad] of [
  [[[-2,4.1,-.7],[-3.8,4.8,-.55],[-5.4,5.0,-.2],[-6.9,5.65,-.25]],[.88,.62,.37,.12]],
  [[[-3.8,4.8,-.55],[-4.35,6.35,-.7],[-5.1,7.55,-1.05]],[.57,.35,.085]],
  [[[1.85,4.45,-.5],[3.6,5.0,-.45],[5.1,4.85,-.25],[6.2,5.2,.05]],[.83,.59,.34,.12]],
  [[[4.6,4.98,-.25],[5.0,6.24,-.4],[6.03,7.08,-.5]],[.44,.23,.06]],
  [[[-2.0,6.4,-.95],[-1.6,7.7,-1.2],[-1.72,8.65,-1.3]],[.6,.34,.08]],
  [[[1.98,6,-.6],[2.5,7.3,-.9],[2.2,8.1,-1.1]],[.53,.28,.09]],
  [[[2.8,5,-.4],[3.45,5.8,.3],[4.5,6.2,.9]],[.38,.20,.07]],
  [[[-4.8,5.1,-.4],[-5.7,4.7,1.0],[-6.1,4.14,1.5]],[.38,.24,.10]]
 ])bent(tree,points,rad,[BARK[2],BARK[1],BARK[0]]);
 // Large broken stubs with visible jagged end grain.
 for(const [x,y,z,size] of [[-2.12,6.62,-.92,.66],[1.98,6.14,-.59,.55],[-5.12,7.61,-1.05,.23]]){
  shard(tree,0x77776a,[x,y,z],[size,.15,size*.78],0);
 }
 // A deep, black, irregular cavity instead of a painted hole on solid wood.
 // It is recessed behind two side root buttresses, with a genuine empty arch.
 const shadow=shard(tree,0x111b19,[0,.98,-.21],[.88,1.23,.41],1);
 shadow.material=new THREE.MeshBasicMaterial({color:0x101716,side:THREE.DoubleSide});
 const inner=shard(tree,0x27312a,[0,.87,.09],[1.06,1.35,.24],1);
 inner.material=new THREE.MeshBasicMaterial({color:0x1c231f,side:THREE.DoubleSide});
 twig(tree,[-.94,.0,1.0],[-.85,1.8,.94],.50,.40,BARK[0],9);
 twig(tree,[.95,.02,1.0],[.94,1.83,.94],.49,.39,BARK[0],9);
 bent(tree,[[-.86,1.75,.95],[-.45,2.28,.91],[.30,2.43,.89],[.95,1.72,.94]],[.42,.39,.42,.44],[BARK[1],BARK[0],BARK[2]]);
 // Bark relief, hanging splinters and vertical fissures along sides.
 for(let i=0;i<63;i++){
  const a=i*2.39996,which=i%2?1:-1,yy=.35+random(i*5)*5.2;
  const radius=yy>3.8?.77:1.17;
  const x=which*1.48+Math.sin(a)*radius*.74,z=-.42+Math.cos(a)*radius*.8;
  if(Math.abs(x)<.92&&z>.15&&yy<2.65)continue; // protect the open mouth
  const len=.28+random(i*9)*1.23;
  twig(tree,[x,yy,z],[x+.035*Math.sin(a),yy+len,z+.05*Math.cos(a)],.035,.018,i%3?0x252d29:0x737669,5);
 }
 // Branches from the earth and buttresses make the root system part of tree.
 for(const [dx,dz] of [[-2.8,1.5],[3.3,1.7],[-2.5,-2.1],[2.6,-2.5],[-.5,2.1],[.8,2.2]]){
  bent(tree,[[dx*.38,.48,0],[dx*.7,.19,dz*.5],[dx,.05,dz]],[.63,.43,.19],[BARK[0],BARK[2]]);
 }
 // Hit target is physically positioned over the opening and invisible visually.
 const hit=new THREE.Mesh(new THREE.PlaneGeometry(3.25,3.2),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
 hit.position.set(0,1.5,2.15);hit.userData={kind:'entrance'};tree.add(hit);
 return {hit,entrance:{x:0,z:2.00}};
}
/** Merge only static decoration, preserving the raycastable terrain and entrance.
 * Thousands of grass/fern cylinders previously produced thousands of draw
 * calls + shadow passes on a phone, making movement appear to freeze.
 */
function batchStaticDecoration(group,protectedMeshes) {
 group.updateMatrixWorld(true);
 const buckets=new Map();
 group.traverse(mesh=>{
  if(!mesh.isMesh||protectedMeshes.has(mesh))return;
  if(!mesh.material?.isMeshLambertMaterial||mesh.material.transparent)return;
  const attrs=Object.keys(mesh.geometry.attributes).sort().map(k=>{
   const a=mesh.geometry.attributes[k];return k+':'+a.itemSize+':'+a.normalized;
  }).join(',');
  const key=mesh.material.uuid+'|'+Boolean(mesh.geometry.index)+'|'+attrs;
  let bucket=buckets.get(key);
  if(!bucket){bucket={material:mesh.material,parts:[],meshes:[]};buckets.set(key,bucket);}
  const geometry=mesh.geometry.clone();geometry.applyMatrix4(mesh.matrixWorld);
  bucket.parts.push(geometry);bucket.meshes.push(mesh);
 });
 let batches=0;
 for(const bucket of buckets.values()){
  if(bucket.parts.length<4)continue;
  const merged=mergeGeometries(bucket.parts,false);
  if(!merged){bucket.parts.forEach(p=>p.dispose());continue;}
  bucket.meshes.forEach(m=>m.parent.remove(m));
  const mesh=new THREE.Mesh(merged,bucket.material);
  mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);batches++;
  bucket.parts.forEach(p=>p.dispose());
 }
 return batches;
}
export function createExterior(scene){
 const group=new THREE.Group();scene.add(group);
 const floor=woodlandFloor(group);
 const tree=hollowAncientTree(group);
 batchStaticDecoration(group,new Set([floor,tree.hit]));
 // Start well inside the forest: walking north, south, east or west is possible.
 const spawn={x:-4.2,z:3.8};
 // A sketchbook held by the miniature character is added in the shared player rig.
 // Surface collision keeps walking above the 3D soil, not inside the rock cut.
 function walkable(x,z){
  if((x/9.1)**2+(z/6.65)**2>.89)return false;
  if(Math.abs(x)<1.65 && z<1.8 && z>-.95)return false;
  return true;
 }
 return {group,hit:tree.hit,floor,entrance:tree.entrance,spawn,height:h,walkable};
}

