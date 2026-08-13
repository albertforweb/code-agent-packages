import { importCodeAgentCoreModule, parseShellLikeTokens } from './core-host.js';
import { readFile } from 'fs/promises';

const { AutomationServiceBridge: AutomationServiceBridgeCtor } = await importCodeAgentCoreModule<{
  AutomationServiceBridge: new (workspacePath: string) => any;
}>('electron/services/automation-service-bridge.js');

type AutomationServiceBridge = InstanceType<typeof AutomationServiceBridgeCtor>;
type SkillDetail = any;
type ScheduledTask = any;
type VirtualTeamAssignmentPlan = any;
type VirtualTeamBlueprint = any;
type VirtualTeamMember = any;
type VirtualTeamRunRecord = any;

export function createAutomationService(): AutomationServiceBridge {
  const service = new AutomationServiceBridgeCtor(process.cwd());
  configureCliExecutors(service);
  return service;
}

function getService(): AutomationServiceBridge {
  return createAutomationService();
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export async function runAutomationCommand(args: string): Promise<string> {
  const tokens = parseAutomationTokens(args);
  if (tokens.length === 0 || tokens.some(isHelpToken)) {
    return getAutomationHelp();
  }

  const output = await captureAutomationOutput(async () => {
    await routeAutomationTokens(tokens);
  });
  return output.trim() || 'Automation command completed.';
}

function parseAutomationTokens(args: string): string[] {
  return parseShellLikeTokens(args.trim());
}

function isHelpToken(token: string): boolean {
  return token === 'help' || token === '--help' || token === '-h';
}

function getAutomationHelp(): string {
  return [
    'Automation commands:',
    '  skills',
    '  skills-refresh',
    '  skill <id> [--enable|--disable]',
    '  task list|runs|add|update|run|enable|disable|delete ...',
    '  remote status|pair|serve|disable|revoke|relay ...',
    '  team list|runs|create-default|save|run|delete ...',
    '  export [--no-include-runs]',
    '  import <file>',
  ].join('\n');
}

async function captureAutomationOutput(callback: () => Promise<void>): Promise<string> {
  const originalWrite = process.stdout.write;
  let output = '';

  process.stdout.write = ((chunk: string | Uint8Array, ...args: any[]) => {
    output += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    const callbackArg = args.find(arg => typeof arg === 'function');
    if (callbackArg) {
      callbackArg();
    }
    return true;
  }) as typeof process.stdout.write;

  try {
    await callback();
  } finally {
    process.stdout.write = originalWrite;
  }

  return output;
}

async function routeAutomationTokens(tokens: string[]): Promise<void> {
  const [command = 'skills', ...rest] = tokens;
  switch (command) {
    case 'skills':
      await automationSkillsHandler();
      return;
    case 'skills-refresh':
      await automationSkillsRefreshHandler();
      return;
    case 'skill': {
      const { positional, options } = parseAutomationOptions(rest);
      const id = requireAutomationArgument(positional[0], 'automation skill requires a skill id');
      if (options.enable || options.disable) {
        await automationSkillEnableHandler(id, !options.disable);
      } else {
        await automationSkillGetHandler(id);
      }
      return;
    }
    case 'export': {
      const { options } = parseAutomationOptions(rest);
      await automationExportHandler({ includeRuns: options.includeRuns });
      return;
    }
    case 'import':
      await automationImportHandler(requireAutomationArgument(rest[0], 'automation import requires a file path'));
      return;
    case 'task':
    case 'tasks':
      await routeAutomationTaskTokens(rest);
      return;
    case 'remote':
      await routeAutomationRemoteTokens(rest);
      return;
    case 'team':
    case 'teams':
      await routeAutomationTeamTokens(rest);
      return;
    default:
      throw new Error(`Unknown automation command: ${command}`);
  }
}

async function routeAutomationTaskTokens(tokens: string[]): Promise<void> {
  const [command = 'list', ...rest] = tokens;
  const { positional, options } = parseAutomationOptions(rest);
  switch (command) {
    case 'list':
      await automationTasksHandler();
      return;
    case 'runs':
      await automationTaskRunsHandler(options.task);
      return;
    case 'add':
      await automationTaskAddHandler(options);
      return;
    case 'update':
      await automationTaskUpdateHandler(requireAutomationArgument(positional[0], 'automation task update requires a task id'), options);
      return;
    case 'run':
      await automationTaskRunHandler(requireAutomationArgument(positional[0], 'automation task run requires a task id'));
      return;
    case 'enable':
      await automationTaskEnableHandler(requireAutomationArgument(positional[0], 'automation task enable requires a task id'), true);
      return;
    case 'disable':
      await automationTaskEnableHandler(requireAutomationArgument(positional[0], 'automation task disable requires a task id'), false);
      return;
    case 'delete':
    case 'rm':
      await automationTaskDeleteHandler(requireAutomationArgument(positional[0], 'automation task delete requires a task id'));
      return;
    default:
      throw new Error(`Unknown automation task command: ${command}`);
  }
}

async function routeAutomationRemoteTokens(tokens: string[]): Promise<void> {
  const [command = 'status', ...rest] = tokens;
  const { positional, options } = parseAutomationOptions(rest);
  switch (command) {
    case 'status':
      await automationRemoteStatusHandler();
      return;
    case 'pair':
      await automationRemotePairHandler(options);
      return;
    case 'serve':
      await automationRemoteServeHandler();
      return;
    case 'disable':
      await automationRemoteDisableHandler();
      return;
    case 'revoke':
      await automationRemoteRevokeHandler(requireAutomationArgument(positional[0], 'automation remote revoke requires a device id'));
      return;
    case 'relay':
      await routeAutomationRemoteRelayTokens(rest);
      return;
    default:
      throw new Error(`Unknown automation remote command: ${command}`);
  }
}

async function routeAutomationRemoteRelayTokens(tokens: string[]): Promise<void> {
  const [command = 'status', ...rest] = tokens;
  const { options } = parseAutomationOptions(rest);
  switch (command) {
    case 'status':
      await automationRemoteRelayStatusHandler();
      return;
    case 'configure':
      await automationRemoteRelayConfigureHandler(options);
      return;
    case 'disable':
      await automationRemoteRelayDisableHandler();
      return;
    default:
      throw new Error(`Unknown automation remote relay command: ${command}`);
  }
}

async function routeAutomationTeamTokens(tokens: string[]): Promise<void> {
  const [command = 'list', ...rest] = tokens;
  const { positional, options } = parseAutomationOptions(rest);
  switch (command) {
    case 'list':
      await automationTeamsHandler();
      return;
    case 'runs':
      await automationTeamRunsHandler(options.team);
      return;
    case 'create-default':
      await automationTeamCreateDefaultHandler(options);
      return;
    case 'save':
      await automationTeamSaveHandler(options);
      return;
    case 'run':
      await automationTeamRunHandler(requireAutomationArgument(positional[0], 'automation team run requires a team id'));
      return;
    case 'delete':
    case 'rm':
      await automationTeamDeleteHandler(requireAutomationArgument(positional[0], 'automation team delete requires a team id'));
      return;
    default:
      throw new Error(`Unknown automation team command: ${command}`);
  }
}

function parseAutomationOptions(tokens: string[]): { positional: string[]; options: Record<string, any> } {
  const positional: string[] = [];
  const options: Record<string, any> = {};
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }
    const rawName = token.slice(2);
    const disabled = rawName.startsWith('no-');
    const name = toCamelCase(disabled ? rawName.slice(3) : rawName);
    const next = tokens[index + 1];
    if (disabled) {
      options[name] = false;
    } else if (next && !next.startsWith('--')) {
      options[name] = next;
      index += 1;
    } else {
      options[name] = true;
    }
  }
  return { positional, options };
}

function toCamelCase(value: string): string {
  return value.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function requireAutomationArgument(value: string | undefined, message: string): string {
  if (!value?.trim()) {
    throw new Error(message);
  }
  return value;
}

export async function automationSkillsHandler(): Promise<void> {
  printJson(await getService().listSkills());
}

export async function automationSkillGetHandler(skillId: string): Promise<void> {
  printJson(await getService().getSkill(skillId));
}

export async function automationSkillsRefreshHandler(): Promise<void> {
  printJson(await getService().listSkills());
}

export async function automationSkillEnableHandler(skillId: string, enabled: boolean): Promise<void> {
  printJson(await getService().setSkillEnabled(skillId, enabled));
}

export async function automationTasksHandler(): Promise<void> {
  printJson(await getService().listTasks());
}

export async function automationTaskRunsHandler(taskId?: string): Promise<void> {
  printJson(await getService().listTaskRuns(taskId));
}

export async function automationTaskAddHandler(options: {
  name?: string;
  prompt?: string;
  interval?: string;
}): Promise<void> {
  const prompt = options.prompt?.trim();
  if (!prompt) {
    throw new Error('automation task add requires --prompt');
  }

  printJson(await getService().saveTask({
    name: options.name || 'Scheduled task',
    prompt,
    intervalMinutes: Number(options.interval ?? 60),
    enabled: true,
  }));
}

export async function automationTaskUpdateHandler(taskId: string, options: {
  name?: string;
  prompt?: string;
  interval?: string;
  enable?: boolean;
  disable?: boolean;
}): Promise<void> {
  const update: Partial<ScheduledTask> = { id: taskId };

  if (options.name !== undefined) {
    update.name = options.name;
  }
  if (options.prompt !== undefined) {
    update.prompt = options.prompt;
  }
  if (options.interval !== undefined) {
    const intervalMinutes = Number(options.interval);
    if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
      throw new Error('automation task update --interval must be a positive number of minutes.');
    }
    update.intervalMinutes = intervalMinutes;
  }
  if (options.enable || options.disable) {
    update.enabled = options.disable ? false : true;
  }

  printJson(await getService().saveTask(update));
}

export async function automationTaskRunHandler(taskId: string): Promise<void> {
  printJson(await getService().runTask(taskId));
}

export async function automationTaskEnableHandler(taskId: string, enabled: boolean): Promise<void> {
  printJson(await getService().setTaskEnabled(taskId, enabled));
}

export async function automationTaskDeleteHandler(taskId: string): Promise<void> {
  printJson(await getService().deleteTask(taskId));
}

export async function automationRemoteStatusHandler(): Promise<void> {
  printJson(await getService().getRemoteControl());
}

export async function automationRemotePairHandler(options: { device?: string }): Promise<void> {
  printJson(await getService().createRemotePairingCode(options.device));
}

export async function automationRemoteServeHandler(): Promise<void> {
  const service = getService();
  const remote = await service.updateRemoteControl({ enabled: true, mode: 'local-network' });
  printJson(remote);
  process.stdout.write('\nRemote control server is running. Press Ctrl+C to stop.\n');
  await new Promise<void>(() => {});
}

export async function automationRemoteDisableHandler(): Promise<void> {
  printJson(await getService().updateRemoteControl({ enabled: false, mode: 'disabled' }));
}

export async function automationRemoteRevokeHandler(deviceId: string): Promise<void> {
  printJson(await getService().revokeRemoteDevice(deviceId));
}

export async function automationRemoteRelayStatusHandler(): Promise<void> {
  printJson((await getService().getRemoteControl()).relay ?? { enrollmentStatus: 'not-configured' });
}

export async function automationRemoteRelayConfigureHandler(options: {
  brokerUrl?: string;
  accountId?: string;
  deviceId?: string;
  relayPublicKey?: string;
  clientKeyId?: string;
  auditCursor?: string;
  tokenRotatesAt?: string;
}): Promise<void> {
  if (!options.brokerUrl?.trim()) {
    throw new Error('automation remote relay configure requires --broker-url');
  }

  const tokenRotatesAt = options.tokenRotatesAt
    ? Date.parse(options.tokenRotatesAt)
    : undefined;
  if (options.tokenRotatesAt && !Number.isFinite(tokenRotatesAt)) {
    throw new Error('automation remote relay configure --token-rotates-at must be an ISO timestamp or parseable date.');
  }

  printJson(await getService().configureRemoteRelay({
    brokerUrl: options.brokerUrl,
    accountId: options.accountId,
    deviceId: options.deviceId,
    relayPublicKey: options.relayPublicKey,
    clientKeyId: options.clientKeyId,
    auditCursor: options.auditCursor,
    tokenRotatesAt,
  }));
}

export async function automationRemoteRelayDisableHandler(): Promise<void> {
  printJson(await getService().disableRemoteRelay());
}

export async function automationTeamsHandler(): Promise<void> {
  printJson(await getService().listTeams());
}

export async function automationTeamRunsHandler(teamId?: string): Promise<void> {
  printJson(await getService().listTeamRuns(teamId));
}

export async function automationTeamCreateDefaultHandler(options: { objective?: string }): Promise<void> {
  printJson(await getService().createDefaultTeam(options.objective));
}

export async function automationTeamSaveHandler(options: {
  id?: string;
  name?: string;
  objective?: string;
  workspace?: string;
  permissionMode?: string;
  maxIterations?: string;
  requireQaSignoff?: boolean;
}): Promise<void> {
  if (!options.objective?.trim() && !options.id) {
    throw new Error('automation team save requires --objective when creating a team.');
  }

  const maxIterations = options.maxIterations === undefined
    ? undefined
    : Number(options.maxIterations);
  if (options.maxIterations !== undefined && (!Number.isFinite(maxIterations) || maxIterations <= 0)) {
    throw new Error('automation team save --max-iterations must be a positive number.');
  }

  printJson(await getService().saveTeam({
    id: options.id,
    name: options.name,
    objective: options.objective,
    workspacePath: options.workspace,
    permissionMode: options.permissionMode === 'supervised' ? 'supervised' : options.permissionMode === 'full-access' ? 'full-access' : undefined,
    maxIterations,
    providerConfig: { requireQaSignoff: Boolean(options.requireQaSignoff) },
  }));
}

export async function automationTeamRunHandler(teamId: string): Promise<void> {
  printJson(await getService().runTeam(teamId));
}

export async function automationTeamDeleteHandler(teamId: string): Promise<void> {
  printJson(await getService().deleteTeam(teamId));
}

export async function automationExportHandler(options: { includeRuns?: boolean }): Promise<void> {
  printJson(await getService().exportProjectState({ includeRuns: options.includeRuns !== false }));
}

export async function automationImportHandler(filePath: string): Promise<void> {
  const content = await readFile(filePath, 'utf-8');
  printJson(await getService().importProjectState(JSON.parse(content)));
}

export function configureCliExecutors(service: AutomationServiceBridge): void {
  service.setTaskExecutor(async (task, context) => {
    const response = await runOpenAiCompatiblePrompt(buildCliScheduledTaskPrompt(task, context.enabledSkills));
    return { content: response.content, model: response.model, usage: response.usage };
  });

  service.setVirtualTeamPlannerExecutor(async (team, context) => {
    const response = await runOpenAiCompatiblePrompt(buildCliTeamPlannerPrompt(team, context.enabledSkills));
    return { content: response.content, model: response.model, usage: response.usage };
  });

  service.setVirtualTeamMemberExecutor(async (team, member, context) => {
    const response = await runOpenAiCompatiblePrompt(buildCliTeamMemberPrompt(
      team,
      member,
      context.assignment,
      context.previousSteps,
      context.sharedSteps,
      context.enabledSkills,
      context.workspacePath,
    ));
    return { content: response.content, model: response.model, usage: response.usage };
  });
}

function buildCliScheduledTaskPrompt(task: ScheduledTask, skills: SkillDetail[]): string {
  return [
    'You are running a scheduled CodeAgent CLI automation task.',
    `Task: ${task.name}`,
    `Prompt: ${task.prompt}`,
    '',
    'Enabled skills:',
    formatSkillContext(skills),
    '',
    'Return a concise automation run summary.',
  ].join('\n');
}

function buildCliTeamPlannerPrompt(team: VirtualTeamBlueprint, skills: SkillDetail[]): string {
  const members = team.members.map(member => [
    `- memberId: ${member.id}`,
    `  name: ${member.name}`,
    `  role: ${member.role}`,
    `  goal: ${member.goal}`,
    `  tools: ${member.tools.join(', ') || 'default tools'}`,
  ].join('\n')).join('\n');

  return [
    'You are the supervisor/orchestrator for a local virtual software delivery team running from the CodeAgent CLI.',
    '',
    `Workspace: ${team.workspacePath ?? process.cwd()}`,
    `Team: ${team.name}`,
    `Objective: ${team.objective}`,
    '',
    'Team members:',
    members || 'No members were configured.',
    '',
    'Enabled workspace skills:',
    formatSkillContext(skills),
    '',
    'Create an execution plan that mirrors a real software team:',
    '- Break the objective into concrete assignments.',
    '- Assign each assignment to exactly one listed memberId.',
    '- Use dependencies only when an assignment truly needs another output first.',
    '- Leave dependencies empty for work that can run in parallel.',
    '- Include review, merge, or signoff assignments after implementation work when useful.',
    '- Keep the plan small enough for one automation run.',
    '',
    'Return only JSON with this shape:',
    '{',
    '  "assignments": [',
    '    {',
    '      "id": "short-stable-id",',
    '      "title": "Concrete assignment title",',
    '      "description": "What this worker should produce or decide",',
    '      "memberId": "one listed memberId",',
    '      "dependencies": ["assignment-id-that-must-complete-first"]',
    '    }',
    '  ]',
    '}',
  ].join('\n');
}

function buildCliTeamMemberPrompt(
  team: VirtualTeamBlueprint,
  member: VirtualTeamMember,
  assignment: VirtualTeamAssignmentPlan,
  dependencySteps: VirtualTeamRunRecord['steps'],
  sharedSteps: VirtualTeamRunRecord['steps'],
  skills: SkillDetail[],
  workspacePath?: string,
): string {
  const dependencyContext = dependencySteps
    .filter(step => step.status !== 'running' && (step.output || step.error))
    .map(step => [
      `## ${step.assignmentTitle ?? `${step.role} - ${step.memberName}`}`,
      step.output ?? `Error: ${step.error}`,
    ].join('\n'))
    .join('\n\n');
  const sharedContext = sharedSteps
    .filter(step => !dependencySteps.some(dependencyStep => dependencyStep.assignmentId === step.assignmentId) && (step.output || step.error))
    .map(step => [
      `## ${step.assignmentTitle ?? `${step.role} - ${step.memberName}`}`,
      step.output ?? `Error: ${step.error}`,
    ].join('\n'))
    .join('\n\n');

  return [
    'You are a member of a local virtual software team running from the CodeAgent CLI.',
    '',
    `Workspace: ${workspacePath ?? team.workspacePath ?? process.cwd()}`,
    `Team: ${team.name}`,
    `Team objective: ${team.objective}`,
    `Role: ${member.role}`,
    `Name: ${member.name}`,
    `Goal: ${member.goal}`,
    `Available role tool families: ${member.tools.join(', ') || 'default tools'}`,
    '',
    `Assignment ID: ${assignment.id}`,
    `Assignment title: ${assignment.title}`,
    `Assignment description: ${assignment.description}`,
    `Dependency IDs: ${assignment.dependencies.join(', ') || 'none'}`,
    `Parallel group: ${assignment.parallelGroup}`,
    '',
    'Enabled skills:',
    formatSkillContext(skills),
    '',
    'Required dependency outputs:',
    dependencyContext || 'No required dependency outputs.',
    '',
    'Other completed shared team outputs:',
    sharedContext || 'No other completed outputs yet.',
    '',
    'Execution rules:',
    '- Stay within your role and produce concrete artifacts or decisions.',
    '- If the objective asks to build or create an app/project, provide exact file paths and complete file contents or patches; do not only describe the code.',
    '- The plain CLI automation executor does not expose desktop bridge tools in this call, so be explicit about any files or commands the caller must apply.',
    '- If this role cannot safely continue without human input, say exactly what approval or information is needed.',
    '- End with a short handoff for dependent team members and mention any files that should be created or changed.',
  ].join('\n');
}

function formatSkillContext(skills: SkillDetail[]): string {
  if (skills.length === 0) {
    return 'No enabled workspace skills.';
  }

  return skills.map(skill => [
    `# ${skill.name}`,
    skill.description,
    skill.content.slice(0, 4000),
  ].filter(Boolean).join('\n')).join('\n\n---\n\n');
}

async function runOpenAiCompatiblePrompt(prompt: string): Promise<{
  content: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}> {
  const baseUrl = (
    process.env.CODE_AGENT_BASE_URL ||
    process.env.CODE_AGENT_LLM_BASE_URL ||
    process.env.OPENAI_COMPATIBLE_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    ''
  ).replace(/\/$/, '');
  const model =
    process.env.CODE_AGENT_MODEL ||
    process.env.OPENAI_COMPATIBLE_MODEL ||
    process.env.OPENAI_MODEL ||
    'local-model';
  const apiKey =
    process.env.CODE_AGENT_API_KEY ||
    process.env.OPENAI_COMPATIBLE_API_KEY ||
    process.env.OPENAI_API_KEY ||
    'local';

  if (!baseUrl) {
    throw new Error('CLI automation execution requires CODE_AGENT_BASE_URL, CODE_AGENT_LLM_BASE_URL, OPENAI_COMPATIBLE_BASE_URL, or OPENAI_BASE_URL.');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are CodeAgent running a local automation task. Be concise and actionable.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: Number(process.env.CODE_AGENT_MAX_OUTPUT_TOKENS || 2048),
      temperature: Number(process.env.CODE_AGENT_TEMPERATURE || 0.7),
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI-compatible automation request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json() as any;
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    model: data.model ?? model,
    usage: {
      inputTokens: Number(data.usage?.prompt_tokens ?? 0),
      outputTokens: Number(data.usage?.completion_tokens ?? 0),
    },
  };
}
