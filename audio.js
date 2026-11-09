"use strict";

const SOUND_CUES={
  select:{notes:[440,587],bus:'ui',wave:'triangle',step:.045,tail:.08,db:-10,gap:.07},
  instant:{notes:[523],bus:'action',wave:'triangle',step:0,tail:.075,db:-9,gap:.09},
  dispatch:{notes:[330,440],bus:'action',wave:'triangle',step:.035,tail:.07,db:-11,gap:.09},
  delivered:{notes:[784],bus:'action',wave:'sine',step:0,tail:.12,db:-10,gap:.3},
  reversal:{notes:[330,392,494],bus:'action',wave:'triangle',step:.1,tail:.16,db:-10,gap:1},
  ban:{notes:[220,165],bus:'action',wave:'triangle',step:.08,tail:.13,db:-10,gap:.4},
  start:{notes:[294,392,587,784],bus:'action',wave:'triangle',step:.065,tail:.12,db:-7,gap:.2},
  rumor:{notes:[330,440,523],bus:'action',wave:'square',step:.045,tail:.09,db:-12,gap:.09},
  clarify:{notes:[523,659,784],bus:'action',wave:'triangle',step:.05,tail:.11,db:-7,gap:.09},
  fusion:{notes:[262,330,392,523,784],bus:'action',wave:'triangle',step:.055,tail:.17,db:-6,gap:.25},
  ai:{notes:[196,247],bus:'action',wave:'square',step:.07,tail:.1,db:-14,gap:.2},
  event:{notes:[587,440],bus:'ui',wave:'triangle',step:.085,tail:.13,db:-9,gap:.35},
  arrivalRumor:{notes:[392],bus:'arrival',wave:'triangle',step:0,tail:.055,db:-15,gap:.4},
  arrivalClarify:{notes:[659],bus:'arrival',wave:'sine',step:0,tail:.075,db:-12,gap:.4},
  win:{notes:[392,523,659,784],bus:'action',wave:'triangle',step:.09,tail:.23,db:-6,gap:.5},
  lose:{notes:[392,330,262],bus:'action',wave:'triangle',step:.12,tail:.22,db:-8,gap:.5}
};

class PixelAudio {
  constructor() {
    const stored=localStorage.getItem('rumor-audio-v1');
    const settings=stored===null?{enabled:true,volume:.25}:JSON.parse(stored);
    this.enabled=settings.enabled;this.volume=settings.volume;this.context=null;
    this.voices=new Set();this.active=false;this.played=0;this.variation=0;this.lastArrival=-Infinity;
    this.lastCue=Object.fromEntries(Object.keys(SOUND_CUES).map(kind=>[kind,-Infinity]));
  }
  async activate() {
    if(this.context===null){
      this.context=new AudioContext();this.gain=this.context.createGain();this.gain.connect(this.context.destination);
      this.buses={ui:this.context.createGain(),action:this.context.createGain(),arrival:this.context.createGain()};
      for(const bus of Object.values(this.buses))bus.connect(this.gain);
    }
    await this.context.resume();this.active=true;this.updateVolume();
  }
  updateVolume() {
    const gain=this.gain.gain,now=this.context.currentTime;gain.cancelScheduledValues(now);
    if(!this.enabled||this.volume===0)gain.setValueAtTime(0,now);
    else gain.setTargetAtTime(this.volume*this.volume*.28,now,.015);
  }
  save() {localStorage.setItem('rumor-audio-v1',JSON.stringify({enabled:this.enabled,volume:this.volume}));}
  setVolume(value) {this.volume=value;this.save();if(this.context!==null)this.updateVolume();}
  toggle() {this.enabled=!this.enabled;this.save();if(this.context!==null){this.updateVolume();if(!this.enabled)this.clearVoices();}}
  clearVoices() {for(const voice of this.voices)voice.stop();this.voices.clear();}
  reset() {
    this.clearVoices();this.variation=0;this.lastArrival=-Infinity;
    for(const kind of Object.keys(SOUND_CUES))this.lastCue[kind]=-Infinity;
    if(this.context!==null){const gain=this.buses.arrival.gain;gain.cancelScheduledValues(this.context.currentTime);gain.setValueAtTime(1,this.context.currentTime);}
  }
  stop() {
    this.active=false;this.clearVoices();
    if(this.context!==null)this.context.suspend();
  }
  play(kind) {
    if(!this.enabled||!this.active)return;
    const cue=SOUND_CUES[kind],now=this.context.currentTime;
    // Sound density limits never delay the simulation.
    if(now-this.lastCue[kind]<cue.gap)return;
    if(cue.bus==='arrival'&&now-this.lastArrival<.4)return;
    if(kind==='win'||kind==='lose')this.clearVoices();
    if(this.voices.size+cue.notes.length>16)return;
    this.lastCue[kind]=now;
    if(cue.bus==='arrival')this.lastArrival=now;
    else if(cue.bus==='action'){
      const gain=this.buses.arrival.gain;
      gain.cancelScheduledValues(now);gain.setValueAtTime(.25,now);gain.linearRampToValueAtTime(1,now+.45);
    }
    const pitch=[1,1.018,.985][this.variation++%3];
    cue.notes.forEach((frequency,i)=>{
      const osc=this.context.createOscillator(),env=this.context.createGain(),at=now+i*cue.step;
      osc.type=cue.wave;osc.frequency.value=frequency*pitch;
      env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(10**(cue.db/20),at+.006);
      env.gain.exponentialRampToValueAtTime(.001,at+cue.tail);
      osc.connect(env);env.connect(this.buses[cue.bus]);osc.start(at);osc.stop(at+cue.tail+.01);this.voices.add(osc);
      osc.onended=()=>{this.voices.delete(osc);osc.disconnect();env.disconnect();};
    });
    this.played++;
  }
}
