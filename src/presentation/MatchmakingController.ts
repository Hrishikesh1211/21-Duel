export type MatchmakingPhase = 'searching' | 'found' | 'intro' | 'leaving' | 'complete';
export const matchmakingTiming = { searchMin: 700, searchRange: 500, found: 180, intro: 650, bridge: 180 } as const;

type Options = {
  knownOpponent?: boolean;
  random?: () => number;
  schedule?: (callback: () => void, delay: number) => () => void;
  onFound?: () => void;
  onComplete: () => void;
};

// Presentation only. One cancellable timer at a time; no game state or network.
export class MatchmakingController {
  private phase: MatchmakingPhase = 'searching';
  private stopped = false;
  private started = false;
  private clearTimer: (() => void) | undefined;
  private readonly schedule: NonNullable<Options['schedule']>;
  constructor(private readonly publish: (phase: MatchmakingPhase) => void, private readonly options: Options) {
    this.schedule = options.schedule ?? ((callback, delay) => {
      const timer = setTimeout(callback, delay);
      return () => clearTimeout(timer);
    });
  }
  start() {
    if (this.started || this.stopped) return;
    this.started = true;
    if (this.options.knownOpponent) {
      this.phase = 'found';
      this.publish('found');
      this.options.onFound?.();
      if (!this.stopped) this.next('intro', matchmakingTiming.found);
      return;
    }
    this.publish('searching');
    const sample = Math.max(0, Math.min(1, (this.options.random ?? Math.random)()));
    this.next('found', matchmakingTiming.searchMin + Math.floor(sample * matchmakingTiming.searchRange));
  }
  private next(phase: MatchmakingPhase, delay: number) {
    this.clearTimer = this.schedule(() => {
      if (this.stopped) return;
      this.clearTimer = undefined;
      this.phase = phase;
      this.publish(phase);
      if (this.stopped) return;
      if (phase === 'found') {
        this.options.onFound?.();
        if (!this.stopped) this.next('intro', matchmakingTiming.found);
      } else if (phase === 'intro') this.next('leaving', matchmakingTiming.intro);
      else if (phase === 'leaving') this.next('complete', matchmakingTiming.bridge);
      else if (phase === 'complete') { this.stopped = true; this.options.onComplete(); }
    }, delay);
  }
  cancel() {
    if (this.phase !== 'searching' || this.stopped) return false;
    this.dispose();
    return true;
  }
  dispose() {
    this.stopped = true;
    this.clearTimer?.();
    this.clearTimer = undefined;
  }
}
