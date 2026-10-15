import {mkdir,cp,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const f of ['index.html','style.css','manifest.webmanifest','icon.svg','src','levels','skins'])await cp(f,`dist/${f}`,{recursive:true});
console.log('Static build ready in dist/');
