import * as T from 'three';import{kit,colors as c,finish}from'./primitives';
export function build(){const root=new T.Group(),k=kit(root);
 // Axial view: stator ring, twelve copper coils, permanent-magnet rotor.
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const m=k.box([.8,.23,.32],[0,Math.cos(a)*1.05,Math.sin(a)*1.05],c.copper,'stator');m.rotation.x=a;}
 for(const x of [-.52,.52])k.torus(1.3,.07,[x,0,0],c.metal,'stator');
 k.cyl(.56,.96,[0,0,0],c.dark,'rotor',{spin:'motor'});k.cyl(.11,2.4,[0,0,0],c.metal,'rotor',{spin:'motor'});
 const rotor=new T.Group();rotor.userData.spin='motor';root.add(rotor);
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const m=k.box([.86,.18,.24],[0,Math.cos(a)*.58,Math.sin(a)*.58],i%2?c.blue:c.red,'rotor');m.rotation.x=a;root.remove(m);rotor.add(m);}
 const housing=k.cyl(1.42,1.15,[0,0,0],c.dark,'shell',{shell:true,explode:new T.Vector3(-1.5,0,0)});housing.material=new T.MeshStandardMaterial({color:c.metal,wireframe:true});
 for(let i=0;i<3;i++){const ring=k.torus(.8,.018,[.7+i*.06,0,0],c.green,'stator');ring.userData.spin='motor';}
 const field=new T.Group();field.userData.spin='motor';root.add(field);
 for(const sign of [-1,1]){const arrow=k.mesh(new T.ConeGeometry(.09,.3,8),c.green,[.85,0,sign*.84],'stator');arrow.rotation.x=sign*Math.PI/2;root.remove(arrow);field.add(arrow);}
 return finish(root);}
