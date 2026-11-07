import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('entry loader uses statically resolvable dynamic imports for BOTH chapters',()=>{
 const src=readFileSync(new URL('../src/boot.js',import.meta.url),'utf8');
 assert.match(src,/import\(['"]\.\/main\.js['"]\)/);
 assert.match(src,/import\(['"]\.\/chapter2-main\.js['"]\)/);
 assert.doesNotMatch(src,/import\(chapter\)/);
});
test('index.html always loads the bundled Vite entry',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/<script\s+type="module"\s+src="\/src\/boot\.js"><\/script>/);
});
test('both game entrypoints import their CSS',()=>{
 for(const path of ['main.js','chapter2-main.js']){
  const js=readFileSync(new URL('../src/'+path,import.meta.url),'utf8');
  assert.match(js,/import\s+['"]\.\/[^'"]+\.css['"]/,'missing CSS import in '+path);
 }
});