import { ui } from '../i18n/ui';
import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import type { Simulation, ModuleId } from '../sim/model';
import {getVehicle,initialPresentation,type Presentation} from '../data/vehicles';
import { orbit,type CameraPreset } from '../adapters/orbit';
import { xrControls, type XRCallbacks } from '../adapters/xr';
import { QualityManager, type Quality } from './quality';
const builders={energy:()=>import('../scenes/energy'),motor:()=>import('../scenes/motor'),gears:()=>import('../scenes/gears'),regen:()=>import('../scenes/regen'),battery:()=>import('../scenes/battery')};
export function release(group:T.Group){const geo=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();group.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){geo.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach((m:T.Material)=>materials.add(m));}if(o instanceof T.InstancedMesh)o.dispose();});geo.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.clear();}
export async function createView(host:HTMLElement,sim:Simulation,callbacks:XRCallbacks&{fallback:()=>void;fps:(v:number)=>void},initialModule:ModuleId='energy',initialStyle:Presentation=initialPresentation){
 const scene=new T.Scene();scene.background=new T.Color(0x10161b);scene.fog=new T.Fog(0x10161b,14,35);
 const camera=new T.PerspectiveCamera(36,1,.05,80);const renderer=new T.WebGLRenderer({antialias:window.devicePixelRatio<1.6,powerPreference:'low-power'});renderer.xr.enabled=true;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
 host.appendChild(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label',ui.text157);
 const pmrem=new T.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();scene.environment=environment.texture;scene.environmentIntensity=.6;
 scene.add(new T.HemisphereLight(0xd4ebff,0x242720,2));const keyLight=new T.DirectionalLight(0xfff1dc,4);keyLight.position.set(4,6,2);scene.add(keyLight);const rim=new T.DirectionalLight(0x9ecfff,3);rim.position.set(-3,2,-4);scene.add(rim);
 const model=new T.Group();scene.add(model);
 const floor=new T.Mesh(new T.CircleGeometry(12,64),new T.MeshStandardMaterial({color:0x182027,roughness:.74,metalness:.2}));floor.rotation.x=-Math.PI/2;floor.position.y=-.38;scene.add(floor);
 const grid=new T.GridHelper(20,40,0x34434b,0x232e35);grid.position.y=-.377;scene.add(grid);
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const ctx=shadowCanvas.getContext('2d')!;const gradient=ctx.createRadialGradient(64,64,7,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.85)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const shadowTexture=new T.CanvasTexture(shadowCanvas);const shadow=new T.Mesh(new T.PlaneGeometry(6,3.5),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.372;scene.add(shadow);
 const controls=orbit(renderer.domElement,camera,new T.Vector3(0,.3,0));const xr=xrControls(renderer,scene,model,sim,callbacks);const qm=new QualityManager();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let quality:Quality='auto',id=initialModule,disposed=false,version=0,exploded=false,explodeAmount=0,hide=false,selected='',ratio=sim.params.ratio,presentation={...initialStyle},doorAngle=0,hoodAngle=0,renderKey='';
 const size=()=>{const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();renderer.setPixelRatio(qm.pixelRatio);renderer.setSize(w,h);renderKey='';};const observer=new ResizeObserver(size);observer.observe(host);size();
 async function load(next:ModuleId){id=next;xr.setScene(next);const ticket=++version;const module=await builders[next]();if(disposed||ticket!==version)return;const vehicle=getVehicle(presentation.vehicle);const group=module.build(sim.params.ratio,vehicle);release(model);model.add(group);ratio=sim.params.ratio;floor.position.y=grid.position.y=shadow.position.y=(next==='energy'||next==='regen')?-vehicle.radius-.02:-1.45;renderKey='';}
 function focusPart(){const box=new T.Box3();let found=false;model.traverse(o=>{if(o.userData.part===selected&&o instanceof T.Mesh){box.expandByObject(o);found=true;}});if(found)controls.focus(box.getCenter(new T.Vector3()));}
 const ray=new T.Raycaster(),mouse=new T.Vector2();let start={x:0,y:0};const down=(e:PointerEvent)=>{start={x:e.clientX,y:e.clientY};};
 const hit=(e:MouseEvent|PointerEvent)=>{const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);return ray.intersectObject(model,true).find(h=>{let o:T.Object3D|null=h.object;while(o){if(!o.visible)return false;o=o.parent;}return!!h.object.userData.part;});};
 const click=(e:PointerEvent)=>{if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>7)return;const h=hit(e);if(h)callbacks.select(h.object.userData.part);};const double=(e:MouseEvent)=>{const h=hit(e);if(h){selected=h.object.userData.part;callbacks.select(selected);focusPart();}};const lost=(e:Event)=>{e.preventDefault();callbacks.fallback();};
 renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',click);renderer.domElement.addEventListener('dblclick',double);renderer.domElement.addEventListener('webglcontextlost',lost);
 function dispose(){if(disposed)return;disposed=true;version++;renderer.setAnimationLoop(null);xr.dispose();controls.dispose();observer.disconnect();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',click);renderer.domElement.removeEventListener('dblclick',double);renderer.domElement.removeEventListener('webglcontextlost',lost);release(model);floor.geometry.dispose();(floor.material as T.Material).dispose();grid.geometry.dispose();(grid.material as T.Material).dispose();shadow.geometry.dispose();(shadow.material as T.Material).dispose();shadowTexture.dispose();environment.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
 try{await load(id);}catch(error){dispose();throw error;}
 let last=0,frames=0,elapsed=0;renderer.setAnimationLoop(time=>{if(disposed)return;const dt=last?Math.min((time-last)/1000,.1):0;last=time;if(document.hidden&&!renderer.xr.isPresenting)return;
 if(renderer.xr.isPresenting)sim.advance(dt);else controls.tick(dt,presentation.autoOrbit,reduced);
 if(id==='gears'&&ratio!==sim.params.ratio){ratio=sim.params.ratio;load(id).catch(()=>callbacks.fallback());}
 const s=sim.state,car=id==='energy'||id==='regen';const a=reduced?1:1-Math.exp(-dt*7);explodeAmount+=(Number(exploded)-explodeAmount)*a;doorAngle+=((presentation.doors?1:0)-doorAngle)*a;hoodAngle+=((presentation.hood?1:0)-hoodAngle)*a;
 const rotating=presentation.realRotation?60:1;const moving=Math.abs(explodeAmount-Number(exploded))>.001||Math.abs(doorAngle-Number(presentation.doors))>.001||Math.abs(hoodAngle-Number(presentation.hood))>.001;
 model.traverse(o=>{const d=o.userData;if(d.lowHidden&&qm.level>0){o.visible=true;d.lowHidden=false;}
 if(o instanceof T.LOD){o.autoUpdate=qm.level>0;if(!o.autoUpdate)o.levels.forEach((level,i)=>{level.object.visible=i===1;});}
 if(d.base){o.position.copy(d.base);if(d.explode)o.position.addScaledVector(d.explode,explodeAmount);}
 if(d.shell)o.visible=!hide;
 if(d.hinge==='door')o.rotation.y=-d.sign*doorAngle*1.12;
 if(d.hinge==='hood')o.rotation.z=-hoodAngle*.72;
 if(d.steer)o.rotation.y=sim.params.turn*.35;
 if(d.spin){const angle=d.spin==='motor'?s.angle:d.spin==='left'?s.leftAngle:d.spin==='right'?s.rightAngle:-s.wheelAngle;const axis=d.spinAxis??(id==='gears'?'z':id==='motor'?'x':'z');o.rotation[axis as 'x'|'y'|'z']=angle*rotating*(d.spinSign??1)+(d.phase??0);}
 if(d.flow!==undefined){const t=(s.time*.6+d.flow*.125)%1;const fraction=s.batteryPower<0?1-t:t;o.position.x=fraction*(d.driveX??-1.5);o.visible=Math.abs(s.batteryPower)>50;}
 if(o instanceof T.Mesh){if(!d.shell){if(presentation.isolate&&selected!=='shell'){let ancestor:T.Object3D|null=o,keep=false;while(ancestor&&ancestor!==model){if(ancestor.userData.part===selected)keep=true;ancestor=ancestor.parent;}o.visible=keep;d.wasIsolated=true;}else if(d.wasIsolated&&d.flow===undefined){o.visible=true;d.wasIsolated=false;}}
 for(const mat of (Array.isArray(o.material)?o.material:[o.material]))if(mat instanceof T.MeshStandardMaterial){if(!mat.userData.initialColor)mat.userData.initialColor=mat.color.clone();if(mat instanceof T.MeshPhysicalMaterial)mat.color.set(presentation.paint);if(!mat.userData.light&&mat.emissiveIntensity<1)mat.emissive.setHex(d.part===selected?0x214d33:0);if(d.part==='cooling')mat.color.setHex(sim.params.cooling?0x42a5c8:0x53616a);}}
 if(d.detail&&qm.level===0){o.visible=false;d.lowHidden=true;}
 if(d.headlight)d.headlight.emissiveIntensity=presentation.lights?2:0;
 if(d.taillight)d.taillight.emissiveIntensity=sim.params.brake>0?3:presentation.lights?.7:0;
 });
 // A small pitch response comes from acceleration, without moving the viewer.
 const body=model.getObjectByName('body');if(body&&car)body.rotation.z=T.MathUtils.damp(body.rotation.z,reduced?0:T.MathUtils.clamp(-s.acceleration*.006,-.035,.035),8,dt);
 xr.update(time);frames++;elapsed+=dt;if(elapsed>1){callbacks.fps(Math.round(frames/elapsed));frames=0;elapsed=0;}
 if(qm.sample(dt,quality==='auto')){renderer.setPixelRatio(qm.pixelRatio);renderKey='';}
 const key=[s.time,s.soc,hide,exploded,selected,quality,id,ratio,presentation.paint,presentation.doors,presentation.hood,presentation.realRotation,presentation.lights,presentation.isolate,sim.params.cooling,camera.position.x.toFixed(4),camera.position.y.toFixed(4),camera.position.z.toFixed(4),host.clientWidth,host.clientHeight].join(',');
 if(renderer.xr.isPresenting||sim.running||moving||key!==renderKey){renderer.render(scene,camera);renderKey=key;}
 });
 return{load,setPresentation(next:Presentation){const changed=presentation.vehicle!==next.vehicle;presentation={...next};renderKey='';if(changed)return load(id);return Promise.resolve();},setExplode(v:boolean){exploded=v;},setShell(v:boolean){hide=v;},select(v:string){selected=v;renderKey='';},setQuality(v:Quality){quality=v;qm.set(v);size();},resetCamera:controls.reset,preset:controls.preset,focusPart,enterVR:xr.enter,dispose};
}
export type View=Awaited<ReturnType<typeof createView>>;
