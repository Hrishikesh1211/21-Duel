import { botRaiseDecision, RAISE_BOT } from '../game/raiseBot';
import { drawId } from './DrawCompletion';
import { decisionSequence, newRound, rematch, raiseActor, raiseDecision, raiseTimeout, RAISE_SECONDS } from '../game/engine';
import { handTotal } from '../game/hand';
import type { Action, Card, MatchState, PlayerState, RaiseAction } from '../game/types';
import { motion } from './motion';
import { MatchHistoryRecorder } from '../review/history';

export type Feedback = 'raise' | 'call' | 'fold' | 'deal' | 'hit' | 'stand' | 'win' | 'loss' | 'draw' | 'victory' | 'defeat' | 'twenty-one' | 'clash';
export type TableGesture = { id: number; action: Action };
export type ClashStage = 'idle' | 'approach' | 'impact' | 'still' | 'complete';
export type TableView = {
  round: number;
  roundValue: 1 | 2;
  decisionActor: 'human' | 'bot' | null;
  seconds: number;
  folded: MatchState['folded'];
  raiseLabel: string;
  strategicTransition: 'raise' | 'call' | 'fold' | null;
  scoreDelta: MatchState['score'];
  handKey: number;
  human: PlayerState;
  bot: PlayerState;
  humanCount: number;
  botCount: number;
  humanTotal: number | null;
  botTotal: number | null;
  revealed: number;
  score: MatchState['score'];
  result: MatchState['result'];
  winner: MatchState['winner'];
  phase: MatchState['phase'];
  busy: boolean;
  thinking: boolean;
  clearing: boolean;
  clash: ClashStage;
  humanCommitting: boolean;
  botCommitting: boolean;
  humanGesture: TableGesture | null;
  botGesture: TableGesture | null;
};

type Wait = (ms: number, signal: AbortSignal) => Promise<boolean>;
export type PresentationOptions = {
  wait?: Wait;
  now?: () => number;
  raiseBot?: typeof botRaiseDecision;
  settleDraw?: (id: string, signal: AbortSignal) => Promise<boolean>;
  random?: () => number;
  feedback?: (kind: Feedback) => void;
};

export function initialView(game: MatchState, handKey = 0): TableView {
  return {
    round: game.round, roundValue: game.roundValue, decisionActor: raiseActor(game), seconds: RAISE_SECONDS, folded: null, raiseLabel: '', strategicTransition: null, scoreDelta: { human: 0, bot: 0 }, handKey, human: game.human, bot: game.bot,
    humanCount: 0, botCount: 0, humanTotal: null, botTotal: null,
    revealed: 1, score: game.score, result: null, winner: null,
    humanGesture: null, botGesture: null, humanCommitting: false, botCommitting: false,
    phase: game.phase, busy: true, thinking: false, clearing: false, clash: 'idle',
  };
}

const wait: Wait = (ms, signal) => new Promise((resolve) => {
  if (signal.aborted) { resolve(false); return; }
  const finish = (completed: boolean) => {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
    resolve(completed);
  };
  const cancel = () => finish(false);
  const timer = setTimeout(() => finish(true), ms);
  signal.addEventListener('abort', cancel, { once: true });
});

// The only owner of presentation sequencing and input locks. It replays engine
// snapshots; winner evaluation and card draws stay in the engine.
export class TableController {
  private game: MatchState;
  private view: TableView;
  private readonly abort = new AbortController();
  private started = false;
  private decisionEpoch = 0;
  private deadline = 0;
  private readonly now: () => number;
  private readonly raiseBot: typeof botRaiseDecision;
  private gestureId = 0;
  private readonly pause: Wait;
  private readonly settleDraw: PresentationOptions['settleDraw'];
  private readonly random: () => number;
  private readonly feedback: (kind: Feedback) => void;
  private readonly history: MatchHistoryRecorder;

  constructor(game: MatchState, private readonly publish: (view: TableView) => void, options: PresentationOptions = {}) {
    this.now = options.now ?? Date.now;
    this.raiseBot = options.raiseBot ?? botRaiseDecision;
    this.game = game;
    this.history = new MatchHistoryRecorder(game);
    this.view = initialView(game);
    this.pause = options.wait ?? wait;
    this.settleDraw = options.settleDraw;
    this.random = options.random ?? Math.random;
    this.feedback = options.feedback ?? (() => {});
  }

  private update(patch: Partial<TableView>) {
    if (this.abort.signal.aborted) return;
    const reached21 = (patch.humanTotal === 21 && this.view.humanTotal !== 21)
      || (patch.botTotal === 21 && this.view.botTotal !== 21);
    if (patch.score) patch.scoreDelta = { human: patch.score.human - this.view.score.human, bot: patch.score.bot - this.view.score.bot };
    this.view = { ...this.view, ...patch };
    this.publish(this.view);
    if (reached21) this.feedback('twenty-one');
  }

  private async sleep(ms: number) {
    const completed = await this.pause(ms, this.abort.signal);
    return completed && !this.abort.signal.aborted;
  }

  private async drawSettled(side: 'human' | 'bot', count: number) {
    if (!this.settleDraw) return this.sleep(motion.card);
    const settled = await this.settleDraw(drawId(this.view.handKey, side, count), this.abort.signal);
    return settled && !this.abort.signal.aborted;
  }

  dispose() { this.abort.abort(); }
  roundHistory() { return this.history.rounds(); }

  async start() {
    if (this.started || this.abort.signal.aborted) return;
    this.started = true;
    await this.deal();
  }

  private async deal() {
    // One at a time, with each player's total and light feedback at settlement.
    for (const [side, count] of [['human', 1], ['bot', 1], ['human', 2], ['bot', 2]] as const) {
      this.update(side === 'human' ? { humanCount: count } : { botCount: count });
      if (!await this.drawSettled(side, count)) return;
      if (side === 'human') {
        this.update({ humanTotal: handTotal(this.game.human.hand.slice(0, count)) });
        if (this.view.humanTotal !== 21) this.feedback('deal');
      }
      if (!await this.sleep(45)) return;
    }
    if (raiseActor(this.game)) {
      this.update({ busy: false });
      this.beginRaiseClock();
      return;
    }
    await this.beginNormalPlay();
  }

  private async beginNormalPlay() {
    this.update({ phase: 'playing', decisionActor: null, raiseLabel: '', strategicTransition: null, busy: true });
    if (handTotal(this.game.bot.hand) === 21) {
      if (!await this.lockTwentyOne('bot')) return;
      this.game = { ...this.game, bot: { ...this.game.bot, status: 'standing' } };
      this.history.autoStand('bot');
    }
    this.update({ busy: false });
    if (handTotal(this.game.human.hand) === 21) await this.act('stand');
  }

  private beginRaiseClock() {
    const epoch = ++this.decisionEpoch;
    this.deadline = this.now() + RAISE_SECONDS * 1000;
    this.update({ phase: this.game.phase, roundValue: this.game.roundValue, decisionActor: raiseActor(this.game), seconds: RAISE_SECONDS, busy: this.view.strategicTransition === 'raise' });
    void this.tickRaise(epoch);
    if (raiseActor(this.game) === 'bot') void this.botPreRound(epoch);
  }

  private async tickRaise(epoch: number) {
    while (epoch === this.decisionEpoch && raiseActor(this.game)) {
      if (!await this.sleep(250) || epoch !== this.decisionEpoch) return;
      this.checkRaiseTimeout();
    }
  }

  // Injectable wall clock also handles background/resume elapsed time.
  checkRaiseTimeout() {
    if (!raiseActor(this.game) || this.abort.signal.aborted) return;
    const seconds = Math.max(0, Math.ceil((this.deadline - this.now()) / 1000));
    if (seconds !== this.view.seconds) this.update({ seconds });
    if (!seconds) void this.applyRaise(raiseTimeout(this.game), this.game.phase === 'preRaiseDecision' ? 'pass' : 'fold');
  }

  private async botPreRound(epoch: number) {
    if (!await this.sleep(RAISE_BOT.delayMs) || epoch !== this.decisionEpoch) return;
    this.checkRaiseTimeout();
    if (epoch !== this.decisionEpoch) return;
    const action = this.raiseBot(this.game.bot.hand.map(card => ({ ...card })), this.game.phase === 'waitingForRaiseResponse', this.random);
    await this.applyRaise(raiseDecision(this.game, 'bot', action), action);
  }

  async preAct(action: RaiseAction) {
    if (this.view.busy || raiseActor(this.game) !== 'human' || this.abort.signal.aborted) return;
    this.checkRaiseTimeout();
    if (raiseActor(this.game) !== 'human') return;
    await this.applyRaise(raiseDecision(this.game, 'human', action), action);
  }

  private async applyRaise(next: MatchState, action: RaiseAction) {
    if (next === this.game) return;
    this.history.preAction(raiseActor(this.game)!, action);
    ++this.decisionEpoch;
    this.game = next;
    this.update({ busy: true, roundValue: next.roundValue, decisionActor: raiseActor(next), strategicTransition: action === 'pass' ? null : action, raiseLabel: action === 'raise' ? 'RAISED' : action === 'call' ? 'CALLED' : action.toUpperCase() });
    if (action !== 'pass') this.feedback(action);
    if (next.folded) {
      // Conceal first; show the terse fold, then award the point. Never reveal.
      this.update({ folded: next.folded, revealed: 0, humanTotal: null, botTotal: null, result: next.result });
      if (!await this.sleep(600)) return;
      this.history.finishRound(next, false);
      this.update({ score: next.score, winner: next.winner, phase: next.phase, strategicTransition: null, raiseLabel: '', busy: !next.winner });
      if (!next.winner && await this.sleep(220)) {
        this.update({ busy: false });
        await this.advance(false);
      }
    } else if (raiseActor(next)) {
      this.beginRaiseClock();
      if (!await this.sleep(400) || this.game !== next) return;
      this.update({ strategicTransition: null, busy: false });
    } else {
      if (action === 'call' && !await this.sleep(300)) return;
      await this.beginNormalPlay();
    }
  }

  private async lockTwentyOne(side: 'human' | 'bot') {
    // Hidden opponent totals never trigger the public 21 signature.
    if (side === 'human' && !await this.sleep(600)) return false;
    const gesture = { id: ++this.gestureId, action: 'stand' as const };
    this.update(side === 'human' ? { humanGesture: gesture } : { botGesture: gesture });
    if (!await this.sleep(motion.gestureTighten)) return false;
    this.update(side === 'human'
      ? { humanCommitting: true, human: { ...this.view.human, status: 'standing' } }
      : { botCommitting: true, bot: { ...this.view.bot, status: 'standing' } });
    if (!await this.sleep(motion.commit + motion.gestureStagger)) return false;
    if (side === 'human') this.feedback('stand');
    this.update(side === 'human' ? { humanCommitting: false } : { botCommitting: false });
    return true;
  }

  async act(action: Action) {
    // Synchronous lock precedes any await or React render, blocking double taps.
    if (this.view.busy || this.view.phase !== 'playing' || this.abort.signal.aborted) return;
    if (handTotal(this.game.human.hand) === 21) action = 'stand';
    this.update({ busy: true });
    if (this.view.humanTotal === 21 && !await this.sleep(600)) return;
    this.update({ humanGesture: { id: ++this.gestureId, action } });
    if (action === 'hit') {
      if (!await this.sleep(motion.gestureContact)) return;
      this.feedback('hit');
      if (!await this.sleep(motion.gestureDraw - motion.gestureContact)) return;
    } else if (!await this.sleep(motion.gestureTighten)) return;
    const frames = decisionSequence(this.game, action);
    let previous = this.game;
    for (const frame of frames) {
      if (frame.human.hand.length !== previous.human.hand.length || frame.human.status !== previous.human.status) {
        this.update({ humanCommitting: action === 'stand', human: { ...frame.human, status: action === 'stand' ? 'standing' : previous.human.status }, humanCount: frame.human.hand.length });
        const drew = frame.human.hand.length > previous.human.hand.length;
        if (!(drew ? await this.drawSettled('human', frame.human.hand.length) : await this.sleep(motion.commit + motion.gestureStagger))) return;
        if (!drew) this.feedback('stand');
        const autoLock = drew && handTotal(frame.human.hand) === 21;
        this.update({ humanCommitting: false, human: autoLock ? { ...frame.human, status: 'playing' } : frame.human, humanTotal: handTotal(frame.human.hand) });
        if (autoLock && !await this.lockTwentyOne('human')) return;
      }
      if (previous.bot.status === 'playing') {
        this.update({ thinking: true });
        if (!await this.sleep(700 + Math.floor(this.random() * 901))) return;
        const hit = frame.bot.hand.length > previous.bot.hand.length;
        this.update({ thinking: false, botGesture: { id: ++this.gestureId, action: hit ? 'hit' : 'stand' } });
        if (!await this.sleep(hit ? motion.gestureDraw : motion.gestureTighten)) return;
        this.update({ botCommitting: !hit, bot: { ...frame.bot, status: hit ? previous.bot.status : frame.bot.status }, botCount: frame.bot.hand.length });
        if (!(hit ? await this.drawSettled('bot', frame.bot.hand.length) : await this.sleep(motion.commit + motion.gestureStagger))) return;
        const autoLock = hit && handTotal(frame.bot.hand) === 21;
        this.update({ botCommitting: false, bot: autoLock ? { ...frame.bot, status: 'playing' } : frame.bot });
        if (autoLock && !await this.lockTwentyOne('bot')) return;
      }
      this.history.frame(previous, frame);
      previous = frame;
    }
    this.game = previous;
    if (this.game.phase === 'playing') this.update({ busy: false });
    else await this.reveal();
  }

  private async reveal() {
    if ((this.game.human.status === 'standing' && this.game.bot.status === 'standing') || (this.game.ranked !== null && this.game.human.status !== 'playing' && this.game.bot.status !== 'playing')) {
      this.update({ clash: 'approach' });
      if (!await this.sleep(motion.clashApproach)) return;
      this.update({ clash: 'impact' });
      this.feedback('clash');
      if (!await this.sleep(motion.clashImpact)) return;
      this.update({ clash: 'still' });
      if (!await this.sleep(motion.clashStill)) return;
      this.update({ clash: 'complete' });
    } else if (!await this.sleep(motion.revealPause)) return;
    for (let count = 2; count <= this.game.bot.hand.length; count++) {
      this.update({ revealed: count });
      if (!await this.sleep(motion.flip + 70)) return;
    }
    this.update({ botTotal: handTotal(this.game.bot.hand) });
    this.history.finishRound(this.game, true);
    if (!await this.sleep(motion.totalPause)) return;
    this.update({ score: this.game.score, result: this.game.result });
    this.feedback(this.game.result === 'human' ? 'win' : this.game.result === 'bot' ? 'loss' : 'draw');
    if (!await this.sleep(this.game.winner ? 950 : 450)) return;
    if (this.game.winner) {
      this.update({ winner: this.game.winner });
      this.feedback(this.game.winner === 'human' ? 'victory' : 'defeat');
      if (!await this.sleep(400)) return;
    }
    this.update({ phase: this.game.phase, busy: false });
  }

  async advance(restart: boolean) {
    const expected = restart ? 'match-complete' : 'round-complete';
    if (this.view.busy || this.view.phase !== expected || this.abort.signal.aborted) return;
    this.update({ busy: true, clearing: true });
    if (!await this.sleep(motion.clear + 40)) return;
    this.game = restart ? rematch(this.random, this.game.mode) : newRound(this.game, this.random);
    if (restart) this.history.reset(this.game);
    else this.history.startRound(this.game);
    this.update(initialView(this.game, this.view.handKey + 1));
    await this.deal();
  }
}

// Never pass unrevealed card values to the card component or accessibility tree.
export function visibleBotCards(view: TableView): readonly (Card | null)[] {
  return view.bot.hand.slice(0, view.botCount).map((card, index) => index < view.revealed ? card : null);
}
