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

const MUSIC_BPM=112,MUSIC_STEPS=64;
const MUSIC_CHORDS=[
  {root:110.00,tones:[440.00,523.25,659.26]},
  {root:87.31,tones:[349.23,440.00,523.25]},
  {root:130.81,tones:[392.00,523.25,659.26]},
  {root:98.00,tones:[392.00,493.88,587.33]}
];
const MUSIC_MELODY=(()=>{
  const m=new Array(MUSIC_STEPS).fill(0),put=(step,freq)=>m[step]=freq;
  put(0,440);put(2,523.25);put(4,659.26);put(6,587.33);put(8,523.25);put(11,440);put(14,392);
  put(16,349.23);put(18,440);put(20,523.25);put(22,440);put(24,392);put(27,329.63);put(30,293.66);
  put(32,329.63);put(34,392);put(36,523.25);put(38,659.26);put(40,783.99);put(43,659.26);put(46,587.33);
  put(48,587.33);put(50,493.88);put(52,392);put(54,587.33);put(56,493.88);put(59,392);put(62,440);
  return m;
})();

class PixelAudio {
  constructor() {
    const stored=localStorage.getItem('rumor-audio-v1');
    const settings=stored===null?{enabled:true,volume:.25}:JSON.parse(stored);
    this.enabled=settings.enabled;this.volume=settings.volume;this.context=null;
    this.voices=new Set();this.active=false;this.played=0;this.variation=0;this.lastArrival=-Infinity;
    this.lastCue=Object.fromEntries(Object.keys(SOUND_CUES).map(kind=>[kind,-Infinity]));
    this.musicWanted=false;this.musicTimer=null;this.musicStep=0;this.nextMusicTime=0;
    this.musicIntensity=.35;this.musicVoices=new Set();
  }
  async activate() {
    if(this.context===null){
      this.context=new AudioContext();this.gain=this.context.createGain();this.gain.connect(this.context.destination);
      this.buses={ui:this.context.createGain(),action:this.context.createGain(),arrival:this.context.createGain()};
      for(const bus of Object.values(this.buses))bus.connect(this.gain);
      this.musicBus=this.context.createGain();this.musicBus.gain.value=1.24+this.musicIntensity;this.musicBus.connect(this.gain);
      this.noiseBuffer=this.context.createBuffer(1,Math.round(this.context.sampleRate*.25),this.context.sampleRate);
      const noise=this.noiseBuffer.getChannelData(0);for(let i=0;i<noise.length;i++)noise[i]=Math.random()*2-1;
    }
    await this.context.resume();this.active=true;this.updateVolume();
    if(this.musicWanted&&this.enabled)this.startMusicLoop();
  }
  updateVolume() {
    const gain=this.gain.gain,now=this.context.currentTime;gain.cancelScheduledValues(now);
    if(!this.enabled||this.volume===0)gain.setValueAtTime(0,now);
    else gain.setTargetAtTime(this.volume*this.volume*.56,now,.015);
  }
  save() {localStorage.setItem('rumor-audio-v1',JSON.stringify({enabled:this.enabled,volume:this.volume}));}
  setVolume(value) {this.volume=value;this.save();if(this.context!==null)this.updateVolume();}
  toggle() {this.enabled=!this.enabled;this.save();if(this.context!==null){this.updateVolume();if(!this.enabled)this.clearVoices();}
    if(!this.enabled)this.stopMusicLoop();else if(this.musicWanted&&this.active)this.startMusicLoop();}
  clearVoices() {for(const voice of this.voices)voice.stop();this.voices.clear();}
  reset() {
    this.clearVoices();this.variation=0;this.lastArrival=-Infinity;this.musicStep=0;
    for(const kind of Object.keys(SOUND_CUES))this.lastCue[kind]=-Infinity;
    if(this.context!==null){const gain=this.buses.arrival.gain;gain.cancelScheduledValues(this.context.currentTime);gain.setValueAtTime(1,this.context.currentTime);}
  }
  stop() {
    this.active=false;this.clearVoices();this.stopMusicLoop();
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
  startMusic() {
    this.musicWanted=true;
    if(this.enabled&&this.active&&this.context!==null)this.startMusicLoop();
  }
  stopMusic() {this.musicWanted=false;this.stopMusicLoop();}
  setMusicIntensity(value) {
    this.musicIntensity=Math.max(0,Math.min(1,value));
    if(this.context!==null)this.musicBus.gain.setTargetAtTime(1.24+this.musicIntensity,this.context.currentTime,.4);
  }
  startMusicLoop() {
    if(this.musicTimer!==null||this.context===null||!this.active)return;
    this.nextMusicTime=this.context.currentTime+.06;
    this.musicTimer=setInterval(()=>this.scheduleMusic(),40);
    this.scheduleMusic();
  }
  stopMusicLoop() {
    if(this.musicTimer!==null){clearInterval(this.musicTimer);this.musicTimer=null;}
    for(const node of this.musicVoices){try{node.stop();}catch(_){}}
    this.musicVoices.clear();
  }
  scheduleMusic() {
    if(this.context===null||!this.active)return;
    while(this.nextMusicTime<this.context.currentTime+.16){
      this.playMusicStep(this.musicStep,this.nextMusicTime);
      // Sixteenth-note swing: odd steps land slightly late for a bouncier groove.
      this.nextMusicTime+=60/MUSIC_BPM/4+(this.musicStep%2===0?.017:0);
      this.musicStep=(this.musicStep+1)%MUSIC_STEPS;
    }
  }
  musicTone(freq,at,duration,type,level,slideTo) {
    const osc=this.context.createOscillator(),env=this.context.createGain();
    osc.type=type;osc.frequency.setValueAtTime(Math.max(20,freq),at);
    if(slideTo)osc.frequency.exponentialRampToValueAtTime(slideTo,at+duration*.8);
    env.gain.setValueAtTime(.0001,at);env.gain.linearRampToValueAtTime(level,at+.005);
    env.gain.exponentialRampToValueAtTime(.0001,at+duration);
    osc.connect(env);env.connect(this.musicBus);osc.start(at);osc.stop(at+duration+.02);
    this.musicVoices.add(osc);osc.onended=()=>{this.musicVoices.delete(osc);osc.disconnect();env.disconnect();};
  }
  musicNoise(at,duration,level,filterType,frequency,q) {
    const src=this.context.createBufferSource(),filter=this.context.createBiquadFilter(),env=this.context.createGain();
    src.buffer=this.noiseBuffer;filter.type=filterType;filter.frequency.value=frequency;filter.Q.value=q;
    env.gain.setValueAtTime(.0001,at);env.gain.linearRampToValueAtTime(level,at+.004);
    env.gain.exponentialRampToValueAtTime(.0001,at+duration);
    src.connect(filter);filter.connect(env);env.connect(this.musicBus);src.start(at);src.stop(at+duration+.02);
    this.musicVoices.add(src);src.onended=()=>{this.musicVoices.delete(src);src.disconnect();filter.disconnect();env.disconnect();};
  }
  playMusicStep(step,at) {
    const bar=Math.floor(step/16),chord=MUSIC_CHORDS[bar],local=step%16,energy=this.musicIntensity;
    if(local===0||local===6||local===8||(energy>.6&&local===14))this.musicTone(132,at,.16,'sine',.14,44);
    if(local===4||local===12)this.musicNoise(at,.11,.07,'bandpass',1900,.9);
    if(local%2===0)this.musicNoise(at,.035,.026,'highpass',7600,.7);
    else if(energy>.5)this.musicNoise(at,.025,.013,'highpass',9000,.7);
    if([0,3,6,8,11,14].includes(local))this.musicTone(chord.root*((local===3||local===11)?1.5:local===14?2:1),at,.14,'triangle',.09);
    if(energy>.18&&(energy>.62||local%2===0))this.musicTone(chord.tones[[0,1,2,1][local%4]],at,.09,'square',.024);
    if(energy>.45&&MUSIC_MELODY[step])this.musicTone(MUSIC_MELODY[step],at,.12,'square',.05);
  }
}
