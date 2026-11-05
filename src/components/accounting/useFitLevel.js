// Steps a printed document through size levels (smaller product pictures) to keep
// its totals from sitting alone at the top of a new page.
//
// Levels only ever go one way, and each is tried once: if the last one doesn't help
// either, the first is used again and the search is over, so this can't loop.
// A new contentKey starts again.
import { useState } from 'react';

export function useFitLevel(contentKey, levelCount) {
  const [fit, setFit] = useState({ key: contentKey, level: 0, done: false });
  const current = fit.key === contentKey ? fit : { key: contentKey, level: 0, done: false };

  // The totals are stranded at this level. True when another level is on its way:
  // what was just measured is out of date, so ignore it and wait for the re-render.
  const strand = () => {
    if (current.done) return false;
    setFit(current.level < levelCount - 1
      ? { key: contentKey, level: current.level + 1, done: false }
      : { key: contentKey, level: 0, done: true });
    return true;
  };

  // Everything measured so far is unreliable (a stylesheet has only just arrived).
  // False when there was nothing to undo and the caller should simply measure again.
  const restart = () => {
    if (current.level === 0 && !current.done) return false;
    setFit({ key: contentKey, level: 0, done: false });
    return true;
  };

  return { level: current.level, done: current.done, strand, restart };
}
