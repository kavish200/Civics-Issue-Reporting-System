const priorityRules = require('../config/priorityRules');

function calculatePriorityScorePure(c, f, a, weights = priorityRules.weights) {
  const normC = Math.max(0, Math.min(1, c));
  const normF = Math.max(0, Math.min(1, f));
  const normA = Math.max(0, Math.min(1, a));
  const { wc, wf, wa } = weights;
  const rawScore = wc * normC + wf * normF + wa * normA;
  const sumWeights = wc + wf + wa;
  const score = sumWeights > 0 ? rawScore / sumWeights : 0;
  return Math.max(0, Math.min(1, score));
}

function mapScoreToLevel(score, category) {
  const rules = (category && priorityRules[category]) || priorityRules;
  const thresholds = rules.thresholds || priorityRules.thresholds;
  if (score < thresholds.low) return 'Low';
  if (score < thresholds.medium) return 'Medium';
  if (score < thresholds.high) return 'High';
  return 'Critical';
}

function calculatePriorityForIssue(category, reportCount = 0, daysOpen = 0) {
  const categoryRules = priorityRules[category];
  if (!categoryRules && (!priorityRules.categorySeverity || priorityRules.categorySeverity[category] === undefined)) {
    return { score: 0, level: 'Low' };
  }

  const c = priorityRules.categorySeverity[category] ?? categoryRules.baseSeverity ?? 0.5;
  const maxReports = priorityRules.caps.reportCount;
  const maxDays = priorityRules.caps.daysOpen;

  const f = Math.min(Math.max(0, reportCount), maxReports) / maxReports;
  const a = Math.min(Math.max(0, daysOpen), maxDays) / maxDays;

  const score = calculatePriorityScorePure(c, f, a, priorityRules.weights);
  const level = mapScoreToLevel(score, category);
  return { score, level };
}

module.exports = {
  calculatePriorityScorePure,
  mapScoreToLevel,
  calculatePriorityForIssue
};