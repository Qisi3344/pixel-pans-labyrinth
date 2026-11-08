import * as THREE from 'three';
import {WELL} from './architecture.js';
import {buildWell} from './scene.js';
import {FINAL_WELL_CENTER} from './chapter4-maze-layout.js';
import {FINAL_BLOOD_STAND} from './chapter4-logic.js';

// Reuse the EXACT first-chapter spiral shaft: 52 carved steps, 2.15 turns,
// tapering subterranean wall, lit lower landing and cutaway masonry.
// This scene shares the original mesh rather than imitating it with a ring.
export function buildFinalSpiralWell(parent){
 const well=buildWell(parent);
 well.name='chapter-one-spiral-reused-in-finale';
 well.position.set(FINAL_WELL_CENTER.x,.07,FINAL_WELL_CENTER.z);
 const fx=new THREE.Group();
 fx.name='well-cinematic-effects';
 fx.position.copy(well.position);
 parent.add(fx);

 // A magical doorway materializes DEEP INSIDE the shaft, not as a flat lid
 // at the mouth that would hide the original descending staircases.
 const portal=new THREE.Mesh(new THREE.CircleGeometry(.74,36),
  new THREE.MeshBasicMaterial({color:0xc4e2cb,transparent:true,opacity:0,
   depthWrite:false,side:THREE.DoubleSide}));
 portal.rotation.x=-Math.PI/2;
 portal.position.set(0,-2.16,0);
 portal.visible=false;
 fx.add(portal);

 // Visibly connect the girl's position at the rim to the inner stone wall.
 // The stream follows the interior slope DOWN, beyond the first stair.
 const x=FINAL_BLOOD_STAND.x-FINAL_WELL_CENTER.x;
 const z=FINAL_BLOOD_STAND.z-FINAL_WELL_CENTER.z;
 const path=new THREE.CatmullRomCurve3([
  new THREE.Vector3(x,.13,z),
  new THREE.Vector3(-2.12,.095,.20),
  new THREE.Vector3(-1.96,.005,.13),
  new THREE.Vector3(-1.81,-.34,-.15),
  new THREE.Vector3(-1.58,-.70,-.39),
  new THREE.Vector3(-1.30,-1.03,-.62),
  new THREE.Vector3(-.91,-1.49,-.79),
  new THREE.Vector3(-.49,-1.94,-.74),
  new THREE.Vector3(-.17,-2.23,-.46)
 ],false,'centripetal');
 const bloodTrail=new THREE.Group();
 bloodTrail.name='rim-to-spiral-shaft-blood-path';
 fx.add(bloodTrail);
 const bloodSegments=[];
 const n=28;
 const red=new THREE.MeshBasicMaterial({color:0x8c2534,depthWrite:false});
 for(let i=0;i<n;i++){
  const a=path.getPoint(i/n),b=path.getPoint((i+1)/n);
  const segment=new THREE.Mesh(new THREE.TubeGeometry(
   new THREE.LineCurve3(a,b),2,.055,5,false),red);
  segment.visible=false;
  bloodTrail.add(segment);bloodSegments.push(segment);
 }
 const droplet=new THREE.Mesh(new THREE.IcosahedronGeometry(.096,0),
  new THREE.MeshBasicMaterial({color:0xab3941}));
 droplet.visible=false;fx.add(droplet);
 function setBloodProgress(progress){
  const p=Math.max(0,Math.min(1,progress));
  bloodSegments.forEach((seg,i)=>seg.visible=p>(i+.5)/n);
  droplet.visible=p>.01&&p<.995;
  droplet.position.copy(path.getPoint(p));
 }
 return {well,portal,droplet,bloodTrail,bloodSegments,bloodCurve:path,setBloodProgress};
}

// The previous chapter-IV round stage was a SOLID cylinder underneath
// the well. Extruding an off-center round hole exposes the full 3D shaft.
export function createFinalStageWithCutout(parent){
 const radius=WELL.rimOuter*WELL.visualScale+.06;
 const build=(outer,depth,top,color,name)=>{
  const shape=new THREE.Shape();
  shape.absarc(0,0,outer,0,Math.PI*2,false);
  const hole=new THREE.Path();
  hole.absarc(FINAL_WELL_CENTER.x,FINAL_WELL_CENTER.z,
   radius,0,Math.PI*2,true);
  shape.holes.push(hole);
  const geometry=new THREE.ExtrudeGeometry(shape,{
   depth,bevelEnabled:false,curveSegments:64
  });
  // Shape XY maps to world XZ; extrusion runs DOWN the scene's Y-axis.
  geometry.rotateX(Math.PI/2);
  const material=new THREE.MeshLambertMaterial({color,flatShading:true,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.y=top;
  mesh.name=name;
  mesh.receiveShadow=true;mesh.castShadow=true;
  mesh.userData.wellHoleRadius=radius;
  parent.add(mesh);
  return mesh;
 };
 const ground=build(13.17,1.08,-.17,0x394a42,'final-stage-stone-cutaway');
 const cap=build(13.08,.17,-.035,0x4c6156,'final-stage-grass-cap-with-hole');
 return {ground,cap,holeRadius:radius};
}
