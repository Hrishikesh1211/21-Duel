import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { Card } from '../game/types';
import { PlayingCard } from './PlayingCard';
import { motion } from '../presentation/motion';

type Rect = { x: number; y: number; width: number; height: number };
type DrawRequest = { target: View; card: Card | null; width: number; opponent: boolean; settled: () => void };
type Flight = DrawRequest & { id: number; source: Rect; destination: Rect; root: Rect };
type DrawContext = { source: RefObject<View | null>; finishDraw: (id: string) => void; launch: (request: DrawRequest) => () => void };
const Context = createContext<DrawContext | null>(null);

export function useCardDraw() {
  const context = useContext(Context);
  if (!context) throw new Error('Card draw must be inside CardDrawLayer.');
  return context;
}

// The flight is rendered outside both hand ScrollViews, so it can actually travel
// from the physical deck to its measured hand slot without being clipped by either hand.
export function CardDrawLayer({ children, finishDraw }: { children: ReactNode; finishDraw: (id: string) => void }) {
  const root = useRef<View>(null);
  const source = useRef<View>(null);
  const sequence = useRef(0);
  const live = useRef(new Map<number, () => void>());
  const [flights, setFlights] = useState<Flight[]>([]);
  const finish = useCallback((id: number) => live.current.get(id)?.(), []);
  const launch = useCallback((request: DrawRequest) => {
    const id = ++sequence.current;
    let active = true;
    let watchdog: ReturnType<typeof setTimeout>;
    let frame: number;
    const complete = () => {
      if (!active) return;
      active = false;
      clearTimeout(watchdog);
      cancelAnimationFrame(frame);
      live.current.delete(id);
      setFlights(current => current.filter(flight => flight.id !== id));
      request.settled();
    };
    live.current.set(id, complete);
    // A missing native layout must never leave a card invisible.
    watchdog = setTimeout(complete, 150);
    frame = requestAnimationFrame(() => {
      const rootNode = root.current, sourceNode = source.current;
      if (!rootNode || !sourceNode) { complete(); return; }
      const rects: Partial<Record<'root' | 'source' | 'destination', Rect>> = {};
      const measured = (key: 'root' | 'source' | 'destination', node: View) => {
        node.measureInWindow((x, y, width, height) => {
          if (!active) return;
          if (width <= 0 || height <= 0) { complete(); return; }
          rects[key] = { x, y, width, height };
          if (rects.root && rects.source && rects.destination) {
            clearTimeout(watchdog);
            setFlights(current => [...current, { ...request, id, root: rects.root!, source: rects.source!, destination: rects.destination! }]);
          }
        });
      };
      measured('root', rootNode);
      measured('source', sourceNode);
      measured('destination', request.target);
    });
    return complete;
  }, []);
  useEffect(() => {
    const pending = live.current;
    return () => { for (const cancel of [...pending.values()]) cancel(); };
  }, []);
  const value = useMemo(() => ({ source, launch, finishDraw }), [launch, finishDraw]);
  return (
    <Context.Provider value={value}>
      <View ref={root} collapsable={false} style={styles.root}>
        {children}
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
          {flights.map(flight => <DrawFlight key={flight.id} flight={flight} finish={finish} />)}
        </View>
      </View>
    </Context.Provider>
  );
}

function DrawFlight({ flight, finish }: { flight: Flight; finish: (id: number) => void }) {
  const reduced = useReducedMotion();
  const travel = useSharedValue(0);
  const { id, width, card, source, destination, root, opponent } = flight;
  useEffect(() => {
    travel.value = withTiming(1, { duration: reduced ? 0 : motion.draw, easing: Easing.out(Easing.cubic) }, done => {
      if (done) scheduleOnRN(finish, id);
    });
    return () => cancelAnimation(travel);
  }, [travel, reduced, finish, id]);
  const style = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [
      { translateX: (source.x + source.width / 2 - destination.x - width / 2) * (1 - travel.value) },
      { translateY: (source.y + source.height / 2 - destination.y - width * 1.43 / 2) * (1 - travel.value) },
      { scale: source.width / width + (1 - source.width / width) * travel.value },
      { rotate: `${(opponent ? -2 : 2) * (1 - travel.value)}deg` },
    ],
  }));
  // The departing top card starts face-down at the stack's exact size. Public
  // faces become visible as it separates; hidden opponent cards remain backs.
  const backCover = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - travel.value * 4) }));
  return (
    <Animated.View style={[styles.flight, { left: destination.x - root.x, top: destination.y - root.y }, style]}>
      <PlayingCard card={card} width={width} />
      {card ? <Animated.View style={[StyleSheet.absoluteFill, backCover]}><PlayingCard card={null} width={width} /></Animated.View> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, flight: { position: 'absolute' } });
