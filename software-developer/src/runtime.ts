import { defineFeaturePackageRuntime, type FeaturePackageRuntimeModule } from '@codeagent/feature-package-sdk';
export { runAutomationCommand } from './cli/automation.js';
export {
  employeeCreateHandler,
  employeeDeleteHandler,
  employeeListHandler,
  employeeUpdateHandler,
  projectContextHandler,
  projectCreateHandler,
  projectDeleteHandler,
  projectDeliverablesHandler,
  projectListHandler,
  projectRunsHandler,
  projectShowHandler,
  projectStartHandler,
  projectStatusHandler,
  projectTeamCreateHandler,
  projectTeamDeleteHandler,
  projectTeamListHandler,
  projectTeamUpdateHandler,
  projectUpdateHandler,
  roleCreateHandler,
  roleDeleteHandler,
  roleListHandler,
  roleUpdateHandler,
  runProjectStudioCommand,
} from './cli/project-studio.js';

const runtime: FeaturePackageRuntimeModule = defineFeaturePackageRuntime({
  packageId: 'software-developer',
  version: '1.0.0',
  activate(context) {
    const registeredExtensions = context.manifest.extensions ?? [];
    for (const extension of registeredExtensions) {
      context.registerExtension(extension);
    }
    context.logger.info('Software Developer package runtime activated.', {
      packageId: context.manifest.id,
      shell: context.shell,
      extensions: registeredExtensions.length,
    });
    return { registeredExtensions };
  },
});

export default runtime;
