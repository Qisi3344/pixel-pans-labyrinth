import * as THREE from 'three';
import {CELL,SIZE,CENTER,RUIN_RADIUS,withinRuin,WELL_ROUTE,id} from './maze.js';
import {ARCH,WELL,wellFloorY,spiralStep,spiralPosition,entranceAngle,isStairheadClearance} from './architecture.js';

const PALETTE = {
  rock: [0x55615d,0x65726a,0x78857b,0x47524f,0x5d685f],
  floor: [0x34423f,0x43534d,0x3d4b47,0x4c5c53,0x394944],
  moss: [0x39594d,0x48674f,0x62785b,0x314b43],
  glass: 0xb8e9db,
};
const origin = CENTER;
// The game grid is kept intact, but the final ten coordinates are projected
// onto the *real* circular staircase rather than floating across the hole.
const spiralCells = new Map(WELL_ROUTE.map((cell,i)=>[id(cell.x,cell.z),i/(WELL_ROUTE.length-1)]));
export const spiralProgress = cell => spiralCells.get(id(cell.x,cell.z));
export const terrainY = cell => {
  const t=spiralProgress(cell);
  return t===undefined?wellFloorY(Math.hypot(cell.x-CENTER,cell.z-CENTER)*CELL):spiralPosition(t).y;
};
export const world = cell => {
  const t=spiralProgress(cell);
  if(t!==undefined){const p=spiralPosition(t);return new THREE.Vector3(p.x,p.y,p.z);}
  return new THREE.Vector3((cell.x-origin)*CELL,terrainY(cell),(cell.z-origin)*CELL);
};
export const spiralWorldAt = progress => {
  const p=spiralPosition(progress);
  return new THREE.Vector3(p.x,p.y,p.z);
};
function hash(x,z,seed=31) { const n=Math.sin((x+seed)*127.1+(z-seed)*311.7)*43758.5453;return n-Math.floor(n); }
function mat(hex,extra={}) {return new THREE.MeshLambertMaterial({color:hex,...extra});}
const cube = new THREE.BoxGeometry(1,1,1);
function box(parent,color,where,scale,cast=true){
  const m = new THREE.Mesh(cube,typeof color==='number'?mat(color):color);
  m.position.set(...where);m.scale.set(...scale);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;
}
function cylinder(parent, material, radiusTop, radiusBottom, height, segments, y){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,height,segments),material);
  m.position.y=y;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function makeGlow(parent,color,rad,pos){
  const sphere=new THREE.Mesh(new THREE.IcosahedronGeometry(rad,1),new THREE.MeshBasicMaterial({color}));
  sphere.position.set(...pos);parent.add(sphere);return sphere;
}
function tuft(parent,x,z,size,shade) {
  const grass=new THREE.Group();grass.position.set(x,.10,z);parent.add(grass);
  const material=mat(shade);
  for(let k=0;k<3;k++){
    const blade=new THREE.Mesh(new THREE.ConeGeometry(size*.27,size,3),material);
    blade.position.set((k-1)*size*.16,size*.36,Math.sin(k*3)*size*.1);
    blade.rotation.z=(k-1)*.3;grass.add(blade);
  }
}
function root(parent, start, end, radius=.17, color=0x2e3737) {
  const dir=new THREE.Vector3().subVectors(end,start);
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius*.68,radius,dir.length(),5),mat(color));
  mesh.position.copy(start).addScaledVector(dir,.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
  mesh.castShadow=true;parent.add(mesh);
}
function twistedTree(parent,x,z,seed=0) {
  const tree=new THREE.Group();tree.position.set(x,-.05,z);parent.add(tree);
  const bark=seed%2?0x353a3b:0x424342;
  root(tree,new THREE.Vector3(0,0,0),new THREE.Vector3(.05,1.1,0),.30,bark);
  root(tree,new THREE.Vector3(.05,1.1,0),new THREE.Vector3(-.15,2.1,.12),.24,bark);
  root(tree,new THREE.Vector3(-.15,2.1,.12),new THREE.Vector3(-.46,3.0,-.12),.16,bark);
  root(tree,new THREE.Vector3(-.1,1.9,.10),new THREE.Vector3(.95,2.78,.18),.13,bark);
  root(tree,new THREE.Vector3(.85,2.7,.18),new THREE.Vector3(1.32,3.23,.40),.08,bark);
  root(tree,new THREE.Vector3(-.32,2.6,-.10),new THREE.Vector3(-1.03,2.98,-.6),.08,bark);
  for (let i=0;i<3;i++) {
    const s=new THREE.Mesh(new THREE.IcosahedronGeometry(.45+i*.12,0),mat(i===1?0x536c62:0x405951));
    s.scale.set(1.3,.55,.9);
    s.position.set(i===0?-.53:i===1?.88:-.19,3.15+(i%2)*.28,i===1?.23:-.2);
    s.castShadow=true;tree.add(s);
  }
  return tree;
}
// Circular stone architecture is modeled in three dimensions, not flattened onto textures.
function stoneArc(parent,radius,theta,arc,height,thickness,tint,base=-.08) {
  const g=new THREE.Group();
  g.position.set(Math.cos(theta)*radius,0,Math.sin(theta)*radius);
  g.rotation.y=-theta-Math.PI/2;
  parent.add(g);
  const core=box(g,tint,[0,base+height/2,0],[arc,height,thickness]);
  core.rotation.z=(hash(theta*73,radius) - .5)*.035;
  box(g,0x879389,[0,base+height-.035,0],[arc*1.03,.10,thickness*1.13],false);
  if(hash(theta*23,radius,6)>.34) box(g,0x384d42,[arc*.24,base+height+.016,thickness*.2],[arc*.28,.035,thickness*.42],false);
  return g;
}
// Polygonal wedge blocks make the weathered ring and *actual* stair treads.
// This is never a decal / flat sprite: each stone has a top and side faces.
function stoneSector(parent,inside,outside,a,b,topY,thickness,tint){
  const shape=new THREE.Shape();
  const n=3;
  for(let k=0;k<=n;k++){
    const t=a+(b-a)*k/n;
    const x=Math.cos(t)*outside,z=Math.sin(t)*outside;
    if(k===0)shape.moveTo(x,z);else shape.lineTo(x,z);
  }
  for(let k=n;k>=0;k--){
    const t=a+(b-a)*k/n;
    shape.lineTo(Math.cos(t)*inside,Math.sin(t)*inside);
  }
  shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false,curveSegments:2});
  geometry.rotateX(Math.PI/2);
  const mesh=new THREE.Mesh(geometry,mat(tint,{side:THREE.DoubleSide}));
  mesh.position.y=topY;
  mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
  return mesh;
}
function archStone(parent,a,b,tint){
  const inner=ARCH.openingRadius,outer=ARCH.outerRadius,y=ARCH.springY;
  const shape=new THREE.Shape();
  const n=4;
  for(let k=0;k<=n;k++){
    const t=a+(b-a)*k/n;
    const px=Math.cos(t)*outer,py=y+Math.sin(t)*outer;
    if(!k)shape.moveTo(px,py);else shape.lineTo(px,py);
  }
  for(let k=n;k>=0;k--){
    const t=a+(b-a)*k/n;
    shape.lineTo(Math.cos(t)*inner,y+Math.sin(t)*inner);
  }
  shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:ARCH.thickness,bevelEnabled:false,curveSegments:1});
  const mesh=new THREE.Mesh(geometry,mat(tint,{side:THREE.DoubleSide}));
  mesh.position.z=-ARCH.thickness/2;
  mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
  return mesh;
}
function makeStoneFace(arch){
  // Five-sided weathered mask at the keystone. Its sockets and teeth are
  // genuine 3D geometry, so it remains visible in a fixed isometric view.
  const face=new THREE.Group();face.position.set(0,3.67,-.77);
  face.scale.setScalar(1.45);
  arch.add(face);
  const skull=new THREE.Mesh(new THREE.IcosahedronGeometry(.39,1),mat(0xa1ada0));
  skull.scale.set(.99,1.17,.57);skull.castShadow=true;face.add(skull);
  const jaw=box(face,0x899c8b,[0,-.29,-.09],[.42,.19,.28]);
  jaw.rotation.z=.035;
  for(const sign of [-1,1]){
    const eye=new THREE.Mesh(new THREE.OctahedronGeometry(.145,0),mat(0x182d24));
    eye.scale.set(1.20,.95,.58);eye.position.set(sign*.17,.055,-.24);face.add(eye);
    const brow=box(face,0x9ba99b,[sign*.17,.155,-.224],[.24,.065,.10]);
    brow.rotation.z=sign*.18;
    box(face,0x66766a,[sign*.29,-.14,-.12],[.11,.15,.17]);
  }
  const nose=new THREE.Mesh(new THREE.ConeGeometry(.08,.155,3),mat(0x283932));
  nose.position.set(0,-.13,-.26);nose.rotation.z=Math.PI;face.add(nose);
  for(let i=0;i<4;i++)box(face,0xced4c4,[(i-1.5)*.09,-.34,-.245],[.053,.095,.075],false);
}
function buildEntrance(parent,angle,radius){
  const arch=new THREE.Group();
  arch.position.set(Math.cos(angle)*radius,-.05,Math.sin(angle)*radius);
  // local X runs along the wall tangent; local -Z faces the forest approach.
  arch.rotation.y=-angle-Math.PI/2;
  parent.add(arch);
  for(const sign of [-1,1]){
    const x=sign*1.77;
    // Uneven block-built piers rather than two generic smooth cylinders.
    for(let j=0;j<4;j++){
      const dy=j*.43;
      box(arch,PALETTE.rock[(j+Math.round(sign+1)*2)%PALETTE.rock.length],
        [x+(hash(j,sign)-.5)*.06,dy+.18,0],
        [.82-(j%2)*.06,.42,ARCH.thickness+(.04*j)]);
    }
    box(arch,0x77877c,[x,1.69,0],[.98,.20,1.08]);
    box(arch,0x3b4d43,[x,.29,-.56],[.73,.19,.30]);
    // Roots travel across the actual stonework.
    root(arch,new THREE.Vector3(x*1.24,.03,-.56),new THREE.Vector3(x,.62,-.52),.13,0x303b35);
    root(arch,new THREE.Vector3(x,.62,-.52),new THREE.Vector3(x*.94,1.40,-.54),.09,0x303b35);
  }
  const n=ARCH.stones;
  for(let i=0;i<n;i++){
    const gap=.011;
    const from=i*Math.PI/n+gap,to=(i+1)*Math.PI/n-gap;
    archStone(arch,from,to,PALETTE.rock[(i*3+1)%PALETTE.rock.length]);
    if(i===Math.floor(n/2)){
      const crown=archStone(arch,from+.045,to-.045,0x839184);
      crown.position.z=-.50;
    }
  }
  makeStoneFace(arch);
  // The upper edge is chipped, the opening itself stays fully walkable.
  box(arch,0x455747,[-2.23,1.38,.30],[.58,.40,.65]);
  box(arch,0x4b5a4d,[2.13,1.54,.27],[.49,.23,.67]);
  root(arch,new THREE.Vector3(-1.98,1.66,-.41),new THREE.Vector3(-1.44,2.68,-.47),.11);
  root(arch,new THREE.Vector3(-1.44,2.68,-.47),new THREE.Vector3(-.74,3.51,-.46),.065);
  root(arch,new THREE.Vector3(2.09,1.71,.36),new THREE.Vector3(1.56,2.64,.32),.1);
  // A little tongue of stone-and-earth leads OUT from the gate into forest.
  for(let j=0;j<5;j++){
    const localZ=-.7-j*.48;
    const width=2.45-j*.30;
    box(arch,j%2?0x49594e:0x3d4d45,[0,-.26,localZ],[width,.24,.53],false);
    if(j%2===0){
      for(const sign of [-1,1]){
        const chip=box(arch,0x728073,[sign*(width*.41),-.08,localZ],[.27,.085,.28],false);
        chip.rotation.y=j*.36;
      }
    }
  }
  return arch;
}
function ruinPerimeter(parent,radius,start){
  const entrance=entranceAngle(start,CENTER);
  const count=60, arc=Math.PI*2*radius/count;
  for(let i=0;i<count;i++){
    const a=(i+.5)*2*Math.PI/count;
    const delta=Math.atan2(Math.sin(a-entrance),Math.cos(a-entrance));
    if(Math.abs(delta)<.205)continue; // exactly one recognizable doorway
    const h=.90+.47*hash(i,18);
    stoneArc(parent,radius,a,arc*.93,h,.78,PALETTE.rock[(i*7)%PALETTE.rock.length]);
    if(i%11===0){
      const p=new THREE.Group();p.position.set(Math.cos(a)*(radius+.48),-.12,Math.sin(a)*(radius+.48));parent.add(p);
      box(p,0x586a5e,[0,.20,0],[.85,.47,.77]);
    }
  }
  buildEntrance(parent,entrance,radius);
}
function buildWell(parent){
  const well=new THREE.Group();parent.add(well);
  const outer=WELL.radius;
  // Genuine OPEN funnel. The upper mouth is narrower than the bottom,
  // leaving a dark 4.9-unit cut into the stage rather than a painted tile.
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(outer,4.19,WELL.depth,56,1,true),
    mat(0x23352d,{side:THREE.DoubleSide}));
  wall.position.y=-WELL.depth/2-.13;
  wall.castShadow=true;wall.receiveShadow=true;well.add(wall);
  for(let layer=0;layer<7;layer++){
    const t=layer/6;
    const y=-.25-t*4.55;
    const radius=outer+(4.19-outer)*t+.018;
    const line=new THREE.Mesh(new THREE.TorusGeometry(radius,.045,4,64),
      mat(layer%2?0x4a6054:0x607066));
    line.rotation.x=Math.PI/2;line.position.y=y;line.receiveShadow=true;well.add(line);
    // vertical mortar joints are staggered between courses
    for(let k=0;k<34;k++){
      const a=(k+(layer%2)*.5)*Math.PI*2/34;
      const chip=box(well,layer%2?0x394f43:0x54675a,
        [Math.cos(a)*radius, y-.20, Math.sin(a)*radius],[.095,.27,.06],false);
      chip.rotation.y=-a;
    }
  }
  // Individual irregular radial keystones define a massive 360-degree rim.
  const pieces=42;
  for(let i=0;i<pieces;i++){
    const a=i*2*Math.PI/pieces+.008, b=(i+1)*2*Math.PI/pieces-.008;
    const mid=(a+b)/2;
    const gap=Math.atan2(Math.sin(mid-WELL.startAngle),Math.cos(mid-WELL.startAngle));
    if(Math.abs(gap)<.19)continue; // a real gap where the upper stairs begin
    stoneSector(well,outer-.055,WELL.rimOuter,a,b,.095+(hash(i,23)-.5)*.055,
      .27,[0x849387,0x748579,0x98a69a][i%3]);
    if(i%6===1){
      stoneSector(well,outer+.04,WELL.rimOuter-.06,a+.024,b-.024,.132,
        .04,0x384e43);
    }
  }
  // Short descending threshold connects the maze floor to the first
  // visible tread, instead of walking through a sealed circular parapet.
  for(let j=0;j<3;j++){
    box(well,j%2?0x65776b:0x7a877a,
      [0,-.17-j*.055,-4.75+j*.55],
      [1.24,.26,.65]);
  }
  // Long uninterrupted descending stair, physically modelled as 52 raised
  // treads winding inwards for > 2 turns. This is visible from overhead.
  for(let i=0;i<WELL.stepCount;i++){
    const {angle,radius,y,width}=spiralStep(i);
    const delta=(Math.PI*2*WELL.turns)/(WELL.stepCount-1);
    const inset=Math.max(.44,radius-width/2),outset=radius+width/2;
    const tread=stoneSector(well,inset,outset,angle-delta*.13,angle+delta*.98,
      y,.28,[0xb7c5b4,0x94a99a,0x7e9786,0xa6b7a4][i%4]);
    tread.material.emissive.setHex(0x213a2b);
    tread.material.emissiveIntensity=.18;
    // A darker vertical riser accent highlights the grade at small scale.
    if(i%3===0)stoneSector(well,inset+.025,outset-.03,angle+delta*.91,
      angle+delta*1.02,y-.09,.15,0x263b31);
  }
  // A carved inner-edge seam reads as an unmistakable spiral even at
  // deliberately pixelated resolutions, without a flat overlay texture.
  const stairLine=[];
  for(let i=0;i<WELL.stepCount;i++){
    const {angle,radius,y,width}=spiralStep(i);
    const edge=radius-width/2+.04;
    stairLine.push(new THREE.Vector3(Math.cos(angle)*edge,y+.035,Math.sin(angle)*edge));
  }
  const seam=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stairLine),160,.06,6,false),
    new THREE.MeshBasicMaterial({color:0xd7e6d4}));
  well.add(seam);
  const wellFill=new THREE.PointLight(0xb6cbb8,1.35,10,2);
  wellFill.position.set(0,-1.55,0);well.add(wellFill);
  // The shaft must be a CLOSED dark cavity, not a hole through to the white stage.
  // A full-radius floor also prevents daylight leaks between the lowest stairs.
  const pitFloor=new THREE.Mesh(new THREE.CircleGeometry(4.30,64),
    mat(0x10201b,{side:THREE.DoubleSide}));
  pitFloor.rotation.x=-Math.PI/2;
  pitFloor.position.y=-4.93;
  pitFloor.receiveShadow=true;
  well.add(pitFloor);
  // All the bottom detail lives far below the lip. No tall obelisk pokes
  // out and disguises the opening as an altar on a flat tiled platform.
  cylinder(well,mat(0x172522),1.36,1.46,.27,26,-4.66);
  cylinder(well,mat(0x3d5148),.72,.82,.18,11,-4.43);
  const monolith=new THREE.Mesh(new THREE.CylinderGeometry(.15,.26,.68,5),mat(0x829080));
  monolith.position.set(-.68,-4.11,.28);monolith.castShadow=true;well.add(monolith);
  const sigil=new THREE.Mesh(new THREE.OctahedronGeometry(.115,0),
    new THREE.MeshBasicMaterial({color:0xa1daca}));
  sigil.position.set(-.68,-3.40,-.01);well.add(sigil);
  const glow=new THREE.PointLight(0x628e82,.7,3.3,2);
  glow.position.set(0,-3.3,0);well.add(glow);
  return well;
}
function makeRune(parent,rune,clickables){
  const pivot=new THREE.Group();pivot.position.copy(world(rune));pivot.position.x+=.16;pivot.position.z-=.13;parent.add(pivot);
  cylinder(pivot,mat(0x303d3a),.38,.45,.16,8,.16);
  cylinder(pivot,mat(0x7f8582),.25,.30,.55,6,.42);
  cylinder(pivot,mat(0x313c39),.36,.36,.12,8,.74);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.27,.033,5,24),new THREE.MeshBasicMaterial({color:rune.color}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.86;pivot.add(ring);
  // A clear, raised compass pointer whose rotation is tied to the logical puzzle state.
  const arrow=new THREE.Shape();
  arrow.moveTo(0,.25);arrow.lineTo(.16,.02);arrow.lineTo(.065,.02);
  arrow.lineTo(.065,-.19);arrow.lineTo(-.065,-.19);arrow.lineTo(-.065,.02);
  arrow.lineTo(-.16,.02);arrow.closePath();
  const pointer=new THREE.Mesh(new THREE.ShapeGeometry(arrow),new THREE.MeshBasicMaterial({color:rune.color,side:THREE.DoubleSide,depthTest:true}));
  pointer.rotation.x=-Math.PI/2;pointer.position.y=.885;pivot.add(pointer);
  const gem=makeGlow(pivot,rune.color,.115,[0,1.18,0]);
  const light=new THREE.PointLight(rune.color,1.1,3.5,2);light.position.y=1.25;pivot.add(light);
  // In-world stone clue replaces a UI text label. No puzzle state is altered.
  box(pivot,0x233b32,[.57,.16,.36],[.55,.25,.46],false);
  box(pivot,0x789082,[.57,.298,.36],[.49,.035,.40],false);
  const carvedHeading=new THREE.Group();
  carvedHeading.position.set(.57,.32,.36);
  carvedHeading.rotation.y=-rune.target*Math.PI/2;
  pivot.add(carvedHeading);
  const engraving=new THREE.Shape();
  engraving.moveTo(0,.17);engraving.lineTo(.125,.015);
  engraving.lineTo(.05,.015);engraving.lineTo(.05,-.15);
  engraving.lineTo(-.05,-.15);engraving.lineTo(-.05,.015);
  engraving.lineTo(-.125,.015);engraving.closePath();
  const carvedArrow=new THREE.Mesh(new THREE.ShapeGeometry(engraving),
    new THREE.MeshBasicMaterial({color:0x20382f,side:THREE.DoubleSide}));
  carvedArrow.rotation.x=-Math.PI/2;
  carvedHeading.add(carvedArrow);
  pivot.traverse(o=>{if(o.isMesh){o.userData={kind:'rune',index:rune.index};clickables.push(o);}});
  return {pivot,ring,pointer,gem,light};
}
function makeGate(parent,gate,clickables){
  const position=world(gate);
  const group=new THREE.Group();group.position.set(position.x,0,position.z);parent.add(group);
  box(group,0x34443f,[0,.72,0],[CELL*.94,1.46,CELL*.94]);
  box(group,0x818b80,[0,1.49,0],[CELL*1.01,.16,CELL*1.01]);
  box(group,0x9aa69b,[0,1.53,0],[CELL*.71,.06,CELL*.71],false);
  const symbol=new THREE.Mesh(new THREE.TorusGeometry(.18,.032,4,16),new THREE.MeshBasicMaterial({color:0xa8e0cc}));
  symbol.rotation.x=-Math.PI/2;symbol.position.y=1.595;group.add(symbol);
  group.traverse(o=>{if(o.isMesh){o.userData={kind:'gate',index:gate.index};clickables.push(o);}});
  return {group, symbol};
}
function makeExit(parent, cell){
  const p=world(cell);const group=new THREE.Group();group.position.set(p.x,p.y,p.z);parent.add(group);
  cylinder(group,mat(0x495752),.46,.53,.23,10,.19);
  cylinder(group,mat(0xa4aea3),.39,.44,.12,10,.35);
  cylinder(group,mat(0x283e3c),.29,.32,.12,12,.44);
  const flame=makeGlow(group,0xd1f6e4,.23,[0,.9,0]);
  const light=new THREE.PointLight(0xb0e8dc,1.8,4,2);light.position.y=1.1;group.add(light);
  const circle=new THREE.Mesh(new THREE.TorusGeometry(.35,.028,5,30),new THREE.MeshBasicMaterial({color:0xa9dacd}));
  circle.rotation.x=-Math.PI/2;circle.position.y=.54;group.add(circle);
  return {group,flame,circle,light};
}
function makePlayer(parent,initial){
  const body=new THREE.Group();body.position.copy(world(initial));body.position.y=.13;parent.add(body);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.29,16),new THREE.MeshBasicMaterial({color:0x182c2c,transparent:true,opacity:.40,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-.065;body.add(shadow);
  const cape=new THREE.Mesh(new THREE.ConeGeometry(.30,.78,6),mat(0x556a87));cape.position.y=.48;cape.rotation.y=Math.PI/6;cape.castShadow=true;body.add(cape);
  box(body,0x25333a,[0,.22,.14],[.16,.37,.14]);
  const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.24,1),mat(0xcebcae));head.position.y=.92;head.castShadow=true;body.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.245,8,5,0,Math.PI*2,0,Math.PI*.58),mat(0x272a2e));
  hair.position.y=1.03;hair.castShadow=true;body.add(hair);
  box(body,0x25343b,[-.12,.13,.05],[.13,.24,.17]);
  box(body,0x25343b,[.12,.13,.05],[.13,.24,.17]);
  // Small lantern with an actual luminous mesh, not a billboard/sprite.
  const lantern=box(body,0x2b3436,[.30,.48,-.08],[.22,.31,.20]);
  lantern.material=mat(0x2d3a39);
  makeGlow(body,0xf4d6a3,.082,[.30,.48,-.08]);
  const light=new THREE.PointLight(0xe2c69c,.7,2.5,2);light.position.set(.3,.52,-.08);body.add(light);
  return {body,cape,head,light};
}

export function createDiorama(canvas,maze) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
  renderer.setClearColor(0xffffff,1);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NoToneMapping;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
  const camera=new THREE.OrthographicCamera(-16,16,12,-12,.1,130);
  // True isometric: equal world-axis projections; 45-degree yaw, 35.264-degree elevation.
  camera.position.set(25,25,25);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xeaf9f5,0x34443d,1.55));
  const sun=new THREE.DirectionalLight(0xffffff,2.12);
  sun.position.set(-12,27,17);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-23;sun.shadow.camera.right=23;sun.shadow.camera.top=23;sun.shadow.camera.bottom=-23;
  sun.shadow.camera.near=1;sun.shadow.camera.far=70;sun.shadow.bias=-.0005;scene.add(sun);
  const table=new THREE.Mesh(new THREE.PlaneGeometry(150,150),mat(0xffffff));
  // Keep the tabletop UNDER the entire 4.9-unit shaft; never bisect the stairs.
  table.rotation.x=-Math.PI/2;table.position.y=-8.4;table.receiveShadow=true;scene.add(table);
  const stage=new THREE.Group();scene.add(stage);
  const boardSize=(RUIN_RADIUS+.55)*CELL;
  // Circular cutaway: a thick annular island; the open centre exposes the spiral shaft.
  const annulus=new THREE.Shape();annulus.absarc(0,0,boardSize,0,Math.PI*2,false);
  const hole=new THREE.Path();hole.absarc(0,0,WELL.radius+.04,0,Math.PI*2,true);annulus.holes.push(hole);
  const strata=new THREE.ExtrudeGeometry(annulus,{depth:1.03,bevelEnabled:false,curveSegments:48});
  strata.rotateX(-Math.PI/2);
  const island=new THREE.Mesh(strata,mat(0x46554f,{side:THREE.DoubleSide}));
  island.position.y=-1.27;island.castShadow=true;island.receiveShadow=true;stage.add(island);
  const bottomLip=new THREE.Mesh(new THREE.TorusGeometry(boardSize,.21,5,58),mat(0x283b36));
  bottomLip.rotation.x=Math.PI/2;bottomLip.position.y=-1.16;stage.add(bottomLip);
  ruinPerimeter(stage,RUIN_RADIUS*CELL+.43,maze.start);
  buildWell(stage);
  const clickables=[];
  const tiles=[];
  for(let z=0;z<SIZE;z++) for(let x=0;x<SIZE;x++){
    if(!withinRuin(x,z))continue;
    const p=world({x,z});const h=hash(x,z);
    const solid=!maze.grid[z][x];
    const inner=Math.hypot(p.x,p.z)<WELL.radius+.12;
    if(inner){
      // No square walls over the well, even if the logical tile is blocked.
      // Invisible collision/picking targets follow the descending path.
      if(!solid){
        const picking=new THREE.Mesh(new THREE.PlaneGeometry(CELL*.92,CELL*.92),
          new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
        picking.rotation.x=-Math.PI/2;
        picking.position.set(p.x,p.y+.06,p.z);
        picking.userData={kind:'tile',x,z};stage.add(picking);clickables.push(picking);
      }
      continue;
    }
    if(solid){
      // Low collapsed stones by the stairhead keep the upper spiral visible.
      // Original impassable grid cells remain impassable.
      if(isStairheadClearance(p.x,p.z,CELL)){
        const rubble=box(stage,PALETTE.rock[Math.floor(h*5)],
          [p.x,-.18,p.z],[CELL*.87,.20,CELL*.87],false);
        rubble.userData.kind='wall';
        continue;
      }
      // Weathered, short, visibly stacked stonework: not tall concrete blocks.
      const height=.78+h*.40;
      const column=box(stage,PALETTE.rock[Math.floor(h*5)],
        [p.x,height/2-.08,p.z],[CELL*.985,height,CELL*.985]);
      if(hash(z,x,7)>.35){
        box(stage,0x849187,[p.x,height-.055,p.z],[CELL*1.005,.10,CELL*1.005],false);
      }
      if(hash(x,z,54)>.60){
        box(stage,0x334b41,[p.x+CELL*.23,height+.012,p.z-CELL*.23],[CELL*.26,.045,CELL*.22],false);
      }
      column.userData.kind='wall';
    } else {
      const slab=box(stage,PALETTE.floor[Math.floor(h*5)],
        [p.x,p.y-.105,p.z],[CELL*.965,.22,CELL*.965],false);
      slab.userData={kind:'tile',x,z};clickables.push(slab);tiles.push(slab);
      if(hash(x,z,9)>.76 && !maze.runes.some(r=>r.x===x&&r.z===z)){
        tuft(stage,p.x+(h-.5)*.65,p.z+(hash(z,x)-.5)*.6,.19,PALETTE.moss[Math.floor(h*4)]);
      }
      if(hash(x,z,55)>.93) {
        box(stage,0x93a69b,[p.x-.27,.016,p.z+.26],[.23,.03,.06],false);
      }
    }
  }
  // Sparse ruins and three old trees outside the footprint; no square border corners.
  for(let k=0;k<36;k++){
    const a=k*2.399963, radius=RUIN_RADIUS*CELL+.95+hash(k,11)*.75;
    const x=Math.cos(a)*radius,z=Math.sin(a)*radius;
    box(stage,PALETTE.rock[k%PALETTE.rock.length],[x,-.41,z],[.20+hash(k,2)*.42,.12+hash(k,3)*.32,.22],false);
  }
  [[-8.9,-6.2],[9.0,-5.5],[-5.5,-9.25]].forEach(([x,z],index)=>twistedTree(stage,x,z,index));
  const visuals={gates:maze.gates.map(g=>makeGate(stage,g,clickables)),runes:maze.runes.map(r=>makeRune(stage,r,clickables))};
  const exit=makeExit(stage,maze.exit);
  const player=makePlayer(stage,maze.start);
  const ray=new THREE.Raycaster();
  const mouse=new THREE.Vector2();
  let zoom=1;
  let screenWidth=0,screenHeight=0;
  const target=new THREE.Vector3();const lookAt=new THREE.Vector3();
  const direction=new THREE.Vector3(1,1,1).normalize();
  function resize(){
    const w=canvas.clientWidth||window.innerWidth,h=canvas.clientHeight||window.innerHeight;
    if(w===screenWidth&&h===screenHeight)return;
    screenWidth=w;screenHeight=h;
    const aspect=w/h;
    // Keep one fixed isometric camera on every screen size; only framing changes.
    const vertical=aspect<.85?29:26;
    camera.left=-vertical*aspect/(2*zoom);camera.right=vertical*aspect/(2*zoom);
    camera.top=vertical/(2*zoom);camera.bottom=-vertical/(2*zoom);
    camera.updateProjectionMatrix();
    const factor=aspect<.85?2.35:2.15;
    renderer.setPixelRatio(1);
    renderer.setSize(Math.max(160,Math.floor(w/factor)),Math.max(170,Math.floor(h/factor)),false);
    renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';
  }
  function setZoom(next){zoom=THREE.MathUtils.clamp(next,.72,1.65);screenWidth=0;resize();return zoom;}
  function pick(clientX,clientY){
    const rect=canvas.getBoundingClientRect();
    mouse.set(((clientX-rect.left)/rect.width)*2-1,-((clientY-rect.top)/rect.height)*2+1);
    ray.setFromCamera(mouse,camera);
    const hit=ray.intersectObjects(clickables,false)[0];
    return hit?.object.userData||null;
  }
  function draw(now,dt,cell,moving){
    resize();
    const pos=player.body.position;
    if(!moving){pos.y=terrainY(cell)+.13+Math.sin(now*1.8)*.012;}
    player.cape.rotation.z=moving?Math.sin(now*13)*.035:Math.sin(now*2)*.012;
    for(let i=0;i<3;i++){
      const rune=maze.runes[i], v=visuals.runes[i],gate=visuals.gates[i];
      v.pointer.rotation.z=-(rune.phase*Math.PI/2);
      v.gem.position.y=1.18+Math.sin(now*2.7+i)*.10;
      v.gem.rotation.y+=dt*.6;
      v.ring.material.color.setHex(rune.solved?0x75a092:rune.color);
      v.light.intensity=rune.solved?.35:1.1;
      const y=rune.solved?-2.2:0;
      gate.group.position.y=THREE.MathUtils.damp(gate.group.position.y,y,5,dt);
    }
    exit.flame.position.y=.9+Math.sin(now*2.3)*.12;
    exit.flame.rotation.y+=dt*.35;
    exit.circle.rotation.z=now*.3;
    // No screen-dependent camera rotation or player-follow behaviour.
    const focal=new THREE.Vector3(0,0,0);
    target.lerp(focal,Math.min(1,dt*2));
    camera.position.copy(target).addScaledVector(direction,43);
    lookAt.copy(target);camera.lookAt(lookAt);
    renderer.render(scene,camera);
  }
  resize();draw(0,.016,maze.start,false);
  return { renderer,scene,camera,player,visuals,draw,pick,setZoom,getZoom:()=>zoom,resize,dispose:()=>renderer.dispose() };
}