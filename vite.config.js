import {defineConfig} from 'vite';
export default defineConfig({
 base:'./',
 build:{
  target:'es2022',
  rollupOptions:{
   output:{
    // Three.js is shared across chapters and should be cached once on navigation.
    manualChunks(id){
     if(id.includes('/node_modules/three/'))return 'three';
    }
   }
  }
 }
});
