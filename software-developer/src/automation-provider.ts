import fs from 'node:fs/promises';
import path from 'node:path';

import type {
  FeatureAutomationAssignment,
  FeatureAutomationAssignmentValidationContext,
  FeatureAutomationActor,
  FeatureAutomationMemberContext,
  FeatureAutomationPlannerContext,
  FeatureAutomationRun,
  FeatureAutomationSkill,
  FeatureAutomationWorkflow,
  FeaturePackageAutomationProvider,
} from '@codeagent/feature-package-sdk';

const MAX_OBJECTIVE_CHARS = 12_000;
const MAX_SKILL_CONTEXT_CHARS = 8_000;
const MAX_STEP_CONTEXT_CHARS = 12_000;

function truncate(value: string, limit: number): string {
  return value.length <= limit ? value : `${value.slice(0, limit)}\n...[truncated]`;
}

function skillContext(skills: FeatureAutomationSkill[]): string {
  const value = skills.map(skill => [
    `## ${skill.name}`,
    skill.description,
    truncate(skill.content, 2_000),
  ].filter(Boolean).join('\n')).join('\n\n');
  return truncate(value, MAX_SKILL_CONTEXT_CHARS) || 'No enabled skills.';
}

function stepContext(steps: FeatureAutomationMemberContext['previousSteps']): string {
  return truncate(steps.filter(step => step.output || step.error).map(step => [
    `## ${step.assignmentTitle ?? step.role}`,
    `Owner: ${step.memberName} (${step.role})`,
    step.output ?? `Error: ${step.error}`,
  ].join('\n')).join('\n\n'), MAX_STEP_CONTEXT_CHARS);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(readString).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map(item => item.trim()).filter(Boolean);
  return [];
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'assignment';
}

function parseJsonFromText(content: string): unknown {
  const trimmed = content.trim();
  if (!trimmed) return null;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim() ?? trimmed;
  const objectStart = fenced.indexOf('{');
  const objectEnd = fenced.lastIndexOf('}');
  const arrayStart = fenced.indexOf('[');
  const arrayEnd = fenced.lastIndexOf(']');
  const candidate = arrayStart >= 0 && (objectStart < 0 || arrayStart < objectStart) && arrayEnd > arrayStart
    ? fenced.slice(arrayStart, arrayEnd + 1)
    : objectStart >= 0 && objectEnd > objectStart
      ? fenced.slice(objectStart, objectEnd + 1)
      : fenced;
  try { return JSON.parse(candidate); } catch { return null; }
}

function projectGoals(objective: string): Array<{ id: string; text: string }> {
  const match = objective.match(/(?:^|\n)Goals:\s*\n([\s\S]*?)(?=\n(?:Acceptance criteria|Completion criteria|Expected software artifacts|Project mode|Workspace|Team|Constraints):|$)/i);
  if (!match?.[1]) return [];
  return match[1].split(/\n+/)
    .map(line => line.trim().replace(/^[-*\s]*\d+[.)]\s*/, '').replace(/^[-*]\s*/, ''))
    .filter(Boolean)
    .map((text, index) => ({ id: `goal-${index + 1}`, text }));
}

const PLATFORM_PACKAGE_EXTENSION = /\.(?:pkg|dmg|app|msi|exe|appimage|deb|rpm|apk|ipa)$/i;

function explicitlyRequestsPackagedDeliverable(objective: string): boolean {
  return /\b(installer|installation package|installable package|release package|packaged application|packaged app|distribution package|distributable binary|application binary)\b/i.test(objective)
    || PLATFORM_PACKAGE_EXTENSION.test(objective);
}

function invalidPackagedArtifacts(
  team: FeatureAutomationWorkflow,
  assignments: FeatureAutomationAssignment[],
): Array<{ assignmentId: string; artifact: string }> {
  if (explicitlyRequestsPackagedDeliverable(team.objective)) return [];
  return assignments.flatMap(assignment => (assignment.expectedArtifacts ?? [])
    .filter(artifact => PLATFORM_PACKAGE_EXTENSION.test(artifact))
    .map(artifact => ({ assignmentId: assignment.id, artifact })));
}

function isPlanning(member: FeatureAutomationActor, team: FeatureAutomationWorkflow): boolean {
  const role = member.role.toLowerCase();
  return member.id === team.supervisorId || ['supervisor', 'lead', 'manager', 'planner', 'product', 'architect'].some(value => role.includes(value));
}

function isReview(member: FeatureAutomationActor): boolean {
  const role = member.role.toLowerCase();
  return ['qa', 'quality', 'test', 'review', 'security', 'release'].some(value => role.includes(value));
}

function isDocumentationArtifact(artifact: string): boolean {
  return ['.md', '.txt', '.rst', '.adoc'].includes(path.extname(artifact).toLowerCase());
}

function isImplementationOwner(member: FeatureAutomationActor): boolean {
  if (isReview(member)) return false;
  const role = member.role.toLowerCase();
  return ['developer', 'engineer', 'programmer', 'data', 'designer'].some(value => role.includes(value));
}

function resolveDeclaredMember(
  team: FeatureAutomationWorkflow,
  memberId: string,
  memberName: string,
  role: string,
): FeatureAutomationActor | undefined {
  return (memberId ? team.members.find(item => item.id === memberId) : undefined)
    ?? (memberName ? team.members.find(item => item.name.toLowerCase() === memberName.toLowerCase()) : undefined)
    ?? (role ? team.members.find(item => item.role.toLowerCase() === role.toLowerCase()) : undefined);
}

function selectAssignmentOwner(
  team: FeatureAutomationWorkflow,
  declaredMember: FeatureAutomationActor | undefined,
  title: string,
  description: string,
  expectedArtifacts: string[],
  index: number,
): FeatureAutomationActor | undefined {
  const text = `${title} ${description}`.toLowerCase();
  const reviewIntent = /\b(?:qa|quality|verify|verification|review|sign[ -]?off|acceptance)\b/.test(text)
    && !/\b(?:implement|create|build|develop|write source|product data)\b/.test(text);
  const implementationIntent = expectedArtifacts.some(artifact => !isDocumentationArtifact(artifact))
    && !reviewIntent;
  const planningIntent = !implementationIntent
    && /\b(?:plan|planning|architect|architecture|product brief|requirements)\b/.test(text);
  const candidates = implementationIntent
    ? team.members.filter(isImplementationOwner)
    : reviewIntent
      ? team.members.filter(isReview)
      : planningIntent
        ? team.members.filter(member => isPlanning(member, team))
        : [];

  if (implementationIntent && declaredMember && isImplementationOwner(declaredMember)) return declaredMember;
  if (reviewIntent && declaredMember && isReview(declaredMember)) return declaredMember;
  if (planningIntent && declaredMember && isPlanning(declaredMember, team)) return declaredMember;
  if (!implementationIntent && !reviewIntent && !planningIntent && declaredMember) return declaredMember;
  if (candidates.length) return candidates[index % candidates.length];

  // Do not silently assign an unresolved implementation task to the first
  // roster member. Keeping the declared member lets validation report that the
  // workflow needs a capable role instead of making the PM appear to fail.
  return declaredMember;
}

function assignmentSemantics(member: FeatureAutomationActor, title: string): Pick<FeatureAutomationAssignment,
  'kind' | 'workspaceMode' | 'requiresArtifact' | 'requiresNonDocumentationArtifact'> {
  const text = `${member.role} ${title}`.toLowerCase();
  const review = isReview(member) || ['review', 'merge', 'sign off', 'signoff'].some(value => text.includes(value));
  const planning = !review && ['plan', 'architect', 'product brief', 'requirements'].some(value => text.includes(value));
  const implementation = !review && !planning && ['developer', 'engineer', 'implement', 'code', 'build'].some(value => text.includes(value));
  return {
    kind: review ? 'review' : planning ? 'planning' : implementation ? 'implementation' : 'delivery',
    workspaceMode: 'isolated',
    requiresArtifact: true,
    requiresNonDocumentationArtifact: implementation,
  };
}

interface WorkerCompletionResult {
  status?: unknown;
  summary?: unknown;
  changedFiles?: unknown;
  criteria?: unknown;
  verification?: unknown;
}

interface QaVerificationReport {
  verdict?: unknown;
  goals?: unknown;
  tests?: unknown;
  failures?: unknown;
}

const COMPLETION_MARKER = 'CODEAGENT_ASSIGNMENT_RESULT';

function parseWorkerCompletion(output: string): WorkerCompletionResult | null {
  const markerIndex = output.lastIndexOf(COMPLETION_MARKER);
  if (markerIndex < 0) return null;
  const parsed = parseJsonFromText(output.slice(markerIndex + COMPLETION_MARKER.length));
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as WorkerCompletionResult
    : null;
}

function safeArtifactPath(workspacePath: string, artifact: string): string | null {
  const root = path.resolve(workspacePath);
  const resolved = path.resolve(root, artifact);
  return resolved === root || resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
}

async function readJsonArtifact(workspacePath: string, artifact: string): Promise<unknown> {
  const resolved = safeArtifactPath(workspacePath, artifact);
  if (!resolved) throw new Error(`Artifact path escapes the assignment workspace: ${artifact}`);
  return JSON.parse(await fs.readFile(resolved, 'utf-8'));
}

function verificationArtifact(assignment: FeatureAutomationAssignment): string {
  return `docs/verification/${assignment.id}.json`;
}

function validateWorkerContract(
  assignment: FeatureAutomationAssignment,
  context: FeatureAutomationAssignmentValidationContext,
): string | undefined {
  const completion = context.completionRecord
    ? context.completionRecord as WorkerCompletionResult
    : parseWorkerCompletion(context.output);
  if (!completion) {
    return `Assignment "${assignment.title}" did not submit the required structured completion record.`;
  }
  if (completion.status !== 'completed') {
    return `Assignment "${assignment.title}" did not report status "completed" in its structured completion record.`;
  }
  const changedFiles = readStringArray(completion.changedFiles);
  const missingChangedFiles = context.producedArtifacts.filter(artifact => !changedFiles.includes(artifact));
  if (missingChangedFiles.length) {
    return `The structured completion record omits changed artifact(s): ${missingChangedFiles.join(', ')}.`;
  }
  const criteria = Array.isArray(completion.criteria) ? completion.criteria : [];
  const missingCriteria = (assignment.acceptanceCriteria ?? []).map((_criterion, index) => index + 1).filter(index => (
    !criteria.some(value => {
      if (!value || typeof value !== 'object') return false;
      const record = value as Record<string, unknown>;
      return Number(record.index) === index
        && record.status === 'passed'
        && readStringArray(record.evidence).length > 0;
    })
  ));
  if (missingCriteria.length) {
    return `The structured completion record lacks passing evidence for acceptance criterion index(es): ${missingCriteria.join(', ')}.`;
  }
  const verification = Array.isArray(completion.verification) ? completion.verification : [];
  if (!verification.some(value => value && typeof value === 'object' && (value as Record<string, unknown>).status === 'passed')) {
    return 'The structured completion record contains no successful verification evidence.';
  }
  return undefined;
}

function validateQaReport(
  assignment: FeatureAutomationAssignment,
  report: QaVerificationReport,
): string | undefined {
  if (report.verdict !== 'pass') return `QA report verdict is ${String(report.verdict ?? 'missing')}, not pass.`;
  const goals = Array.isArray(report.goals) ? report.goals : [];
  const missingGoals = (assignment.goalIds ?? []).filter(goalId => !goals.some(value => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return record.id === goalId && record.status === 'pass' && readStringArray(record.evidence).length > 0;
  }));
  if (missingGoals.length) return `QA report lacks passing evidence for goal(s): ${missingGoals.join(', ')}.`;
  const tests = Array.isArray(report.tests) ? report.tests : [];
  if (!tests.length) return 'QA report contains no executed tests.';
  const failedTests = tests.filter(value => {
    if (!value || typeof value !== 'object') return true;
    const record = value as Record<string, unknown>;
    return Number(record.exitCode) !== 0 || !readString(record.command);
  });
  if (failedTests.length) return 'QA report contains missing or failed test execution evidence.';
  if (Array.isArray(report.failures) && report.failures.length > 0) return 'QA report contains unresolved failures.';
  return undefined;
}

function assignParallelGroups(assignments: FeatureAutomationAssignment[]): FeatureAutomationAssignment[] {
  const validIds = new Set(assignments.map(item => item.id));
  assignments.forEach(item => { item.dependencies = [...new Set(item.dependencies.filter(id => validIds.has(id) && id !== item.id))]; });
  const completed = new Set<string>();
  const pending = new Set(assignments.map(item => item.id));
  let group = 1;
  while (pending.size > 0) {
    const ready = assignments.filter(item => pending.has(item.id) && item.dependencies.every(id => completed.has(id)));
    if (!ready.length) return [];
    ready.forEach(item => { item.parallelGroup = group; pending.delete(item.id); completed.add(item.id); });
    group += 1;
  }
  return assignments;
}

function dependsOn(assignment: FeatureAutomationAssignment, target: string, assignments: FeatureAutomationAssignment[], visited = new Set<string>()): boolean {
  if (assignment.dependencies.includes(target)) return true;
  if (visited.has(assignment.id)) return false;
  visited.add(assignment.id);
  return assignment.dependencies.some(id => {
    const dependency = assignments.find(item => item.id === id);
    return dependency ? dependsOn(dependency, target, assignments, visited) : false;
  });
}

const defaultMembers: FeatureAutomationActor[] = [
  { id: 'supervisor', name: 'Supervisor', role: 'Supervisor', goal: 'Coordinate delivery, dependencies, reviews, and completion.', tools: ['tasks', 'review', 'approval'] },
  { id: 'project-manager', name: 'Project Manager', role: 'Project Manager', goal: 'Translate goals into milestones and acceptance criteria.', tools: ['planning', 'tasks'] },
  { id: 'developer', name: 'Developer', role: 'Software Developer', goal: 'Implement and verify a complete runnable product.', tools: ['filesystem', 'bash', 'git'] },
  { id: 'qa', name: 'QA', role: 'QA Engineer', goal: 'Test the integrated product and verify acceptance criteria.', tools: ['bash', 'test', 'review'] },
];

function requiresQaSignoff(team: FeatureAutomationWorkflow): boolean {
  return team.providerConfig?.requireQaSignoff === true;
}

export const softwareDeveloperAutomationProvider: FeaturePackageAutomationProvider = {
  id: 'software-developer',

  internalArtifactPaths() {
    return ['ASSIGNMENT.md'];
  },

  createDefaultWorkflow(objective, workspacePath) {
    return {
      providerId: 'software-developer',
      name: 'Software delivery team',
      objective,
      workspacePath,
      permissionMode: 'full-access',
      maxIterations: 1,
      providerConfig: { requireQaSignoff: true },
      members: defaultMembers.map(member => ({ ...member, tools: [...member.tools] })),
      supervisorId: 'supervisor',
    };
  },

  async prepareRun(team, _run, context) {
    const metadataPath = path.join(context.workspacePath, '.code-agent');
    await fs.mkdir(metadataPath, { recursive: true });
    await fs.writeFile(path.join(metadataPath, 'team-blueprint.md'), [
      `# ${team.name}`,
      '',
      '## Objective',
      '',
      team.objective,
      '',
      '## Execution',
      '',
      `- Permission mode: ${team.permissionMode ?? 'full-access'}`,
      `- Supervisor: ${team.supervisorId}`,
      '',
      '## Members',
      '',
      ...team.members.map(member => `- ${member.name} (${member.role}): ${member.goal}`),
      '',
    ].join('\n'), 'utf-8');

    const readmePath = path.join(context.workspacePath, 'README.md');
    try {
      await fs.access(readmePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      await fs.writeFile(readmePath, [
        `# ${team.name}`,
        '',
        team.objective,
        '',
        'This workspace was initialized by the Software Developer package.',
        '',
      ].join('\n'), 'utf-8');
    }
  },

  async prepareAssignment(team, run, assignment, context) {
    const dependencyOutput = context.dependencyOutputs
      .filter(step => step.output || step.error)
      .map(step => [
        `## ${step.assignmentTitle ?? step.role}`,
        '',
        `- Owner: ${step.memberName} (${step.role})`,
        step.workspacePath ? `- Workspace: ${step.workspacePath}` : '',
        '',
        step.output ?? `Error: ${step.error}`,
      ].filter(Boolean).join('\n'))
      .join('\n\n');
    const sharedWorkspace = path.resolve(context.workspacePath) === path.resolve(team.workspacePath ?? context.workspacePath);
    const briefPath = sharedWorkspace
      ? path.join(context.workspacePath, '.code-agent', 'team-runs', run.id, 'assignments', `${assignment.id}.md`)
      : path.join(context.workspacePath, 'ASSIGNMENT.md');
    await fs.mkdir(path.dirname(briefPath), { recursive: true });
    await fs.writeFile(briefPath, [
      `# ${assignment.title}`,
      '',
      `- Assignment ID: ${assignment.id}`,
      `- Team run: ${run.id}`,
      `- Owner: ${assignment.memberName} (${assignment.role})`,
      `- Parallel group: ${assignment.parallelGroup}`,
      `- Dependencies: ${assignment.dependencies.join(', ') || 'none'}`,
      '',
      '## Objective',
      '',
      team.objective,
      '',
      '## Assignment',
      '',
      assignment.description,
      '',
      '## Required Deliverables',
      '',
      `- Files required: ${assignment.requiresArtifact ? 'yes' : 'no'}`,
      `- Project goals covered: ${assignment.goalIds?.join(', ') || 'not specified'}`,
      `- Expected artifacts: ${assignment.expectedArtifacts?.join(', ') || 'not specified'}`,
      `- Acceptance criteria: ${assignment.acceptanceCriteria?.join('; ') || 'not specified'}`,
      '',
      '## Dependency Outputs',
      '',
      dependencyOutput || 'No dependency outputs yet.',
      '',
    ].join('\n'), 'utf-8');
  },

  buildPlannerPrompt(team, context) {
    const goals = projectGoals(team.objective);
    const correction = context.validationFailure
      ? `\nPLAN CORRECTION REQUIRED\nThe previous plan failed validation: ${context.validationFailure}\nReturn a corrected plan only.`
      : '';
    return [
      'You are the supervisor of a local virtual software delivery team.',
      `Workspace: ${context.workspacePath}`,
      `Team: ${team.name}`,
      `Objective: ${truncate(team.objective, MAX_OBJECTIVE_CHARS)}`,
      `Planning attempt: ${context.attempt} of ${context.maxAttempts}${correction}`,
      '',
      'Mandatory project goals:',
      goals.map(goal => `- ${goal.id}: ${goal.text}`).join('\n') || '- Cover the complete objective.',
      '',
      'Team members:',
      team.members.map(member => `- ${member.id}: ${member.name}, ${member.role}; goal=${member.goal}; tools=${member.tools.join(', ')}`).join('\n'),
      `Implementation owner IDs (source, executable configuration, product data, and tests): ${team.members.filter(isImplementationOwner).map(member => member.id).join(', ') || 'none configured'}`,
      `Review owner IDs (independent verification and signoff only): ${team.members.filter(isReview).map(member => member.id).join(', ') || 'none configured'}`,
      `Planning owner IDs (plans and documentation only): ${team.members.filter(member => isPlanning(member, team)).map(member => member.id).join(', ') || 'none configured'}`,
      '',
      'Enabled skills:', skillContext(context.enabledSkills),
      '',
      'Produce a small dependency DAG that delivers the complete runnable product, not merely planning documents or one partial module.',
      'Map every goal to concrete artifact-producing work. Include the user-facing entry point, integrations, data/configuration, and tests required by the objective.',
      'Create a separate bounded implementation slice for each supplied goal; combine goals only when they are inseparable and still keep at least three implementation slices for projects with three or more goals.',
      'Each implementation assignment must create source, configuration, test, or data files. Include observable acceptance criteria and concrete expected artifact paths.',
      'Keep every assignment bounded enough to finish in one agent session. Split large datasets, broad integrations, and multi-component features into dependency-linked increments.',
      'Assign source code, executable configuration, and product data to a developer, engineer, data, or designer role—not to a supervisor, project manager, or architect.',
      'Do not invent regulatory standards, compliance claims, external facts, or arbitrary volume requirements that are absent from the objective. Use a clearly identified representative seed dataset when authoritative research is unavailable.',
      'Do not require an installer or platform-specific binary (.pkg, .dmg, .app, .msi, .exe, .AppImage, .deb, .rpm, .apk, or .ipa) unless the objective explicitly requests a packaged deliverable. A desktop or cross-platform app request alone requires runnable source, configuration, tests, and build instructions—not a fabricated installer.',
      'When QA signoff is required, final review must depend on all artifact-producing work.',
      '',
      'Submit this assignments object through the provided structured workflow-planning function. If native function submission is unavailable, return only JSON with this shape: {"assignments":[{"id":"id","title":"title","description":"work","memberId":"listed-id","dependencies":[],"requiresArtifact":true,"goalIds":["goal-1"],"acceptanceCriteria":["observable result"],"expectedArtifacts":["relative/path"]}]}',
    ].join('\n');
  },

  parseAssignmentPlan(content, team) {
    const parsed = parseJsonFromText(content);
    const raw = Array.isArray(parsed) ? parsed : Array.isArray((parsed as { assignments?: unknown } | null)?.assignments)
      ? (parsed as { assignments: unknown[] }).assignments : [];
    const usedIds = new Set<string>();
    const aliases = new Map<string, string>();
    const drafts = raw.map((value, index) => {
      if (!value || typeof value !== 'object' || !team.members.length) return null;
      const record = value as Record<string, unknown>;
      const memberId = readString(record.memberId ?? record.assigneeId ?? record.employeeId);
      const memberName = readString(record.memberName ?? record.assignee ?? record.employee);
      const role = readString(record.role ?? record.ownerRole);
      const declaredMember = resolveDeclaredMember(team, memberId, memberName, role);
      const expectedArtifacts = readStringArray(record.expectedArtifacts ?? record.artifacts ?? record.outputs);
      const description = readString(record.description ?? record.goal ?? record.prompt);
      const provisionalTitle = readString(record.title ?? record.name) || 'Delivery assignment';
      const member = selectAssignmentOwner(
        team,
        declaredMember,
        provisionalTitle,
        description,
        expectedArtifacts,
        index,
      );
      if (!member) return null;
      const title = readString(record.title ?? record.name) || `${member.role} assignment`;
      const sourceId = readString(record.id ?? record.key) || title;
      let id = slug(sourceId); let suffix = 2;
      while (usedIds.has(id)) { id = `${slug(sourceId)}-${suffix++}`; }
      usedIds.add(id);
      const semantics = assignmentSemantics(member, title);
      const assignment: FeatureAutomationAssignment = {
        id, title,
        description: description || member.goal,
        memberId: member.id, memberName: member.name, role: member.role,
        dependencies: [], parallelGroup: 1,
        ...semantics,
        requiresArtifact: typeof record.requiresArtifact === 'boolean' ? record.requiresArtifact : semantics.requiresArtifact,
        goalIds: readStringArray(record.goalIds ?? record.goals ?? record.goalCoverage),
        acceptanceCriteria: readStringArray(record.acceptanceCriteria ?? record.definitionOfDone ?? record.verification),
        expectedArtifacts,
        status: 'pending',
      };
      if (assignment.kind === 'review') {
        const reportPath = verificationArtifact(assignment);
        assignment.workspaceMode = 'isolated';
        assignment.requiresArtifact = true;
        assignment.goalIds = projectGoals(team.objective).map(goal => goal.id);
        assignment.expectedArtifacts = [
          ...(assignment.expectedArtifacts ?? []).filter(artifact => artifact.toLowerCase().endsWith('.json')),
          reportPath,
        ].filter((artifact, artifactIndex, artifacts) => artifacts.indexOf(artifact) === artifactIndex);
        assignment.acceptanceCriteria = [
          ...(assignment.acceptanceCriteria ?? []),
          `Write ${reportPath} with verdict, goal-by-goal evidence, executed test commands and exit codes, and unresolved failures.`,
        ];
      }
      [sourceId, title, id].forEach(alias => { aliases.set(alias, id); aliases.set(slug(alias), id); });
      return { assignment, dependencyValues: readStringArray(record.dependencies ?? record.dependsOn ?? record.dependencyIds) };
    }).filter((item): item is { assignment: FeatureAutomationAssignment; dependencyValues: string[] } => Boolean(item));
    drafts.forEach(item => {
      item.assignment.dependencies = [...new Set(item.dependencyValues.map(value => aliases.get(value) ?? aliases.get(slug(value)) ?? '').filter(Boolean))];
    });
    return assignParallelGroups(drafts.map(item => item.assignment));
  },

  validateAssignmentPlan(team, assignments) {
    if (!assignments.length) return 'The plan contains no executable assignments.';
    const goals = projectGoals(team.objective);
    const artifactWork = assignments.filter(item => item.requiresArtifact && item.kind !== 'review');
    const missingGoals = goals.filter(goal => !artifactWork.some(item => item.goalIds?.includes(goal.id)));
    if (missingGoals.length) return `No concrete artifact-producing work covers: ${missingGoals.map(goal => `${goal.id} (${goal.text})`).join('; ')}`;
    const incomplete = artifactWork.filter(item => item.goalIds?.length && (!item.expectedArtifacts?.length || !item.acceptanceCriteria?.length));
    if (incomplete.length) return `Goal-bearing assignments lack expected artifacts or acceptance criteria: ${incomplete.map(item => item.id).join(', ')}`;
    if (goals.length > 1) {
      const goalWork = artifactWork.filter(item => item.goalIds?.length);
      const minimumSlices = Math.min(goals.length, 3);
      if (goalWork.length < minimumSlices) {
        return `The plan is too monolithic: ${goals.length} goals require at least ${minimumSlices} bounded artifact-producing assignments, but only ${goalWork.length} were provided.`;
      }
    }
    const wrongOwners = artifactWork.filter(item => {
      const member = team.members.find(candidate => candidate.id === item.memberId);
      return Boolean(
        member
        && item.expectedArtifacts?.some(artifact => !isDocumentationArtifact(artifact))
        && !isImplementationOwner(member),
      );
    });
    if (wrongOwners.length) {
      return `Non-documentation implementation work is assigned to planning or review roles: ${wrongOwners.map(item => `${item.id} (${item.memberName}, ${item.role})`).join(', ')}. Assign product data, source, configuration, and tests to an implementation role.`;
    }
    const unsupportedClaims = artifactWork.filter(item => (
      item.acceptanceCriteria?.some(criterion => /\b(?:ISO|IEC|NIST|RFC)\s*[-:]?\s*\d+/i.test(criterion))
      && !/\b(?:ISO|IEC|NIST|RFC)\s*[-:]?\s*\d+/i.test(team.objective)
    ));
    if (unsupportedClaims.length) {
      return `Acceptance criteria invent external standards that are absent from the objective: ${unsupportedClaims.map(item => item.id).join(', ')}. Use observable product behavior grounded in the supplied goals.`;
    }
    const unsupportedVolumes = artifactWork.filter(item => item.acceptanceCriteria?.some(criterion => {
      const target = criterion.match(/\b(\d{2,})\s*\+?\s*(?:countries|country entries|entries|records|items|documents)\b/i);
      return Boolean(target && !new RegExp(`\\b${target[1]}\\b`).test(team.objective));
    }));
    if (unsupportedVolumes.length) {
      return `Acceptance criteria invent arbitrary content-volume targets that are absent from the objective: ${unsupportedVolumes.map(item => item.id).join(', ')}. Use a representative seed dataset and verify its schema and extensibility instead.`;
    }
    const invalidPackages = invalidPackagedArtifacts(team, artifactWork);
    if (invalidPackages.length) {
      return `Platform-specific installer artifacts were required even though the objective does not request packaged binaries: ${invalidPackages.map(item => `${item.assignmentId} (${item.artifact})`).join(', ')}. Require runnable source, configuration, data, tests, and build instructions instead.`;
    }
    if (requiresQaSignoff(team)) {
      const reviews = assignments.filter(item => item.kind === 'review');
      if (!reviews.length) return 'QA signoff is required, but the plan contains no review assignment.';
      const uncovered = artifactWork.map(item => item.id).filter(id => !reviews.some(review => dependsOn(review, id, assignments)));
      if (uncovered.length) return `Final review does not depend on artifact work: ${uncovered.join(', ')}`;
      const invalidReviews = reviews.filter(review => !review.expectedArtifacts?.some(artifact => artifact.toLowerCase().endsWith('.json')));
      if (invalidReviews.length) return `QA review assignments must produce a machine-readable JSON verification report: ${invalidReviews.map(item => item.id).join(', ')}`;
    }
    return undefined;
  },

  createFallbackAssignmentPlan() {
    // A fabricated generic application is not a safe fallback for professional
    // work. The host retries the planner with validation feedback and then
    // reports a planning failure instead of claiming delivery of the wrong app.
    return [];
  },

  buildMemberPrompt(team, member, context) {
    const assignment = context.assignment;
    const correction = context.verificationFailure ? [
      'CORRECTION REQUIRED',
      `Previous verification failure: ${context.verificationFailure}`,
      'Use mutation tools now to correct the files. Do not return another plan or promise.',
    ].join('\n') : '';
    return [
      'You are a worker in a local virtual software delivery team. Perform the assigned work now.',
      `Workspace: ${context.workspacePath}`,
      `Team objective: ${truncate(team.objective, MAX_OBJECTIVE_CHARS)}`,
      `Role: ${member.role}; Name: ${member.name}; Role goal: ${member.goal}`,
      `Assignment: ${assignment.title}\n${assignment.description}`,
      `Goals covered: ${assignment.goalIds?.join(', ') || 'not specified'}`,
      `Acceptance criteria: ${assignment.acceptanceCriteria?.join('; ') || 'not specified'}`,
      `Expected artifacts: ${assignment.expectedArtifacts?.join(', ') || 'not specified'}`,
      `Attempt: ${context.attempt} of ${context.maxAttempts}`,
      correction,
      '', 'Required dependency outputs:', stepContext(context.previousSteps) || 'None.',
      '', 'Other completed outputs:', stepContext(context.sharedSteps) || 'None.',
      '', 'Enabled skills:', skillContext(context.enabledSkills),
      '',
      'Execution rules:',
      `- REQUIRED OUTPUT PATHS: ${assignment.expectedArtifacts?.join(', ') || 'none specified'}. Create these exact relative paths; do not substitute similar filenames.`,
      '- Work only on this bounded assignment. Do not spend tool rounds creating unrelated project-wide artifacts.',
      '- Create or modify the actual files with the available tools; prose and code blocks do not count as implementation.',
      '- Text such as "[content omitted after successful tool execution; N characters]" is internal transcript metadata, not file content. Never copy an omitted/truncated marker into an artifact; reconstruct and write the complete source.',
      '- Deliver the full assigned slice, integrate it with dependency outputs, and verify observable behavior before claiming completion.',
      '- Before answering, list or read every required output path and confirm it exists. If a prior attempt created a near-match filename, rename or rewrite it to the exact required path.',
      context.verificationFailure ? '- This is a repair attempt. Inspect every rejected or missing artifact, overwrite incomplete content with a complete implementation, and rerun the acceptance checks before finishing.' : '',
      '- Keep individual tool payloads reasonably small. For large datasets or source files, build them in bounded valid increments rather than emitting a truncated JSON argument.',
      '- Stay within this workspace and report only files and tests that actually exist.',
      assignment.workspaceMode === 'shared' ? '- Review the shared integrated workspace and do not replace working deliverables with narrative.' : '- Work in this isolated assignment workspace; artifacts will be promoted after verification.',
      assignment.kind === 'review' ? [
        `- This is an independent QA gate. Write ${verificationArtifact(assignment)} as JSON with this exact shape:`,
        '  {"verdict":"pass|fail","goals":[{"id":"goal-1","status":"pass|fail","evidence":["file/behavior evidence"]}],"tests":[{"command":"exact command","exitCode":0,"summary":"observed result"}],"failures":[]}',
        '- Set verdict to pass only when every goal has direct evidence, all recorded tests actually ran with exitCode 0, and failures is empty.',
      ].join('\n') : '',
      team.permissionMode === 'supervised' ? '- Risky operations use the normal approval flow.' : '- Use full-access tools responsibly.',
      '- Finish by calling codeagent.finish_project_turn. Put a concise human handoff in response and put this exact object in completionRecord:',
      '  {"status":"completed","summary":"what was delivered","changedFiles":["relative/path"],"criteria":[{"index":1,"status":"passed","evidence":["file, behavior, or test evidence"]}],"verification":[{"name":"check performed","status":"passed","evidence":"observed result"}]}',
      `- Legacy compatibility only: if completionRecord is unavailable, append ${COMPLETION_MARKER} and the same JSON object to the response.`,
      '- Include one passing criteria entry for every numbered acceptance criterion. Never report completed when any criterion is unverified or failing.',
    ].filter(Boolean).join('\n');
  },

  async validateAssignmentCompletion(_team, _run, assignment, context) {
    const contractFailure = validateWorkerContract(assignment, context);
    if (contractFailure) return contractFailure;
    if (assignment.kind !== 'review') return undefined;
    const reportPath = verificationArtifact(assignment);
    if (!context.producedArtifacts.includes(reportPath)) {
      return `QA did not produce its required machine-readable report: ${reportPath}.`;
    }
    try {
      const report = await readJsonArtifact(context.workspacePath, reportPath);
      if (!report || typeof report !== 'object' || Array.isArray(report)) return `QA report is not a JSON object: ${reportPath}.`;
      return validateQaReport(assignment, report as QaVerificationReport);
    } catch (error) {
      return `QA report could not be parsed: ${error instanceof Error ? error.message : String(error)}`;
    }
  },

  async validateCompletedRun(team, run) {
    if (!requiresQaSignoff(team)) return undefined;
    const reviewAssignment = run.assignments?.find(assignment => assignment.kind === 'review' && assignment.status === 'succeeded');
    if (!reviewAssignment) return 'QA/reviewer signoff was required but no review assignment completed successfully.';
    const reportPath = verificationArtifact(reviewAssignment);
    const workspacePath = team.workspacePath;
    if (!workspacePath) return 'QA signoff cannot be verified because the workflow has no workspace path.';
    try {
      const report = await readJsonArtifact(workspacePath, reportPath);
      if (!report || typeof report !== 'object' || Array.isArray(report)) return `Final QA report is not a JSON object: ${reportPath}.`;
      return validateQaReport(reviewAssignment, report as QaVerificationReport);
    } catch (error) {
      return `Final QA signoff could not be independently verified: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
};
