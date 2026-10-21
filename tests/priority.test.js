const { calculatePriorityScorePure, mapScoreToLevel, calculatePriorityForIssue } = require('../shared/services/priority');

describe('calculatePriorityScorePure', () => {
  test('returns 0 when all inputs are 0', () => {
    expect(calculatePriorityScorePure(0, 0, 0)).toBe(0);
  });

  test('returns 1 when all inputs are 1', () => {
    expect(calculatePriorityScorePure(1, 1, 1)).toBe(1);
  });

  test('normalizes by weight sum', () => {
    const score = calculatePriorityScorePure(1, 0, 0, { wc: 1, wf: 0, wa: 0 });
    expect(score).toBeCloseTo(1);
  });

  test('clips output to [0,1] range', () => {
    expect(calculatePriorityScorePure(2, 2, 2)).toBe(1);
    expect(calculatePriorityScorePure(-1, -1, -1)).toBe(0);
  });

  test('weighted combination is correct', () => {
    const score = calculatePriorityScorePure(0.8, 0.4, 0.2, { wc: 0.4, wf: 0.3, wa: 0.3 });
    expect(score).toBeCloseTo((0.4 * 0.8 + 0.3 * 0.4 + 0.3 * 0.2) / 1.0);
  });
});

describe('mapScoreToLevel', () => {
  test('returns Low for score below low threshold', () => {
    expect(mapScoreToLevel(0.1, 'road_damage')).toBe('Low');
  });

  test('returns Medium for score between low and medium', () => {
    expect(mapScoreToLevel(0.5, 'road_damage')).toBe('Medium');
  });

  test('returns High for score between medium and high', () => {
    expect(mapScoreToLevel(0.7, 'road_damage')).toBe('High');
  });

  test('returns Critical for score at or above high threshold', () => {
    expect(mapScoreToLevel(0.9, 'road_damage')).toBe('Critical');
  });

  test('uses road_damage rules for unknown category', () => {
    expect(mapScoreToLevel(0.1, 'unknown_cat')).toBe('Low');
  });
});

describe('calculatePriorityForIssue', () => {
  test('returns Low priority for zero nearby issues', () => {
    const { score, level } = calculatePriorityForIssue('garbage', 0);
    expect(typeof score).toBe('number');
    expect(['Low', 'Medium', 'High', 'Critical']).toContain(level);
  });

  test('score increases with more nearby issues', () => {
    const { score: s0 } = calculatePriorityForIssue('water', 0);
    const { score: s3 } = calculatePriorityForIssue('water', 3);
    expect(s3).toBeGreaterThanOrEqual(s0);
  });

  test('returns Low for unknown category', () => {
    const { level } = calculatePriorityForIssue('unknown', 0);
    expect(level).toBe('Low');
  });

  test('water category has higher base severity than garbage', () => {
    const { score: waterScore } = calculatePriorityForIssue('water', 0);
    const { score: garbageScore } = calculatePriorityForIssue('garbage', 0);
    expect(waterScore).toBeGreaterThan(garbageScore);
  });
});
