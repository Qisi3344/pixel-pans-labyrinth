import * as THREE from 'three';

// Royal finale inspired by the film's vast three-throne court.
// All art is original procedural low-poly geometry, no external assets.
const mat=c=>new THREE.MeshLambertMaterial({color:c,flatShading:true});
function box(parent,color,x,y,z,w,h,d,shadow=true){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));
 mesh.position.set(x,y,z);mesh.castShadow=shadow;mesh.receiveShadow=true;parent.add(mesh);
 return mesh;
}
function stone(parent,color,x,y,z,r=.3,detail=0){
 const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(r,detail),mat(color));
 mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 return mesh;
}
function cylinder(parent,color,x,y,z,top,bottom,height,segments=8){
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,segments),mat(color));
 mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 return mesh;
}
function beam(parent,color,from,to,r=.12){
 const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),dir=b.clone().sub(a);
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.85,r,dir.length(),6),mat(color));
 mesh.position.copy(a).add(b).multiplyScalar(.5);
 mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
 mesh.castShadow=true;parent.add(mesh);return mesh;
}
function throne(root,x,z,empty){
 const g=new THREE.Group();g.position.set(x,0,z);root.add(g);
 const gold=empty?0xe0c08c:0xb89a6e,stoneColor=empty?0x8d735e:0x705a49;
 box(g,0x433831,0,1.56,-.20,2.48,2.12,.86);
 box(g,stoneColor,0,2.63,-.39,2.56,3.20,.58);
 box(g,gold,0,3.48,-.02,2.58,.11,.17);
 box(g,empty?0x9e8574:0x80604f,0,1.35,.28,1.86,.35,1.16);
 box(g,empty?0xdcc9a7:0x8b5c50,0,1.56,.48,1.53,.16,.75);
 for(const side of [-1,1]){
  box(g,stoneColor,side*1.08,1.64,.37,.35,.45,1.34);
  box(g,gold,side*1.08,1.89,.41,.40,.10,1.34);
  cylinder(g,stoneColor,side*1.12,2.91,-.37,.14,.18,2.45,7);
  const spire=new THREE.Mesh(new THREE.ConeGeometry(.29,.72,6),mat(gold));
  spire.position.set(side*1.12,4.35,-.35);g.add(spire);
  beam(g,gold,[side*1.21,4.13,-.18],[side*.17,4.87,-.18],.17);
 }
 const point=new THREE.Mesh(new THREE.ConeGeometry(.32,.68,7),mat(gold));
 point.position.set(0,5.10,-.18);g.add(point);
 const gem=stone(g,empty?0xf1deae:0x875451,0,3.32,.02,.24);
 gem.scale.set(.80,1.25,.28);
 if(empty){
  // The central vacant chair is unmistakably meant for Ofelia.
  box(g,0xd9c6a7,0,1.45,.42,1.47,.16,.88,false);
  box(g,0xd4ad7b,0,2.06,-.05,.14,.82,.12,false);
 }
 return g;
}
function seatedParent(root,x,z,role){
 const father=role==='father';
 const g=new THREE.Group();g.position.set(x,.28,z+.45);root.add(g);
 const robe=father?0x604a45:0x6f6159,trim=father?0xc6a674:0xd8bd93;
 const hair=father?0x68665d:0x5b4a40,skin=0xd7bea1;
 const skirt=new THREE.Mesh(new THREE.ConeGeometry(.68,1.43,9),mat(robe));
 skirt.position.set(0,.98,.25);skirt.castShadow=true;g.add(skirt);
 cylinder(g,robe,0,1.69,-.02,.33,.46,.93,8);
 box(g,trim,0,1.76,.28,.57,.10,.085);
 beam(g,trim,[-.38,1.93,0],[.38,1.93,0],.05);
 for(const side of [-1,1]){
  beam(g,robe,[side*.36,1.82,0],[side*.52,1.33,.44],.14);
  stone(g,skin,side*.51,1.32,.49,.13);
  const leg=stone(g,robe,side*.24,.73,.60,.26);
  leg.scale.set(.77,1.14,1.47);
 }
 cylinder(g,skin,0,2.21,.04,.17,.18,.28,7);
 const head=stone(g,skin,0,2.48,.11,.29,1);head.scale.set(.89,1.07,.85);
 const cap=stone(g,hair,0,2.69,-.07,.32);cap.scale.set(.95,.44,.80);
 if(!father)for(const side of [-1,1]){
  const lock=stone(g,hair,side*.27,2.31,-.03,.16);
  lock.scale.set(.66,1.72,.72);
 }
 for(const side of [-1,1])stone(g,0x493c33,side*.104,2.52,.35,.03);
 box(g,0x996a60,0,2.34,.379,.11,.025,.02,false);
 const ring=cylinder(g,0xbb985d,0,2.83,.01,.31,.30,.16,10);
 for(let i=0;i<8;i++){
  const angle=i/8*Math.PI*2;
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.075,.26,4),mat(0xd8b874));
  tip.position.set(Math.cos(angle)*.28,3.0,Math.sin(angle)*.28);g.add(tip);
 }
 const gem=stone(g,father?0x964d48:0x668b79,0,2.86,.332,.072);
 const pin=new THREE.Object3D();pin.position.set(0,3.28,.10);g.add(pin);
 return {root:g,head,ring,speechAnchor:pin};
}
export function buildRoyalHall(root){
 // Previously only 17.7 x 11.5 units. This hall is 28.4 x 19.6.
 const floor=box(root,0x433a33,0,-.49,0,28.4,.96,19.6);
 const surface=box(root,0x9e8a69,0,-.016,0,28.11,.055,19.30);
 // Larger dignified checkerwork and an uninterrupted central approach.
 for(let row=0;row<12;row++)for(let col=0;col<16;col++){
  const x=-13.1+col*1.75,z=-8.85+row*1.60;
  const aisle=Math.abs(x)<3;
  const tone=aisle?((row+col)%3?0xb29c76:0xc0a67c):
   ((row+col)%3?0xa18f73:0x9b8b72);
  box(root,tone,x,.034,z,1.71,.070,1.56,false);
 }
 for(const x of [-3.1,3.1])box(root,0xc7ab7a,x,.077,.50,.09,.05,16.3,false);
 for(let i=0;i<8;i++){
  const mosaic=box(root,i%2?0xc1a479:0xb69a72,0,.098,6.75-i*1.55,.61,.06,.61,false);
  mosaic.rotation.y=Math.PI/4;
 }
 // Three-step elevated dais: genuinely separate seats, not one rounded sofa.
 box(root,0x53453a,0,.24,-5.41,15.9,.53,7.17);
 box(root,0x897152,0,.53,-5.42,15.7,.11,7.05);
 box(root,0x68503d,0,.70,-6.30,13.90,.42,4.75);
 box(root,0xb99b6c,0,.95,-6.30,13.71,.10,4.67);
 for(let i=0;i<3;i++){
  const z=-1.85-i*.49;
  box(root,0x978060,0,.17+i*.16,z,11.45,.24,.49);
 }
 // Deep stone facade and pointed Gothic niches, enclosing the royal trio.
 box(root,0x4b4038,0,3.65,-9.05,23.35,7.35,.82);
 box(root,0xa99170,0,7.30,-8.98,23.56,.29,1.06);
 box(root,0x3a332e,0,7.62,-9.21,23.68,.53,.70);
 for(const x of [-8.35,-4.17,0,4.17,8.35]){
  box(root,0x877158,x,3.49,-8.53,.47,6.75,1.32);
  box(root,0xc5a87e,x,6.92,-8.32,.88,.29,1.55);
 }
 for(const x of [-4.16,0,4.16]){
  box(root,0x665144,x,3.44,-8.58,3.20,5.37,.13);
  for(const sign of [-1,1]){
   beam(root,0xd0ae7d,[x+sign*1.58,5.21,-8.30],
    [x+sign*.14,6.77,-8.30],.23);
  }
  box(root,0xc1a071,x,5.15,-8.28,2.76,.13,.12);
 }
 const throneZ=-6.4,kingX=-3.68,queenX=3.68;
 const thrones=[
  throne(root,kingX,throneZ,false),
  throne(root,0,throneZ,true),
  throne(root,queenX,throneZ,false)
 ];
 const father=seatedParent(root,kingX,throneZ,'father');
 const mother=seatedParent(root,queenX,throneZ,'mother');
 // Eight proper pillars along the sides give cinematic height and depth.
 for(const sign of [-1,1])for(const z of [-7.4,-2.4,2.6,7.6]){
  const x=sign*12.62;
  box(root,0x6d5944,x,.16,z,1.55,.31,1.53);
  cylinder(root,0xad956f,x,2.63,z,.46,.61,4.83,10);
  cylinder(root,0xc3aa7b,x,5.17,z,.66,.58,.45,9);
  box(root,0x78624a,x,5.49,z,1.33,.28,1.29);
  const capital=new THREE.Mesh(new THREE.ConeGeometry(.36,.80,8),mat(0xd5b889));
  capital.position.set(x,6.05,z);root.add(capital);
  beam(root,0x947c5d,[sign*12.18,5.32,z],[sign*9.96,6.22,z],.23);
 }
 // Sparse warm torchlight; visually rich without glitter and no textures.
 for(const x of [-10.9,10.9]){
  for(const z of [-4.55,4.35]){
   cylinder(root,0x876344,x,1.06,z,.34,.43,.33,8);
   const flame=stone(root,0xf1d09d,x,1.48,z,.22);
   flame.material=new THREE.MeshBasicMaterial({color:0xf4d3a0});
  }
 }
 const lighting=new THREE.AmbientLight(0xffdfa8,.50);root.add(lighting);
 const royalSun=new THREE.PointLight(0xffe0ad,2.3,23,1.5);
 royalSun.position.set(0,8.7,-3.9);root.add(royalSun);
 const speechAnchors={father:father.speechAnchor,mother:mother.speechAnchor};
 return {father,mother,thrones,thirdThrone:thrones[1],surface,floor,
  light:lighting,royalSun,speechAnchors,hallWidth:28.4,hallDepth:19.6,columns:8};
}
