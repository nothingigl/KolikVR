import * as T from 'three';import{kit,colors as c,finish}from'./primitives';
export function build(){const root=new T.Group(),k=kit(root);
 k.box([4.8,.15,2.15],[0,.1,0],c.dark,'shell',{shell:true});
 // A skateboard EV layout: battery between axles, rear drive unit.
 k.box([2.5,.26,1.65],[.05,.32,0],c.green,'battery');for(let i=0;i<8;i++)k.box([.025,.02,1.6],[-1.03+i*.31,.46,0],c.dark,'battery');
 k.box([.6,.42,.65],[-1.7,.48,0],c.blue,'inverter');k.cyl(.35,.9,[-1.65,.4,.65],c.copper,'rotor',{spin:'motor'});
 k.box([.55,.33,.4],[-1.65,.37,-.15],c.metal,'gears');
 for(const x of [-1.65,1.65]){k.cyl(.055,2.6,[x,.28,0],c.metal,'gears').rotation.z=0;for(const z of [-1.32,1.32]){const w=k.cyl(.49,.25,[x,.3,z],c.dark,'wheels',{spin:z<0?'left':'right'});w.rotation.set(Math.PI/2,0,0);const hub=k.torus(.29,.035,[x,.3,z],c.metal,'wheels');hub.rotation.set(0,0,0);}}
 // Lightweight schematic body, hidden with the chassis toggle.
 const body=k.mesh(new T.EdgesGeometry(new T.BoxGeometry(4.55,1.1,2)),c.metal,[0,1,0],'shell',{shell:true});root.remove(body);body.geometry.dispose();
 const lines=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(4.55,1.1,2)),new T.LineBasicMaterial({color:0x78877b}));lines.position.y=1;lines.userData.shell=true;root.add(lines);
 for(let i=0;i<5;i++){const m=k.box([.13,.06,.12],[1-i*.65,.6,.05],c.green,'inverter');m.userData.flow=i;}
 return finish(root);}
