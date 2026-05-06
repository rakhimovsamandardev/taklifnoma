const queues = new Map();

export function runSequential(userId, fn) {
  const key = String(userId);
  const prev = queues.get(key) ?? Promise.resolve();
  const job = prev.then(() => fn());
  queues.set(key, job.catch(() => {}));
  return job;
}
