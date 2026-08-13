import assert from 'node:assert/strict';
import test from 'node:test';

import { build } from 'esbuild';

const buildResult = await build({
  entryPoints: [new URL('../src/automation-provider.ts', import.meta.url).pathname],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(buildResult.outputFiles[0].text).toString('base64')}`;
const { softwareDeveloperAutomationProvider: provider } = await import(moduleUrl);

function workflow() {
  return {
    providerId: 'software-developer',
    name: 'Delivery team',
    objective: [
      'Goals:',
      '1. Store requirements',
      '2. Build editor',
      '3. Remove backgrounds',
      'Acceptance criteria:',
      '- The product is runnable.',
    ].join('\n'),
    workspacePath: '/tmp/project',
    supervisorId: 'jim',
    providerConfig: { requireQaSignoff: false },
    members: [
      { id: 'jim', name: 'Jim', role: 'Product Manager', goal: 'Plan delivery.', tools: [] },
      { id: 'jery', name: 'Jery', role: 'Software Developer', goal: 'Implement delivery.', tools: [] },
      { id: 'tom', name: 'Tom', role: 'QA Engineer', goal: 'Verify delivery.', tools: [] },
    ],
  };
}

test('repairs implementation assignments that target planning or invalid members', () => {
  const team = workflow();
  const content = JSON.stringify({ assignments: [
    {
      id: 'assignment-1', title: 'Create requirements data', description: 'Create product data', memberId: 'jim',
      goalIds: ['goal-1'], expectedArtifacts: ['data/requirements.json'], acceptanceCriteria: ['The data loads.'],
    },
    {
      id: 'assignment-2', title: 'Build editor', description: 'Implement the UI', memberId: 'unknown',
      goalIds: ['goal-2'], expectedArtifacts: ['src/app.ts'], acceptanceCriteria: ['The editor opens.'],
    },
    {
      id: 'assignment-3', title: 'Implement background removal', description: 'Implement image transforms', memberId: 'jim',
      goalIds: ['goal-3'], expectedArtifacts: ['src/image.ts'], acceptanceCriteria: ['Background removal works.'],
    },
  ] });

  const assignments = provider.parseAssignmentPlan(content, team);

  assert.deepEqual(assignments.map(assignment => assignment.memberId), ['jery', 'jery', 'jery']);
  assert.equal(provider.validateAssignmentPlan(team, assignments), undefined);
});

test('keeps final verification with a QA owner', () => {
  const team = workflow();
  const content = JSON.stringify({ assignments: [{
    id: 'qa', title: 'Verify integrated product', description: 'Review every goal and execute tests', memberId: 'tom',
    goalIds: ['goal-1', 'goal-2', 'goal-3'], expectedArtifacts: ['docs/verification/qa.json'], acceptanceCriteria: ['All tests pass.'],
  }] });

  const [assignment] = provider.parseAssignmentPlan(content, team);

  assert.equal(assignment.memberId, 'tom');
  assert.equal(assignment.kind, 'review');
});
