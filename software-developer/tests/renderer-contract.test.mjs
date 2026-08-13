import assert from 'node:assert/strict';
import test from 'node:test';
import renderer from '../../dist-feature-packages/software-developer/dist/renderer.js';

test('renderer artifact exposes the SDK renderer module contract', () => {
  assert.equal(renderer.packageId, 'software-developer');
  assert.equal(typeof renderer.createContribution, 'function');

  const contribution = renderer.createContribution({});
  assert.deepEqual(Object.keys(contribution.views).sort(), ['automation', 'history', 'projects', 'tools']);
  assert.equal(typeof contribution.workflowDefaults?.getDefaultGoal, 'function');
  assert.equal(typeof contribution.workflowDefaults?.getDefaultTools, 'function');
});
