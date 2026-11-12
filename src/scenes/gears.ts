import type {Vehicle} from '../data/vehicles';
import * as T from 'three';import{kit,colors as c,finish}from'./primitives';
export function build(ratio=9,_vehicle?:Vehicle){const root=new T.Group(),k=kit(root);const small=12,large=small*ratio;const module=2.4/(small+large);const r1=small*module/2,r2=large*module/2;
 const a=k.gear(small,module,[-r2,0,0],c.copper);a.userData.spin='motor';
 const b=k.gear(large,module,[r1,0,0],c.green);b.rotation.z=Math.PI/large;b.userData.spin='wheel';b.userData.phase=Math.PI/large;
 k.cyl(.06,1,[-r2,0,0],c.metal,'gears').rotation.set(Math.PI/2,0,0);
 for(const x of [-1.5,1.5]){const w=k.torus(.38,.09,[x,-1,0],c.dark,'wheels');w.rotation.set(0,0,0);w.userData.spin=x<0?'left':'right';k.box([.52,.05,.08],[x,-1,0],c.metal,'wheels',{spin:x<0?'left':'right'});}
 k.box([3,.07,.07],[0,-1,0],c.metal,'gears');k.box([.4,.35,.3],[0,-1,0],c.blue,'gears');k.box([2.8,1.3,.06],[0,0,-.18],c.dark,'shell',{shell:true});return finish(root);}
