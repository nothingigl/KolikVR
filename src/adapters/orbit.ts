import type {PerspectiveCamera,Vector3} from 'three';
export function orbit(canvas:HTMLCanvasElement,camera:PerspectiveCamera,target:Vector3){let yaw=.68,pitch=.62,distance=6.5;const pointers=new Map<number,{x:number;y:number}>();let gap=0;
 const update=()=>{camera.position.set(target.x+distance*Math.sin(yaw)*Math.cos(pitch),target.y+distance*Math.sin(pitch),target.z+distance*Math.cos(yaw)*Math.cos(pitch));camera.lookAt(target);};
 const reset=()=>{yaw=.68;pitch=.62;distance=6.5;update();};
 const down=(e:PointerEvent)=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);gap=0;};
 const move=(e:PointerEvent)=>{const old=pointers.get(e.pointerId);if(!old)return;if(pointers.size===1){yaw-=(e.clientX-old.x)*.008;pitch=Math.max(-.1,Math.min(1.4,pitch+(e.clientY-old.y)*.008));}pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const[a,b]=[...pointers.values()];const next=Math.hypot(a.x-b.x,a.y-b.y);if(gap)distance=Math.max(2.5,Math.min(13,distance*gap/next));gap=next;}update();};
 const up=(e:PointerEvent)=>{pointers.delete(e.pointerId);gap=0;};
 const wheel=(e:WheelEvent)=>{e.preventDefault();distance=Math.max(2.5,Math.min(13,distance+e.deltaY*.005));update();};
 const key=(e:KeyboardEvent)=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();yaw+=e.key==='ArrowLeft'?-.1:e.key==='ArrowRight'?.1:0;pitch=Math.max(-.1,Math.min(1.4,pitch+(e.key==='ArrowUp'?.1:e.key==='ArrowDown'?-.1:0)));distance=Math.max(2.5,Math.min(13,distance+(e.key==='+'?-.4:e.key==='-'?.4:0)));update();}};
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',key);update();
 return{reset,dispose(){canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('keydown',key);}};
}
