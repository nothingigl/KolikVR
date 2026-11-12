import * as T from 'three';import{kit,colors as c,finish}from'./primitives';
export function build(){const root=new T.Group(),k=kit(root);k.box([3.8,.2,2.3],[0,-.32,0],c.dark,'shell',{shell:true});
 // One instanced geometry for the 96 repeated cells.
 const geo=new T.CylinderGeometry(.105,.105,.48,12),mat=k.material(c.green),cells=new T.InstancedMesh(geo,mat,96),dummy=new T.Object3D();
 let index=0;for(let x=0;x<12;x++)for(let z=0;z<8;z++){dummy.position.set((x-5.5)*.29,0,(z-3.5)*.25);dummy.updateMatrix();cells.setMatrixAt(index++,dummy.matrix);}cells.userData.part='battery';root.add(cells);
 for(let x=0;x<4;x++)k.box([.025,.5,2.12],[(x-1.5)*.9,-.05,0],c.metal,'battery');
 for(let z=0;z<5;z++)k.box([3.6,.05,.05],[0,-.18,(z-2)*.42],c.blue,'cooling');
 for(const x of [-1.8,1.8])k.box([.06,.05,1.75],[x,-.18,0],c.blue,'cooling');
 k.box([3.8,.08,2.3],[0,.4,0],c.metal,'shell',{shell:true,explode:new T.Vector3(0,1.2,0)});const lod=new T.LOD();root.remove(cells);lod.addLevel(cells,0);const low=k.box([3.5,.48,2.05],[0,0,0],c.green,'battery');root.remove(low);lod.addLevel(low,8);root.add(lod);
 return finish(root);}
