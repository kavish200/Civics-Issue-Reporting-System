const categorySeverity = {
  water: 0.9,
  drainage: 0.8,
  road_damage: 0.7,
  streetlight: 0.6,
  garbage: 0.5
};

const weights = {
  wc: 0.4,
  wf: 0.3,
  wa: 0.3
};

const caps = {
  reportCount: 10,
  daysOpen: 30
};

const thresholds = {
  low: 0.3,
  medium: 0.6,
  high: 0.8
};

module.exports = {
  categorySeverity,
  weights,
  caps,
  thresholds,
  road_damage: {
    baseSeverity: categorySeverity.road_damage,
    weights,
    caps,
    thresholds
  },
  garbage: {
    baseSeverity: categorySeverity.garbage,
    weights,
    caps,
    thresholds
  },
  streetlight: {
    baseSeverity: categorySeverity.streetlight,
    weights,
    caps,
    thresholds
  },
  water: {
    baseSeverity: categorySeverity.water,
    weights,
    caps,
    thresholds
  },
  drainage: {
    baseSeverity: categorySeverity.drainage,
    weights,
    caps,
    thresholds
  }
};