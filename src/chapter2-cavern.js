import * as THREE from 'three';
import {NODES,EDGES,STONE_NODES} from './chapter2-logic.js';

// Organic, fully modelled under-tree cave. No opaque rectangular stage,
// shallow fake backdrop, or top slab occluding the avatar.
const SOIL=[0x333c35,0x41483b,0x4a5140,0x56604a,0x38443c];
const ROCK=[0x4f5e54,0x69766a,0x7a8174,0x46564f,0x879184];
const ROOT=[0x292f2b,0x353b32,0x4b493b,0x5b5544];
const MOSS=[0x44624d,0x58715b,0x6a815c];
const allMats=new Map();
const mat=(c,options={})=>new THREE.MeshLambertMaterial({color:c,flatShading:true,...options});
const random=n=>{const s=Math.sin(n*31.778+74.221)*13475.312;return s-Math.floor(s);};
function m(c){if(!allMats.has(c))allMats.set(c,mat(c,{side:THREE.DoubleSide}));return allMats.get(c);}
const cube=new THREE.BoxGeometry(1,1,1);
function rock(parent,x,y,z,r,color=ROCK[0]){
 const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(1,0),m(color));
 mesh.position.set(x,y,z);mesh.scale.set(r, r*(.45+random(x*19+z)*.6),r*(.65+random(x*12+z)*.55));
 mesh.rotation.set(.06*random(z*11),random(x*9+z*17)*6.28,.05);
 mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function branch(parent,from,to,r,color=ROOT[0],seg=6){
 const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),d=b.clone().sub(a);
 const obj=new THREE.Mesh(new THREE.CylinderGeometry(r*.65,r,d.length(),seg),m(color));
 obj.position.copy(a).add(b).multiplyScalar(.5);
 obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
 obj.castShadow=true;obj.receiveShadow=true;parent.add(obj);
 return obj;
}
function chain(parent,points,radii,color=ROOT[0]){
 points.slice(1).forEach((p,i)=>branch(parent,points[i],p,radii[i],color,7));
}
function glow(parent,x,y,z,color,r=.14,power=.5){
 const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),
  new THREE.MeshBasicMaterial({color,depthWrite:false}));
 orb.position.set(x,y,z);parent.add(orb);
 const light=new THREE.PointLight(color,power,3.7,2);light.position.copy(orb.position);parent.add(light);
 return orb;
}
function mushroom(parent,x,z,s,color){
 const y=-2.75;
 branch(parent,[x,y,z],[x,y+.20*s,z],.042*s,0xa8a895,5);
 const cap=new THREE.Mesh(new THREE.ConeGeometry(.18*s,.17*s,6),m(color));
 cap.rotation.z=Math.PI;cap.position.set(x,y+.25*s,z);parent.add(cap);
}
function crust(parent){
 // Each real path is a jagged, thick dirt-and-rock trench. Side branches are
 // visible, including the amber grotto on the *near* side of the boss junction.
 const positions=[],colors=[],c=new THREE.Color();
 function tri(a,b,d,color){
  c.setHex(color);
  for(const v of [a,b,d]){positions.push(...v);colors.push(c.r,c.g,c.b);}
 }
 function quad(a,b,d,e,top,side){
  tri(a,b,d,top);tri(a,d,e,top);
  if(side){} // side walls are authored explicitly below
 }
 for(const [a,b] of EDGES){
  const A=NODES[a],B=NODES[b];
  const dx=B.x-A.x,dz=B.z-A.z,length=Math.hypot(dx,dz);
  const nx=-dz/length,nz=dx/length;
  const steps=Math.max(6,Math.ceil(length*3));
  for(let i=0;i<steps;i++){
   const rails=t=>{
    const x=A.x+dx*t,z=A.z+dz*t;
    const wobble=.10*Math.sin(t*18+a*3.4+b);
    const w=1.02+.17*Math.sin(t*11.1+b*2.4)+wobble;
    const y=-2.91 +.035*Math.sin(t*21+a*3);
    return {
     l:[x+nx*w,y,z+nz*w],r:[x-nx*w,y,z-nz*w],
     bl:[x+nx*(w+.13),-4.13-.09*Math.sin(t*10),z+nz*(w+.13)],
     br:[x-nx*(w+.13),-4.13-.09*Math.cos(t*7),z-nz*(w+.13)]
    };
   };
   const q=rails(i/steps),u=rails((i+1)/steps);
   quad(q.l,q.r,u.r,u.l,SOIL[(a+i)%SOIL.length]);
   quad(q.l,u.l,u.bl,q.bl,ROCK[(a+i)%ROCK.length]);
   quad(q.r,q.br,u.br,u.r,ROCK[(b+i)%ROCK.length]);
  }
 }
 // Round out nodes with irregular shallow rooms instead of square floor cells.
 for(let n=0;n<NODES.length;n++){
  const node=NODES[n],r=n===10?2.15:STONE_NODES.includes(n)?1.65:1.32;
  const N=13,center=[node.x,-2.91,node.z];
  for(let i=0;i<N;i++){
   const v=j=>{
    const a=j/N*Math.PI*2,rad=r*(.89+.12*Math.sin(j*3.5+n*2.1));
    return [node.x+rad*Math.cos(a),-2.93+.03*Math.cos(a*3),node.z+rad*Math.sin(a)];
   };
   tri(center,v(i),v((i+1)%N),SOIL[(n+i)%SOIL.length]);
   const A=v(i),B=v((i+1)%N);
   const da=[A[0]*1.01,-4.16,A[2]*1.01],db=[B[0]*1.01,-4.16,B[2]*1.01];
   quad(A,da,db,B,ROCK[(n+i)%ROCK.length]);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({
  vertexColors:true,flatShading:true,side:THREE.DoubleSide
 }));
 mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function backWall(parent){
 // Broken rear cavern boundary with gaps and overhangs; open on the camera
 // side so the playable routes and Ofelia are never behind an air wall.
 const pieces=21;
 for(let i=0;i<pieces;i++){
  const x=-10.2+i*1.01,z=-2.65-.3*Math.sin(i*1.9);
  const r=.6+random(i*7)*.53;
  const base=rock(parent,x,-3.38,z,r,ROCK[i%ROCK.length]);
  base.scale.y=1.0+random(i*3)*.75;
  if(i%2===0){
   rock(parent,x+.16,-2.32,z-.2,.55,ROCK[(i+2)%ROCK.length]).scale.set(.75,1.15,.85);
   chain(parent,[[x,-1.8,z-.45],[x+.27,-1.13,z+.12],[x+.5,-.87,z+.6]],
     [.14,.08],ROOT[(i+1)%4]);
  }
 }
 for(let i=0;i<9;i++){
  const x=-8.9+i*2.18;
  chain(parent,[[x,-1.15,-3.2],[x+.58,-.77,-2.5],[x+.92,-.88,-1.8]],
    [.22,.10],ROOT[i%ROOT.length]);
  for(let j=0;j<2;j++){
   const s=.44+random(i+j*8)*.32;
   rock(parent,x+j*.3,-2.68,-2.82,s,ROCK[(i+j)%ROCK.length]);
  }
 }
}
function rootCanopy(parent){
 // Interlaced roots form overhead arches at strategic landmarks rather than
 // an unconvincing 'tent' of sticks lying on the walkable floor.
 const ribs=[
  [[-9,-1.8,-1.7],[-8.6,-.37,-1.12],[-7.8,.20,.17],[-7.1,-.25,2.5]],
  [[-5.4,-1.65,-2.6],[-4.8,-.3,-1.75],[-3.45,.10,.00],[-3.6,-.7,2.3]],
  [[-2.4,-1.55,-2.5],[-2.05,-.54,-1.3],[-1.2,.18,.6],[-.3,-.85,2.6]],
  [[1.45,-1.7,-2.7],[.85,-.37,-1.7],[1.6,.12,.08],[2.7,-1.2,2.7]],
  [[3.9,-1.65,-2.7],[4.75,-.34,-1.83],[5.5,.01,.0],[4.9,-.8,3.9]],
  [[7,-1.7,-2.5],[7.8,-.5,-1.3],[8.4,.15,.4],[8.95,-.85,2.7]]
 ];
 ribs.forEach((rib,i)=>{
  chain(parent,rib,[.40,.28,.18],ROOT[i%ROOT.length]);
  branch(parent,rib[1],[rib[1][0]+(i%2?-.8:.7),-.6,rib[1][2]+.8],.09,ROOT[(i+2)%ROOT.length],5);
 });
 // Twisting roots descending from the ceiling, shorter than the avatar.
 for(let i=0;i<14;i++){
  const x=-8+i*1.24,z=-2.15;
  chain(parent,[[x,-.65,z],[x+.18,-1.16,z+.14],[x+.36,-1.35,z+.33]],
    [.11,.055],ROOT[i%ROOT.length]);
 }
}
function fungusAndStones(parent){
 for(let i=0;i<118;i++){
  const edge=EDGES[Math.floor(random(i*9+1)*EDGES.length)];
  const a=NODES[edge[0]],b=NODES[edge[1]],t=random(i*13+7);
  const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
  const d=Math.hypot(b.x-a.x,b.z-a.z),nx=-(b.z-a.z)/d,nz=(b.x-a.x)/d;
  const side=i%2?-1:1,off=1.06+random(i*4+3)*.42;
  const cx=x+nx*off*side,cz=z+nz*off*side;
  if(i%7===0){
   mushroom(parent,cx,cz,.75+random(i)*.8,i%3?0x8da994:0x869c7c);
  }else if(i%4===0){
   rock(parent,cx,-2.69,cz,.18+random(i*2)*.26,ROCK[i%ROCK.length]);
  }else if(i%5===0){
   branch(parent,[cx,-2.78,cz],[cx+.24,-2.52,cz+.13],.032,MOSS[i%MOSS.length],4);
  }else{
   const pebble=rock(parent,cx,-2.82,cz,.08+random(i)*.17,ROCK[(i+2)%ROCK.length]);
   pebble.scale.y*=.45;
  }
 }
 const seats=[[-4,-1],[2,-1],[4,3]];
 seats.forEach(([x,z],i)=>{
  // Every collectible has a distinct alcove, floor runes and back stones.
  for(let k=0;k<9;k++){
   const a=k/9*Math.PI*2,r=1.0+(k%3)*.14;
   rock(parent,x+Math.cos(a)*r,-2.68,z+Math.sin(a)*r,
    .18+random(k*4+i)*.17,ROCK[(k+i)%ROCK.length]);
  }
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.72,.045,5,30),
    new THREE.MeshBasicMaterial({color:[0x9ecbaa,0xb5a5e5,0xecca7c][i]}));
  ring.rotation.x=-Math.PI/2;ring.position.set(x,-2.77,z);parent.add(ring);
 });
 // Amber route marked by a golden spine leading forward from node #8 to #11.
 for(let k=0;k<6;k++){
  const z=1.36+k*.30,x=4+.065*Math.sin(k*1.7);
  const pebble=rock(parent,x,-2.73,z,.12,k%2?0xdbb96c:0xf6d88a);
  pebble.material=new THREE.MeshBasicMaterial({color:k%2?0xe4bc66:0xf4d58c});
 }
 // Recognizable stone cairn in the amber grotto.
 for(let k=0;k<3;k++)rock(parent,5.14,-2.76+k*.36,3.35,.52-k*.10,ROCK[(k+1)%ROCK.length]);
 const rootGuide=new THREE.Mesh(new THREE.TorusGeometry(.29,.035,6,20),
  new THREE.MeshBasicMaterial({color:0xf1c46d}));
 rootGuide.rotation.x=-Math.PI/2;rootGuide.position.set(4,-2.68,2.18);parent.add(rootGuide);
 for(const [x,z,shade] of [[-6,1.9,0x80b5a1],[-2.0,-.55,0x9bb1a7],[3.2,3.6,0xe8c482],[8.8,2.4,0xa2bd85]]){
  glow(parent,x,-2.43,z,shade,.105,.55);
 }
}
export function createCavern(parent){
 crust(parent);
 backWall(parent);
 rootCanopy(parent);
 fungusAndStones(parent);
 // Keep the original logical grid as the single source of path/collision truth.
 return {amberPosition:new THREE.Vector3(NODES[11].x,-1.60,NODES[11].z)};
}
