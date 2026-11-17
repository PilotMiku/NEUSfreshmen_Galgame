// Six original arrangements, each with a sixteen-bar phrase and a quieter turnaround.
export const musicTracks = {
  open: { bpm: 100, roots: [48, 45, 53, 55], melody: [72, 76, 79, 83, 81, 79, 76, 74] },
  ke: { bpm: 112, roots: [45, 44, 48, 43], melody: [69, 72, 76, 72, 68, 72, 75, 71] },
  banwei: { bpm: 106, roots: [48, 45, 53, 55], melody: [72, 76, 79, 81, 79, 76, 74, 76] },
  xingfu: { bpm: 88, roots: [53, 50, 58, 48], melody: [77, 81, 84, 88, 86, 84, 81, 79] },
  qiuzhu: { bpm: 76, roots: [45, 53, 48, 55], melody: [69, 72, 76, 79, 77, 76, 72, 74] },
  shouwei: { bpm: 84, roots: [48, 53, 45, 55], melody: [72, 79, 84, 88, 86, 84, 79, 76] },
};
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const note = (midi, duration, level, type = 'sine', envelope = {}) => ({
  at: 0,
  duration,
  frequency: hz(midi),
  end: hz(midi),
  type,
  level,
  ...envelope,
});
const drum = (frequency, end, duration, level, type = 'sine') => ({
  at: 0,
  duration,
  frequency,
  end,
  type,
  level,
});

export function musicStep(track, step) {
  const config = musicTracks[track];
  if (!config) return [];
  const position = step % 128;
  const beat = position % 8;
  const bar = Math.floor(position / 8);
  const root = config.roots[Math.floor(bar / 2) % 4];
  const eighth = 30 / config.bpm;
  const turnaround = bar % 8 === 7;
  const melody = config.melody[(Math.floor(beat / 2) + bar * 2 + (bar >= 8 ? 1 : 0)) % 8];
  const third = [45, 44, 50].includes(root) ? 3 : 4;
  const chord = [root, root + third, root + 7];
  const score = [];
  const pad = (level, duration = eighth * 7) => {
    for (const midi of chord)
      score.push(
        note(midi + 12, duration, level, 'sine', {
          attack: 0.16,
          release: 0.65,
        }),
      );
  };

  if (track === 'open') {
    // Plucked melody and light brushes for arrival, with room between phrases.
    if (beat === 0 || (beat === 4 && !turnaround)) score.push(drum(110, 45, 0.16, 0.12));
    if (beat % 2 === 0 && !turnaround) score.push(drum(3400, 3400, 0.045, 0.018, 'noise'));
    if ([0, 3, 6].includes(beat)) score.push(note(root - 12, eighth * 1.5, 0.075, 'triangle'));
    if ([0, 2, 5].includes(beat) && !(turnaround && beat > 0)) {
      score.push(note(melody, eighth * 2.2, 0.1, 'triangle'));
      score.push(note(melody + 12, eighth, 0.018));
    }
    if (beat === 0) pad(0.012);
  } else if (track === 'ke') {
    // Short, syncopated notes and a tighter backbeat for the course overload.
    if ([0, 3, 4].includes(beat)) score.push(drum(135, 43, 0.15, 0.17));
    if ([2, 6].includes(beat)) score.push(drum(2100, 2100, 0.07, 0.05, 'noise'));
    if (!turnaround || beat < 4) score.push(drum(4600, 4600, 0.025, 0.018, 'noise'));
    if ([0, 3, 4, 7].includes(beat)) score.push(note(root - 12, eighth * 0.7, 0.09, 'triangle'));
    if ([0, 1, 3, 6].includes(beat) && !(turnaround && beat > 3)) {
      score.push(note(melody - 12, eighth * 0.65, 0.085, 'triangle'));
      score.push(note(melody, eighth * 0.45, 0.016, 'square'));
    }
  } else if (track === 'banwei') {
    // Rounded mallet-like notes with an offbeat response for friendly conversations.
    if ([0, 4].includes(beat)) score.push(drum(100, 48, 0.13, 0.1));
    if ([3, 7].includes(beat) && !turnaround) score.push(drum(1800, 1800, 0.065, 0.028, 'noise'));
    if ([0, 3, 6].includes(beat))
      score.push(note(root - 12 + (beat === 6 ? 7 : 0), eighth, 0.085, 'triangle'));
    if ([0, 3, 4, 6].includes(beat) && !(turnaround && beat > 3)) {
      score.push(note(melody, eighth * 1.7, 0.11));
      score.push(note(melody + 19, eighth * 0.6, 0.015));
    }
    if (beat === 1) score.push(note(chord[bar % 3] + 12, eighth * 2, 0.04, 'triangle'));
  } else if (track === 'xingfu') {
    // Long, slow chords and a floating melody; no drum kit at the lake.
    if (beat === 0) pad(0.026);
    if ([0, 4].includes(beat))
      score.push(note(root - 12, eighth * 3, 0.07, 'sine', { attack: 0.08, release: 0.7 }));
    if ([0, 4].includes(beat) && !(turnaround && beat === 4)) {
      score.push(note(melody, eighth * 3.4, 0.07, 'sine', { attack: 0.1, release: 0.7 }));
    }
    if (bar % 2 === 0 && beat === 6) score.push(note(root + 19, eighth * 1.8, 0.025));
  } else if (track === 'qiuzhu') {
    // Sparse lower piano-like notes and breathing space under the senior's memory.
    if (beat === 0) {
      pad(0.018);
      score.push(note(root - 12, eighth * 4, 0.055, 'sine', { attack: 0.06, release: 1 }));
    }
    if ((beat === 0 || (beat === 4 && bar % 2 === 0)) && !turnaround) {
      score.push(note(melody - 12, eighth * 3.5, 0.09));
      score.push(note(melody, eighth * 1.7, 0.016, 'triangle'));
    }
  } else if (track === 'shouwei') {
    // Warm ascending arpeggios and an occasional high note for the ending.
    if (beat === 0) {
      pad(0.02);
      score.push(note(root - 12, eighth * 4, 0.065, 'sine', { attack: 0.08, release: 0.8 }));
    }
    if (beat % 2 === 0 && !(turnaround && beat > 2)) {
      score.push(note(chord[(beat / 2) % 3] + 12, eighth * 2.5, 0.065, 'triangle'));
    }
    if (beat === 0 || (beat === 5 && bar % 2 === 0 && !turnaround)) {
      score.push(note(melody, eighth * 2.6, 0.07));
      if (bar >= 8) score.push(note(melody + 12, eighth * 1.2, 0.012));
    }
  }
  return score;
}
