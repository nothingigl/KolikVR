import type{Vehicle}from'../data/vehicles';
import * as T from'three';import{kit,colors as c,finish}from'./primitives';
export function build(_ratio=9,_vehicle?:Vehicle){const root=new T.Group(),k=kit(root);
 const shell=k.mesh(new T.CylinderGeometry(1.36,1.36,1.25,64,1,true,0,Math.PI*1.55),c.metal,[0,0,0],'shell',{shell:true,explode:new T.Vector3(-1.5,0,0)});shell.rotation.z=Math.PI/2;
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const iron=k.box([1,.24,.3],[0,Math.cos(a)*1.08,Math.sin(a)*1.08],c.dark,'stator');iron.rotation.x=a;}
 // Copper windings are repeated via instancing; they encircle each stator tooth.
 const windings=new T.InstancedMesh(new T.TorusGeometry(.22,.026,6,20),k.material(c.copper,'stator'),72),dummy=new T.Object3D();let index=0;
 for(let tooth=0;tooth<12;tooth++){const a=tooth/12*Math.PI*2;for(let turn=0;turn<6;turn++){const r=.88+turn*.065;dummy.position.set(0,Math.cos(a)*r,Math.sin(a)*r);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(0,Math.cos(a),Math.sin(a)));dummy.scale.set(1.9,1,1);dummy.updateMatrix();windings.setMatrixAt(index++,dummy.matrix);}}windings.userData.part='stator';root.add(windings);
 for(const sign of [-1,1]){const cap=k.torus(1.26,.085,[sign*.7,0,0],c.metal,'shell');cap.userData.shell=true;cap.userData.explode=new T.Vector3(sign*.8,0,0);k.torus(.24,.065,[sign*.82,0,0],c.metal,'rotor');
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const bolt=k.cyl(.045,.08,[sign*.76,Math.cos(a)*1.26,Math.sin(a)*1.26],c.dark,'shell',{shell:true,explode:new T.Vector3(sign*.8,0,0)});void bolt;}}
 const rotor=new T.Group();rotor.userData={spin:'motor',part:'rotor',base:new T.Vector3(),explode:new T.Vector3(1.3,0,0)};root.add(rotor);
 function moveToRotor(o:T.Object3D){root.remove(o);rotor.add(o);}
 moveToRotor(k.cyl(.58,1.12,[0,0,0],c.dark,'rotor'));moveToRotor(k.cyl(.105,2.65,[0,0,0],c.metal,'rotor'));
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const magnet=k.box([1.04,.11,.24],[0,Math.cos(a)*.59,Math.sin(a)*.59],i%2?c.blue:c.red,'rotor');magnet.rotation.x=a;moveToRotor(magnet);}
 for(let i=0;i<12;i++){const ring=k.torus(.58,.008,[-.51+i*.09,0,0],c.metal,'rotor');moveToRotor(ring);}
 const field=new T.Group();field.userData={spin:'motor',part:'stator'};root.add(field);
 for(const sign of [-1,1]){const arrow=k.mesh(new T.ConeGeometry(.07,.24,8),c.green,[.9,0,sign*.81],'stator');arrow.rotation.x=sign*Math.PI/2;root.remove(arrow);field.add(arrow);}
 finish(root);rotor.traverse(o=>{if(o instanceof T.Mesh)o.userData.explode=new T.Vector3();});return root;}
