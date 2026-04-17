/**
 * Mirrors backend GuideStageUtil.getGuideStage for client-side previews.
 * @param {{ trips: number, earnings: number, rating: number, reviews: number }} m
 * @returns {'BEGINNER'|'PRO'|'ELITE'}
 */
export function getGuideStage(m) {
  const trips = Number(m.trips) || 0;
  const earnings = Number(m.earnings) || 0;
  const rating = Number(m.rating) || 0;
  const reviews = Number(m.reviews) || 0;

  if (trips >= 50 && rating >= 4.5 && reviews >= 20) return 'ELITE';
  if (trips >= 30 || earnings >= 25000) return 'PRO';
  return 'BEGINNER';
}

export function commissionForStage(stage) {
  switch (stage) {
    case 'ELITE':
      return 10;
    case 'PRO':
      return 15;
    default:
      return 18;
  }
}
