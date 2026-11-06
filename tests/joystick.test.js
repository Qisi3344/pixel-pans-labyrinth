import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeJoystick,joystickGridStep} from '../src/joystick.js';

test('stick is limited to the circular travel radius',()=>{
 assert.deepEqual(normalizeJoystick(0,0),{x:0,y:0});
 assert.deepEqual(normalizeJoystick(500,0,50),{x:1,y:0});
 const d=normalizeJoystick(40,-40,40);
 assert.ok(Math.abs(Math.hypot(d.x,d.y)-1)<1e-9);
 assert.deepEqual(normalizeJoystick(NaN,6),{x:0,y:0});
});
test('deadzone prevents movement and joystick release stops new steps',()=>{
 assert.equal(joystickGridStep(0,0),null);
 assert.equal(joystickGridStep(.1,.1),null);
 assert.deepEqual(joystickGridStep(.99,.57),{dx:1,dz:0});
 assert.deepEqual(joystickGridStep(-.99,.57),{dx:0,dz:1});
 assert.deepEqual(joystickGridStep(-.99,-.57),{dx:-1,dz:0});
 assert.deepEqual(joystickGridStep(.99,-.57),{dx:0,dz:-1});
});
