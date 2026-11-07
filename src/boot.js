// Preserve chapter one unchanged; the URL only chooses which chapter to load.
const params=new URLSearchParams(location.search);
const chapter=params.get('stage')==='2'?'./chapter2-main.js':'./main.js';
import(chapter);