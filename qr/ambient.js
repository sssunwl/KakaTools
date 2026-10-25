export class Ambient {
  constructor(){this.enabled=false;this.season='spring';document.addEventListener('visibilitychange',()=>{if(this.ctx){if(document.hidden)this.ctx.suspend();else if(this.enabled)this.ctx.resume();}});}
  async toggle(){
    if(!this.ctx){const Audio=window.AudioContext||window.webkitAudioContext;this.ctx=new Audio();const ctx=this.ctx,buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
      const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=450;this.gain=ctx.createGain();this.gain.gain.value=.035;noise.connect(filter).connect(this.gain).connect(ctx.destination);noise.start();const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.frequency.value=.12;depth.gain.value=.012;lfo.connect(depth).connect(this.gain.gain);lfo.start();this.birds();
    }
    this.enabled=!this.enabled;if(this.enabled&&!document.hidden)await this.ctx.resume();else await this.ctx.suspend();return this.enabled;
  }
  setSeason(season){this.season=season;if(this.gain)this.gain.gain.setTargetAtTime(season==='autumn'?.065:.035,this.ctx.currentTime,.5);}
  birds(){this.timer=setTimeout(()=>{if(this.enabled&&!document.hidden&&this.season!=='autumn'){const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(1600,t);o.frequency.exponentialRampToValueAtTime(3000,t+.1);o.frequency.exponentialRampToValueAtTime(1800,t+.23);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.035,t+.025);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g).connect(this.ctx.destination);o.start(t);o.stop(t+.26);}this.birds();},3500+Math.random()*6500);}
}
