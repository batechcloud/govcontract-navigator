/**
 * Lightweight in-memory request queue for AI edge function calls.
 *
 * Goals:
 * - Serialize concurrent calls to the same key so we don't hammer an
 *   already-overloaded AI gateway.
 * - Deduplicate: if a request for `key` is already in-flight, return its
 *   promise instead of starting a new one.
 * - Enforce a minimum gap between successive requests to the same key.
 */

type Task<T> = () => Promise<T>;

interface QueueState {
  chain: Promise<unknown>;
  lastRunAt: number;
  inflight: Map<string, Promise<unknown>>;
}

const queues = new Map<string, QueueState>();

function getQueue(key: string): QueueState {
  let q = queues.get(key);
  if (!q) {
    q = { chain: Promise.resolve(), lastRunAt: 0, inflight: new Map() };
    queues.set(key, q);
  }
  return q;
}

export interface EnqueueOptions {
  /** Minimum ms gap between successive runs on this queue. */
  minGapMs?: number;
  /** Dedup key — if a request with this id is already running, reuse it. */
  dedupeId?: string;
}

export function enqueueAIRequest<T>(
  key: string,
  task: Task<T>,
  opts: EnqueueOptions = {},
): Promise<T> {
  const { minGapMs = 500, dedupeId } = opts;
  const q = getQueue(key);

  if (dedupeId && q.inflight.has(dedupeId)) {
    return q.inflight.get(dedupeId) as Promise<T>;
  }

  const run = q.chain.then(async () => {
    const wait = Math.max(0, q.lastRunAt + minGapMs - Date.now());
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    try {
      return await task();
    } finally {
      q.lastRunAt = Date.now();
      if (dedupeId) q.inflight.delete(dedupeId);
    }
  });

  // Keep the chain alive even if this task throws.
  q.chain = run.catch(() => undefined);
  if (dedupeId) q.inflight.set(dedupeId, run);
  return run as Promise<T>;
}
