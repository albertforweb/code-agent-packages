import { defineFeaturePackageRuntime, type FeaturePackageRuntimeModule } from '@codeagent/feature-package-sdk';
import { softwareDeveloperAutomationProvider } from './automation-provider.js';

const runtime: FeaturePackageRuntimeModule = defineFeaturePackageRuntime({
  packageId: 'software-developer',
  version: '1.0.7',
  activate(context) {
    const registeredExtensions = context.manifest.extensions ?? [];
    for (const extension of registeredExtensions) {
      context.registerExtension(extension);
    }
    context.registerAutomationProvider(softwareDeveloperAutomationProvider);
    context.logger.info('Software Developer package runtime activated.', {
      packageId: context.manifest.id,
      shell: context.shell,
      extensions: registeredExtensions.length,
    });
    return {
      registeredExtensions,
      registeredAutomationProviderIds: [softwareDeveloperAutomationProvider.id],
    };
  },
});

export default runtime;
