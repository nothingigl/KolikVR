import type {PerspectiveCamera,Vector3} from 'three';
export type CameraPreset='perspective'|'front'|'side'|'top'|'drive';
export function orbit(canvas:HTMLCanvasElement,camera:PerspectiveCamera,target:Vector3){
 let yaw=.72,pitch=.37,distance=7.5,desiredYaw=yaw,desiredPitch=pitch,desiredDistance=distance;
 const desiredTarget=target.clone();const pointers=new Map<number,{x:number;y:number}>();let gap=0;
 const update=()=>{camera.position.set(target.x+distance*Math.sin(yaw)*Math.cos(pitch),target.y+distance*Math.sin(pitch),target.z+distance*Math.cos(yaw)*Math.cos(pitch));camera.lookAt(target);};
 const preset=(name:CameraPreset)=>{desiredTarget.set(0,.3,0);desiredDistance=name==='drive'?4:7.5;desiredYaw=name==='front'?Math.PI/2:name==='side'?0:name==='top'?.001:.72;desiredPitch=name==='top'?Math.PI/2-.01:name==='side'?.08:name==='front'?.12:.37;};
 const reset=()=>preset('perspective');
 const down=(e:PointerEvent)=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);gap=0;};
 const move=(e:PointerEvent)=>{const old=pointers.get(e.pointerId);if(!old)return;if(pointers.size===1){desiredYaw-=(e.clientX-old.x)*.007;desiredPitch=Math.max(-.1,Math.min(1.55,desiredPitch+(e.clientY-old.y)*.007));}pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const[a,b]=[...pointers.values()];const next=Math.hypot(a.x-b.x,a.y-b.y);if(gap)desiredDistance=Math.max(1.5,Math.min(14,desiredDistance*gap/next));gap=next;}};
 const up=(e:PointerEvent)=>{pointers.delete(e.pointerId);gap=0;};
 const wheel=(e:WheelEvent)=>{e.preventDefault();desiredDistance=Math.max(1.5,Math.min(14,desiredDistance+e.deltaY*.006));};
 const key=(e:KeyboardEvent)=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();desiredYaw+=e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0;desiredPitch=Math.max(-.1,Math.min(1.55,desiredPitch+(e.key==='ArrowUp'?.12:e.key==='ArrowDown'?-.12:0)));desiredDistance=Math.max(1.5,Math.min(14,desiredDistance+(e.key==='+'?-.4:e.key==='-'?.4:0)));}};
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',key);update();
 return{reset,preset,focus(point:Vector3){desiredTarget.copy(point);desiredDistance=3;},tick(dt:number,auto:boolean,reduced=false){if(auto&&!pointers.size&&!reduced)desiredYaw+=dt*.12;const a=reduced?1:1-Math.exp(-dt*10);yaw+=(desiredYaw-yaw)*a;pitch+=(desiredPitch-pitch)*a;distance+=(desiredDistance-distance)*a;target.lerp(desiredTarget,a);update();},dispose(){canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('keydown',key);}};
}
