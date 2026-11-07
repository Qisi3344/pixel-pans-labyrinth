import * as THREE from 'three';
const cube=new THREE.BoxGeometry(1,1,1);
const mat=(color,extra={})=>new THREE.MeshLambertMaterial({color,...extra});
function box(parent,color,where,scale,cast=true){
 const mesh=new THREE.Mesh(cube,typeof color==='number'?mat(color):color);
 mesh.position.set(...where);mesh.scale.set(...scale);mesh.castShadow=cast;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function createPlayer(parent,position){
  const body=new THREE.Group();body.position.copy(position);parent.add(body);
  const fabric=(color)=>mat(color,{side:THREE.DoubleSide});
  const burgundy=fabric(0x87373e),coatTrim=fabric(0xa6474b),deepRed=fabric(0x5d2733);
  const gold=fabric(0xc8b98b),cream=fabric(0xd9ca9a),skin=fabric(0xd7b7a0);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.32,16),
    new THREE.MeshBasicMaterial({color:0x142824,transparent:true,opacity:.36,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-.075;body.add(shadow);
  // Walking: actual leg and arm pivots, rather than a rigid moving figurine.
  const rig=new THREE.Group();body.add(rig);
  const legs=[],arms=[];
  for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.13,.34,.015);rig.add(leg);
    box(leg,skin,[0,-.15,0],[.105,.30,.115]);
    const shoe=box(leg,0x652832,[0,-.265,.104],[.18,.13,.26]);
    shoe.rotation.y=side*.04;
    box(leg,0xa14b4f,[0,-.195,.13],[.14,.028,.12],false);
    legs.push(leg);
  }

  const skirtRig=new THREE.Group();skirtRig.position.y=.78;rig.add(skirtRig);
  // Truncated low-poly yellow skirt with genuine small floral tesserae.
  const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.17,.38,.72,10,1,false),gold);
  skirt.position.y=.59-.78;skirt.castShadow=true;skirt.receiveShadow=true;skirtRig.add(skirt);
  const hem=new THREE.Mesh(new THREE.CylinderGeometry(.381,.405,.065,10),cream);
  hem.position.y=.235-.78;hem.castShadow=true;skirtRig.add(hem);
  const bodice=new THREE.Mesh(new THREE.CylinderGeometry(.16,.19,.32,8),cream);
  bodice.position.y=1.03;bodice.castShadow=true;rig.add(bodice);

  const floralColors=[0x9d4950,0xbd6662,0x607551,0x7e8c61];
  for(let i=0;i<15;i++){
    const a=.13+i*2.39996;
    const y=.31+(i%4)*.12;
    const r=.38-(y-.23)*(.21/.72);
    const spot=new THREE.Mesh(new THREE.IcosahedronGeometry(.035+(i%3)*.008,0),
      fabric(floralColors[i%floralColors.length]));
    spot.position.set(Math.sin(a)*r,y-.78,Math.cos(a)*r);
    spot.scale.set(1,.77,.32);spot.rotation.y=a;
    skirtRig.add(spot);
  }

  // Wine-red open-front long coat; the central gold dress remains visible.
  const cape=new THREE.Group();rig.add(cape);
  const coat=new THREE.Mesh(new THREE.CylinderGeometry(.195,.40,.93,14,1,true,.61,Math.PI*2-1.22),burgundy);
  coat.position.y=.72;coat.castShadow=true;coat.receiveShadow=true;cape.add(coat);
  for(const side of [-1,1]){
    const panel=box(cape,side<0?0x983a42:0x77333b,
      [side*.195,.69,.19],[.13,.80,.10]);
    panel.rotation.z=side*.065;
    // Lapels, shoulders, and small cuffs keep the outline legible at pixel size.
    const lapel=box(cape,coatTrim,[side*.14,1.095,.215],[.12,.19,.055],false);
    lapel.rotation.z=-side*.24;
    const arm=new THREE.Group();arm.position.set(side*.29,1.13,.02);
    rig.add(arm);arms.push(arm);
    const sleeve=box(arm,burgundy,[0,-.19,0],[.16,.40,.19]);
    sleeve.rotation.z=side*.14;
    box(arm,skin,[side*.04,-.41,.04],[.12,.10,.12]);
    box(cape,deepRed,[side*.18,.35,.22],[.06,.20,.06],false);
  }

  // Small face and asymmetric curled 1940s dark bob from the reference.
  const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.215,1),skin);
  head.position.y=1.355;head.castShadow=true;rig.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.245,10,6,0,Math.PI*2,0,Math.PI*.67),
    fabric(0x222326));
  hair.position.y=1.45;hair.castShadow=true;rig.add(hair);
  for(const side of [-1,1]){
    for(let i=0;i<3;i++){
      const curl=new THREE.Mesh(new THREE.IcosahedronGeometry(.085+(i%2)*.014,1),
        fabric(i===1?0x313035:0x252529));
      curl.position.set(side*(.208+i*.014),1.38-i*.10,.02+(i%2)*.05);
      curl.castShadow=true;rig.add(curl);
    }
  }
  // Tiny claret collar detail, not a modern cape or fantasy armour.
  box(rig,0xa74d51,[0,1.20,.19],[.12,.055,.07],false);
  return {body,cape,head,rig,skirtRig,legs,arms,walkPhase:0,walkBlend:0};
}

export function animatePlayer(player,dt,travelled=0,moving=false){
    player.walkPhase+=Math.max(0,travelled)*5.4;
    const isWalking=moving||travelled>.00001;
    player.walkBlend=THREE.MathUtils.damp(player.walkBlend,isWalking?1:0,12,dt);
    const gait=player.walkPhase,weight=player.walkBlend;
    const stride=Math.sin(gait)*.48*weight;
    player.legs[0].rotation.x=stride;
    player.legs[1].rotation.x=-stride;
    player.arms[0].rotation.x=-stride*.70;
    player.arms[1].rotation.x=stride*.70;
    player.rig.position.y=weight*(.012+.020*Math.cos(gait*2));
    player.rig.rotation.z=weight*.018*Math.sin(gait);
    player.skirtRig.rotation.z=weight*.065*Math.sin(gait+.45);
    player.skirtRig.rotation.x=weight*.045*Math.sin(gait*.73);
    player.cape.rotation.z=weight*.026*Math.sin(gait+.7);
}
