import { DrawCompletion } from './DrawCompletion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createMatch } from '../game/engine';
import type { Action, GameMode, RaiseAction } from '../game/types';
import { initialView, TableController, type Feedback } from './TableController';

function feedback(kind: Feedback) {
  if (AppState.currentState !== 'active') return;
  let effect: Promise<void>;
  if (kind === 'raise' || kind === 'call' || kind === 'fold') {
    effect = Haptics.impactAsync(kind === 'raise' ? Haptics.ImpactFeedbackStyle.Medium : kind === 'fold' ? Haptics.ImpactFeedbackStyle.Soft : Haptics.ImpactFeedbackStyle.Light);
  } else if (kind === 'clash') {
    effect = Haptics.selectionAsync();
  } else if (kind === 'twenty-one') {
    effect = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
  } else if (kind === 'win' || kind === 'victory') {
    effect = kind === 'victory' ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else if (kind === 'loss' || kind === 'defeat') {
    effect = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } else {
    effect = Haptics.impactAsync(kind === 'stand' ? Haptics.ImpactFeedbackStyle.Medium
      : kind === 'deal' ? Haptics.ImpactFeedbackStyle.Soft : Haptics.ImpactFeedbackStyle.Light);
  }
  // Haptics may be unavailable; they must never interrupt the sequence.
  void effect.catch(() => {});
}

export function useGamePresentation(mode: GameMode = 'casual') {
  const [draws] = useState(() => new DrawCompletion());
  const [initial] = useState(() => createMatch(Math.random, mode));
  const [view, setView] = useState(() => initialView(initial));
  const controller = useRef<TableController | null>(null);
  const getRoundHistory = useCallback(() => controller.current?.roundHistory() ?? [], []);
  useEffect(() => {
    const current = new TableController(initial, setView, { feedback, settleDraw: draws.wait });
    controller.current = current;
    void current.start();
    return () => { current.dispose(); draws.reset(); controller.current = null; };
  }, [initial, draws]);
  return {
    view,
    getRoundHistory,
    finishDraw: draws.complete,
    preAct: (action: RaiseAction) => { void controller.current?.preAct(action); },
    act: (action: Action) => { void controller.current?.act(action); },
    nextRound: () => { void controller.current?.advance(false); },
    rematch: () => { void controller.current?.advance(true); },
  };
}
