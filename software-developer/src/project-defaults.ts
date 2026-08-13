/**
 * Software-development defaults shared by the package renderer and the host
 * adapter that restores package-owned project state.
 */
export function getDefaultTeamGoal(role: string): string {
  const normalizedRole = role.toLowerCase();
  if (normalizedRole.includes('supervisor')) {
    return 'Coordinate the team, keep work aligned to the project objective, and decide the next handoff.';
  }
  if (normalizedRole.includes('manager')) {
    return 'Break the objective into milestones, clarify acceptance criteria, and identify sequencing risks.';
  }
  if (normalizedRole.includes('qa') || normalizedRole.includes('test')) {
    return 'Validate the implementation plan, propose tests, and call out release blockers.';
  }
  if (normalizedRole.includes('review')) {
    return 'Review the work for correctness, maintainability, security, and missing verification.';
  }
  return 'Implement the assigned work, use tools conservatively, and report concrete results.';
}

export function getDefaultTeamTools(role: string): string[] {
  const normalizedRole = role.toLowerCase();
  if (normalizedRole.includes('supervisor') || normalizedRole.includes('manager')) {
    return ['automation.listTeams', 'automation.listTeamRuns', 'fs.read'];
  }
  if (normalizedRole.includes('qa') || normalizedRole.includes('test')) {
    return ['fs.read', 'bash.run'];
  }
  return ['fs.read', 'fs.write', 'bash.run'];
}
