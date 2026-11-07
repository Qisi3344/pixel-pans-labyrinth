/** World-space rune compass: north=-Z, east=+X, south=+Z, west=-X.
 * Scene stone clue, overworld pointer and inspector all use this convention.
 */
export const COMPASS_SYMBOLS=Object.freeze(['↑','→','↓','←']);
export const QUARTER_TURN=Math.PI/2;
export function headingAngle(phase){
 if(!Number.isInteger(phase))throw new TypeError('rune phase must be an integer');
 return -phase*QUARTER_TURN;
}
export function headingPosition(phase,radius=1){
 const a=phase*QUARTER_TURN;
 return Object.freeze({x:Math.sin(a)*radius,z:-Math.cos(a)*radius});
}
