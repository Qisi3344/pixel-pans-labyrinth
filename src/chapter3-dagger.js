import * as THREE from 'three';
// The golden key obtained from the tree becomes a real gameplay item here.
// Ofelia takes the ritual dagger BEFORE disobeying the no-food instruction.
export const DAGGER_POINT=Object.freeze({x:-7.52,z:-3.16});
export const DAGGER_RADIUS=1.55;
const material=(color)=>new THREE.MeshLambertMaterial({color,flatShading:true});
function block(root,color,x,y,z,w,h,d){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));
 m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);
 return m;
}
function blade(root){
 const g=new THREE.Group();root.add(g);
 const metal=material(0xb7c1bd),shadow=material(0x7c8984),gold=material(0xa88b59);
 const spine=new THREE.Mesh(new THREE.ConeGeometry(.16,.74,4),metal);
 spine.rotation.z=Math.PI;spine.position.set(0,.27,.09);g.add(spine);
 const glint=new THREE.Mesh(new THREE.ConeGeometry(.034,.68,4),shadow);
 glint.rotation.z=Math.PI;glint.position.set(.012,.29,.139);g.add(glint);
 block(g,0x483630,0,-.35,.09,.12,.32,.10);
 block(g,0xb59a66,0,-.20,.09,.48,.09,.14);
 const end=new THREE.Mesh(new THREE.IcosahedronGeometry(.12,0),gold);
 end.position.set(0,-.53,.10);g.add(end);
 g.position.set(DAGGER_POINT.x,1.18,-3.96);
 g.rotation.z=.06;
 return g;
}
export function createDaggerNiche(scene){
 const root=new THREE.Group();scene.add(root);
 const x=DAGGER_POINT.x,z=-4.06;
 // A real miniature wall cabinet with three narrow sealed niches.
 block(root,0x4d453e,x,1.33,z,.62,1.70,.42);
 block(root,0x987b57,x,1.33,z+.235,.70,1.75,.08);
 for(let i=0;i<3;i++){
  block(root,0x403932,x+(i-1)*.68,1.33,z,.55,1.60,.38);
  block(root,0xa08a6c,x+(i-1)*.68,2.18,z,.61,.14,.46);
  block(root,0x9a8262,x+(i-1)*.68,.47,z,.61,.16,.46);
 }
 const doorPivot=new THREE.Group();
 doorPivot.position.set(x-.30,1.34,z+.24);root.add(doorPivot);
 block(doorPivot,0x6c483c,.29,0,.04,.57,1.48,.10);
 for(let y of [-.36,.13,.47]){
  block(doorPivot,0x997659,.29,y,.105,.40,.055,.022);
 }
 const keyhole=new THREE.Mesh(new THREE.TorusGeometry(.078,.017,5,8),material(0xd1aa72));
 keyhole.position.set(.48,.05,.13);doorPivot.add(keyhole);
 block(doorPivot,0x302f2a,.49,.04,.13,.038,.11,.02);
 const dagger=blade(root);
 const light=new THREE.PointLight(0xffd7a3,0,3.4,2);
 light.position.set(x,1.47,z+.60);root.add(light);
 const target=block(root,0xffffff,x,1.33,z+.40,.98,1.85,.12);
 target.material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
 target.userData.kind='dagger-niche';
 let reveal=0;
 function update(dt,taken,time){
  reveal=THREE.MathUtils.damp(reveal,taken?1:0,4,Math.max(0,Math.min(dt,.1)));
  doorPivot.rotation.y=reveal*-1.62;
  keyhole.visible=!taken;
  light.intensity=reveal*.82;
  dagger.visible=true;
  dagger.position.y=1.18+Math.sin(time*1.3)*.03+reveal*.22;
  dagger.scale.setScalar(taken?Math.max(.02,1-reveal*.96):1);
 }
 return {root,dagger,target,doorPivot,update};
}
