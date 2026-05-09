import { MODULE_KEY } from '../../../../packages/domain/src/motorizedScreens';

export function buildMyProjectsModuleEntry(projectId: string, submissionId: string, totalScreens: number, createdAt: string) {
  return {
    projectId,
    moduleKey: MODULE_KEY,
    submissionId,
    summary: `Motorized Screens submission: ${totalScreens} screen(s)`,
    createdAt,
  };
}
