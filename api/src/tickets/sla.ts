export type SlaStatus = 'on_track' | 'at_risk' | 'breached' | 'complete';

const AT_RISK_HOURS = 2;

export function computeSlaStatus(
  status: string,
  createdAt: Date,
  slaHours: number,
  now: Date = new Date()
): SlaStatus {
  if (status === 'resolved' || status === 'closed') {
    return 'complete';
  }

  const deadlineMs = createdAt.getTime() + slaHours * 60 * 60 * 1000;
  const remainingHours = (deadlineMs - now.getTime()) / (60 * 60 * 1000);

  if (remainingHours <= 0) return 'breached';
  if (remainingHours < AT_RISK_HOURS) return 'at_risk';
  return 'on_track';
}
