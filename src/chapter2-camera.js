/** Camera sizing in visible CSS pixels, independent of render resolution.
 * An orthographic camera never rotates with the phone; we adjust the framing
 * so the player AND a recognizable part of the ancient tree remain on-screen.
 */
export const VIEW_AZIMUTH = Object.freeze({x:1,z:1.3});
const horizontalLength=Math.hypot(VIEW_AZIMUTH.x,VIEW_AZIMUTH.z);
export const VIEW_RIGHT=Object.freeze({
  x:VIEW_AZIMUTH.z/horizontalLength,
  z:-VIEW_AZIMUTH.x/horizontalLength
});
export function screenHorizontal(a,b){
 return (a.x-b.x)*VIEW_RIGHT.x+(a.z-b.z)*VIEW_RIGHT.z;
}
export function chapterFraming({
 width,height,area='exterior',zoom=1,hero={x:-4.2,z:3.8},entrance={x:0,z:2.6}
}){
 const w=Math.max(1,Number(width)||1),h=Math.max(1,Number(height)||1);
 const aspect=w/h,portrait=aspect<.85;
 const scale=Math.max(.7,Math.min(1.6,Number(zoom)||1));
 let vertical,focus;
 if(area==='exterior'){
  if(portrait){
   const gap=Math.abs(screenHorizontal(hero,entrance));
   // Keep both the player and trunk visible with generous side margin.
   const requiredWidth=Math.max(10.0,gap+4.6);
   vertical=Math.max(20,requiredWidth/aspect);
   focus={x:(hero.x+entrance.x)*.5,y:2.0,z:(hero.z+entrance.z)*.5};
  } else {
   vertical=20.8;
   focus={x:0,y:2.0,z:.5};
  }
 } else {
  vertical=portrait?Math.max(14.5,8.5/aspect):20;
  focus=portrait?{x:hero.x,y:-1.4,z:hero.z}:{x:0,y:-.9,z:0};
 }
 // Use zoom in the real camera size, and keep aspect unchanged.
 const halfHeight=vertical/(2*scale);
 const halfWidth=halfHeight*aspect;
 return {left:-halfWidth,right:halfWidth,top:halfHeight,bottom:-halfHeight,portrait,focus,aspect};
}
