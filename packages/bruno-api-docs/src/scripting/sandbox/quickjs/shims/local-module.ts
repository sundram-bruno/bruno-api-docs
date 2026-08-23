import { marshallToVm } from '../utils';

type LocalModuleResolver = (modulePath: string) => string | null;

let localModuleResolver: LocalModuleResolver = () => null;

export const setLocalModuleResolver = (resolver: LocalModuleResolver) => {
  localModuleResolver = resolver;
};

const addLocalModuleShimToContext = (vm: any) => {
  const loadLocalModule = vm.newFunction('__brunoLoadLocalModule', (pathHandle: any) => {
    const modulePath = String(vm.dump(pathHandle));
    const source = localModuleResolver(modulePath);
    if (source === null || source === undefined) {
      throw vm.newError(
        `Local file require is not available in the docs playground (tried to load '${modulePath}'). ` + 'Only the built-in safe-mode libraries can be required here.'
      );
    }
    return marshallToVm(source, vm);
  });
  loadLocalModule.consume((handle: any) => vm.setProp(vm.global, '__brunoLoadLocalModule', handle));
};

export default addLocalModuleShimToContext;
