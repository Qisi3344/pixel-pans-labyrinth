import * as THREE from 'three';
import {CELL} from './maze.js';
import {FINAL_MAZE_WALLS,FINAL_MAZE_FLOORS,FINAL_WELL_CENTER} from './chapter4-maze-layout.js';

// Chapter I's stone/moss/ivy palette and block scale. This is a genuine
// central crop of generateMaze(132): no invisible ornamental wall shortcuts.
const ROCK=[0x55615d,0x65726a,0x78857b,0x47524f,0x5d685f];
const FLOOR=[0x2e3936,0x3b4945,0x36413d,0x43514b,0x32413c];
const MOSS=[0x39594d,0x48674f,0x62785b,0x314b43];
const mat=color=>new THREE.MeshLambertMaterial({color,flatShading:true});
const hash=(x,z,s=0)=>{
 const n=Math.sin(x*127.1+z*311.7+s*93.1)*43758.5453;
 return n-Math.floor(n);
};
const block=(parent,color,x,y,z,w,h,d)=>{
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));
 m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
};
function stem(parent,color,x,y,z,height=.4){
 const m=new THREE.Mesh(new THREE.ConeGeometry(height*.25,height,3),mat(color));
 m.position.set(x,y+height*.45,z);m.castShadow=true;parent.add(m);
 return m;
}
function ivy(parent,x,z,h,seed){
 let px=x+CELL*.37,pz=z+CELL*.495;
 const leafy=[0x344b3b,0x476447,0x5c7451];
 for(let k=0;k<4;k++){
  const yy=h-.12-k*.19,xi=px+Math.sin(seed+k*2.1)*.09;
  const leaf=new THREE.Mesh(new THREE.TetrahedronGeometry(.13,0),mat(leafy[k%3]));
  leaf.position.set(xi,yy,pz+.024);leaf.rotation.set(.3,k*.45,.4);
  leaf.scale.set(1.3,.6,1);parent.add(leaf);
  if(k>0){
   const from=new THREE.Vector3(px,h-.12-(k-1)*.19,pz);
   const to=new THREE.Vector3(xi,yy,pz);
   const line=to.clone().sub(from);
   const v=new THREE.Mesh(new THREE.CylinderGeometry(.025,.026,line.length(),5),mat(0x38513d));
   v.position.copy(from).add(to).multiplyScalar(.5);
   v.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),line.normalize());
   parent.add(v);
  }
  px=xi;
 }
}
function fern(parent,x,z,s,scale=1){
 for(let k=0;k<4;k++){
  const a=k*Math.PI*.5+s*1.2;
  const leaf=stem(parent,k%2?0x506849:0x657c52,x+Math.cos(a)*.12,
   .08,z+Math.sin(a)*.12,.34*scale);
  leaf.rotation.z=Math.cos(a)*.4;leaf.rotation.x=-Math.sin(a)*.4;
 }
}
export function buildFirstMazeCenterFragment(root){
 const fragment=new THREE.Group();root.add(fragment);
 for(const cell of FINAL_MAZE_WALLS){
  const {x,z,gridX,gridZ}=cell,seed=hash(gridX,gridZ);
  const height=.82+seed*.43,stoneColor=ROCK[Math.floor(seed*ROCK.length)];
  block(fragment,stoneColor,x,height/2-.07,z,CELL*.985,height,CELL*.985);
  if(hash(gridZ,gridX,7)>.35)
   block(fragment,0x879389,x,height-.052,z,CELL*1.002,.10,CELL*1.002);
  if(hash(gridX,gridZ,54)>.59)
   block(fragment,0x344b40,x+CELL*.22,height+.015,z-CELL*.22,.32,.05,.28);
  if(seed>.62)ivy(fragment,x,z,height,gridX*37+gridZ*107);
  if(seed>.75)fern(fragment,x+.37,z-.30,seed,.65);
  // Scrubby hedge leaves above/between actual maze wall stones.
  if(hash(gridX,gridZ,27)>.32){
   const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.34+seed*.11,0),
    mat(MOSS[Math.floor(seed*MOSS.length)]));
   crown.position.set(x+.13,height+.18,z-.09);
   crown.scale.set(1.30,.58,.97);crown.castShadow=true;
   fragment.add(crown);
  }
 }
 for(const cell of FINAL_MAZE_FLOORS){
  const {x,z,gridX,gridZ}=cell;
  const rr=Math.hypot(x-FINAL_WELL_CENTER.x,z-FINAL_WELL_CENTER.z);
  // Don't lay rectangular paving over the actual black spiral well opening.
  if(rr<3.32)continue;
  const seed=hash(gridX,gridZ);
  block(fragment,FLOOR[Math.floor(seed*FLOOR.length)],
   x,-.047,z,CELL*.963,.19,CELL*.963);
  if(seed>.76&&rr>4.8){
   const gx=x+(seed-.5)*.50,gz=z+(hash(gridZ,gridX)-.5)*.49;
   fern(fragment,gx,gz,seed,.70);
  }
  if(hash(gridX,gridZ,55)>.91)
   block(fragment,0x8da399,x-.29,.067,z+.27,.22,.036,.06);
 }
 // Raised, weathered circular broken stone boundary as in Chapter I.
 for(let i=0;i<44;i++){
  const a=i/44*Math.PI*2;
  const rr=11.65+hash(i,18)*.35;
  const x=Math.cos(a)*rr,z=Math.sin(a)*rr;
  // Entrance cut-out near the direction of the incoming heroine.
  if(Math.hypot(x+9.65,z-7.2)<4.1)continue;
  const rock=block(fragment,ROCK[i%ROCK.length],x,.19,z,.47,.43,.72);
  rock.rotation.y=-a;
  if(i%3===0)fern(fragment,x*.94,z*.94,i,.8);
 }
 return {root:fragment,wallCount:FINAL_MAZE_WALLS.length,
  floorCount:FINAL_MAZE_FLOORS.length};
}
