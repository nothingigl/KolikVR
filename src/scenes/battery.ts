import{getVehicle,type Vehicle}from'../data/vehicles';
import * as T from'three';import{kit,colors as c,finish}from'./primitives';
export function build(_ratio=9,vehicle:Vehicle=getVehicle('model3')){const root=new T.Group(),k=kit(root),leaf=vehicle.id==='leaf';
 k.box([3.8,.15,2.3],[0,-.22,0],c.dark,'shell',{shell:true,explode:new T.Vector3(0,-.4,0)});
 const geo=new T.BoxGeometry(leaf?.28:.24,leaf?.022:.4,leaf?.4:.18),mat=k.material(c.metal,'battery'),count=leaf?192:96,cells=new T.InstancedMesh(geo,mat,count),dummy=new T.Object3D();let index=0;
 if(leaf){for(let module=0;module<24;module++)for(let cell=0;cell<8;cell++){dummy.position.set((module%8-3.5)*.44,cell*.027-.1,(Math.floor(module/8)-1)*.66);dummy.updateMatrix();cells.setMatrixAt(index++,dummy.matrix);}}
 else{for(let x=0;x<12;x++)for(let z=0;z<8;z++){dummy.position.set((x-5.5)*.29,.02,(z-3.5)*.25);dummy.updateMatrix();cells.setMatrixAt(index++,dummy.matrix);}}
 cells.userData.part='battery';const lod=new T.LOD();lod.addLevel(cells,0);const low=k.box([3.5,.4,2.05],[0,0,0],c.metal,'battery');root.remove(low);lod.addLevel(low,8);root.add(lod);
 for(let i=0;i<4;i++)k.box([.03,.42,2.12],[(i-1.5)*.9,.02,0],c.dark,'battery');
 for(const z of [-.8,.8])k.box([3.5,.025,.03],[0,.24,z],c.copper,'battery');
 if(vehicle.liquidCooling){for(let z=0;z<5;z++)k.box([3.6,.04,.035],[0,-.12,(z-2)*.42],c.blue,'cooling');for(const x of [-1.8,1.8])k.box([.05,.04,1.75],[x,-.12,0],c.blue,'cooling');}
 else for(let i=0;i<18;i++)k.box([.02,.04,2.1],[(i-8.5)*.2,-.28,0],c.metal,'cooling');
 k.box([3.8,.07,2.3],[0,.32,0],c.metal,'shell',{shell:true,explode:new T.Vector3(0,1.0,0)});
 for(const x of [-1.9,1.9])for(const z of [-1.15,1.15])k.cyl(.05,.06,[x,.29,z],c.dark,'shell',{shell:true,explode:new T.Vector3(0,1,0)});
 return finish(root);}
