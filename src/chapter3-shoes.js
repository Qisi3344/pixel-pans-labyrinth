import * as THREE from 'three';

// A clustered pile of recognisable small worn shoes, never anonymous boxes.
// Children's footwear is a quiet environmental story clue in the banquet hall.
export const CHILD_SHOE_PILE=Object.freeze({x:6.48,z:3.17});
export const SHOE_INSPECT_RADIUS=1.55;
export const SHOE_MESSAGE='这些都是小孩的鞋子……鞋尖已经磨破，有的还系着鞋带。';
const leathers=[0x4b342d,0x655041,0x322f30,0x755d4b,0x51473e,0x6d5045,0x403536,0x82735e];
const soles=[0x2f302d,0x4a3930,0x272727,0x514136];
const random=n=>{const v=Math.sin(n*127.23+17.47)*43758.545;return v-Math.floor(v);};
function mesh(parent,geo,color,x,y,z,options={}){
 const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color,flatShading:true,...options}));
 m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function shoeOutline(w,l,extra=0){
 const s=new THREE.Shape();
 s.moveTo(-w*.36,-l*.48);
 s.bezierCurveTo(-w*.51,-l*.48,-w*.51,-l*.30,-w*.49,-l*.12);
 s.lineTo(-w*(.50+extra),l*.20);
 s.bezierCurveTo(-w*.58,l*.52,-w*.31,l*.57,0,l*.56);
 s.bezierCurveTo(w*.31,l*.57,w*.58,l*.52,w*(.50+extra),l*.20);
 s.lineTo(w*.49,-l*.12);
 s.bezierCurveTo(w*.51,-l*.30,w*.51,-l*.48,w*.36,-l*.48);
 s.closePath();return s;
}
function extruded(parent,s,c,y,depth){
 const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:4,steps:1});
 const m=mesh(parent,g,c,0,y,0);m.rotation.x=Math.PI/2;return m;
}
function shoeChild(style,w,l,leather,sole,seed){
 const g=new THREE.Group();g.userData={kind:'child-shoe',style,size:'child'};
 const dark=0x2d2926,light=0xbcae91;
 extruded(g,shoeOutline(w,l),sole,.145,.072);
 extruded(g,shoeOutline(w*.95,l*.96),leather,.190,.072);
 // The rounded toe is a true three-dimensional upper, not a square block.
 const cap=mesh(g,new THREE.SphereGeometry(1,8,6),leather,0,.242,l*.17);
 cap.scale.set(w*.46,.105,l*.32);
 const heel=mesh(g,new THREE.SphereGeometry(1,7,5),leather,0,.247,-l*.29);
 heel.scale.set(w*.40,.11,l*.19);
 const throat=mesh(g,new THREE.SphereGeometry(1,8,5),dark,0,.311,-l*.12);
 throat.scale.set(w*.30,.018,l*.19);
 if(style==='boot'){
  // A folded boot shaft, tongue, shoelace eyelets and a contrasting collar.
  mesh(g,new THREE.CylinderGeometry(w*.34,w*.40,.30,7),leather,
   0,.413,-l*.26);
  mesh(g,new THREE.CylinderGeometry(w*.36,w*.36,.048,7),sole,
   0,.564,-l*.26);
  const tongue=mesh(g,new THREE.BoxGeometry(w*.27,.16,.028),0x837460,
   0,.407,-l*.26);tongue.rotation.x=-.09;
  for(let n=0;n<3;n++){
   const y=.38+n*.07;
   for(const side of [-1,1]){
    mesh(g,new THREE.SphereGeometry(.019,5,4),light,side*w*.14,y,-l*.235);
   }
   const lace=mesh(g,new THREE.CylinderGeometry(.010,.010,w*.31,5),
    0xc9b89d,0,y,-l*.22);
   lace.rotation.z=Math.PI/2+(n%2?.19:-.19);
  }
 }else if(style==='mary-jane'){
  // Wide instep strap across an open vamp, with actual buckle.
  const strap=mesh(g,new THREE.BoxGeometry(w*.83,.04,l*.115),sole,
   0,.330,-l*.046);strap.rotation.z=.045;
  const buckle=mesh(g,new THREE.TorusGeometry(.049,.012,4,8),light,
   w*.33,.351,-l*.047);
  buckle.rotation.x=Math.PI/2;
  mesh(g,new THREE.CylinderGeometry(.010,.010,.07,5),light,
   w*.33,.350,-l*.047).rotation.z=Math.PI/2;
 }else{
  // Tiny child's lace-up shoe: ankle tongue, X laces and worn toe seam.
  const tongue=mesh(g,new THREE.SphereGeometry(1,8,4),0x827365,
   0,.314,-l*.20);tongue.scale.set(w*.20,.045,l*.24);
  for(let n=0;n<3;n++){
   const z=-l*.23+n*l*.10;
   for(const side of [-1,1])
    mesh(g,new THREE.SphereGeometry(.015,4,4),light,
     side*w*.17,.334,z);
   const line=mesh(g,new THREE.CylinderGeometry(.009,.009,w*.37,5),
    0xd0bfa3,0,.348,z);
   line.rotation.z=Math.PI/2;line.rotation.y=n%2?.33:-.33;
  }
 }
 // Stitching at the rounded front makes each low-poly shoe legible.
 for(let n=0;n<5;n++){
  const a=(-.7+n*.35);
  mesh(g,new THREE.SphereGeometry(.009,4,3),n%2?0x9c8b78:0xb6a793,
   a*w*.39,.253,l*(.31+.04*Math.cos(a*2)));
 }
 if(seed%4===0){
  const scuff=mesh(g,new THREE.SphereGeometry(1,5,4),0xa18b6c,
   -w*.10,.294,l*.37);scuff.scale.set(w*.17,.008,l*.09);
 }
 return g;
}
export function createChildShoePile(scene,{count=23}={}){
 const root=new THREE.Group();root.position.set(CHILD_SHOE_PILE.x,0,CHILD_SHOE_PILE.z);
 root.userData.kind='child-shoe-pile';scene.add(root);
 // On the camera-facing banquet-hall floor rather than hidden behind the
 // raised long table. The contrast plinth is flush with the stone tiles.
 const rug=mesh(root,new THREE.BoxGeometry(2.85,.055,2.42),
  0x80786b,0,-.22,-.03);
 rug.castShadow=false;rug.receiveShadow=true;rug.userData.kind='shoe-display-ground';
 const lip=mesh(root,new THREE.BoxGeometry(2.98,.045,2.55),
  0xb1a18a,0,-.255,-.03);lip.receiveShadow=true;lip.castShadow=false;
 // Dedicated gentle warm bounce light: legible, without a glowing quest marker.
 const light=new THREE.PointLight(0xf3d0a1,1.18,4.2,2);
 light.position.set(0,1.72,.3);root.add(light);
 // A slightly messy cluster: soles, noses and raised ankle shafts create
 // recognisable silhouettes at the game's orthographic pixel resolution.
 const shoes=[];
 for(let n=0;n<count;n++){
  const w=.32+random(n*3)*.12,l=.58+random(n*7+3)*.15;
  const style=['mary-jane','boot','lace-up'][n%3];
  const shoe=shoeChild(style,w,l,leathers[n%leathers.length],
   soles[n%soles.length],n);
  const col=n%5,row=Math.floor(n/5);
  // Spaced enough that the tiny footwear actually reads as FOOTWEAR.
  shoe.position.set((col-2)*.48+(random(n*9)-.5)*.11,
   .018+row*.07,
   (row-2)*.39+(random(n*13)-.5)*.09);
  shoe.rotation.y=random(n*41)*Math.PI*2;
  shoe.rotation.z=(random(n*33)-.5)*.28;
  shoe.rotation.x=(random(n*23)-.5)*.20;
  root.add(shoe);shoes.push(shoe);
 }
 // One displaced pair beside the pile tells the player what these objects are.
 for(const [i,x,z] of [[0,-1.28,.59],[1,-.78,.70]]){
  const shoe=shoeChild('mary-jane',.39,.68,0x685347,0x342e2a,i);
  shoe.position.set(x,0,z);shoe.rotation.y=.35+i*.15;
  root.add(shoe);shoes.push(shoe);
 }
 return {root,shoes,point:{...CHILD_SHOE_PILE}};
}
