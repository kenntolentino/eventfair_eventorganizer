export function sheetWeightedTotal(scores, criteria) {
  const byId = new Map(criteria.map((item) => [Number(item.id), item]));
  let weighted = 0;
  let raw = 0;

  for (const score of scores) {
    const criterion = byId.get(Number(score.criterionId));
    if (!criterion) continue;
    const value = Number(score.scoreValue) || 0;
    const maxScore = Number(criterion.maxScore) || 0;
    const weight = Number(criterion.weightPercentage) || 0;
    raw += value;
    if (maxScore > 0) weighted += (value / maxScore) * weight;
  }

  return { raw, weighted };
}

export function rankContestants(rows, formula = "average_weighted") {
  const key = formula === "sum_weighted" ? "totalWeightedScore" : "averageScore";
  const sorted = [...rows].sort((a, b) => {
    return Number(b[key]) - Number(a[key]) || Number(a.contestantId) - Number(b.contestantId);
  });

  let previousScore;
  let previousRank = 0;
  return sorted.map((row, index) => {
    const score = Number(row[key].toFixed(2));
    const rank = score === previousScore ? previousRank : index + 1;
    previousScore = score;
    previousRank = rank;
    return { ...row, rank };
  });
}
