import * as THREE from 'three';
import {CORRIDOR} from './chapter3-logic.js';
// Additional geometry for Chapter III's long chase, using real meshes only.
const sharedBox=new THREE.BoxGeometry(1,1,1);
const MAT=new Map();
function mat(c){if(!MAT.has(c))MAT.set(c,new THREE.MeshLambertMaterial({color:c,flatShading:true}));return MAT.get(c);}
const rand=n=>{const v=Math.sin(n*127.17+42.7)*48715.2;return v-Math.floor(v);}
function cube(group,c,x,y,z,w,h,d){
 const m=new THREE.Mesh(sharedBox,mat(c));m.position.set(x,y,z);m.scale.set(w,h,d);
 m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
}
function stone(group,c,x,y,z,sx,sy,sz){
 const m=new THREE.Mesh(new THREE.IcosahedronGeometry(1,0),mat(c));m.position.set(x,y,z);
 m.scale.set(sx,sy,sz);m.castShadow=true;group.add(m);return m;
}
function stick(group,c,a,b,r=.13){
 const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),length=start.distanceTo(end);
 const m=new THREE.Mesh(new THREE.CylinderGeometry(r*.82,r,length,6),mat(c));
 m.position.copy(start).add(end).multiplyScalar(.5);
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());
 m.castShadow=true;group.add(m);return m;
}
function disk(group,c,x,y,z,r=.35,h=.08){
 const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10),mat(c));
 m.position.set(x,y,z);m.castShadow=true;group.add(m);return m;
}
export function createProcessionalPassage(scene){
 const section=new THREE.Group();scene.add(section);
 const length=CORRIDOR.maxX-CORRIDOR.minX,center=(CORRIDOR.maxX+CORRIDOR.minX)/2;
 // Slab is cut into aged stone strata with open front and roof, not a flat
 // full-screen room. White outside preserves the miniature diorama language.
 cube(section,0x282c2a,center,-1.04,0,length+.65,1.22,4.56);
 cube(section,0x4b5047,center,-.42,0,length+.58,.16,4.45);
 for(let i=0;i<48;i++){
  const x=CORRIDOR.minX+.30+i*.53;
  for(let j=0;j<5;j++){
   const z=-1.44+j*.71;
   cube(section,[0x716d61,0x575f56,0x777368,0x616459,0x898172][(i+j*3)%5],
     x,-.297+Math.sin(i+j)*.012,z,.51,.095,.67);
   if(rand(i*29+j*13)>.76)
    cube(section,0x948e7b,x+.12,-.232,z+.10,.15,.01,.20);
  }
 }
 // Six shallow crosswise risers make the descending visual path readable, but
 // remain below the character feet and don't form an invisible obstacle.
 for(let k=0;k<6;k++)
  cube(section,0x97907b,-26+k*1.24,-.196,0,.20,.055,3.18);
 // Ancient masonry along the rear. Only broken waist-high buttresses at front
 // to prevent camera occlusion and keep the running character in full view.
 cube(section,0x41443d,center,1.67,-2.04,length+.7,4.32,.55);
 cube(section,0x767367,center,3.92,-2.0,length+.7,.19,.65);
 const arches=[];
 for(let i=0;i<8;i++){
  const x=-31.4+i*3.12;
  cube(section,0x64665c,x,1.68,-1.78,.61,3.58,.71);
  cube(section,0x9a9080,x,3.51,-1.75,.84,.20,.81);
  for(const side of [-1,1]){
   const z=1.76*side;
   stick(section,0x6e7268,[x,.10,z],[x,2.50,z*.78],.16);
   stick(section,0x949083,[x,2.50,z*.78],[x,3.66,0],.125);
  }
  for(const pair of [
   [[x+.16,3.31,-1.7],[x+1.57,4.06,-1.6]],
   [[x+1.57,4.06,-1.6],[x+2.9,3.31,-1.7]]
  ])stick(section,0x938a7d,...pair,.12);
  const niche=cube(section,0x262725,x+1.13,1.89,-1.71,1.15,1.49,.07);
  if(i%2===0){
   disk(section,0x9d825e,x+1.13,2.02,-1.60,.29,.06).rotation.x=Math.PI/2;
   stone(section,0x443c32,x+1.13,2.02,-1.54,.14,.25,.08);
  }
  const flame=stone(section,0xdbaa69,x+1.2,2.42,-1.5,.085,.19,.07);
  cube(section,0x86694d,x+1.2,2.11,-1.51,.37,.12,.28);
  if(i%2===0){
   const light=new THREE.PointLight(0xf5ac65,.45,4.3,2);
   light.position.set(x+1.2,2.46,-1.3);section.add(light);
  }
  arches.push(x);
  cube(section,0x494e45,x,.24,2.04,.64,1.05,.56);
  cube(section,0x817b70,x,.78,2.04,.78,.18,.73);
 }
 // Massive gateway separates the very long passage from the food chamber.
 for(const z of [-2.30,2.30]){
  cube(section,0x59594f,-8.62,1.65,z,.87,3.70,.76);
  cube(section,0x80786b,-8.62,3.48,z,.99,.25,.84);
 }
 stick(section,0x938576,[-8.62,3.38,-2.30],[-8.62,4.40,0],.19);
 stick(section,0x938576,[-8.62,4.40,0],[-8.62,3.38,2.30],.19);
 // Distinct hourglass set into an illuminated wall niche at the exit.
 const hourglass=new THREE.Group();hourglass.position.set(-29.8,.54,-1.12);section.add(hourglass);
 for(const y of [-.33,.58])disk(hourglass,0xbba171,0,y,0,.34,.11);
 for(const x of [-.24,.24])for(const z of [-.21,.21])
  stick(hourglass,0x886b47,[x,-.31,z],[x,.61,z],.045);
 const glassMat=new THREE.MeshLambertMaterial({color:0xc6c7b5,transparent:true,opacity:.44});
 const upper=new THREE.Mesh(new THREE.ConeGeometry(.26,.52,9),glassMat);
 upper.position.y=.27;upper.rotation.z=Math.PI;hourglass.add(upper);
 const lower=new THREE.Mesh(new THREE.ConeGeometry(.26,.52,9),glassMat);
 lower.position.y=-.06;hourglass.add(lower);
 stone(hourglass,0xe2ce8c,0,-.20,0,.18,.09,.17);
 // A few broken stones and dead tendrils establish scale along the route.
 for(let i=0;i<34;i++){
  const x=-31.0+i*.65,z=i%2?1.56:-1.60;
  stone(section,i%3===0?0x4c544a:0x696d61,x,-.08,z,
   .13+rand(i)*.12,.1+rand(i+9)*.10,.16+rand(i+5)*.12);
  if(i%5===0){
   stick(section,0x494638,[x,.03,z],[x+.32,.48,z*.9],.045);
  }
 }
 return {section,hourglass,arches};
}
export function enrichForbiddenFeast(scene){
 const props=new THREE.Group();scene.add(props);
 // Dense, volumetric food layered over the actual tabletop. Not additional
 // invisible collision meshes; these are decorative above the table.
 const foods=[0x8b3f47,0xb56348,0xd9b16c,0x805a3d,0x5d7448,0x9b6743,0xd4c597];
 for(let i=0;i<100;i++){
  const x=-3.78+rand(i*7)*8.38,z=-.97+rand(i*29+2)*1.88;
  const sy=.08+rand(i*41)*.12;
  stone(props,foods[i%foods.length],x,1.82+rand(i*13)*.28,z,
    .095+rand(i+3)*.12,sy,.09+rand(i*9)*.13);
 }
 for(const x of [-2.88,.52,3.42]){
  disk(props,0xb8a78a,x,1.69,0,.70,.10);
  for(let j=0;j<3;j++){
   const y=1.88+j*.25,r=.48-j*.08;
   disk(props,0x93765f,x,y,0,r,.10);
   for(let k=0;k<7-j;k++){
    const a=k*Math.PI*2/(7-j);
    stone(props,k%2===0?0xa4414c:0xe0b46d,
     x+Math.cos(a)*r*.76,y+.15,Math.sin(a)*r*.76,.15,.17,.14);
   }
  }
 }
 // Oppressive ceremonial frescoes plus piles of tiny discarded shoes.
 for(const x of [-4.48,3.56]){
  cube(props,0x6a413b,x,2.35,-4.27,2.12,2.18,.13);
  cube(props,0x332c28,x,2.35,-4.18,1.84,1.92,.09);
  for(let i=0;i<9;i++){
   const px=x-.61+(i%3)*.63,py=1.74+Math.floor(i/3)*.58;
   stone(props,i%2?0x785045:0x8b604d,px,py,-4.08,.23,.25,.06);
  }
 }
 for(let i=0;i<32;i++){
  const x=5.36+rand(i*4)*2.4,z=-3.58+rand(i*11)*.77,y=.02+Math.floor(i/11)*.13;
  const shoe=cube(props,[0x49312c,0x322e2b,0x795b47][i%3],
   x,y,z,.25,.16,.37);
  shoe.rotation.y=rand(i*13)*Math.PI*2;
 }
 // Small dagger in a niche for film fidelity; not a mandatory fetch quest.
 cube(props,0x72675b,-6.17,.45,-3.84,1.02,.69,.70);
 stick(props,0xb6bdba,[-6.16,.71,-3.84],[-6.16,1.37,-3.84],.065);
 cube(props,0xad8b63,-6.16,.74,-3.84,.34,.085,.16);
 return props;
}
