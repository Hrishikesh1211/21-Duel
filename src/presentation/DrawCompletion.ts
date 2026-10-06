// Bridges native animation completion to the controller without engine timing.
export class DrawCompletion {
  private completed = new Set<string>();
  private pending = new Map<string, (finished: boolean) => void>();

  complete = (id: string) => {
    const finish = this.pending.get(id);
    if (finish) finish(true);
    else this.completed.add(id);
  };

  wait = (id: string, signal: AbortSignal): Promise<boolean> => {
    if (signal.aborted) return Promise.resolve(false);
    if (this.completed.delete(id)) return Promise.resolve(true);
    return new Promise(resolve => {
      const finish = (finished: boolean) => {
        signal.removeEventListener('abort', cancel);
        this.pending.delete(id);
        resolve(finished);
      };
      const cancel = () => finish(false);
      this.pending.set(id, finish);
      signal.addEventListener('abort', cancel, { once: true });
    });
  };

  reset() {
    for (const finish of [...this.pending.values()]) finish(false);
    this.completed.clear();
  }
}

export const drawId = (handKey: number, side: 'human' | 'bot', count: number) => `${handKey}:${side}:${count}`;
