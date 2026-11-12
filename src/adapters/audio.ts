import type{State}from'../sim/model';
export class MotorAudio{private ctx:AudioContext;private oscillator:OscillatorNode;private gain:GainNode;private filter:BiquadFilterNode;
 private visibility=()=>{if(document.hidden)this.gain.gain.setTargetAtTime(0,this.ctx.currentTime,.03);};
 constructor(){this.ctx=new AudioContext();this.oscillator=this.ctx.createOscillator();this.oscillator.type='sawtooth';this.gain=this.ctx.createGain();this.gain.gain.value=0;this.filter=this.ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=800;this.oscillator.connect(this.filter).connect(this.gain).connect(this.ctx.destination);this.oscillator.start();void this.ctx.resume();document.addEventListener('visibilitychange',this.visibility);}
 update(s:State,running:boolean){const now=this.ctx.currentTime;this.oscillator.frequency.setTargetAtTime(70+s.rpm/25,now,.08);this.filter.frequency.setTargetAtTime(400+Math.abs(s.torque)*3,now,.08);this.gain.gain.setTargetAtTime(running&&!document.hidden?Math.min(.025,Math.abs(s.torque)*.0001):0,now,.1);}
 dispose(){document.removeEventListener('visibilitychange',this.visibility);this.gain.gain.value=0;this.oscillator.stop();void this.ctx.close();}
}
