import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

test('renderer artifact exposes the SDK renderer module contract', async () => {
  globalThis.__CODEAGENT_FEATURE_PACKAGE_REACT__ = React;
  const { default: renderer } = await import('../../dist-feature-packages/software-developer/dist/renderer.js');
  assert.equal(renderer.packageId, 'software-developer');
  assert.equal(typeof renderer.createContribution, 'function');

  const contribution = renderer.createContribution({});
  assert.deepEqual(Object.keys(contribution.views).sort(), ['automation', 'history', 'projects', 'tools']);
  assert.equal(typeof contribution.workflowDefaults?.getDefaultGoal, 'function');
  assert.equal(typeof contribution.workflowDefaults?.getDefaultTools, 'function');
});
