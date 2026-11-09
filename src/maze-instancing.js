import * as THREE from 'three';

// Batched STATIC stone tiles/walls. Moving gates and runes stay separate meshes.
export function buildStoneInstances(entries,geometry,material,{kind='wall',castShadow=false}={}){
 if(!Array.isArray(entries)||entries.length===0)return null;
 const mesh=new THREE.InstancedMesh(geometry,material,entries.length);
 mesh.userData.kind=kind;
 mesh.userData.cells=kind==='tile'?entries.map(entry=>({...entry.cell})):null;
 mesh.castShadow=castShadow;
 mesh.receiveShadow=true;
 const dummy=new THREE.Object3D();
 entries.forEach((entry,i)=>{
  dummy.position.set(...entry.position);
  dummy.scale.set(...entry.scale);
  dummy.updateMatrix();
  mesh.setMatrixAt(i,dummy.matrix);
 });
 mesh.instanceMatrix.needsUpdate=true;
 mesh.computeBoundingSphere();
 return mesh;
}
export function resolveStonePick(hit){
 if(!hit)return null;
 const object=hit.object;
 if(object?.isInstancedMesh&&object.userData.kind==='tile'){
  const cell=object.userData.cells?.[hit.instanceId];
  return cell?{kind:'tile',x:cell.x,z:cell.z}:null;
 }
 return object?.userData||null;
}
