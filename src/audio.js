export class GameAudio {
  constructor() {
    this.ambient = new window.Audio('./assets/audio/ambient-forest.mp3');
    this.ambient.loop = true;
    this.ambient.volume = 0.0;
    this.started = false;
    this.stepPool = ['./assets/audio/sfx-step-1.ogg', './assets/audio/sfx-step-2.ogg'];
    this.stepIndex = 0;
    this.lastStep = 0;
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.ambient.volume = 0.32;
    this.ambient.play().catch(() => {});
  }

  coin() {
    if (!this.started) return;
    const a = new window.Audio('./assets/audio/sfx-coin.ogg');
    a.volume = 0.55;
    a.play().catch(() => {});
  }

  step(now) {
    if (!this.started) return;
    if (now - this.lastStep < 0.42) return;
    this.lastStep = now;
    const a = new window.Audio(this.stepPool[this.stepIndex % this.stepPool.length]);
    this.stepIndex++;
    a.volume = 0.16;
    a.play().catch(() => {});
  }
}
