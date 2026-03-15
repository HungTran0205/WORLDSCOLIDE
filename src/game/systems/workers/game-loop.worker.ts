/** Web Worker: sends tick messages at fixed interval to prevent background tab throttling */
const TICK_INTERVAL = 1000;

let running = false;
let tickTimer: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e: MessageEvent) => {
  if (e.data.type === 'start') {
    running = true;
    tickTimer = setInterval(() => {
      if (running) {
        self.postMessage({ type: 'tick', time: Date.now() });
      }
    }, TICK_INTERVAL);
  }

  if (e.data.type === 'stop') {
    running = false;
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  }
};
