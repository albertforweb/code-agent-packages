import { runAutomationCommand } from './cli/automation.js';
import { runProjectStudioCommand } from './cli/project-studio.js';
import type { FeaturePackageCliModule } from '@codeagent/feature-package-sdk';

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

export async function runCliCommand(command: string, args: string): Promise<string> {
  if (command === 'automation' || command === 'auto') {
    return runAutomationCommand(args);
  }
  if (command === 'role' || command === 'roles') {
    return runProjectStudioCommand(args, 'role');
  }
  if (command === 'employee' || command === 'employees' || command === 'people') {
    return runProjectStudioCommand(args, 'employee');
  }
  if (command === 'team' || command === 'teams') {
    return runProjectStudioCommand(args, 'team');
  }
  if (command === 'project' || command === 'projects') {
    return runProjectStudioCommand(args, 'project');
  }
  throw new Error(`Software Developer package does not register the "${command}" CLI command.`);
}

const cliModule: FeaturePackageCliModule = { runCliCommand };
export default cliModule;
