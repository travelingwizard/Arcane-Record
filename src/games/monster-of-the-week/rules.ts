import { playbooks, ratingPackages } from './catalog';
import type { MotwHunter } from './schema';
export function hunterCreationIssues(hunter: MotwHunter) {
  const issues: string[] = [];
  if (!hunter.playbookId) issues.push('Choose a playbook.');
  if (!hunter.name.trim()) issues.push('Enter the Hunter’s name.');
  if (hunter.creation.ratingPackageIndex === null)
    issues.push('Choose a ratings package.');
  return issues;
}
export function applyRatingPackage(
  hunter: MotwHunter,
  index: number,
): MotwHunter {
  const values = ratingPackages[hunter.playbookId]?.[index];
  if (!values) return hunter;
  return {
    ...hunter,
    ratings: {
      charm: values[0]!,
      cool: values[1]!,
      sharp: values[2]!,
      tough: values[3]!,
      weird: values[4]!,
    },
    creation: { ...hunter.creation, ratingPackageIndex: index },
  };
}
export function rollMotw(
  dice: [number, number],
  ratingValue: number,
  forward: number,
  ongoing: number,
) {
  const total = dice[0] + dice[1] + ratingValue + forward + ongoing;
  return {
    total,
    outcome:
      total >= 12
        ? 'advanced'
        : total >= 10
          ? 'full'
          : total >= 7
            ? 'mixed'
            : 'miss',
  } as const;
}
export const playbookName = (id: string) =>
  playbooks.find((x) => x.id === id)?.name ?? 'No playbook';
