import * as T from 'three';
import {getVehicle,type Vehicle,type VehicleId} from '../data/vehicles';
const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
/** Authored geometry in metres. +X is front. Wheels turn about Z. */
export function buildCar(vehicle:Vehicle=getVehicle('model3')){
 const root=new T.Group();root.name=vehicle.id;const body=new T.Group();body.name='body';root.add(body);body.userData={part:'shell',shell:true,explode:V(0,1.15,0)};
 const paint=new T.MeshPhysicalMaterial({color:vehicle.color,metalness:.7,roughness:.26,clearcoat:1,clearcoatRoughness:.15});
 const glass=new T.MeshStandardMaterial({color:0x12252e,metalness:.7,roughness:.17});const rubber=new T.MeshStandardMaterial({color:0x111519,roughness:.91});const black=new T.MeshStandardMaterial({color:0x20272b,roughness:.53,metalness:.3});const silver=new T.MeshStandardMaterial({color:0xa6b3bb,roughness:.25,metalness:.87});const copper=new T.MeshStandardMaterial({color:0xc87942,metalness:.8,roughness:.3});const pack=new T.MeshStandardMaterial({color:0x68797d,metalness:.65,roughness:.4});
 const headlight=new T.MeshStandardMaterial({color:0xe2f5ff,emissive:0xc5ecff,emissiveIntensity:2});const taillight=new T.MeshStandardMaterial({color:0x681d22,emissive:0xff253a,emissiveIntensity:1});
 headlight.userData.light=true;taillight.userData.light=true;
 const orange=new T.MeshStandardMaterial({color:0xf1953e,roughness:.4});const blue=new T.MeshStandardMaterial({color:0x42a5c8,metalness:.4,roughness:.4});
 const geoCache=new Map<string,T.BufferGeometry>();const partMaterials=new Map<string,T.Material>();
 function mesh(g:T.BufferGeometry,m:T.Material,parent:T.Object3D,pos:T.Vector3,part:string){const matKey=m.uuid+part;if(part!=='shell'){if(!partMaterials.has(matKey))partMaterials.set(matKey,m.clone());m=partMaterials.get(matKey)!;}const o=new T.Mesh(g,m);o.position.copy(pos);o.userData.part=part;parent.add(o);return o;}
 function box(size:number[],pos:number[],mat:T.Material=paint,parent:T.Object3D=body,part='shell'){const key=size.join();if(!geoCache.has(key))geoCache.set(key,new T.BoxGeometry(...size as [number,number,number]));return mesh(geoCache.get(key)!,mat,parent,V(...pos as[number,number,number]),part);}
 function cylinder(radius:number,length:number,pos:number[],mat:T.Material,parent:T.Object3D,part:string){const key=`c${radius},${length}`;if(!geoCache.has(key))geoCache.set(key,new T.CylinderGeometry(radius,radius,length,32));const o=mesh(geoCache.get(key)!,mat,parent,V(...pos as[number,number,number]),part);o.rotation.x=Math.PI/2;return o;}
 function panel(points:number[][],mat:T.Material,parent:T.Object3D=body,part='shell'){const g=new T.BufferGeometry();const data:number[]=[];for(let i=1;i<points.length-1;i++)data.push(...points[0],...points[i],...points[i+1]);g.setAttribute('position',new T.Float32BufferAttribute(data,3));g.computeVertexNormals();const o=mesh(g,mat,parent,V(0,0,0),part);return o;}
 function line(points:number[][],mat:T.Material,parent:T.Object3D,part:string,r=.012){const curve=new T.CatmullRomCurve3(points.map(p=>V(...p as[number,number,number])));return mesh(new T.TubeGeometry(curve,24,r,6,false),mat,parent,V(0,0,0),part);}
 const L=vehicle.length/2,W=vehicle.width/2,wb=vehicle.wheelbase/2,r=vehicle.radius;
 const top=vehicle.height-r,angular=vehicle.shape==='angular',hatch=vehicle.shape==='hatch';const shoulder=.45,roofFront=angular?.7:.52,roofRear=hatch?-1.38:angular?-1.12:-.65;
 // Side silhouette with actual wheel openings instead of solid cubes through tyres.
 const side=new T.Shape();side.moveTo(-L+.06,-.12);const arch=r+.075;
 let x=-L+.06;for(let i=0;i<=180;i++){x=-L+.06+i*(vehicle.length-.12)/180;let y=-.12;for(const axle of [-wb,wb]){const d=x-axle;if(Math.abs(d)<arch)y=Math.max(y,Math.sqrt(arch*arch-d*d));}side.lineTo(x,y);}side.lineTo(L-.03,.28);side.quadraticCurveTo(L-.15,.46,L-.5,.46);side.lineTo(-L+.4,.46);side.quadraticCurveTo(-L+.04,.4,-L+.06,.23);side.closePath();
 const sideGeo=new T.ExtrudeGeometry(side,{depth:.045,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.015,bevelThickness:.012});
 for(const sign of [-1,1]){mesh(sideGeo,paint,body,V(0,0,sign>0?W-.045:-W),'shell');
 // Trim follows the wheel arch, leaving an open space around the tyre.
 for(const axle of [-wb,wb]){const pts=Array.from({length:25},(_,i)=>{const a=Math.PI-i/24*Math.PI;return[axle+Math.cos(a)*arch,Math.sin(a)*arch,sign*(W+.008)];});line(pts,angular?black:paint,body,'shell',angular?.029:.018);}
 box([vehicle.wheelbase-2*r,.055,.07],[0,-.12,sign*(W-.02)],black);
 }
 // Hood with a real hinge; rear deck. Top body panels terminate at the glazing.
 const hood=new T.Group();hood.position.set(.85,shoulder,0);hood.userData={part:'shell',hinge:'hood',shell:true};body.add(hood);
 panel([[0,0,-W*.94],[L-.9,-.11,-W*.8],[L-.82,-.11,W*.8],[0,0,W*.94]],paint,hood);
 const rearDeck=hatch||angular?-L+.15:roofRear-.55;
 panel([[-L+.05,.32,-W*.8],[rearDeck,.47,-W*.94],[rearDeck,.47,W*.94],[-L+.05,.32,W*.8]],paint);
 // Glazed cabin with model-specific roof and window contour.
 const cabin=new T.Group();body.add(cabin);const zroof=W*.77,zbase=W*.94;
 const a=V(1.02,shoulder,0),b=V(roofFront,top-.08,0),c=V(roofRear,top,0),d=V(hatch?-L+.25:angular?-L+.25:-1.43,shoulder,0);
 const roofPts=[[b.x,b.y,-zroof],[c.x,c.y,-zroof],[c.x,c.y,zroof],[b.x,b.y,zroof]];
 panel(roofPts,vehicle.id==='model3'?glass:paint,cabin);
 panel([[a.x,a.y,-zbase],[b.x,b.y,-zroof],[b.x,b.y,zroof],[a.x,a.y,zbase]],glass,cabin);
 panel([[c.x,c.y,zroof],[c.x,c.y,-zroof],[d.x,d.y,-zbase],[d.x,d.y,zbase]],glass,cabin);
 for(const sign of [-1,1]){
 const windowPts=[[-.34,shoulder,sign*zbase],[d.x,d.y,sign*zbase],[c.x,c.y,sign*zroof],[-.34,top-.025,sign*zroof]];panel(sign>0?windowPts:[...windowPts].reverse(),glass,cabin);
 line([[a.x,a.y,sign*zbase],[b.x,b.y,sign*zroof],[c.x,c.y,sign*zroof],[d.x,d.y,sign*zbase]],paint,cabin,'shell',.035);
 line([[-.34,.47,sign*(zbase+.01)],[-.34,top-.02,sign*zroof]],black,cabin,'shell',.027);
 // Front door skin and glazing rotate around a proper front hinge.
 const door=new T.Group();door.position.set(.88,.43,sign*(W+.023));door.userData={part:'shell',hinge:'door',sign,shell:true};body.add(door);
 panel([[0,0,0],[-1.13,0,0],[-1.13,-.43,0],[0,-.43,0]],paint,door);
 panel([[0,.025,0],[-1.13,.025,0],[-1.13,top-.49,-sign*.14],[-.38,top-.51,-sign*.14]],glass,door);
 line([[0,0,0],[-1.13,0,0],[-1.13,-.43,0],[0,-.43,0],[0,0,0]],black,door,'shell',.007);
 box([.13,.018,.018],[-.9,-.09,sign*.013],silver,door);box([.2,.07,.13],[.02,.11,sign*.12],black,door);
 // A simple rear door seam and flush handle.
 line([[-.35,.44,sign*(W+.02)],[-.42,-.09,sign*(W+.02)]],black,body,'shell',.006);box([.13,.018,.02],[-1.0,.33,sign*(W+.025)],silver);
 }
 // Front / rear bumpers, grille, distinctive light signatures.
 box([.14,.25,vehicle.width*.88],[L-.06,.13,0],paint);box([.09,.25,vehicle.width*.88],[-L+.05,.13,0],paint);
 box([.025,.09,vehicle.width*.53],[L+.016,.045,0],black);box([.023,.05,vehicle.width*.72],[-L-.01,.0,0],black);
 if(hatch){panel([[L+.019,.31,-.38],[L+.023,.16,0],[L+.019,.31,.38],[L+.019,.35,0]],black);line([[L+.03,.32,-.39],[L+.03,.16,0],[L+.03,.32,.39]],silver,body,'shell',.014);}
 for(const sign of [-1,1]){
 if(angular){for(let i=0;i<4;i++){box([.025,.065,.065],[L+.02,.32,sign*(.43+i*.085)],headlight);box([.025,.065,.065],[-L-.01,.32,sign*(.43+i*.085)],taillight);}}
 else{const lamp=box([.025,hatch?.09:.035,.36],[L-.0,.33,sign*W*.65],headlight);lamp.rotation.y=sign*.08;box([.026,.055,hatch?.18:.4],[-L-.008,.34,sign*W*.65],taillight);}
 }
 // Minimal interior remains visible when doors are open / body is lifted.
 const interior=new T.Group();interior.userData={part:'shell',shell:true};body.add(interior);box([2.3,.06,1.5],[-.1,.0,0],black,interior);
 for(const x0 of [.15,-.85])for(const z of [-.43,.43]){box([.5,.14,.45],[x0,.16,z],black,interior);const seat=box([.11,.5,.44],[x0-.22,.42,z],black,interior);seat.rotation.z=-.14;box([.12,.15,.3],[x0-.25,.75,z],black,interior);}
 box([.14,.32,.46],[.77,.5,0],black,interior);box([.02,.19,.3],[.86,.57,0],blue,interior);
 const steering=mesh(new T.TorusGeometry(.13,.018,8,24),black,interior,V(.65,.5,.44),'shell');steering.rotation.y=Math.PI/2;
 // Battery, chassis and independently explodable axle assemblies.
 const battery=new T.Group();battery.userData={part:'battery',explode:V(0,-.65,0)};root.add(battery);
 box([vehicle.wheelbase-.35,.15,vehicle.width*.79],[0,-.12,0],pack,battery,'battery');
 const cols=vehicle.id==='leaf'?8:6,rows=vehicle.id==='leaf'?3:2;
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const px=(col-(cols-1)/2)*(vehicle.wheelbase-.5)/cols,pz=(row-(rows-1)/2)*1.3/rows;box([(vehicle.wheelbase-.6)/cols,.11,1.15/rows],[px,-.015,pz],vehicle.id==='leaf'?blue:pack,battery,'battery');}
 if(vehicle.liquidCooling)for(const z of [-.45,0,.45])line([[-1.1,-.22,z],[1.1,-.22,z]],blue,battery,'cooling',.015);
 const driveX=vehicle.drive==='front'?wb:-wb;
 const unit=new T.Group();unit.position.set(driveX,.1,0);unit.userData={part:'rotor',explode:V(vehicle.drive==='front'?.65:-.65,.2,0)};root.add(unit);
 const motor=cylinder(.23,.55,[0,0,0],silver,unit,'rotor');for(let i=0;i<9;i++)cylinder(.242,.016,[0,0,(i-4)*.05],pack,unit,'stator');
 const rotor=new T.Group();rotor.userData={part:'rotor',spin:'motor',spinAxis:'z'};unit.add(rotor);cylinder(.08,.73,[0,0,0],copper,rotor,'rotor');box([.28,.05,.025],[0,0,.38],copper,rotor,'rotor');
 box([.42,.18,.52],[.12,.32,0],silver,unit,'inverter');box([.28,.25,.25],[-.25,-.02,0],pack,unit,'gears');
 line([[0,.03,-.55],[driveX*.65,.14,-.55],[driveX,.43,-.18]],orange,root,'inverter',.023);
 for(const axle of [-wb,wb]){
 const axleGroup=new T.Group();axleGroup.position.x=axle;axleGroup.userData={part:'gears',explode:V(axle>0?.2:-.2,0,0)};root.add(axleGroup);
 cylinder(.035,vehicle.track,[0,.03,0],silver,axleGroup,'gears');
 for(const sign of [-1,1]){
 const suspension=new T.Group();suspension.position.z=sign*vehicle.track/2;suspension.userData.part='suspension';axleGroup.add(suspension);
 line([[0,-.1,0],[-.28,-.1,-sign*.28],[.2,-.1,-sign*.28]],silver,suspension,'suspension',.02);
 const springPoints=Array.from({length:100},(_,i)=>{const a=i/99*10*Math.PI;return[.065*Math.cos(a),.05+i/99*.35,.065*Math.sin(a)-sign*.1];});line(springPoints,copper,suspension,'suspension',.012);
 const steer=new T.Group();steer.userData={steer:axle>0,part:'wheels'};suspension.add(steer);
 const wheel=new T.Group();wheel.userData={part:'wheels',spin:sign>0?'left':'right',spinAxis:'z',spinSign:-1,explode:V(0,0,sign*.48)};steer.add(wheel);
 const tyre=mesh(new T.TorusGeometry(r-.075,.075,12,48),rubber,wheel,V(0,0,0),'wheels');tyre.scale.z=1.65;
 cylinder(r*.70,.16,[0,0,0],black,wheel,'wheels');
 for(const face of [-1,1]){const lip=mesh(new T.TorusGeometry(r*.69,.011,6,40),silver,wheel,V(0,0,face*.095),'wheels');
 for(let i=0;i<10;i++){const theta=i/10*Math.PI*2;const spoke=box([r*.55,.025,.018],[Math.cos(theta)*r*.36,Math.sin(theta)*r*.36,face*.1],silver,wheel,'wheels');spoke.rotation.z=theta+.15;spoke.userData.detail=face<0||i%2===1;}}
 cylinder(.055,.22,[0,0,0],silver,wheel,'wheels');
 // Disc rotates with the hub, while caliper remains attached to the upright.
 cylinder(r*.52,.015,[0,0,-sign*.105],silver,wheel,'brakes');
 for(let i=0;i<20;i++){const a=i/20*Math.PI*2;const hole=cylinder(.009,.018,[Math.cos(a)*r*.42,Math.sin(a)*r*.42,-sign*.118],black,wheel,'brakes');hole.userData.detail=true;}
 box([.08,.17,.07],[r*.43,0,-sign*.11],copper,steer,'brakes');
 // Instanced tread grooves; no per-groove materials.
 const tread=new T.InstancedMesh(new T.BoxGeometry(.012,.018,.16),black,48);const dummy=new T.Object3D();for(let i=0;i<48;i++){const a=i/48*Math.PI*2;dummy.position.set(Math.cos(a)*(r+.001),Math.sin(a)*(r+.001),0);dummy.rotation.z=a;dummy.updateMatrix();tread.setMatrixAt(i,dummy.matrix);}tread.userData.part='wheels';tread.userData.detail=true;wheel.add(tread);
 }
 }
 // Modest flow particles; animation follows the sign of battery power.
 for(let i=0;i<8;i++){const flow=box([.06,.025,.025],[0,.08,.6],orange,root,'inverter');flow.userData.flow=i;flow.userData.driveX=driveX;}
 root.traverse(o=>{if(o instanceof T.Mesh)(o.material as T.Material).side=T.DoubleSide;if(o.userData.explode)o.userData.base=o.position.clone();if(o.userData.hinge){o.userData.closed=o.rotation.clone();}});
 root.userData={vehicle:vehicle.id,paint,headlight,taillight};return root;
}
