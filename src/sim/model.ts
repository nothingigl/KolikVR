export type ModuleId = 'energy'|'motor'|'gears'|'regen'|'battery';
export type Parameters = {throttle:number;brake:number;load:number;ratio:number;turn:number;initialSoc:number;cooling:boolean;demoSpeed:number};
export type State = {time:number;speed:number;rpm:number;wheelRpm:number;leftRpm:number;rightRpm:number;torque:number;wheelTorque:number;mechanicalPower:number;batteryPower:number;regenPower:number;frictionPower:number;soc:number;temperature:number;angle:number;wheelAngle:number;leftAngle:number;rightAngle:number;energyOut:number;energyRecovered:number};
export const defaults:Parameters={throttle:.45,brake:0,load:.2,ratio:9,turn:0,initialSoc:65,cooling:true,demoSpeed:1};
const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
export const initialState=(soc=65):State=>({time:0,speed:0,rpm:0,wheelRpm:0,leftRpm:0,rightRpm:0,torque:0,wheelTorque:0,mechanicalPower:0,batteryPower:0,regenPower:0,frictionPower:0,soc,temperature:25,angle:0,wheelAngle:0,leftAngle:0,rightAngle:0,energyOut:0,energyRecovered:0});
/** SI units; 1600 kg, 0.32 m wheel, 60 kWh pack. Fixed 1/120 s integration.
 * Quasi-static shaft speeds, motor efficiency .90, gear efficiency .96.
 * Regen tapers from 90% SOC and is zero at 98%; no regeneration below .5 m/s.
 * Visual rotation is /60 of physical rotation. Thermal time is accelerated x30.
 */
export function step(s:State,p:Parameters,dt:number):State {
 const omega=s.speed/.32*p.ratio;
 const available=s.soc>0?Math.min(220,75000/Math.max(omega,1)):0;
 const drive=p.brake>0?0:p.throttle*available;
 const brakeForce=p.brake*6500;
 const chargeLimit=clamp((98-s.soc)/8,0,1)*Math.max(0,1-(s.temperature-45)/15);
 const regenForce=s.speed>.5?Math.min(brakeForce,35000/s.speed,120*p.ratio/.32*.96)*chargeLimit:0;
 const resistance=s.speed>0?160+p.load*1200+.38*s.speed*s.speed:0;
 const acceleration=(drive*p.ratio*.96/.32-brakeForce-resistance)/1600;
 const speed=clamp(s.speed+acceleration*dt,0,55);
 const avgSpeed=(speed+s.speed)/2;
 const mechanicalPower=(drive*p.ratio/.32-regenForce*.96)*avgSpeed;
 const regenPower=regenForce*avgSpeed*.96*.90;
 const batteryPower=drive*p.ratio*.96/.32*avgSpeed/(.90*.96)-regenPower;
 const wheelRpm=speed/.32*60/(2*Math.PI),rpm=wheelRpm*p.ratio;
 const torque=drive-regenForce*.32*.96/p.ratio;
 const loss=Math.max(0,batteryPower-(drive*p.ratio*.96/.32-regenForce)*avgSpeed)+Math.abs(batteryPower)*.025;
 const temperature=clamp(s.temperature+(loss-(p.cooling?450:25)*(s.temperature-25))*dt*30/180000,20,80);
 const leftRpm=wheelRpm*(1-p.turn*.25),rightRpm=wheelRpm*(1+p.turn*.25);
 return {...s,time:s.time+dt,speed,rpm,wheelRpm,leftRpm,rightRpm,torque,wheelTorque:drive*p.ratio*.96-regenForce*.32,mechanicalPower,batteryPower,regenPower,frictionPower:Math.max(0,brakeForce-regenForce)*avgSpeed,soc:clamp(s.soc-batteryPower*dt/2160000,0,100),temperature,angle:s.angle+rpm*2*Math.PI/60*dt/60,wheelAngle:s.wheelAngle+wheelRpm*2*Math.PI/60*dt/60,leftAngle:s.leftAngle+leftRpm*2*Math.PI/60*dt/60,rightAngle:s.rightAngle+rightRpm*2*Math.PI/60*dt/60,energyOut:s.energyOut+Math.max(0,batteryPower)*dt,energyRecovered:s.energyRecovered+regenPower*dt};
}
export interface LearningModule {load():Promise<void>;start():void;pause():void;setParameter<K extends keyof Parameters>(key:K,value:Parameters[K]):void;reset():void;getState():State;dispose():void;}
export class Simulation implements LearningModule {
 xrActive=false;state=initialState();params={...defaults};running=false;private accumulator=0;
 async load(){} start(){this.running=true;} pause(){this.running=false;}
 setParameter<K extends keyof Parameters>(key:K,value:Parameters[K]){this.params[key]=value;if(key==='initialSoc')this.state.soc=Number(value);}
 reset(){this.running=false;this.state=initialState(this.params.initialSoc);this.accumulator=0;}
 advance(realDt:number){if(!this.running)return;this.accumulator+=Math.min(realDt,.1)*this.params.demoSpeed;while(this.accumulator>=1/120){this.state=step(this.state,this.params,1/120);this.accumulator-=1/120;}}
 getState(){return this.state;} dispose(){this.pause();}
}
