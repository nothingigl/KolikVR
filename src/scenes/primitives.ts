import * as T from 'three';
export const colors={green:0xbde899,copper:0xde915a,blue:0x73b8e6,metal:0x83958d,dark:0x27342e,red:0xef8b76};
export type PartMesh=T.Mesh & {userData:{part?:string;spin?:'motor'|'wheel'|'left'|'right';base?:T.Vector3;explode?:T.Vector3;shell?:boolean}};
export function kit(root:T.Group){
 const geometries=new Map<string,T.BufferGeometry>(),materials=new Map<string,T.MeshStandardMaterial>();
 const material=(c:number,part="")=>{const key=c+part;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color:c,roughness:.5,metalness:.3}));return materials.get(key)!;};
 function mesh(g:T.BufferGeometry,c:number,pos:number[],part:string,extra:PartMesh['userData']={}){const m=new T.Mesh(g,material(c,part)) as PartMesh;m.position.set(pos[0],pos[1],pos[2]);m.userData={part,...extra};root.add(m);return m;}
 function box(size:number[],pos:number[],c:number,part:string,extra:PartMesh['userData']={}){const key='b'+size.join(',');if(!geometries.has(key))geometries.set(key,new T.BoxGeometry(...size as [number,number,number]));return mesh(geometries.get(key)!,c,pos,part,extra);}
 function cyl(r:number,len:number,pos:number[],c:number,part:string,extra:PartMesh['userData']={}){const key='c'+r+','+len;if(!geometries.has(key))geometries.set(key,new T.CylinderGeometry(r,r,len,32));const m=mesh(geometries.get(key)!,c,pos,part,extra);m.rotation.z=Math.PI/2;return m;}
 function torus(r:number,t:number,pos:number[],c:number,part:string){const key='t'+r+','+t;if(!geometries.has(key))geometries.set(key,new T.TorusGeometry(r,t,8,48));const m=mesh(geometries.get(key)!,c,pos,part);m.rotation.y=Math.PI/2;return m;}
 function gear(teeth:number,module:number,pos:number[],c:number){const radius=teeth*module/2;const shape=new T.Shape();for(let i=0;i<teeth*4;i++){const a=i/(teeth*4)*Math.PI*2;const r=radius+((i%4===1||i%4===2)?.9:-1.15)*module;const x=r*Math.cos(a),y=r*Math.sin(a);if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:.18,bevelEnabled:false});g.translate(0,0,-.09);const m=mesh(g,c,pos,'gears');return m;}
 return{box,cyl,torus,gear,material,mesh};
}
export function finish(root:T.Group){root.traverse(o=>{if(o instanceof T.Mesh){o.userData.base=o.position.clone();if(!o.userData.explode)o.userData.explode=o.position.clone().multiplyScalar(.35);}});return root;}
