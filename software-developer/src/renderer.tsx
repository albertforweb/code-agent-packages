// @ts-nocheck
/**
 * Software Developer desktop renderer.
 *
 * This implementation lives with the feature package. The core desktop renderer
 * supplies framework UI primitives and service callbacks through the host
 * contract; professional workflow presentation remains package-owned.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  defineFeaturePackageRenderer,
  type FeaturePackageRendererContribution,
  type FeaturePackageRendererHost,
  type FeaturePackageRendererModule,
} from '@codeagent/feature-package-sdk';
import { getDefaultTeamGoal, getDefaultTeamTools } from './project-defaults';

export function createSoftwareDeveloperRendererViews(
  host: FeaturePackageRendererHost,
): Record<string, React.ComponentType<any>> {
  const {
    AUTOMATION_PERMISSION_TOOLS,
    DEFAULT_AUTONOMOUS_ROLES,
    DEFAULT_EMPLOYEE_PERMISSIONS,
    DEFAULT_PROJECT_ARTIFACTS,
    PROJECT_LIST_PAGE_SIZE,
    TOOL_PERMISSION_OPTIONS,
    Icon,
    InlineApprovalQueue,
    MessageItem,
    RecordViewToggle,
    ToolActivityPanel,
    createDefaultProjectTeams,
    createProjectReadyMessages,
    createProjectTeamId,
    createSoftwareProjectDraft,
    createVirtualEmployeeProfile,
    createVirtualRoleDefinition,
    formatFileSize,
    formatImageAttachmentSummary,
    formatProjectOutputSource,
    formatProjectStatus,
    getDefaultRoleId,
    getEmployeeRoleDefinition,
    getHistoryRecordSummary,
    getHistoryRecordTitle,
    getHistoryRecordTypeLabel,
    getPathBasename,
    getProjectAssignedEmployees,
    getProjectAutomationTeamId,
    getProjectChatKey,
    getProjectStaffingEmployees,
    getProjectSupervisor,
    getProjectTeams,
    getProviderDefault,
    getRoleDefinitionById,
    getTeamMembers,
    getTeamSupervisor,
    getToolPermissionPolicy,
    getToolResultPath,
    groupMessagesByAssistantRun,
    groupToolsByCategory,
    isProjectToolActivity,
    isReviewForProjectChat,
    isSupervisorEmployee,
    isToolExposedToModel,
    joinWorkspacePath,
    normalizeStringList,
    normalizeToolNameList,
    readCliOption,
    styles,
    summarizeProjectGoals,
    summarizeToolResult
  } = host as any;

  function SettingsSection({
    title,
    children,
  }: {
    title?: string;
    children: React.ReactNode;
  }) {
    return (
      <section className={styles.settingsSection}>
        {title && <h3>{title}</h3>}
        {children}
      </section>
    );
  }

  function WorkbenchEditorPanel({
    title,
    subtitle,
    children,
    footer,
    onClose,
    wide = false,
    bodyClassName,
  }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    onClose: () => void;
    wide?: boolean;
    bodyClassName?: string;
  }) {
    return (
      <aside className={wide ? `${styles.workbenchEditorPanel} ${styles.workbenchEditorPanelWide}` : styles.workbenchEditorPanel} aria-label={title}>
        <div className={styles.workbenchEditorHeader}>
          <div>
            <h3>{title}</h3>
            {subtitle && <span>{subtitle}</span>}
          </div>
          <button className={styles.secondaryButton} type="button" onClick={onClose} title="Close this panel">
            <Icon name="x" size={14} />
            Close
          </button>
        </div>
        <div className={bodyClassName ? `${styles.workbenchEditorBody} ${bodyClassName}` : styles.workbenchEditorBody}>
          {children}
        </div>
        {footer && (
          <div className={styles.workbenchEditorFooter}>
            {footer}
          </div>
        )}
      </aside>
    );
  }
  
  function ProjectsView({
    activeSection,
    appInfo,
    appConfig,
    appState,
    activeProviderLabel,
    activeProviderDefault,
    viewportSize,
    tokenUsage,
    toolActivities,
    teamRuns,
    runningProjectIds,
    currentSessionTitle,
    sessionCount,
    projects,
    activeProjectId,
    roles,
    employees,
    projectTeams,
    projectChatMessages,
    fileWriteReviews,
    commandReviews,
    toolPermissionReviews,
    projectGeneratedOutputs,
    projectChatSendingKeys,
    workspacePath,
    workspaceEntries,
    workspaceBrowserError,
    workspaceActionMessage,
    isLoadingWorkspaceEntries,
    onOpenWorkspaceEntry,
    onOpenWorkspacePath,
    onRevealWorkspacePath,
    onGoToWorkspaceParent,
    onRefreshWorkspace,
    mcpServers,
    mcpTools,
    onSaveProject,
    onSaveRole,
    onDeleteRole,
    onSaveEmployee,
    onDeleteEmployee,
    onSaveTeam,
    onDeleteTeam,
    onSelectProject,
    onSetProjectStatus,
    onDeleteProject,
    onSendProjectChat,
    onResolveFileWrite,
    onResolveCommand,
    onResolveToolPermission,
    onChangeSection,
  }: {
    activeSection: ProjectsSectionId;
    appInfo: AppInfo | null;
    appConfig: AppConfig | null;
    appState: Record<string, any>;
    activeProviderLabel: string;
    activeProviderDefault: ReturnType<typeof getProviderDefault>;
    viewportSize: { width: number; height: number };
    tokenUsage: { inputTokens: number; outputTokens: number };
    toolActivities: ToolActivity[];
    teamRuns: VirtualTeamRunRecord[];
    runningProjectIds: Set<string>;
    currentSessionTitle: string;
    sessionCount: number;
    projects: SoftwareProjectPlan[];
    activeProjectId: string;
    roles: VirtualRoleDefinition[];
    employees: VirtualEmployeeProfile[];
    projectTeams: ProjectTeamDefinition[];
    projectChatMessages: Record<string, UiMessage[]>;
    fileWriteReviews: FileWriteReviewRequest[];
    commandReviews: CommandReviewRequest[];
    toolPermissionReviews: ToolPermissionReviewRequest[];
    projectGeneratedOutputs: Record<string, ProjectGeneratedOutput[]>;
    projectChatSendingKeys: Set<string>;
    workspacePath: string;
    workspaceEntries: FileEntry[];
    workspaceBrowserError: string;
    workspaceActionMessage: string;
    isLoadingWorkspaceEntries: boolean;
    onOpenWorkspaceEntry: (entry: FileEntry) => void;
    onOpenWorkspacePath: (path: string) => void;
    onRevealWorkspacePath: (path: string) => void;
    onGoToWorkspaceParent: () => void;
    onRefreshWorkspace: () => void;
    mcpServers: McpServerInfo[];
    mcpTools: McpToolInfo[];
    onSaveProject: (project: SoftwareProjectPlan) => void;
    onSaveRole: (role: VirtualRoleDefinition) => void;
    onDeleteRole: (roleId: string) => void;
    onSaveEmployee: (employee: VirtualEmployeeProfile) => void;
    onDeleteEmployee: (employeeId: string) => void;
    onSaveTeam: (team: ProjectTeamDefinition) => void;
    onDeleteTeam: (teamId: string) => void;
    onSelectProject: (projectId: string) => void;
    onSetProjectStatus: (projectId: string, status: SoftwareProjectStatus) => void;
    onDeleteProject: (projectId: string) => void;
    onSendProjectChat: (project: SoftwareProjectPlan, channel: ProjectChatChannel, prompt: string) => void;
    onResolveFileWrite: (review: FileWriteReviewRequest, approved: boolean) => void;
    onResolveCommand: (review: CommandReviewRequest, approved: boolean) => void;
    onResolveToolPermission: (review: ToolPermissionReviewRequest, approved: boolean) => void;
    onChangeSection: (section: ProjectsSectionId) => void;
  }) {
    const visibleActiveSection = (['studio', 'roles', 'employees', 'teams'] as ProjectsSectionId[]).includes(activeSection)
      ? activeSection
      : 'studio';
    const workspaceTitle = appInfo?.workspacePath?.split('/').filter(Boolean).pop() || 'Workspace';
    const selectedProject = projects.find(project => project.id === activeProjectId) ?? projects[0];
    const guidedProjects = projects.filter(project => project.mode === 'guided');
    const autonomousProjects = projects.filter(project => project.mode === 'autonomous');
    const selectedAutonomousProject = autonomousProjects.find(project => project.id === activeProjectId) ?? autonomousProjects[0];
    const selectedAutonomousSupervisor = selectedAutonomousProject ? getProjectSupervisor(selectedAutonomousProject, employees, roles) : employees.find(employee => isSupervisorEmployee(employee, roles));
    const selectedAutonomousTeams = selectedAutonomousProject ? getProjectTeams(selectedAutonomousProject, projectTeams) : [];
    const selectedAutonomousDirectEmployees = selectedAutonomousProject ? getProjectAssignedEmployees(selectedAutonomousProject, employees, roles) : [];
    const selectedAutonomousStaff = selectedAutonomousProject
      ? getProjectStaffingEmployees(selectedAutonomousProject, employees, roles, projectTeams)
      : employees.filter(employee => employee.id !== selectedAutonomousSupervisor?.id);
    function getProjectLatestRun(project: SoftwareProjectPlan): VirtualTeamRunRecord | undefined {
      if (project.mode !== 'autonomous') {
        return undefined;
      }
  
      const automationTeamId = getProjectAutomationTeamId(project.id);
      return teamRuns
        .filter(run => run.teamId === automationTeamId)
        .sort((left, right) => right.startedAt - left.startedAt)[0];
    }
  
    function getProjectEffectiveStatus(project: SoftwareProjectPlan): SoftwareProjectStatus {
      if (project.status === 'stopped') {
        return 'stopped';
      }
  
      const latestRun = getProjectLatestRun(project);
      if (project.mode === 'autonomous' && (runningProjectIds.has(project.id) || latestRun?.status === 'running')) {
        return 'active';
      }
      if (latestRun?.status === 'succeeded') {
        return 'done';
      }
      if (latestRun?.status === 'failed') {
        return 'blocked';
      }
      return project.status;
    }
  
    const activeProjects = projects.filter(project => getProjectEffectiveStatus(project) === 'active');
    const staffedProjectCount = projects.filter(project => (
      project.mode === 'guided'
        ? project.assignedEmployeeIds.length > 0
        : Boolean(project.supervisorEmployeeId || project.assignedEmployeeIds.length > 0 || project.assignedTeamIds.length > 0)
    )).length;
    const deliverableCount = projects.reduce((total, project) => total + project.artifacts.length, 0);
    const projectModeMetrics = [
      { label: 'Standard', value: guidedProjects.length, className: styles.projectMetricGuided },
      { label: 'Fully autonomous', value: autonomousProjects.length, className: styles.projectMetricAutonomous },
    ];
    const projectStatusMetrics = ([
      ['Active', 'active', styles.projectMetricActive],
      ['Planning', 'planning', styles.projectMetricPlanning],
      ['Blocked', 'blocked', styles.projectMetricBlocked],
      ['Stopped', 'stopped', styles.projectMetricStopped],
      ['Done', 'done', styles.projectMetricDone],
      ['Idea', 'idea', styles.projectMetricIdea],
    ] as Array<[string, SoftwareProjectStatus, string]>).map(([label, status, className]) => ({
      label,
      value: projects.filter(project => getProjectEffectiveStatus(project) === status).length,
      className,
    }));
    const projectStaffingMetrics = [
      { label: 'Staffed', value: staffedProjectCount, className: styles.projectMetricStaffed },
      { label: 'Needs staffing', value: Math.max(0, projects.length - staffedProjectCount), className: styles.projectMetricNeedsStaffing },
    ];
    const [draft, setDraft] = useState<SoftwareProjectPlan>(() => createSoftwareProjectDraft(appInfo?.workspacePath));
    const [roleDraft, setRoleDraft] = useState<VirtualRoleDefinition>(() => createVirtualRoleDefinition('Developer'));
    const [employeeDraft, setEmployeeDraft] = useState<VirtualEmployeeProfile>(() => createVirtualEmployeeProfile('Developer'));
    const [teamDraft, setTeamDraft] = useState<ProjectTeamDefinition>(() => createDefaultProjectTeams()[0]);
    const [profileEmployeeId, setProfileEmployeeId] = useState('');
    const [projectEditorPanel, setProjectEditorPanel] = useState<ProjectEditorPanelId | null>(null);
    const [projectDeleteTarget, setProjectDeleteTarget] = useState<DeleteTarget<ProjectDeleteKind> | null>(null);
    const [projectActionProjectId, setProjectActionProjectId] = useState('');
    const [projectChatDrafts, setProjectChatDrafts] = useState<Record<string, string>>({});
    const [activityRunSelections, setActivityRunSelections] = useState<Record<string, string>>({});
    const [copiedProjectMessageId, setCopiedProjectMessageId] = useState<string | null>(null);
    const [projectPortfolioView, setProjectPortfolioView] = useState<RecordViewMode>('table');
    const [roleListView, setRoleListView] = useState<RecordViewMode>('table');
    const [employeeListView, setEmployeeListView] = useState<RecordViewMode>('table');
    const [teamListView, setTeamListView] = useState<RecordViewMode>('table');
    const [projectPage, setProjectPage] = useState(1);
    const projectPageCount = Math.max(1, Math.ceil(projects.length / PROJECT_LIST_PAGE_SIZE));
    const normalizedProjectPage = Math.min(projectPage, projectPageCount);
    const projectPageStartIndex = (normalizedProjectPage - 1) * PROJECT_LIST_PAGE_SIZE;
    const visibleProjects = projects.slice(projectPageStartIndex, projectPageStartIndex + PROJECT_LIST_PAGE_SIZE);
    const projectPageFirstRecord = projects.length === 0 ? 0 : projectPageStartIndex + 1;
    const projectPageLastRecord = Math.min(projectPageStartIndex + PROJECT_LIST_PAGE_SIZE, projects.length);
    const projectChatTranscriptRef = useRef<HTMLDivElement | null>(null);
    const profileEmployee = employees.find(employee => employee.id === profileEmployeeId);
    const projectActionProject = projects.find(project => project.id === projectActionProjectId)
      ?? selectedProject;
    const projectWidePanels: ProjectEditorPanelId[] = [
      'project-chat',
      'project-org',
      'project-execution',
      'project-board',
      'project-team-chat',
      'project-deliverables',
    ];
    const projectRailOpen = Boolean(projectEditorPanel);
    const projectRailWide = Boolean(projectEditorPanel && projectWidePanels.includes(projectEditorPanel));
  
    useEffect(() => {
      setProjectPage(current => Math.min(Math.max(1, current), Math.max(1, Math.ceil(projects.length / PROJECT_LIST_PAGE_SIZE))));
    }, [projects.length]);
  
    useEffect(() => {
      if (projectEditorPanel !== 'project-chat' && projectEditorPanel !== 'project-team-chat') {
        return;
      }
  
      const transcript = projectChatTranscriptRef.current;
      if (transcript) {
        transcript.scrollTop = transcript.scrollHeight;
      }
    }, [projectEditorPanel, projectActionProjectId, projectChatMessages, projectChatSendingKeys]);
  
    function startDraft() {
      const supervisor = employees.find(employee => isSupervisorEmployee(employee, roles)) ?? employees[0];
      setDraft({
        ...createSoftwareProjectDraft(appInfo?.workspacePath),
        mode: 'guided',
        permissionMode: 'supervised',
        supervisorEmployeeId: supervisor?.id ?? '',
        supervisorRole: supervisor ? getEmployeeRoleDefinition(supervisor, roles)?.title ?? supervisor.role : 'Supervisor',
        assignedEmployeeIds: [],
        assignedTeamIds: [],
        teamRoles: [],
      });
      setProfileEmployeeId('');
      setProjectDeleteTarget(null);
      setProjectActionProjectId('');
      setProjectEditorPanel('project');
    }
  
    function editProject(project: SoftwareProjectPlan) {
      setDraft({
        ...project,
        artifacts: [...project.artifacts],
        teamRoles: [...project.teamRoles],
        assignedTeamIds: [...project.assignedTeamIds],
        assignedEmployeeIds: [...project.assignedEmployeeIds],
      });
      onSelectProject(project.id);
      setProfileEmployeeId('');
      setProjectDeleteTarget(null);
      setProjectActionProjectId(project.id);
      setProjectEditorPanel('project');
    }
  
    function updateDraft(update: Partial<SoftwareProjectPlan>) {
      setDraft(current => ({
        ...current,
        ...update,
        updatedAt: Date.now(),
      }));
    }
  
    function saveDraft(): SoftwareProjectPlan {
      const supervisor = employees.find(employee => employee.id === draft.supervisorEmployeeId);
      const assignedEmployees = employees.filter(employee => draft.assignedEmployeeIds.includes(employee.id));
      const assignedTeams = projectTeams.filter(team => draft.assignedTeamIds.includes(team.id));
      const next = {
        ...draft,
        name: draft.name.trim() || 'Untitled software project',
        workspacePath: draft.workspacePath || appInfo?.workspacePath,
        artifacts: normalizeStringList(draft.artifacts, DEFAULT_PROJECT_ARTIFACTS),
        supervisorRole: supervisor
          ? getEmployeeRoleDefinition(supervisor, roles)?.title ?? supervisor.role
          : draft.supervisorRole,
        assignedTeamIds: assignedTeams.map(team => team.id),
        teamRoles: assignedEmployees.length > 0 || assignedTeams.length > 0
          ? [
              ...assignedTeams.map(team => team.name),
              ...assignedEmployees.map(employee => getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role),
            ]
          : normalizeStringList(draft.teamRoles, DEFAULT_AUTONOMOUS_ROLES),
        updatedAt: Date.now(),
      };
      onSaveProject(next);
      setDraft(next);
      return next;
    }
  
    function saveDraftAndViewOrganization() {
      const project = saveDraft();
      onSelectProject(project.id);
      setProjectActionProjectId(project.id);
      setProjectEditorPanel(project.mode === 'autonomous' ? 'project-org' : 'project-chat');
    }
  
    function saveDraftAndOpenProjectChat() {
      const project = saveDraft();
      onSelectProject(project.id);
      setProjectActionProjectId(project.id);
      setProjectEditorPanel('project-chat');
    }
  
    function closeProjectEditorPanel() {
      setProjectEditorPanel(null);
      setProfileEmployeeId('');
      setProjectDeleteTarget(null);
      setProjectActionProjectId('');
    }
  
    function openProjectDeleteConfirmation(target: DeleteTarget<ProjectDeleteKind>) {
      setProfileEmployeeId('');
      setProjectActionProjectId(target.kind === 'project' ? target.id : '');
      setProjectDeleteTarget(target);
      setProjectEditorPanel('delete');
    }
  
    function openProjectActionPanel(project: SoftwareProjectPlan, panel: ProjectEditorPanelId) {
      onSelectProject(project.id);
      setProfileEmployeeId('');
      setProjectDeleteTarget(null);
      setProjectActionProjectId(project.id);
      setProjectEditorPanel(panel);
    }
  
    function confirmProjectDelete() {
      if (!projectDeleteTarget) {
        return;
      }
  
      if (projectDeleteTarget.kind === 'project') {
        onDeleteProject(projectDeleteTarget.id);
      } else if (projectDeleteTarget.kind === 'role') {
        onDeleteRole(projectDeleteTarget.id);
      } else if (projectDeleteTarget.kind === 'employee') {
        onDeleteEmployee(projectDeleteTarget.id);
      } else if (projectDeleteTarget.kind === 'team') {
        onDeleteTeam(projectDeleteTarget.id);
      }
  
      closeProjectEditorPanel();
    }
  
    function openNewRoleEditor() {
      setRoleDraft(createVirtualRoleDefinition('Developer'));
      setProjectDeleteTarget(null);
      setProjectEditorPanel('role');
    }
  
    function openRoleEditor(role: VirtualRoleDefinition) {
      setRoleDraft({
        ...role,
        responsibilities: [...role.responsibilities],
        defaultTools: [...role.defaultTools],
      });
      setProjectDeleteTarget(null);
      setProjectEditorPanel('role');
    }
  
    function openNewEmployeeEditor() {
      setEmployeeDraft(createVirtualEmployeeProfile('Developer'));
      setProjectDeleteTarget(null);
      setProjectEditorPanel('employee');
    }
  
    function openEmployeeEditor(employee: VirtualEmployeeProfile) {
      setEmployeeDraft({
        ...employee,
        permissions: [...employee.permissions],
      });
      setProjectDeleteTarget(null);
      setProjectEditorPanel('employee');
    }
  
    function openEmployeeProfile(employeeId: string) {
      setProjectDeleteTarget(null);
      setProfileEmployeeId(employeeId);
      setProjectEditorPanel('employee-profile');
    }
  
    function openNewProjectTeamEditor() {
      setTeamDraft({
        ...createDefaultProjectTeams()[0],
        id: createProjectTeamId('Project team'),
        name: 'New Project Team',
        memberEmployeeIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setProjectDeleteTarget(null);
      setProjectEditorPanel('team');
    }
  
    function openProjectTeamEditor(team: ProjectTeamDefinition) {
      setTeamDraft({
        ...team,
        memberEmployeeIds: [...team.memberEmployeeIds],
      });
      setProjectDeleteTarget(null);
      setProjectEditorPanel('team');
    }
  
    function saveRoleDraft() {
      onSaveRole({
        ...roleDraft,
        title: roleDraft.title.trim() || 'Contributor',
        responsibilities: normalizeStringList(roleDraft.responsibilities, ['Deliver assigned project responsibilities.']),
        defaultGoal: roleDraft.defaultGoal.trim() || getDefaultTeamGoal(roleDraft.title),
        defaultTools: normalizeStringList(roleDraft.defaultTools, getDefaultTeamTools(roleDraft.title)),
        updatedAt: Date.now(),
      });
      setRoleDraft(createVirtualRoleDefinition('Developer'));
      closeProjectEditorPanel();
    }
  
    function selectEmployeeRole(roleId: string) {
      const role = getRoleDefinitionById(roles, roleId);
      setEmployeeDraft(current => ({
        ...current,
        roleId,
        role: role?.title ?? current.role,
        updatedAt: Date.now(),
      }));
    }
  
    function saveEmployeeDraft() {
      const role = getRoleDefinitionById(roles, employeeDraft.roleId, employeeDraft.role);
      onSaveEmployee({
        ...employeeDraft,
        name: employeeDraft.name.trim() || role?.title || employeeDraft.role.trim() || 'Employee',
        roleId: role?.id ?? employeeDraft.roleId,
        role: role?.title ?? (employeeDraft.role.trim() || 'Contributor'),
        permissions: normalizeStringList(employeeDraft.permissions, DEFAULT_EMPLOYEE_PERMISSIONS),
        updatedAt: Date.now(),
      });
      setEmployeeDraft(createVirtualEmployeeProfile('Developer'));
      closeProjectEditorPanel();
    }
  
    function saveTeamDraft() {
      onSaveTeam({
        ...teamDraft,
        name: teamDraft.name.trim() || 'Project team',
        mission: teamDraft.mission.trim() || 'Deliver a scoped portion of the project mission.',
        memberEmployeeIds: normalizeStringList(teamDraft.memberEmployeeIds, []),
        updatedAt: Date.now(),
      });
      setTeamDraft({
        ...createDefaultProjectTeams()[0],
        id: createProjectTeamId('Project team'),
        name: 'New Project Team',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      closeProjectEditorPanel();
    }
  
    function selectTeamSupervisor(employeeId: string) {
      setTeamDraft(current => ({
        ...current,
        supervisorEmployeeId: employeeId,
        memberEmployeeIds: current.memberEmployeeIds.filter(id => id !== employeeId),
        updatedAt: Date.now(),
      }));
    }
  
    function toggleTeamMember(employeeId: string) {
      setTeamDraft(current => {
        const members = new Set(current.memberEmployeeIds);
        if (members.has(employeeId)) {
          members.delete(employeeId);
        } else {
          members.add(employeeId);
        }
        members.delete(current.supervisorEmployeeId);
        return {
          ...current,
          memberEmployeeIds: Array.from(members),
          updatedAt: Date.now(),
        };
      });
    }
  
    function toggleDraftEmployee(employeeId: string) {
      setDraft(current => {
        const assigned = new Set(current.assignedEmployeeIds);
        if (assigned.has(employeeId)) {
          assigned.delete(employeeId);
        } else {
          assigned.add(employeeId);
        }
        assigned.delete(current.supervisorEmployeeId);
        const assignedEmployees = employees.filter(employee => assigned.has(employee.id));
        const assignedTeams = projectTeams.filter(team => current.assignedTeamIds.includes(team.id));
        return {
          ...current,
          assignedEmployeeIds: assignedEmployees.map(employee => employee.id),
          teamRoles: [
            ...assignedTeams.map(team => team.name),
            ...assignedEmployees.map(employee => getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role),
          ],
          updatedAt: Date.now(),
        };
      });
    }
  
    function selectDraftSupervisor(employeeId: string) {
      const supervisor = employees.find(employee => employee.id === employeeId);
      updateDraft({
        supervisorEmployeeId: employeeId,
        supervisorRole: supervisor ? getEmployeeRoleDefinition(supervisor, roles)?.title ?? supervisor.role : 'Supervisor',
        assignedEmployeeIds: draft.assignedEmployeeIds.filter(id => id !== employeeId),
      });
    }
  
    function toggleDraftTeam(teamId: string) {
      setDraft(current => {
        const assigned = new Set(current.assignedTeamIds);
        if (assigned.has(teamId)) {
          assigned.delete(teamId);
        } else {
          assigned.add(teamId);
        }
        const assignedTeams = projectTeams.filter(team => assigned.has(team.id));
        return {
          ...current,
          assignedTeamIds: assignedTeams.map(team => team.id),
          teamRoles: [
            ...assignedTeams.map(team => team.name),
            ...employees
              .filter(employee => current.assignedEmployeeIds.includes(employee.id))
              .map(employee => getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role),
          ],
          updatedAt: Date.now(),
        };
      });
    }
  
    function buildProjectDeleteTarget(project: SoftwareProjectPlan): DeleteTarget<ProjectDeleteKind> {
      return {
        kind: 'project',
        id: project.id,
        name: project.name,
        detail: 'Delete this saved software project from Project Studio.',
        impact: [
          `${formatProjectStatus(getProjectEffectiveStatus(project))} ${project.mode} project record will be removed.`,
          `${project.artifacts.length} planned artifact entry(ies) and project staffing selections will be removed from the local project list.`,
        ],
      };
    }
  
    function buildRoleDeleteTarget(role: VirtualRoleDefinition): DeleteTarget<ProjectDeleteKind> {
      const affectedEmployees = employees.filter(employee => (
        employee.roleId === role.id || employee.role.toLowerCase() === role.title.toLowerCase()
      ));
      return {
        kind: 'role',
        id: role.id,
        name: role.title,
        detail: 'Delete this role definition from the shared project role library.',
        impact: [
          `${affectedEmployees.length} employee profile(s) currently reference this role and will be normalized by the existing delete handler.`,
          `${role.responsibilities.length} responsibility entry(ies) and ${role.defaultTools.length} default tool entry(ies) will be removed.`,
        ],
      };
    }
  
    function buildEmployeeDeleteTarget(employee: VirtualEmployeeProfile): DeleteTarget<ProjectDeleteKind> {
      const assignedProjects = projects.filter(project => (
        project.supervisorEmployeeId === employee.id || project.assignedEmployeeIds.includes(employee.id)
      ));
      const assignedTeams = projectTeams.filter(team => (
        team.supervisorEmployeeId === employee.id || team.memberEmployeeIds.includes(employee.id)
      ));
      return {
        kind: 'employee',
        id: employee.id,
        name: employee.name,
        detail: 'Delete this employee profile from the shared staffing pool.',
        impact: [
          `${assignedProjects.length} project(s) reference this employee directly or as supervisor.`,
          `${assignedTeams.length} project team(s) reference this employee as supervisor or member.`,
        ],
      };
    }
  
    function buildProjectTeamDeleteTarget(team: ProjectTeamDefinition): DeleteTarget<ProjectDeleteKind> {
      const assignedProjects = projects.filter(project => project.assignedTeamIds.includes(team.id));
      return {
        kind: 'team',
        id: team.id,
        name: team.name,
        detail: 'Delete this reusable project team.',
        impact: [
          `${assignedProjects.length} project(s) currently assign this team.`,
          `${team.memberEmployeeIds.length} member assignment(s) and the team mission will be removed.`,
        ],
      };
    }
  
    function renderRoleRow(role: VirtualRoleDefinition) {
      const assignedEmployees = employees.filter(employee => (
        employee.roleId === role.id || employee.role.toLowerCase() === role.title.toLowerCase()
      ));
      const summary = `${role.responsibilities.length} responsibilities / ${role.defaultTools.length} tools`;
      return (
        <article className={styles.workbenchRecordRow} key={role.id}>
          <div className={styles.workbenchRecordPrimary}>
            <strong>{role.title}</strong>
            <span>{assignedEmployees.length} employee profile(s)</span>
          </div>
          <span className={styles.workbenchRecordCell}>
            {role.canSupervise ? 'Supervisor-capable' : 'Contributor'}
          </span>
          <span className={styles.workbenchRecordCell} title={role.defaultGoal}>
            {role.defaultGoal}
          </span>
          <span className={styles.workbenchRecordCell}>
            {summary}
          </span>
          <div className={styles.workbenchRecordActions}>
            <button className={styles.secondaryButton} type="button" onClick={() => openRoleEditor(role)} title={`Edit role ${role.title}`}>
              <Icon name="edit" size={14} />
              Edit
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => openProjectDeleteConfirmation(buildRoleDeleteTarget(role))}
              disabled={roles.length <= 1}
              title={`Delete role ${role.title}`}
            >
              <Icon name="trash" size={14} />
              Delete
            </button>
          </div>
        </article>
      );
    }
  
    function renderRoleCard(role: VirtualRoleDefinition) {
      const assignedEmployees = employees.filter(employee => (
        employee.roleId === role.id || employee.role.toLowerCase() === role.title.toLowerCase()
      ));
      const summary = `${role.responsibilities.length} responsibilities / ${role.defaultTools.length} tools`;
  
      return (
        <article className={styles.projectCard} key={role.id}>
          <div className={styles.projectCardHeader}>
            <div>
              <strong>{role.title}</strong>
              <span>{assignedEmployees.length} employee profile(s)</span>
            </div>
          </div>
          <p title={role.defaultGoal}>{role.defaultGoal}</p>
          <dl className={styles.projectCardMeta}>
            <div>
              <dt>Scope</dt>
              <dd>{role.canSupervise ? 'Supervisor-capable' : 'Contributor'}</dd>
            </div>
            <div>
              <dt>Definition</dt>
              <dd>{summary}</dd>
            </div>
          </dl>
          <div className={styles.projectChipList}>
            {role.responsibilities.slice(0, 4).map(responsibility => (
              <span className={styles.projectChip} key={responsibility}>{responsibility}</span>
            ))}
            {role.responsibilities.length > 4 && <span className={styles.projectChip}>+{role.responsibilities.length - 4}</span>}
          </div>
          <div className={styles.projectCardActions}>
            <button className={styles.secondaryButton} type="button" onClick={() => openRoleEditor(role)} title={`Edit role ${role.title}`}>
              <Icon name="edit" size={14} />
              Edit
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => openProjectDeleteConfirmation(buildRoleDeleteTarget(role))}
              disabled={roles.length <= 1}
              title={`Delete role ${role.title}`}
            >
              <Icon name="trash" size={14} />
              Delete
            </button>
          </div>
        </article>
      );
    }
  
    function renderEmployeeRow(employee: VirtualEmployeeProfile) {
      const role = getEmployeeRoleDefinition(employee, roles);
      const teamsForEmployee = projectTeams.filter(team => (
        team.supervisorEmployeeId === employee.id || team.memberEmployeeIds.includes(employee.id)
      ));
      const projectsForEmployee = projects.filter(project => (
        project.supervisorEmployeeId === employee.id ||
        project.assignedEmployeeIds.includes(employee.id) ||
        getProjectTeams(project, projectTeams).some(team => (
          team.supervisorEmployeeId === employee.id || team.memberEmployeeIds.includes(employee.id)
        ))
      ));
      const activeWork = employee.currentTask || role?.defaultGoal || 'No current task';
  
      return (
        <article className={styles.workbenchRecordRow} key={employee.id}>
          <div className={styles.workbenchRecordPrimary}>
            <strong>{employee.name}</strong>
            <span>{projectsForEmployee.length} project(s) / {teamsForEmployee.length} team(s)</span>
          </div>
          <span className={styles.workbenchRecordCell} title={role?.title ?? employee.role}>
            {role?.title ?? employee.role}
          </span>
          <span className={styles.workbenchRecordCell}>
            {employee.status} / {employee.model}
          </span>
          <span className={styles.workbenchRecordCell} title={activeWork}>
            {activeWork}
          </span>
          <div className={`${styles.workbenchRecordActions} ${styles.workbenchRecordActionsWide}`}>
            <button className={styles.secondaryButton} type="button" onClick={() => openEmployeeProfile(employee.id)} title={`View profile for ${employee.name}`}>
              <Icon name="user" size={14} />
              Profile
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => openEmployeeEditor(employee)} title={`Edit employee ${employee.name}`}>
              <Icon name="edit" size={14} />
              Edit
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => openProjectDeleteConfirmation(buildEmployeeDeleteTarget(employee))} title={`Delete employee ${employee.name}`}>
              <Icon name="trash" size={14} />
              Delete
            </button>
          </div>
        </article>
      );
    }
  
    function renderEmployeeCard(employee: VirtualEmployeeProfile, options: { compact?: boolean } = {}) {
      const role = getEmployeeRoleDefinition(employee, roles);
      return (
        <article className={styles.employeeCard} key={employee.id}>
          <div className={styles.employeeCardHeader}>
            <span className={styles.employeeAvatar}>{employee.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{employee.name}</strong>
              <span>{role?.title ?? employee.role} / {employee.status}</span>
            </div>
          </div>
          {!options.compact && <p>{role?.defaultGoal ?? employee.currentTask}</p>}
          <div className={styles.projectChipList}>
            {(role?.responsibilities ?? employee.permissions).slice(0, 4).map(responsibility => (
              <span className={styles.projectChip} key={responsibility}>{responsibility}</span>
            ))}
          </div>
        </article>
      );
    }
  
    function renderEmployeeManagementCard(employee: VirtualEmployeeProfile) {
      const role = getEmployeeRoleDefinition(employee, roles);
      const teamsForEmployee = projectTeams.filter(team => (
        team.supervisorEmployeeId === employee.id || team.memberEmployeeIds.includes(employee.id)
      ));
      const projectsForEmployee = projects.filter(project => (
        project.supervisorEmployeeId === employee.id ||
        project.assignedEmployeeIds.includes(employee.id) ||
        getProjectTeams(project, projectTeams).some(team => (
          team.supervisorEmployeeId === employee.id || team.memberEmployeeIds.includes(employee.id)
        ))
      ));
      const activeWork = employee.currentTask || role?.defaultGoal || 'No current task';
  
      return (
        <article className={styles.projectCard} key={employee.id}>
          <div className={styles.employeeCardHeader}>
            <span className={styles.employeeAvatar}>{employee.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{employee.name}</strong>
              <span>{role?.title ?? employee.role} / {employee.status}</span>
            </div>
          </div>
          <p title={activeWork}>{activeWork}</p>
          <dl className={styles.projectCardMeta}>
            <div>
              <dt>Assignments</dt>
              <dd>{projectsForEmployee.length} project(s), {teamsForEmployee.length} team(s)</dd>
            </div>
            <div>
              <dt>Model</dt>
              <dd>{employee.model}</dd>
            </div>
          </dl>
          <div className={styles.projectChipList}>
            {(role?.responsibilities ?? employee.permissions).slice(0, 4).map(responsibility => (
              <span className={styles.projectChip} key={responsibility}>{responsibility}</span>
            ))}
          </div>
          <div className={styles.projectCardActions}>
            <button className={styles.secondaryButton} type="button" onClick={() => openEmployeeProfile(employee.id)} title={`View profile for ${employee.name}`}>
              <Icon name="user" size={14} />
              Profile
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => openEmployeeEditor(employee)} title={`Edit employee ${employee.name}`}>
              <Icon name="edit" size={14} />
              Edit
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => openProjectDeleteConfirmation(buildEmployeeDeleteTarget(employee))} title={`Delete employee ${employee.name}`}>
              <Icon name="trash" size={14} />
              Delete
            </button>
          </div>
        </article>
      );
    }
  
    function renderEmployeeProfile(employee: VirtualEmployeeProfile) {
      const role = getEmployeeRoleDefinition(employee, roles);
      const teamsForEmployee = projectTeams.filter(team => (
        team.supervisorEmployeeId === employee.id || team.memberEmployeeIds.includes(employee.id)
      ));
      const projectsForEmployee = projects.filter(project => (
        project.supervisorEmployeeId === employee.id ||
        project.assignedEmployeeIds.includes(employee.id) ||
        getProjectTeams(project, projectTeams).some(team => (
          team.supervisorEmployeeId === employee.id || team.memberEmployeeIds.includes(employee.id)
        ))
      ));
  
      return (
        <>
          <dl className={styles.detailList}>
            <div>
              <dt>Model</dt>
              <dd>{employee.model}</dd>
            </div>
            <div>
              <dt>Teams</dt>
              <dd>{teamsForEmployee.length}</dd>
            </div>
            <div>
              <dt>Projects</dt>
              <dd>{projectsForEmployee.length}</dd>
            </div>
            <div>
              <dt>Current task</dt>
              <dd>{employee.currentTask}</dd>
            </div>
          </dl>
          <div className={styles.projectChipList}>
            {(role?.responsibilities ?? employee.permissions).map(item => (
              <span className={styles.projectChip} key={item}>{item}</span>
            ))}
          </div>
        </>
      );
    }
  
    function renderProjectTeamRow(team: ProjectTeamDefinition) {
      const supervisor = getTeamSupervisor(team, employees);
      const members = getTeamMembers(team, employees);
      const assignedProjects = projects.filter(project => project.assignedTeamIds.includes(team.id));
  
      return (
        <article className={styles.workbenchRecordRow} key={team.id}>
          <div className={styles.workbenchRecordPrimary}>
            <strong>{team.name}</strong>
            <span>{assignedProjects.length} assigned project(s)</span>
          </div>
          <span className={styles.workbenchRecordCell} title={supervisor?.name ?? 'Unassigned'}>
            {supervisor?.name ?? 'Unassigned'}
          </span>
          <span className={styles.workbenchRecordCell}>
            {members.length} member(s)
          </span>
          <span className={styles.workbenchRecordCell} title={team.mission}>
            {team.mission}
          </span>
          <div className={styles.workbenchRecordActions}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => openProjectTeamEditor(team)}
              title={`Edit team ${team.name}`}
            >
              <Icon name="edit" size={14} />
              Edit
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => openProjectDeleteConfirmation(buildProjectTeamDeleteTarget(team))} title={`Delete team ${team.name}`}>
              <Icon name="trash" size={14} />
              Delete
            </button>
          </div>
        </article>
      );
    }
  
    function renderProjectTeamCard(team: ProjectTeamDefinition, options: { compact?: boolean } = {}) {
      const supervisor = getTeamSupervisor(team, employees);
      const members = getTeamMembers(team, employees);
      return (
        <article className={styles.employeeCard} key={team.id}>
          <div className={styles.employeeCardHeader}>
            <span className={styles.employeeAvatar}>{team.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{team.name}</strong>
              <span>Supervisor: {supervisor?.name ?? 'Unassigned'}</span>
            </div>
          </div>
          <p>{team.mission}</p>
          <div className={styles.projectChipList}>
            {members.slice(0, options.compact ? 3 : 6).map(member => (
              <span className={styles.projectChip} key={member.id}>{member.name}</span>
            ))}
            {members.length === 0 && <span className={styles.projectChip}>No members</span>}
          </div>
        </article>
      );
    }
  
    function renderProjectTeamManagementCard(team: ProjectTeamDefinition) {
      const supervisor = getTeamSupervisor(team, employees);
      const members = getTeamMembers(team, employees);
      const assignedProjects = projects.filter(project => project.assignedTeamIds.includes(team.id));
  
      return (
        <article className={styles.projectCard} key={team.id}>
          <div className={styles.projectCardHeader}>
            <div>
              <strong>{team.name}</strong>
              <span>{assignedProjects.length} assigned project(s)</span>
            </div>
          </div>
          <p title={team.mission}>{team.mission}</p>
          <dl className={styles.projectCardMeta}>
            <div>
              <dt>Supervisor</dt>
              <dd>{supervisor?.name ?? 'Unassigned'}</dd>
            </div>
            <div>
              <dt>Members</dt>
              <dd>{members.length} member(s)</dd>
            </div>
          </dl>
          <div className={styles.projectChipList}>
            {members.slice(0, 6).map(member => (
              <span className={styles.projectChip} key={member.id}>{member.name}</span>
            ))}
            {members.length === 0 && <span className={styles.projectChip}>No members</span>}
          </div>
          <div className={styles.projectCardActions}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => openProjectTeamEditor(team)}
              title={`Edit team ${team.name}`}
            >
              <Icon name="edit" size={14} />
              Edit
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => openProjectDeleteConfirmation(buildProjectTeamDeleteTarget(team))} title={`Delete team ${team.name}`}>
              <Icon name="trash" size={14} />
              Delete
            </button>
          </div>
        </article>
      );
    }
  
    function getBoardTasks(project: SoftwareProjectPlan) {
      const latestRun = getProjectLatestRun(project);
      const assignmentTasks = (latestRun?.assignments ?? []).map(assignment => ({
        title: assignment.title,
        status: assignment.status === 'pending'
          ? 'todo'
          : assignment.status === 'running'
            ? 'doing'
            : assignment.status === 'failed'
              ? 'review'
              : 'done',
        employee: employees.find(employee => employee.id === assignment.memberId),
        detail: [
          assignment.description,
          assignment.dependencies.length > 0 ? `Depends on: ${assignment.dependencies.join(', ')}` : '',
          assignment.workspacePath ? `Workspace: ${assignment.workspacePath}` : '',
        ].filter(Boolean).join('\n'),
      }));
      if (assignmentTasks.length > 0) {
        return assignmentTasks;
      }
  
      const stepTasks = (latestRun?.steps ?? []).map(step => ({
        title: step.assignmentTitle ?? `${step.role} work`,
        status: step.status === 'running' ? 'doing' : step.status === 'failed' ? 'review' : 'done',
        employee: employees.find(employee => employee.id === step.memberId),
        detail: [
          step.dependencyIds?.length ? `Depends on: ${step.dependencyIds.join(', ')}` : '',
          step.workspacePath ? `Workspace: ${step.workspacePath}` : '',
        ].filter(Boolean).join('\n'),
      }));
      if (stepTasks.length > 0) {
        return stepTasks;
      }
  
      const assigned = getProjectStaffingEmployees(project, employees, roles, projectTeams)
        .filter(employee => employee.id !== project.supervisorEmployeeId);
      const supervisor = getProjectSupervisor(project, employees, roles);
      const employeePool = assigned.length > 0 ? assigned : employees;
      const effectiveStatus = getProjectEffectiveStatus(project);
      const baseTasks = [
        { title: 'Clarify requirements and acceptance criteria', status: 'done', employee: supervisor },
        ...project.artifacts.map((artifact, index) => ({
          title: `Produce ${artifact}`,
          status: effectiveStatus === 'done' ? 'done' : index === 0 ? 'doing' : index === 1 ? 'review' : 'todo',
          employee: employeePool[index % Math.max(employeePool.length, 1)],
        })),
        { title: 'Final integration and release notes', status: effectiveStatus === 'done' ? 'done' : 'todo', employee: supervisor },
      ];
  
      return baseTasks;
    }
  
    function renderTaskBoard(project: SoftwareProjectPlan) {
      const tasks = getBoardTasks(project);
      const columns = [
        { id: 'todo', title: 'Todo' },
        { id: 'doing', title: 'Doing' },
        { id: 'review', title: 'Review' },
        { id: 'done', title: 'Done' },
      ];
  
      return (
        <div className={styles.projectBoard}>
          {columns.map(column => {
            const columnTasks = tasks.filter(task => task.status === column.id);
            return (
              <section className={styles.projectBoardColumn} key={column.id}>
                <div className={styles.projectBoardColumnHeader}>
                  <strong>{column.title}</strong>
                  <span>{columnTasks.length}</span>
                </div>
                {columnTasks.map(task => (
                  <article className={styles.projectTaskCard} key={`${column.id}-${task.title}`}>
                    <strong>{task.title}</strong>
                    <span>
                      {task.employee?.name ?? 'Unassigned'} / {task.employee ? getEmployeeRoleDefinition(task.employee, roles)?.title ?? task.employee.role : 'Contributor'}
                    </span>
                    {'detail' in task && typeof task.detail === 'string' && task.detail && <span>{task.detail}</span>}
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      );
    }
  
    function renderTeamChat(project: SoftwareProjectPlan) {
      const supervisor = getProjectSupervisor(project, employees, roles);
      const assignedTeams = getProjectTeams(project, projectTeams);
      const assigned = getProjectStaffingEmployees(project, employees, roles, projectTeams)
        .filter(employee => employee.id !== supervisor?.id);
      const chatEmployees = [supervisor, ...assigned].filter((employee): employee is VirtualEmployeeProfile => Boolean(employee));
      const messages = [
        { author: supervisor, text: `I will coordinate "${project.name}" and keep work aligned to the project goal.` },
        ...assignedTeams.slice(0, 3).map(team => ({
          author: getTeamSupervisor(team, employees) ?? supervisor,
          text: `Team "${team.name}" is responsible for: ${team.mission}`,
        })),
        ...assigned.slice(0, 4).map((employee, index) => ({
          author: employee,
          text: index === 0
            ? `I am taking the first implementation task and will report blockers here.`
            : index === 1
              ? `I will review architecture and integration risks before code changes fan out.`
              : index === 2
                ? `I will prepare verification coverage for the planned deliverables.`
                : `I am available for the next queued task.`,
        })),
      ];
  
      return (
        <div className={styles.projectChatList}>
          {messages.map((message, index) => (
            <article className={styles.projectChatMessage} key={`${message.author?.id ?? 'system'}-${index}`}>
              <span className={styles.employeeAvatar}>{message.author?.name.slice(0, 2).toUpperCase() ?? 'CA'}</span>
              <div>
                <strong>{message.author?.name ?? 'CodeAgent'}</strong>
                <p>{message.text}</p>
              </div>
            </article>
          ))}
          {chatEmployees.length === 0 && <span className={styles.mutedText}>Assign employees to start team chat.</span>}
        </div>
      );
    }
  
    function renderDeliverables(project: SoftwareProjectPlan) {
      const latestRun = getProjectLatestRun(project);
      const effectiveStatus = getProjectEffectiveStatus(project);
      const projectRootPath = project.workspacePath ?? appInfo?.workspacePath ?? workspacePath;
      const projectAutomationTeamId = getProjectAutomationTeamId(project.id);
      function resolveDeliverablePath(targetPath: string): string {
        if (!targetPath.trim()) {
          return projectRootPath;
        }
        return targetPath.startsWith('/')
          ? targetPath
          : joinWorkspacePath(projectRootPath, targetPath);
      }
      function getExpectedArtifactPath(artifact: string, index: number): string {
        const slug = artifact.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `artifact-${index + 1}`;
        return `artifacts/${slug}.md`;
      }
      function renderDeliverableActions(targetPath: string, label = 'Open') {
        const resolvedPath = resolveDeliverablePath(targetPath);
        return (
          <div className={styles.projectDeliverableActions}>
            <button className={styles.textButton} type="button" onClick={() => onOpenWorkspacePath(resolvedPath)} title={`Open ${resolvedPath}`}>
              <Icon name="external" size={13} />
              {label}
            </button>
            <button className={styles.textButton} type="button" onClick={() => onRevealWorkspacePath(resolvedPath)} title={`Reveal ${resolvedPath}`}>
              <Icon name="folder-open" size={13} />
              Reveal
            </button>
          </div>
        );
      }
      const assignmentOutputs = (latestRun?.assignments ?? [])
        .filter(assignment => assignment.output || assignment.error || assignment.workspacePath)
        .map(assignment => ({
          title: assignment.title,
          status: assignment.status === 'succeeded' ? 'Completed' : assignment.status === 'failed' ? 'Needs review' : assignment.status === 'running' ? 'Running' : 'Pending',
          workspacePath: assignment.workspacePath,
          detail: [
            `${assignment.memberName} / ${assignment.role}`,
            assignment.workspacePath ? `Workspace: ${assignment.workspacePath}` : '',
            assignment.output ? assignment.output.slice(0, 240) : assignment.error ? assignment.error.slice(0, 240) : '',
          ].filter(Boolean).join('\n'),
        }));
      const activityOutputs = toolActivities
        .filter(activity => activity.status === 'succeeded' && isProjectToolActivity(activity, project.id, projectAutomationTeamId))
        .map((activity): ProjectGeneratedOutput | null => {
          const outputPath = getToolResultPath(activity);
          if (!outputPath) {
            return null;
          }
  
          const absolutePath = activity.result && typeof activity.result === 'object' && typeof (activity.result as { absolutePath?: unknown }).absolutePath === 'string'
            ? String((activity.result as { absolutePath?: unknown }).absolutePath)
            : undefined;
  
          return {
            id: `${project.id}:${absolutePath || outputPath}`,
            projectId: project.id,
            path: outputPath,
            absolutePath,
            toolName: activity.toolName,
            source: activity.scope?.source === 'virtual-team'
              ? 'automation'
              : activity.scope?.channel === 'team' ? 'team-chat' : 'guided-chat',
            summary: activity.resultPreview,
            createdAt: activity.startedAt,
            updatedAt: activity.completedAt ?? activity.startedAt,
          };
        })
        .filter((output: ProjectGeneratedOutput | null): output is ProjectGeneratedOutput => Boolean(output));
      const generatedOutputs = [
        ...(projectGeneratedOutputs[project.id] ?? []),
        ...activityOutputs,
      ].reduce<ProjectGeneratedOutput[]>((outputs, output) => {
        if (!outputs.some(candidate => (
          candidate.id === output.id ||
          candidate.path === output.path ||
          Boolean(candidate.absolutePath && output.absolutePath && candidate.absolutePath === output.absolutePath)
        ))) {
          outputs.push(output);
        }
        return outputs;
      }, []).sort((left, right) => right.updatedAt - left.updatedAt);
  
      return (
        <div className={styles.projectDeliverables}>
          {generatedOutputs.length > 0 && (
            <div className={styles.projectDeliverableGroupHeader}>
              <strong>Generated files</strong>
              <span>{generatedOutputs.length} tracked output{generatedOutputs.length === 1 ? '' : 's'}</span>
            </div>
          )}
          {generatedOutputs.map(output => (
            <article className={styles.projectDeliverableCard} key={`generated-${output.id}`}>
              <div>
                <strong title={output.absolutePath ?? output.path}>{output.path}</strong>
                <span>{formatProjectOutputSource(output.source)}</span>
              </div>
              <p>{output.summary || `${output.toolName} at ${new Date(output.updatedAt).toLocaleString()}`}</p>
              {renderDeliverableActions(output.absolutePath ?? output.path, 'Open file')}
            </article>
          ))}
          {latestRun?.artifactPath && (
            <article className={styles.projectDeliverableCard}>
              <div>
                <strong>Automation run artifact</strong>
                <span>{latestRun.status === 'succeeded' ? 'Completed' : latestRun.status}</span>
              </div>
              <p>{latestRun.artifactPath}</p>
              {renderDeliverableActions(latestRun.artifactPath, 'Open artifact')}
            </article>
          )}
          {project.artifacts.map((artifact, index) => (
            <article className={styles.projectDeliverableCard} key={artifact}>
              <div>
                <strong>{artifact}</strong>
                <span>{effectiveStatus === 'done' ? 'Completed' : index < 2 ? 'Draft planned' : 'Queued'}</span>
              </div>
              <p>{effectiveStatus === 'done'
                ? latestRun?.summary ?? 'Completed by the latest autonomous project run.'
                : index < 2 ? 'Ready to be produced by the assigned team.' : 'Will be generated after upstream work completes.'}</p>
              {effectiveStatus === 'done' && renderDeliverableActions(getExpectedArtifactPath(artifact, index), 'Open expected file')}
            </article>
          ))}
          {assignmentOutputs.map(output => (
            <article className={styles.projectDeliverableCard} key={`assignment-${output.title}`}>
              <div>
                <strong>{output.title}</strong>
                <span>{output.status}</span>
              </div>
              <p>{output.detail}</p>
              {output.workspacePath && renderDeliverableActions(output.workspacePath, 'Open workspace')}
            </article>
          ))}
          {project.artifacts.length === 0 && generatedOutputs.length === 0 && assignmentOutputs.length === 0 && !latestRun?.artifactPath && (
            <span className={styles.mutedText}>No deliverables or run artifacts recorded yet.</span>
          )}
        </div>
      );
    }
  
    function getProjectPanelMessages(project: SoftwareProjectPlan, channel: ProjectChatChannel): UiMessage[] {
      const projectChatKey = getProjectChatKey(project.id, channel);
      return projectChatMessages[projectChatKey] ?? createProjectReadyMessages(project, channel);
    }
  
    function updateProjectChatDraft(project: SoftwareProjectPlan, channel: ProjectChatChannel, value: string) {
      const projectChatKey = getProjectChatKey(project.id, channel);
      setProjectChatDrafts(current => ({
        ...current,
        [projectChatKey]: value,
      }));
    }
  
    function submitProjectChatDraft(project: SoftwareProjectPlan, channel: ProjectChatChannel) {
      const projectChatKey = getProjectChatKey(project.id, channel);
      const draftValue = projectChatDrafts[projectChatKey] ?? '';
      if (!draftValue.trim() || projectChatSendingKeys.has(projectChatKey)) {
        return;
      }
  
      setProjectChatDrafts(current => ({
        ...current,
        [projectChatKey]: '',
      }));
      onSendProjectChat(project, channel, draftValue);
    }
  
    function handleProjectChatKeyDown(
      event: React.KeyboardEvent<HTMLTextAreaElement>,
      project: SoftwareProjectPlan,
      channel: ProjectChatChannel,
    ) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submitProjectChatDraft(project, channel);
      }
    }
  
    async function copyProjectMessage(message: UiMessage) {
      try {
        const imageSummary = formatImageAttachmentSummary(message.imageAttachments ?? []);
        await navigator.clipboard.writeText(imageSummary ? `${message.content}\n\nAttached images: ${imageSummary}` : message.content);
        setCopiedProjectMessageId(message.id);
        window.setTimeout(() => setCopiedProjectMessageId(null), 1500);
      } catch {
        // Copy feedback is non-critical in the project side panel.
      }
    }
  
    function renderProjectChatSurface(project: SoftwareProjectPlan, channel: ProjectChatChannel) {
      const projectChatKey = getProjectChatKey(project.id, channel);
      const panelMessages = getProjectPanelMessages(project, channel);
      const draftValue = projectChatDrafts[projectChatKey] ?? '';
      const isProjectSending = projectChatSendingKeys.has(projectChatKey);
      const scopedFileWriteReviews = fileWriteReviews.filter(review => isReviewForProjectChat(review, project.id, channel));
      const scopedCommandReviews = commandReviews.filter(review => isReviewForProjectChat(review, project.id, channel));
      const scopedToolPermissionReviews = toolPermissionReviews.filter(review => isReviewForProjectChat(review, project.id, channel));
  
      return (
        <section className={styles.projectChatSurface}>
          <div className={styles.projectChatTranscript} ref={projectChatTranscriptRef}>
            {groupMessagesByAssistantRun(panelMessages).map(({ message, activities }) => (
              <MessageItem
                key={message.id}
                message={message}
                activities={activities}
                copied={copiedProjectMessageId === message.id}
                onCopy={() => copyProjectMessage(message)}
              />
            ))}
            <InlineApprovalQueue
              fileWriteReviews={scopedFileWriteReviews}
              commandReviews={scopedCommandReviews}
              toolPermissionReviews={scopedToolPermissionReviews}
              onResolveFileWrite={onResolveFileWrite}
              onResolveCommand={onResolveCommand}
              onResolveToolPermission={onResolveToolPermission}
            />
            {isProjectSending && (
              <div className={styles.typingIndicator} role="status">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
          <form className={styles.projectChatComposer} onSubmit={event => {
            event.preventDefault();
            submitProjectChatDraft(project, channel);
          }}>
            <textarea
              value={draftValue}
              onChange={event => updateProjectChatDraft(project, channel, event.target.value)}
              onKeyDown={event => handleProjectChatKeyDown(event, project, channel)}
              placeholder={channel === 'team' ? 'Direct the supervisor or team…' : 'Ask about this project…'}
              rows={2}
              disabled={isProjectSending}
              aria-label={channel === 'team' ? 'Team chat message' : 'Project chat message'}
            />
            <div className={styles.composerToolbar}>
              <div className={styles.composerMeta}>
                <span className={styles.projectComposerIdentity} title={channel === 'team'
                  ? 'Instructions are handled by this autonomous project’s supervisor and team'
                  : 'This agent can use tools within the project working folder'}>
                  <Icon name={channel === 'team' ? 'network' : 'bot'} size={13} />
                  {channel === 'team' ? 'Project supervisor' : 'Project agent'}
                </span>
                <label className={styles.projectComposerPermission} title="Permission level for this project">
                  <Icon name="lock" size={12} />
                  <span className={styles.visuallyHidden}>Project permissions</span>
                  <select
                    value={project.permissionMode}
                    onChange={event => onSaveProject({
                      ...project,
                      permissionMode: event.target.value as VirtualTeamPermissionMode,
                      updatedAt: Date.now(),
                    })}
                    disabled={isProjectSending}
                    aria-label="Project permissions"
                  >
                    <option value="supervised">Ask for risky actions</option>
                    <option value="full-access">Full project access</option>
                  </select>
                </label>
                <span title={project.workspacePath}>{getPathBasename(project.workspacePath)}</span>
              </div>
              <div className={styles.composerActions}>
                {draftValue && (
                  <button
                    className={styles.composerClearButton}
                    type="button"
                    onClick={() => updateProjectChatDraft(project, channel, '')}
                    disabled={isProjectSending}
                    title="Clear the draft message"
                  >
                    Clear input
                  </button>
                )}
                <button className={styles.primaryButton} type="submit" disabled={isProjectSending || !draftValue.trim()} title="Send this project message (Command+Enter)">
                  <Icon name="send" size={14} />
                  Send
                  <kbd>⌘↵</kbd>
                </button>
              </div>
            </div>
          </form>
        </section>
      );
    }
  
    function renderAutonomousProjectSelector() {
      if (autonomousProjects.length === 0) {
        return <span className={styles.mutedText}>Create an autonomous project before using this view.</span>;
      }
  
      return (
        <label className={styles.field}>
          <span>Autonomous project</span>
          <select value={selectedAutonomousProject?.id ?? ''} onChange={event => onSelectProject(event.target.value)}>
            {autonomousProjects.map(project => (
              <option value={project.id} key={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      );
    }
  
    function renderProjectSelector() {
      if (projects.length === 0) {
        return <span className={styles.mutedText}>Create a project before using this view.</span>;
      }
  
      return (
        <label className={styles.field}>
          <span>Project</span>
          <select value={selectedProject?.id ?? ''} onChange={event => onSelectProject(event.target.value)}>
            {projects.map(project => (
              <option value={project.id} key={project.id}>
                {project.name} / {project.mode === 'autonomous' ? 'autonomous' : 'guided'}
              </option>
            ))}
          </select>
        </label>
      );
    }
  
    function renderProjectInsights(project: SoftwareProjectPlan) {
      const assignedTeams = getProjectTeams(project, projectTeams);
      const supervisor = getProjectSupervisor(project, employees, roles);
      const assignedStaff = getProjectStaffingEmployees(project, employees, roles, projectTeams);
      const effectiveStatus = getProjectEffectiveStatus(project);
      const risks = [
        !project.goals.trim()
          ? { title: 'Goals missing', detail: 'Project goals are empty or underspecified.', level: 'Risk' }
          : null,
        project.mode === 'autonomous' && !supervisor
          ? { title: 'Supervisor missing', detail: 'Autonomous execution needs a supervisor employee.', level: 'Risk' }
          : null,
        project.mode === 'autonomous' && assignedTeams.length === 0 && project.assignedEmployeeIds.length === 0
          ? { title: 'No staffing assigned', detail: 'Assign at least one team or direct employee.', level: 'Risk' }
          : null,
        project.artifacts.length < 3
          ? { title: 'Artifact scope thin', detail: 'Expected deliverables may not cover requirements, design, and verification.', level: 'Watch' }
          : null,
        effectiveStatus === 'blocked'
          ? { title: 'Project blocked', detail: 'Resume requires resolving the active blocker.', level: 'Risk' }
          : null,
      ].filter((item): item is { title: string; detail: string; level: string } => Boolean(item));
      const signals = [
        { title: 'Staffing', detail: `${assignedTeams.length} team(s), ${assignedStaff.length} total employee(s)` },
        { title: 'Delivery shape', detail: `${project.artifacts.length} artifact(s), ${getBoardTasks(project).length} planned task(s)` },
        { title: 'Execution posture', detail: project.permissionMode === 'full-access' ? 'Supervisor has full project permission' : 'Risky actions require approval' },
      ];
  
      return (
        <div className={styles.detailGrid}>
          <section className={styles.detailPanel}>
            <h3>Risk Signals</h3>
            <div className={styles.projectDeliverables}>
              {risks.map(risk => (
                <article className={styles.projectDeliverableCard} key={risk.title}>
                  <div>
                    <strong>{risk.title}</strong>
                    <span>{risk.level}</span>
                  </div>
                  <p>{risk.detail}</p>
                </article>
              ))}
              {risks.length === 0 && <span className={styles.mutedText}>No immediate project risks detected.</span>}
            </div>
          </section>
          <section className={styles.detailPanel}>
            <h3>Operational Signals</h3>
            <div className={styles.projectDeliverables}>
              {signals.map(signal => (
                <article className={styles.projectDeliverableCard} key={signal.title}>
                  <div>
                    <strong>{signal.title}</strong>
                    <span>{formatProjectStatus(effectiveStatus)}</span>
                  </div>
                  <p>{signal.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      );
    }
  
    function renderExecutionConsole(project: SoftwareProjectPlan) {
      const projectSupervisor = getProjectSupervisor(project, employees, roles);
      const projectAutomationTeamId = getProjectAutomationTeamId(project.id);
      const projectRunRecords = teamRuns
        .filter(run => run.teamId === projectAutomationTeamId)
        .sort((left, right) => right.startedAt - left.startedAt);
      const latestRun = projectRunRecords[0];
      const selectedRunId = activityRunSelections[project.id] ?? '';
      const selectedRun = selectedRunId
        ? projectRunRecords.find(run => run.id === selectedRunId)
        : undefined;
      const visibleRun = selectedRun ?? latestRun;
      const allProjectToolActivities = toolActivities.filter(activity => isProjectToolActivity(activity, project.id, projectAutomationTeamId));
      const projectToolActivities = visibleRun
        ? allProjectToolActivities.filter(activity => activity.scope?.runId === visibleRun.id)
        : allProjectToolActivities;
      const effectiveStatus = getProjectEffectiveStatus(project);
      const isProjectRunning = effectiveStatus === 'active';
      type ActivityTimelineEntry = {
        id: string;
        timestamp: number;
        employee: string;
        title: string;
        summary: string;
        status: string;
      };
      const activityEntries: ActivityTimelineEntry[] = [];
      const pushActivity = (entry: ActivityTimelineEntry | null | undefined) => {
        if (entry) {
          activityEntries.push(entry);
        }
      };
  
      if (!visibleRun) {
        pushActivity({
          id: `project-ready-${project.id}`,
          timestamp: project.updatedAt,
          employee: 'Project Studio',
          title: 'Project ready',
          summary: `${project.mode === 'autonomous' ? 'Fully autonomous' : 'Standard'} project is ${formatProjectStatus(effectiveStatus)} and has not started an automation run yet.`,
          status: effectiveStatus,
        });
      }
      if (!visibleRun && projectSupervisor) {
        pushActivity({
          id: `project-supervisor-${project.id}`,
          timestamp: project.updatedAt,
          employee: projectSupervisor.name,
          title: 'Supervisor assigned',
          summary: `${getEmployeeRoleDefinition(projectSupervisor, roles)?.title ?? projectSupervisor.role} owns project coordination.`,
          status: 'ready',
        });
      }
  
      for (const run of visibleRun ? [visibleRun] : []) {
        pushActivity({
          id: `${run.id}-started`,
          timestamp: run.startedAt,
          employee: run.teamName,
          title: 'Automation run started',
          summary: `${run.objective.slice(0, 180)}${run.objective.length > 180 ? '...' : ''}`,
          status: run.status === 'running' ? 'running' : 'ready',
        });
  
        for (const assignment of run.assignments ?? []) {
          pushActivity(assignment.startedAt ? {
            id: `${run.id}-${assignment.id}-started`,
            timestamp: assignment.startedAt,
            employee: assignment.memberName,
            title: assignment.title,
            summary: [
              assignment.description,
              assignment.dependencies.length > 0 ? `Depends on ${assignment.dependencies.join(', ')}` : 'No blocking dependencies',
              `Parallel group ${assignment.parallelGroup}`,
            ].join(' / '),
            status: 'running',
          } : null);
          pushActivity(assignment.completedAt ? {
            id: `${run.id}-${assignment.id}-completed`,
            timestamp: assignment.completedAt,
            employee: assignment.memberName,
            title: `${assignment.title} ${assignment.status === 'succeeded' ? 'completed' : 'finished'}`,
            summary: assignment.output?.slice(0, 220) ?? assignment.error?.slice(0, 220) ?? assignment.workspacePath ?? 'Assignment finished.',
            status: assignment.status,
          } : null);
        }
  
        if (!run.assignments?.length) {
          for (const step of run.steps) {
            pushActivity({
              id: `${run.id}-${step.memberId}-${step.startedAt}-started`,
              timestamp: step.startedAt,
              employee: step.memberName,
              title: step.assignmentTitle ?? `${step.role} work started`,
              summary: step.dependencyIds?.length ? `Depends on ${step.dependencyIds.join(', ')}` : step.workspacePath ?? 'Worker started.',
              status: 'running',
            });
            pushActivity(step.completedAt ? {
              id: `${run.id}-${step.memberId}-${step.completedAt}-completed`,
              timestamp: step.completedAt,
              employee: step.memberName,
              title: step.assignmentTitle ? `${step.assignmentTitle} completed` : `${step.role} work completed`,
              summary: step.output?.slice(0, 220) ?? step.error?.slice(0, 220) ?? 'Worker finished.',
              status: step.status,
            } : null);
          }
        }
  
        pushActivity(run.completedAt ? {
          id: `${run.id}-completed`,
          timestamp: run.completedAt,
          employee: run.teamName,
          title: `Automation run ${run.status}`,
          summary: run.summary ?? run.error ?? run.artifactPath ?? `Run ${run.status}.`,
          status: run.status,
        } : null);
      }
  
      for (const activity of projectToolActivities) {
        pushActivity({
          id: `${activity.id}-tool-start`,
          timestamp: activity.startedAt,
          employee: activity.scope?.memberName ?? activity.scope?.teamName ?? 'Automation',
          title: `Tool call: ${activity.toolName}`,
          summary: activity.scope?.assignmentTitle
            ? `${activity.scope.assignmentTitle} / ${summarizeToolResult(activity.args)}`
            : summarizeToolResult(activity.args),
          status: activity.status === 'running' ? 'running' : 'ready',
        });
        pushActivity(activity.completedAt ? {
          id: `${activity.id}-tool-complete`,
          timestamp: activity.completedAt,
          employee: activity.scope?.memberName ?? activity.scope?.teamName ?? 'Automation',
          title: `Tool ${activity.status}`,
          summary: activity.error ?? activity.resultPreview ?? `${activity.toolName} finished${activity.duration ? ` in ${activity.duration} ms` : ''}.`,
          status: activity.status,
        } : null);
      }
  
      if (isProjectRunning && !visibleRun) {
        pushActivity({
          id: `project-${project.id}-starting`,
          timestamp: Date.now(),
          employee: projectSupervisor?.name ?? 'Supervisor',
          title: 'Automation run starting',
          summary: 'The project run has been requested and the planner is preparing assignments.',
          status: 'running',
        });
      }
  
      const timelineEntries = activityEntries
        .sort((left, right) => left.timestamp - right.timestamp)
        .slice(-160);
  
      return (
        <section className={styles.detailPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Activity Timeline</h3>
              <span>
                {visibleRun
                  ? `${visibleRun.id === latestRun?.id ? 'Current run' : 'Past run'}: ${visibleRun.status} / ${projectToolActivities.length} tool call(s)`
                  : 'No automation run yet'}
              </span>
            </div>
            {projectRunRecords.length > 0 && (
              <label className={styles.activityRunPicker}>
                <span>Run</span>
                <select
                  value={visibleRun?.id ?? ''}
                  onChange={event => setActivityRunSelections(current => ({
                    ...current,
                    [project.id]: event.target.value,
                  }))}
                >
                  {projectRunRecords.map((run, index) => (
                    <option value={run.id} key={run.id}>
                      {index === 0 ? 'Current' : 'Past'} / {run.status} / {new Date(run.startedAt).toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className={styles.projectTimeline}>
            {timelineEntries.map(entry => (
              <article className={styles.projectTimelineItem} key={entry.id}>
                <div className={styles.projectTimelineMarker} />
                <div className={styles.projectTimelineContent}>
                  <div className={styles.projectTimelineContentHeader}>
                    <strong>{entry.title}</strong>
                    <time dateTime={new Date(entry.timestamp).toISOString()}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </time>
                  </div>
                  <span>{entry.employee}</span>
                  <p>{entry.summary}</p>
                  <em>{entry.status}</em>
                </div>
              </article>
            ))}
            {timelineEntries.length === 0 && (
              <span className={styles.mutedText}>
                {isProjectRunning ? 'Automation run is starting.' : 'No activity recorded for this project yet.'}
              </span>
            )}
          </div>
        </section>
      );
    }
  
    function renderArtifactsExplorer(project: SoftwareProjectPlan) {
      return (
        <section className={styles.detailPanel}>
          <h3>Artifact Explorer</h3>
          <div className={styles.projectDeliverables}>
            {project.artifacts.map((artifact, index) => {
              const slug = artifact.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `artifact-${index + 1}`;
              return (
                <article className={styles.projectDeliverableCard} key={artifact}>
                  <div>
                    <strong>{artifact}</strong>
                    <span>{index < 2 ? 'Planned' : 'Queued'}</span>
                  </div>
                  <p>{`artifacts/${slug}.md`}</p>
                </article>
              );
            })}
            {project.artifacts.length === 0 && <span className={styles.mutedText}>No artifacts defined.</span>}
          </div>
        </section>
      );
    }
  
    function renderProjectTimeline(project: SoftwareProjectPlan) {
      const tasks = getBoardTasks(project);
      return (
        <section className={styles.detailPanel}>
          <h3>Timeline</h3>
          <div className={styles.projectDeliverables}>
            {tasks.map((task, index) => (
              <article className={styles.projectDeliverableCard} key={`${task.title}-${index}`}>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.status}</span>
                </div>
                <p>{task.employee ? `${task.employee.name} / ${getEmployeeRoleDefinition(task.employee, roles)?.title ?? task.employee.role}` : 'Unassigned'}</p>
              </article>
            ))}
          </div>
        </section>
      );
    }
  
    function renderGovernance(project: SoftwareProjectPlan) {
      const projectSupervisor = getProjectSupervisor(project, employees, roles);
      return (
        <div className={styles.detailGrid}>
          <section className={styles.detailPanel}>
            <h3>Approval Policy</h3>
            <dl className={styles.detailList}>
              <div>
                <dt>Mode</dt>
                <dd>{project.permissionMode === 'full-access' ? 'Full supervisor permission' : 'Supervised approvals'}</dd>
              </div>
              <div>
                <dt>Supervisor</dt>
                <dd>{projectSupervisor?.name ?? 'Unassigned'}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{formatProjectStatus(getProjectEffectiveStatus(project))}</dd>
              </div>
            </dl>
          </section>
          <section className={styles.detailPanel}>
            <h3>Tool Posture</h3>
            <dl className={styles.detailList}>
              <div>
                <dt>Provider</dt>
                <dd>{activeProviderLabel}</dd>
              </div>
              <div>
                <dt>MCP tools</dt>
                <dd>{mcpTools.length}</dd>
              </div>
              <div>
                <dt>MCP servers</dt>
                <dd>{mcpServers.length}</dd>
              </div>
            </dl>
          </section>
        </div>
      );
    }
  
    function renderProjectFormFields() {
      return (
        <div className={styles.settingsGrid}>
          <label className={styles.field}>
            <span>Project name</span>
            <input value={draft.name} onChange={event => updateDraft({ name: event.target.value })} />
          </label>
          <label className={styles.field}>
            <span>Status</span>
            <select value={draft.status} onChange={event => updateDraft({ status: event.target.value as SoftwareProjectStatus })}>
              <option value="idea">Idea</option>
              <option value="planning">Planning</option>
              <option value="active">Running</option>
              <option value="stopped">Stopped</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Workspace path</span>
            <input value={draft.workspacePath ?? appInfo?.workspacePath ?? ''} onChange={event => updateDraft({ workspacePath: event.target.value })} />
          </label>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span>Idea</span>
            <textarea value={draft.idea} onChange={event => updateDraft({ idea: event.target.value })} rows={4} />
          </label>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span>Goals</span>
            <textarea value={draft.goals} onChange={event => updateDraft({ goals: event.target.value })} rows={4} />
          </label>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span>Software artifacts</span>
            <textarea
              value={draft.artifacts.join('\n')}
              onChange={event => updateDraft({ artifacts: normalizeStringList(event.target.value.split('\n'), DEFAULT_PROJECT_ARTIFACTS) })}
              rows={6}
            />
          </label>
          <label className={`${styles.employeeAssignOption} ${styles.fieldWide}`}>
            <input
              type="checkbox"
              checked={draft.mode === 'autonomous'}
              onChange={event => updateDraft({
                mode: event.target.checked ? 'autonomous' : 'guided',
                permissionMode: event.target.checked ? 'full-access' : 'supervised',
                assignedEmployeeIds: event.target.checked ? draft.assignedEmployeeIds : [],
                assignedTeamIds: event.target.checked ? draft.assignedTeamIds : [],
                teamRoles: event.target.checked ? draft.teamRoles : [],
              })}
            />
            <span>Fully autonomous</span>
            <em>A supervisor and virtual team manage planning and execution. You can start, pause, or rerun the project.</em>
          </label>
          {draft.mode === 'autonomous' && (
            <>
              <label className={styles.field}>
                <span>Supervisor employee</span>
                <select value={draft.supervisorEmployeeId} onChange={event => selectDraftSupervisor(event.target.value)}>
                  {employees.map(employee => (
                    <option value={employee.id} key={employee.id}>
                      {employee.name} / {getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Execution permissions</span>
                <select value={draft.permissionMode} onChange={event => updateDraft({ permissionMode: event.target.value as VirtualTeamPermissionMode })}>
                  <option value="full-access">Full access supervisor</option>
                  <option value="supervised">Ask for risky actions</option>
                </select>
              </label>
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <span>Assigned teams</span>
                <div className={styles.employeeAssignGrid}>
                  {projectTeams.map(team => (
                    <label className={styles.employeeAssignOption} key={team.id}>
                      <input
                        type="checkbox"
                        checked={draft.assignedTeamIds.includes(team.id)}
                        onChange={() => toggleDraftTeam(team.id)}
                      />
                      <span>{team.name}</span>
                      <em>{team.mission}</em>
                    </label>
                  ))}
                  {projectTeams.length === 0 && <span className={styles.mutedText}>Create teams before assigning them to a project.</span>}
                </div>
              </div>
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <span>Direct employees</span>
                <div className={styles.employeeAssignGrid}>
                  {employees
                    .filter(employee => employee.id !== draft.supervisorEmployeeId)
                    .map(employee => (
                      <label className={styles.employeeAssignOption} key={employee.id}>
                        <input
                          type="checkbox"
                          checked={draft.assignedEmployeeIds.includes(employee.id)}
                          onChange={() => toggleDraftEmployee(employee.id)}
                        />
                        <span>{employee.name}</span>
                        <em>{getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role}</em>
                      </label>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      );
    }
  
    function saveProjectDraftAndClose() {
      const project = saveDraft();
      onSelectProject(project.id);
      closeProjectEditorPanel();
    }
  
    function saveProjectDraftAndOpenPrimaryAction() {
      const project = saveDraft();
      onSelectProject(project.id);
      setProjectActionProjectId(project.id);
      setProjectEditorPanel(project.mode === 'autonomous' ? 'project-org' : 'project-chat');
    }
  
    function renderProjectFormPanel() {
      return (
        <WorkbenchEditorPanel
          title={projects.some(project => project.id === draft.id) ? 'Edit Project' : 'New Project'}
          subtitle={draft.mode === 'autonomous' ? 'Project details with autonomous staffing and execution' : 'Project details, workspace, goals, and deliverables'}
          onClose={closeProjectEditorPanel}
          footer={(
            <div className={styles.toolRouterActions}>
              <button className={styles.primaryButton} type="button" onClick={saveProjectDraftAndClose} title="Save this project and close the panel">
                <Icon name="save" size={14} />
                Save Project
              </button>
              <button className={styles.secondaryButton} type="button" onClick={saveProjectDraftAndOpenPrimaryAction} title={draft.mode === 'autonomous' ? 'Save this project and open its team view' : 'Save this project and open its chat'}>
                <Icon name={draft.mode === 'autonomous' ? 'network' : 'chat'} size={14} />
                {draft.mode === 'autonomous' ? 'Save And View Team' : 'Save And Open Chat'}
              </button>
            </div>
          )}
        >
          {renderProjectFormFields()}
        </WorkbenchEditorPanel>
      );
    }
  
    function renderProjectDeleteConfirmation() {
      if (!projectDeleteTarget) {
        return null;
      }
  
      return (
        <WorkbenchEditorPanel
          title={`Delete ${projectDeleteTarget.kind}`}
          subtitle={projectDeleteTarget.name}
          onClose={closeProjectEditorPanel}
          footer={(
            <div className={styles.toolRouterActions}>
              <button className={styles.dangerButton} type="button" onClick={confirmProjectDelete} title={`Confirm deletion of ${projectDeleteTarget.name}`}>
                <Icon name="trash" size={14} />
                Confirm Delete
              </button>
              <button className={styles.secondaryButton} type="button" onClick={closeProjectEditorPanel} title="Cancel deletion and close the panel">
                <Icon name="x" size={14} />
                Cancel
              </button>
            </div>
          )}
        >
          <section className={styles.deleteConfirmation}>
            <strong>{projectDeleteTarget.detail}</strong>
            <span>This action updates local Project Studio state immediately.</span>
            <ul>
              {projectDeleteTarget.impact.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </WorkbenchEditorPanel>
      );
    }
  
    function renderGuidedProjectChat(project: SoftwareProjectPlan) {
      return (
        <div className={styles.projectRailChatBody}>
          <p className={styles.mutedText}>{summarizeProjectGoals(project)}</p>
          {renderProjectChatSurface(project, 'guided')}
        </div>
      );
    }
  
    function renderProjectOrganization(project: SoftwareProjectPlan) {
      const supervisor = getProjectSupervisor(project, employees, roles);
      const assignedTeams = getProjectTeams(project, projectTeams);
      const directEmployees = getProjectAssignedEmployees(project, employees, roles);
  
      return (
        <>
          <section className={styles.detailPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Team Organization</h3>
                <span>{project.name}</span>
              </div>
              <button className={styles.secondaryButton} type="button" onClick={() => editProject(project)} title="Edit project staffing and team assignments">
                Edit Members
              </button>
            </div>
            <p className={styles.mutedText}>{summarizeProjectGoals(project)}</p>
            <div className={styles.projectTeamDiagram}>
              {supervisor ? (
                <div className={styles.projectSupervisorNode}>
                  <span>Supervisor acting for human</span>
                  <strong>{supervisor.name}</strong>
                  <em>{getEmployeeRoleDefinition(supervisor, roles)?.title ?? supervisor.role} / {project.permissionMode === 'full-access' ? 'Full permission' : 'Supervised'}</em>
                </div>
              ) : (
                <span className={styles.mutedText}>No supervisor assigned.</span>
              )}
              <div className={styles.employeeGrid}>
                {assignedTeams.map(team => renderProjectTeamCard(team, { compact: true }))}
                {assignedTeams.length === 0 && <span className={styles.mutedText}>No teams assigned to this project.</span>}
              </div>
              <div className={styles.projectSupervisorRow}>
                <span>Direct employees</span>
                <strong>{directEmployees.length}</strong>
                <em>Assigned outside teams</em>
              </div>
              <div className={styles.employeeGrid}>
                {directEmployees.map(employee => renderEmployeeCard(employee, { compact: true }))}
                {directEmployees.length === 0 && <span className={styles.mutedText}>No direct employees assigned outside teams.</span>}
              </div>
            </div>
          </section>
        </>
      );
    }
  
    function renderProjectActionPanel() {
      const project = projectActionProject;
      if (!project) {
        return null;
      }
  
      if (projectEditorPanel === 'project-chat') {
        return (
          <WorkbenchEditorPanel
            title="Project Chat"
            subtitle={project.name}
            onClose={closeProjectEditorPanel}
            wide
            bodyClassName={styles.projectChatPanelBody}
          >
            {renderGuidedProjectChat(project)}
          </WorkbenchEditorPanel>
        );
      }
  
      if (projectEditorPanel === 'project-org') {
        return (
          <WorkbenchEditorPanel title="Team Organization" subtitle={project.name} onClose={closeProjectEditorPanel} wide>
            {renderProjectOrganization(project)}
          </WorkbenchEditorPanel>
        );
      }
  
      if (projectEditorPanel === 'project-board') {
        return (
          <WorkbenchEditorPanel title="Task Board" subtitle={project.name} onClose={closeProjectEditorPanel} wide>
            {renderTaskBoard(project)}
          </WorkbenchEditorPanel>
        );
      }
  
      if (projectEditorPanel === 'project-execution') {
        return (
          <WorkbenchEditorPanel title="Activity" subtitle={project.name} onClose={closeProjectEditorPanel} wide>
            {renderExecutionConsole(project)}
          </WorkbenchEditorPanel>
        );
      }
  
      if (projectEditorPanel === 'project-team-chat') {
        return (
          <WorkbenchEditorPanel title="Team Chat" subtitle={project.name} onClose={closeProjectEditorPanel} wide>
            <div className={styles.projectRailChatBody}>
              <p className={styles.mutedText}>{summarizeProjectGoals(project)}</p>
              {renderProjectChatSurface(project, 'team')}
            </div>
          </WorkbenchEditorPanel>
        );
      }
  
      if (projectEditorPanel === 'project-deliverables') {
        return (
          <WorkbenchEditorPanel title="Deliverables" subtitle={project.name} onClose={closeProjectEditorPanel} wide>
            {renderDeliverables(project)}
          </WorkbenchEditorPanel>
        );
      }
  
      return null;
    }
  
    function getLifecycleButton(project: SoftwareProjectPlan, showLabel = false) {
      if (project.mode !== 'autonomous') {
        return null;
      }
      const effectiveStatus = getProjectEffectiveStatus(project);
      const buttonClassName = showLabel ? styles.secondaryButton : `${styles.secondaryButton} ${styles.projectIconButton}`;
      const iconSize = showLabel ? 14 : 15;
  
      const renderLifecycleButton = (status: SoftwareProjectStatus, icon: IconName, label: string, title: string) => (
        <button className={buttonClassName} type="button" onClick={() => onSetProjectStatus(project.id, status)} title={title} aria-label={title}>
          <Icon name={icon} size={iconSize} />
          {showLabel && label}
        </button>
      );
  
      if (runningProjectIds.has(project.id)) {
        return renderLifecycleButton('stopped', 'stop', 'Stop', 'Stop this running autonomous project');
      }
  
      if (effectiveStatus === 'active') {
        return renderLifecycleButton('stopped', 'stop', 'Stop', 'Stop this autonomous project');
      }
  
      if (effectiveStatus === 'stopped') {
        return renderLifecycleButton('active', 'play', 'Resume', 'Resume this autonomous project');
      }
  
      if (effectiveStatus === 'blocked') {
        return renderLifecycleButton('active', 'rotate', 'Retry', 'Retry this blocked autonomous project');
      }
  
      if (effectiveStatus === 'done') {
        return renderLifecycleButton('active', 'rotate', 'Re-run', 'Run this completed autonomous project again');
      }
  
      if (effectiveStatus === 'idea' || effectiveStatus === 'planning') {
        return renderLifecycleButton('active', 'play', 'Start', 'Start this autonomous project');
      }
  
      return null;
    }
  
    function renderProjectPortfolioActions(project: SoftwareProjectPlan, variant: 'compact' | 'expanded') {
      const showLabel = variant === 'expanded';
      const buttonClassName = showLabel ? styles.secondaryButton : `${styles.secondaryButton} ${styles.projectIconButton}`;
      const iconSize = showLabel ? 14 : 15;
      const actionsClassName = showLabel
        ? styles.projectCardActions
        : `${styles.workbenchRecordActions} ${styles.projectRecordActions}`;
  
      const renderActionButton = (
        panel: ProjectEditorPanelId,
        icon: IconName,
        label: string,
        title: string,
      ) => (
        <button className={buttonClassName} type="button" onClick={() => openProjectActionPanel(project, panel)} title={title} aria-label={title}>
          <Icon name={icon} size={iconSize} />
          {showLabel && label}
        </button>
      );
  
      return (
        <div className={actionsClassName}>
          {project.mode === 'guided' ? (
            <>
              {renderActionButton('project-chat', 'chat', 'Chat', 'Open this project chat')}
              {renderActionButton('project-deliverables', 'archive', 'Deliverables', 'View project deliverables')}
            </>
          ) : (
            <>
              {getLifecycleButton(project, showLabel)}
              {renderActionButton('project-org', 'network', 'Team', 'View team organization for this project')}
              {renderActionButton('project-board', 'board', 'Board', 'Open this project task board')}
              {renderActionButton('project-execution', 'activity', 'Activity', 'Open this project activity')}
              {renderActionButton('project-team-chat', 'message', 'Team Chat', 'Open this autonomous team chat')}
              {renderActionButton('project-deliverables', 'archive', 'Deliverables', 'View project deliverables')}
            </>
          )}
          <button className={buttonClassName} type="button" onClick={() => editProject(project)} title="Edit this project" aria-label="Edit this project">
            <Icon name="edit" size={iconSize} />
            {showLabel && 'Edit'}
          </button>
          <button className={buttonClassName} type="button" onClick={() => openProjectDeleteConfirmation(buildProjectDeleteTarget(project))} title="Delete this project" aria-label="Delete this project">
            <Icon name="trash" size={iconSize} />
            {showLabel && 'Delete'}
          </button>
        </div>
      );
    }
  
    function renderProjectRow(project: SoftwareProjectPlan) {
      const assignedTeams = getProjectTeams(project, projectTeams);
      const assignedStaff = getProjectStaffingEmployees(project, employees, roles, projectTeams);
      const effectiveStatus = getProjectEffectiveStatus(project);
  
      return (
        <article className={`${styles.workbenchRecordRow} ${styles.projectRecordRow} ${getProjectStatusRowClassName(effectiveStatus)}`} key={project.id}>
          <div className={styles.workbenchRecordPrimary}>
            <strong>{project.name}</strong>
            <span>{project.mode === 'autonomous' ? 'Fully autonomous' : 'Standard'} / {formatProjectStatus(effectiveStatus)}</span>
          </div>
          <span className={styles.workbenchRecordCell} title={summarizeProjectGoals(project)}>
            {summarizeProjectGoals(project)}
          </span>
          <span className={styles.workbenchRecordCell}>
            {project.mode === 'autonomous'
              ? `${assignedTeams.length} team(s), ${assignedStaff.length} employee(s)`
              : `${project.artifacts.length} deliverable(s)`}
          </span>
          <span className={styles.workbenchRecordCell} title={project.workspacePath ?? appInfo?.workspacePath ?? undefined}>
            {project.workspacePath ?? workspaceTitle}
          </span>
          {renderProjectPortfolioActions(project, 'compact')}
        </article>
      );
    }
  
    function renderProjectCard(project: SoftwareProjectPlan, action: 'chat' | 'organization') {
      const effectiveStatus = getProjectEffectiveStatus(project);
      const cardClassName = [
        styles.projectCard,
        getProjectStatusCardClassName(effectiveStatus),
        project.id === selectedProject?.id ? styles.projectCardSelected : '',
      ].filter(Boolean).join(' ');
      return (
        <article className={cardClassName} key={project.id}>
          <div className={styles.projectCardHeader}>
            <div>
              <strong>{project.name}</strong>
              <span>{project.mode === 'autonomous' ? 'Fully autonomous' : 'Standard project'} / {formatProjectStatus(effectiveStatus)}</span>
            </div>
            <button className={styles.textButton} type="button" onClick={() => editProject(project)} title="Edit this project">
              <Icon name="edit" size={13} />
              Edit
            </button>
          </div>
          <p>{summarizeProjectGoals(project)}</p>
          <div className={styles.projectChipList}>
            {project.artifacts.slice(0, 4).map(artifact => (
              <span className={styles.projectChip} key={artifact}>{artifact}</span>
            ))}
            {project.artifacts.length > 4 && <span className={styles.projectChip}>+{project.artifacts.length - 4}</span>}
          </div>
          {project.mode === 'autonomous' && (
            <div className={styles.projectSupervisorRow}>
              <span>Supervisor</span>
              <strong>{project.supervisorRole}</strong>
              <em>{project.permissionMode === 'full-access' ? 'Full permission' : 'Supervised'}</em>
            </div>
          )}
          <div className={styles.toolRouterActions}>
            <button
              className={styles.secondaryButton}
              type="button"
              title={action === 'organization' ? 'View this project team' : 'Open this project chat'}
              onClick={() => {
                if (action === 'organization') {
                  openProjectActionPanel(project, 'project-org');
                  return;
                }
                openProjectActionPanel(project, 'project-chat');
              }}
            >
              <Icon name={action === 'organization' ? 'network' : 'chat'} size={14} />
              {action === 'organization' ? 'Team' : 'Open Chat'}
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => onSelectProject(project.id)} title="Select this project">
              <Icon name="check" size={14} />
              Select
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => openProjectDeleteConfirmation(buildProjectDeleteTarget(project))} title="Delete this project">
              <Icon name="trash" size={14} />
              Delete
            </button>
          </div>
        </article>
      );
    }
  
    function renderProjectPortfolioCard(project: SoftwareProjectPlan) {
      const assignedTeams = getProjectTeams(project, projectTeams);
      const assignedStaff = getProjectStaffingEmployees(project, employees, roles, projectTeams);
      const effectiveStatus = getProjectEffectiveStatus(project);
      const workspace = project.workspacePath ?? workspaceTitle;
      const cardClassName = [
        styles.projectCard,
        styles.projectPortfolioCard,
        getProjectStatusCardClassName(effectiveStatus),
        project.id === selectedProject?.id ? styles.projectCardSelected : '',
      ].filter(Boolean).join(' ');
  
      return (
        <article className={cardClassName} key={project.id}>
          <div className={styles.projectCardHeader}>
            <div>
              <strong>{project.name}</strong>
              <span>{project.mode === 'autonomous' ? 'Fully autonomous' : 'Standard project'} / {formatProjectStatus(effectiveStatus)}</span>
            </div>
            <span className={`${styles.projectStatusBadge} ${getProjectStatusBadgeClassName(effectiveStatus)}`}>{formatProjectStatus(effectiveStatus)}</span>
          </div>
          <p title={summarizeProjectGoals(project)}>{summarizeProjectGoals(project)}</p>
          <dl className={styles.projectCardMeta}>
            <div>
              <dt>Scope</dt>
              <dd>
                {project.mode === 'autonomous'
                  ? `${assignedTeams.length} team(s), ${assignedStaff.length} employee(s)`
                  : `${project.artifacts.length} deliverable(s)`}
              </dd>
            </div>
            <div>
              <dt>Workspace</dt>
              <dd title={workspace}>{workspace}</dd>
            </div>
          </dl>
          <div className={styles.projectChipList}>
            {project.artifacts.slice(0, 4).map(artifact => (
              <span className={styles.projectChip} key={artifact}>{artifact}</span>
            ))}
            {project.artifacts.length > 4 && <span className={styles.projectChip}>+{project.artifacts.length - 4}</span>}
          </div>
          {renderProjectPortfolioActions(project, 'expanded')}
        </article>
      );
    }
  
    function renderProjectMetricBar(segments: Array<{ label: string; value: number; className: string }>, total: number) {
      const visibleSegments = segments.filter(segment => segment.value > 0);
  
      return (
        <div className={styles.projectMetricChart}>
          <div className={styles.projectMetricBar} aria-label="Project metric distribution">
            {visibleSegments.length > 0 ? visibleSegments.map(segment => {
              const width = total > 0 ? Math.max(8, (segment.value / total) * 100) : 0;
              return (
                <span
                  className={`${styles.projectMetricSegment} ${segment.className}`}
                  key={segment.label}
                  style={{ width: `${width}%` }}
                  title={`${segment.label}: ${segment.value}`}
                />
              );
            }) : <span className={styles.projectMetricEmpty}>No data</span>}
          </div>
          <div className={styles.projectMetricLegend}>
            {segments.map(segment => (
              <span key={segment.label}>
                <i className={segment.className} />
                {segment.label}: {segment.value}
              </span>
            ))}
          </div>
        </div>
      );
    }
  
    function getProjectStatusRowClassName(status: SoftwareProjectStatus): string {
      if (status === 'active') {
        return styles.projectRecordRowActive;
      }
      if (status === 'planning') {
        return styles.projectRecordRowPlanning;
      }
      if (status === 'blocked') {
        return styles.projectRecordRowBlocked;
      }
      if (status === 'stopped') {
        return styles.projectRecordRowStopped;
      }
      if (status === 'done') {
        return styles.projectRecordRowDone;
      }
      return styles.projectRecordRowIdea;
    }
  
    function getProjectStatusCardClassName(status: SoftwareProjectStatus): string {
      if (status === 'active') {
        return styles.projectStatusCardActive;
      }
      if (status === 'planning') {
        return styles.projectStatusCardPlanning;
      }
      if (status === 'blocked') {
        return styles.projectStatusCardBlocked;
      }
      if (status === 'stopped') {
        return styles.projectStatusCardStopped;
      }
      if (status === 'done') {
        return styles.projectStatusCardDone;
      }
      return styles.projectStatusCardIdea;
    }
  
    function getProjectStatusBadgeClassName(status: SoftwareProjectStatus): string {
      if (status === 'active') {
        return styles.projectStatusBadgeActive;
      }
      if (status === 'planning') {
        return styles.projectStatusBadgePlanning;
      }
      if (status === 'blocked') {
        return styles.projectStatusBadgeBlocked;
      }
      if (status === 'stopped') {
        return styles.projectStatusBadgeStopped;
      }
      if (status === 'done') {
        return styles.projectStatusBadgeDone;
      }
      return styles.projectStatusBadgeIdea;
    }
  
    function renderProjectPagination() {
      if (projects.length <= PROJECT_LIST_PAGE_SIZE) {
        return null;
      }
  
      return (
        <div className={styles.projectPager}>
          <span>
            Showing {projectPageFirstRecord}-{projectPageLastRecord} of {projects.length}
          </span>
          <div className={styles.projectPagerControls}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => setProjectPage(page => Math.max(1, page - 1))}
              disabled={normalizedProjectPage <= 1}
              title="Previous project page"
            >
              <Icon name="chevron-left" size={14} />
              Previous
            </button>
            <strong>Page {normalizedProjectPage} / {projectPageCount}</strong>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => setProjectPage(page => Math.min(projectPageCount, page + 1))}
              disabled={normalizedProjectPage >= projectPageCount}
              title="Next project page"
            >
              Next
              <Icon name="chevron-right" size={14} />
            </button>
          </div>
        </div>
      );
    }
  
    const projectDetailViewClassName = projectRailOpen
      ? `${styles.detailView} ${styles.detailViewWithRail} ${projectRailWide ? styles.detailViewWithWideRail : ''}`
      : styles.detailView;
  
    return (
      <section className={projectDetailViewClassName} aria-label="Projects">
        {projectEditorPanel === 'project' && renderProjectFormPanel()}
        {projectEditorPanel === 'delete' && renderProjectDeleteConfirmation()}
        {renderProjectActionPanel()}
  
        {visibleActiveSection === 'studio' && (
          <>
            <div className={styles.detailHero}>
              <span className={styles.detailEyebrow}>Current workspace</span>
              <h2>Turn ideas into software projects</h2>
              <p title={appInfo?.workspacePath || undefined}>{appInfo?.workspacePath || 'Workspace path unavailable'}</p>
            </div>
  
            <div className={styles.detailGrid}>
              <section className={styles.detailPanel}>
                <h3>Project Portfolio</h3>
                <div className={styles.projectMetricHeadline}>
                  <strong>{projects.length}</strong>
                  <span>Total project(s)</span>
                </div>
                {renderProjectMetricBar(projectModeMetrics, projects.length)}
                <p className={styles.mutedText}>Use project row actions to open chat, team, board, or deliverables.</p>
              </section>
              <section className={styles.detailPanel}>
                <h3>Project Status</h3>
                <div className={styles.projectMetricHeadline}>
                  <strong>{activeProjects.length}</strong>
                  <span>Active project(s)</span>
                </div>
                {renderProjectMetricBar(projectStatusMetrics, projects.length)}
                <p className={styles.mutedText}>
                  Fully autonomous projects can run in the background; the table below is the source of project navigation.
                </p>
              </section>
              <section className={styles.detailPanel}>
                <h3>Project Staffing</h3>
                <div className={styles.projectMetricHeadline}>
                  <strong>{employees.length}</strong>
                  <span>Employee profile(s)</span>
                </div>
                {renderProjectMetricBar(projectStaffingMetrics, projects.length)}
                <dl className={styles.detailList}>
                  <div>
                    <dt>Roles</dt>
                    <dd>{roles.length}</dd>
                  </div>
                  <div>
                    <dt>Teams</dt>
                    <dd>{projectTeams.length}</dd>
                  </div>
                  <div>
                    <dt>Deliverables</dt>
                    <dd>{deliverableCount}</dd>
                  </div>
                </dl>
              </section>
            </div>
  
            <section className={styles.detailPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Projects</h3>
                  <span>{projects.length} saved project(s)</span>
                </div>
                <div className={styles.panelActions}>
                  <RecordViewToggle view={projectPortfolioView} onChange={setProjectPortfolioView} label="Project list view" />
                  <button className={styles.primaryButton} type="button" onClick={startDraft} title="Create a software project">
                    <Icon name="plus" size={14} />
                    New Project
                  </button>
                </div>
              </div>
                <div className={styles.projectStatusLegend} aria-label="Project status color legend">
                  {projectStatusMetrics.map(segment => (
                    <span key={segment.label} title={`${segment.label}: ${segment.value} project(s)`}>
                      <i className={segment.className} />
                      {segment.label}
                    </span>
                  ))}
                </div>
                {projectPortfolioView === 'table' ? (
                  <div className={`${styles.workbenchRecordList} ${styles.projectRecordList}`}>
                    <div className={`${styles.workbenchRecordRow} ${styles.workbenchRecordHeader} ${styles.projectRecordRow}`}>
                      <span>Project</span>
                      <span>Goal</span>
                      <span>Scope</span>
                      <span>Workspace</span>
                      <span>Actions</span>
                    </div>
                    {visibleProjects.map(project => renderProjectRow(project))}
                    {projects.length === 0 && <span className={styles.workbenchEmptyState}>No software projects created yet.</span>}
                  </div>
                ) : (
                  <div className={styles.projectPortfolioGrid}>
                    {visibleProjects.map(project => renderProjectPortfolioCard(project))}
                    {projects.length === 0 && <span className={styles.workbenchEmptyState}>No software projects created yet.</span>}
                  </div>
                )}
                {renderProjectPagination()}
            </section>
          </>
        )}
  
        {visibleActiveSection === 'roles' && (
          <div className={styles.workbenchSplit}>
            <section className={`${styles.detailPanel} ${styles.workbenchMain}`}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Roles</h3>
                  <span>{roles.length} project role definition(s)</span>
                </div>
                <div className={styles.panelActions}>
                  <RecordViewToggle view={roleListView} onChange={setRoleListView} label="Role list view" />
                  <button className={styles.primaryButton} type="button" onClick={openNewRoleEditor} title="Create a new role definition">
                    <Icon name="plus" size={14} />
                    New Role
                  </button>
                </div>
              </div>
              {roleListView === 'table' ? (
                <div className={styles.workbenchRecordList}>
                  <div className={`${styles.workbenchRecordRow} ${styles.workbenchRecordHeader}`}>
                    <span>Role</span>
                    <span>Scope</span>
                    <span>Default goal</span>
                    <span>Definition</span>
                    <span>Actions</span>
                  </div>
                  {roles.map(role => renderRoleRow(role))}
                  {roles.length === 0 && <span className={styles.mutedText}>No roles configured.</span>}
                </div>
              ) : (
                <div className={styles.recordCardGrid}>
                  {roles.map(role => renderRoleCard(role))}
                  {roles.length === 0 && <span className={styles.workbenchEmptyState}>No roles configured.</span>}
                </div>
              )}
            </section>
  
            {projectEditorPanel === 'role' && (
              <WorkbenchEditorPanel
                title={roles.some(role => role.id === roleDraft.id) ? 'Edit Role' : 'New Role'}
                subtitle="Responsibilities, default goal, and tool expectations"
                onClose={closeProjectEditorPanel}
                footer={(
                  <div className={styles.toolRouterActions}>
                    <button className={styles.primaryButton} type="button" onClick={saveRoleDraft} title="Save this role definition">
                      <Icon name="save" size={14} />
                      Save Role
                    </button>
                    <button className={styles.secondaryButton} type="button" onClick={openNewRoleEditor} title="Reset the form for a new role">
                      <Icon name="rotate" size={14} />
                      Reset New
                    </button>
                  </div>
                )}
              >
                <div className={styles.settingsGrid}>
                  <label className={styles.field}>
                    <span>Role title</span>
                    <input value={roleDraft.title} onChange={event => setRoleDraft(current => ({ ...current, title: event.target.value, updatedAt: Date.now() }))} />
                  </label>
                  <label className={styles.field}>
                    <span>Can supervise</span>
                    <select value={roleDraft.canSupervise ? 'yes' : 'no'} onChange={event => setRoleDraft(current => ({ ...current, canSupervise: event.target.value === 'yes', updatedAt: Date.now() }))}>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </label>
                  <label className={`${styles.field} ${styles.fieldWide}`}>
                    <span>Default goal</span>
                    <textarea value={roleDraft.defaultGoal} onChange={event => setRoleDraft(current => ({ ...current, defaultGoal: event.target.value, updatedAt: Date.now() }))} rows={3} />
                  </label>
                  <label className={`${styles.field} ${styles.fieldWide}`}>
                    <span>Responsibilities</span>
                    <textarea
                      value={roleDraft.responsibilities.join('\n')}
                      onChange={event => setRoleDraft(current => ({
                        ...current,
                        responsibilities: normalizeStringList(event.target.value.split('\n'), ['Deliver assigned project responsibilities.']),
                        updatedAt: Date.now(),
                      }))}
                      rows={7}
                    />
                  </label>
                  <label className={`${styles.field} ${styles.fieldWide}`}>
                    <span>Default tools</span>
                    <textarea
                      value={roleDraft.defaultTools.join('\n')}
                      onChange={event => setRoleDraft(current => ({
                        ...current,
                        defaultTools: normalizeStringList(event.target.value.split('\n'), getDefaultTeamTools(current.title)),
                        updatedAt: Date.now(),
                      }))}
                      rows={4}
                    />
                  </label>
                </div>
              </WorkbenchEditorPanel>
            )}
          </div>
        )}
  
        {visibleActiveSection === 'employees' && (
          <div className={styles.workbenchSplit}>
            <section className={`${styles.detailPanel} ${styles.workbenchMain}`}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Employees</h3>
                  <span>{employees.length} reusable employee profile(s)</span>
                </div>
                <div className={styles.panelActions}>
                  <RecordViewToggle view={employeeListView} onChange={setEmployeeListView} label="Employee list view" />
                  <button className={styles.primaryButton} type="button" onClick={openNewEmployeeEditor} title="Create a new employee profile">
                    <Icon name="plus" size={14} />
                    New Employee
                  </button>
                </div>
              </div>
              {employeeListView === 'table' ? (
                <div className={styles.workbenchRecordList}>
                  <div className={`${styles.workbenchRecordRow} ${styles.workbenchRecordHeader}`}>
                    <span>Employee</span>
                    <span>Role</span>
                    <span>Status</span>
                    <span>Current work</span>
                    <span>Actions</span>
                  </div>
                  {employees.map(employee => renderEmployeeRow(employee))}
                  {employees.length === 0 && <span className={styles.workbenchEmptyState}>No employees configured.</span>}
                </div>
              ) : (
                <div className={styles.recordCardGrid}>
                  {employees.map(employee => renderEmployeeManagementCard(employee))}
                  {employees.length === 0 && <span className={styles.workbenchEmptyState}>No employees configured.</span>}
                </div>
              )}
            </section>
  
            {projectEditorPanel === 'employee-profile' && profileEmployee && (
              <WorkbenchEditorPanel
                title={profileEmployee.name}
                subtitle={`${getEmployeeRoleDefinition(profileEmployee, roles)?.title ?? profileEmployee.role} / ${profileEmployee.status}`}
                onClose={closeProjectEditorPanel}
              >
                {renderEmployeeProfile(profileEmployee)}
              </WorkbenchEditorPanel>
            )}
  
            {projectEditorPanel === 'employee' && (
              <WorkbenchEditorPanel
                title={employees.some(employee => employee.id === employeeDraft.id) ? 'Edit Employee' : 'New Employee'}
                subtitle="Role, model, permissions, and current assignment"
                onClose={closeProjectEditorPanel}
                footer={(
                  <div className={styles.toolRouterActions}>
                    <button className={styles.primaryButton} type="button" onClick={saveEmployeeDraft} title="Save this employee profile">
                      <Icon name="save" size={14} />
                      Save Employee
                    </button>
                    <button className={styles.secondaryButton} type="button" onClick={openNewEmployeeEditor} title="Reset the form for a new employee">
                      <Icon name="rotate" size={14} />
                      Reset New
                    </button>
                  </div>
                )}
              >
                <div className={styles.settingsGrid}>
                  <label className={styles.field}>
                    <span>Name</span>
                    <input value={employeeDraft.name} onChange={event => setEmployeeDraft(current => ({ ...current, name: event.target.value, updatedAt: Date.now() }))} />
                  </label>
                  <label className={styles.field}>
                    <span>Role</span>
                    <select value={employeeDraft.roleId || getDefaultRoleId(employeeDraft.role)} onChange={event => selectEmployeeRole(event.target.value)}>
                      {roles.map(role => (
                        <option value={role.id} key={role.id}>
                          {role.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Model</span>
                    <input value={employeeDraft.model} onChange={event => setEmployeeDraft(current => ({ ...current, model: event.target.value, updatedAt: Date.now() }))} />
                  </label>
                  <label className={styles.field}>
                    <span>Status</span>
                    <select value={employeeDraft.status} onChange={event => setEmployeeDraft(current => ({ ...current, status: event.target.value as VirtualEmployeeProfile['status'], updatedAt: Date.now() }))}>
                      <option value="idle">Idle</option>
                      <option value="working">Working</option>
                      <option value="approval">Needs approval</option>
                    </select>
                  </label>
                  <label className={`${styles.field} ${styles.fieldWide}`}>
                    <span>Current task</span>
                    <input value={employeeDraft.currentTask} onChange={event => setEmployeeDraft(current => ({ ...current, currentTask: event.target.value, updatedAt: Date.now() }))} />
                  </label>
                  <label className={`${styles.field} ${styles.fieldWide}`}>
                    <span>Permissions</span>
                    <textarea
                      value={employeeDraft.permissions.join('\n')}
                      onChange={event => setEmployeeDraft(current => ({
                        ...current,
                        permissions: normalizeStringList(event.target.value.split('\n'), DEFAULT_EMPLOYEE_PERMISSIONS),
                        updatedAt: Date.now(),
                      }))}
                      rows={5}
                    />
                  </label>
                </div>
              </WorkbenchEditorPanel>
            )}
          </div>
        )}
  
        {visibleActiveSection === 'teams' && (
          <div className={styles.workbenchSplit}>
            <section className={`${styles.detailPanel} ${styles.workbenchMain}`}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Teams</h3>
                  <span>{projectTeams.length} reusable project team(s)</span>
                </div>
                <div className={styles.panelActions}>
                  <RecordViewToggle view={teamListView} onChange={setTeamListView} label="Team list view" />
                  <button className={styles.primaryButton} type="button" onClick={openNewProjectTeamEditor} title="Create a new reusable team">
                    <Icon name="plus" size={14} />
                    New Team
                  </button>
                </div>
              </div>
              {teamListView === 'table' ? (
                <div className={styles.workbenchRecordList}>
                  <div className={`${styles.workbenchRecordRow} ${styles.workbenchRecordHeader}`}>
                    <span>Team</span>
                    <span>Supervisor</span>
                    <span>Members</span>
                    <span>Mission</span>
                    <span>Actions</span>
                  </div>
                  {projectTeams.map(team => renderProjectTeamRow(team))}
                  {projectTeams.length === 0 && <span className={styles.workbenchEmptyState}>No project teams configured.</span>}
                </div>
              ) : (
                <div className={styles.recordCardGrid}>
                  {projectTeams.map(team => renderProjectTeamManagementCard(team))}
                  {projectTeams.length === 0 && <span className={styles.workbenchEmptyState}>No project teams configured.</span>}
                </div>
              )}
            </section>
  
            {projectEditorPanel === 'team' && (
              <WorkbenchEditorPanel
                title={projectTeams.some(team => team.id === teamDraft.id) ? 'Edit Team' : 'New Team'}
                subtitle="Mission, supervisor, and members"
                onClose={closeProjectEditorPanel}
                footer={(
                  <div className={styles.toolRouterActions}>
                    <button className={styles.primaryButton} type="button" onClick={saveTeamDraft} title="Save this reusable team">
                      <Icon name="save" size={14} />
                      Save Team
                    </button>
                    <button className={styles.secondaryButton} type="button" onClick={openNewProjectTeamEditor} title="Reset the form for a new team">
                      <Icon name="rotate" size={14} />
                      Reset New
                    </button>
                  </div>
                )}
              >
                <div className={styles.settingsGrid}>
                  <label className={styles.field}>
                    <span>Team name</span>
                    <input value={teamDraft.name} onChange={event => setTeamDraft(current => ({ ...current, name: event.target.value, updatedAt: Date.now() }))} />
                  </label>
                  <label className={styles.field}>
                    <span>Supervisor</span>
                    <select value={teamDraft.supervisorEmployeeId} onChange={event => selectTeamSupervisor(event.target.value)}>
                      {employees.map(employee => (
                        <option value={employee.id} key={employee.id}>
                          {employee.name} / {getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={`${styles.field} ${styles.fieldWide}`}>
                    <span>Mission</span>
                    <textarea value={teamDraft.mission} onChange={event => setTeamDraft(current => ({ ...current, mission: event.target.value, updatedAt: Date.now() }))} rows={4} />
                  </label>
                  <div className={`${styles.field} ${styles.fieldWide}`}>
                    <span>Members</span>
                    <div className={styles.employeeAssignGrid}>
                      {employees
                        .filter(employee => employee.id !== teamDraft.supervisorEmployeeId)
                        .map(employee => (
                          <label className={styles.employeeAssignOption} key={employee.id}>
                            <input
                              type="checkbox"
                              checked={teamDraft.memberEmployeeIds.includes(employee.id)}
                              onChange={() => toggleTeamMember(employee.id)}
                            />
                            <span>{employee.name}</span>
                            <em>{getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role}</em>
                          </label>
                        ))}
                    </div>
                  </div>
                </div>
              </WorkbenchEditorPanel>
            )}
          </div>
        )}
  
        {visibleActiveSection === 'new' && (
          <section className={styles.detailPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Project Definition</h3>
                <span>{draft.mode === 'autonomous' ? 'Fully autonomous execution enabled' : 'Standard project'}</span>
              </div>
            </div>
  
            <div className={styles.settingsGrid}>
              <label className={styles.field}>
                <span>Project name</span>
                <input value={draft.name} onChange={event => updateDraft({ name: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Status</span>
                <select value={draft.status} onChange={event => updateDraft({ status: event.target.value as SoftwareProjectStatus })}>
                  <option value="idea">Idea</option>
                  <option value="planning">Planning</option>
                  <option value="active">Running</option>
                  <option value="stopped">Stopped</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Workspace path</span>
                <input value={draft.workspacePath ?? appInfo?.workspacePath ?? ''} onChange={event => updateDraft({ workspacePath: event.target.value })} />
              </label>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>Idea</span>
                <textarea value={draft.idea} onChange={event => updateDraft({ idea: event.target.value })} rows={4} />
              </label>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>Goals</span>
                <textarea value={draft.goals} onChange={event => updateDraft({ goals: event.target.value })} rows={4} />
              </label>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>Software artifacts</span>
                <textarea
                  value={draft.artifacts.join('\n')}
                  onChange={event => updateDraft({ artifacts: normalizeStringList(event.target.value.split('\n'), DEFAULT_PROJECT_ARTIFACTS) })}
                  rows={6}
                />
              </label>
              <label className={`${styles.employeeAssignOption} ${styles.fieldWide}`}>
                <input
                  type="checkbox"
                  checked={draft.mode === 'autonomous'}
                  onChange={event => updateDraft({
                    mode: event.target.checked ? 'autonomous' : 'guided',
                    permissionMode: event.target.checked ? 'full-access' : 'supervised',
                    assignedEmployeeIds: event.target.checked ? draft.assignedEmployeeIds : [],
                    assignedTeamIds: event.target.checked ? draft.assignedTeamIds : [],
                    teamRoles: event.target.checked ? draft.teamRoles : [],
                  })}
                />
                <span>Fully autonomous</span>
                <em>A supervisor and virtual team manage this project on your behalf.</em>
              </label>
              {draft.mode === 'autonomous' && (
                <>
                  <label className={styles.field}>
                    <span>Supervisor employee</span>
                    <select value={draft.supervisorEmployeeId} onChange={event => selectDraftSupervisor(event.target.value)}>
                      {employees.map(employee => (
                        <option value={employee.id} key={employee.id}>
                          {employee.name} / {getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Execution permissions</span>
                    <select value={draft.permissionMode} onChange={event => updateDraft({ permissionMode: event.target.value as VirtualTeamPermissionMode })}>
                      <option value="full-access">Full access supervisor</option>
                      <option value="supervised">Ask for risky actions</option>
                    </select>
                  </label>
                  <div className={`${styles.field} ${styles.fieldWide}`}>
                    <span>Assigned teams</span>
                    <div className={styles.employeeAssignGrid}>
                      {projectTeams.map(team => (
                        <label className={styles.employeeAssignOption} key={team.id}>
                          <input
                            type="checkbox"
                            checked={draft.assignedTeamIds.includes(team.id)}
                            onChange={() => toggleDraftTeam(team.id)}
                          />
                          <span>{team.name}</span>
                          <em>{team.mission}</em>
                        </label>
                      ))}
                      {projectTeams.length === 0 && <span className={styles.mutedText}>Create teams before assigning them to a project.</span>}
                    </div>
                  </div>
                  <div className={`${styles.field} ${styles.fieldWide}`}>
                    <span>Direct employees</span>
                    <div className={styles.employeeAssignGrid}>
                      {employees
                        .filter(employee => employee.id !== draft.supervisorEmployeeId)
                        .map(employee => (
                          <label className={styles.employeeAssignOption} key={employee.id}>
                            <input
                              type="checkbox"
                              checked={draft.assignedEmployeeIds.includes(employee.id)}
                              onChange={() => toggleDraftEmployee(employee.id)}
                            />
                            <span>{employee.name}</span>
                            <em>{getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role}</em>
                          </label>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
  
            <div className={styles.toolRouterActions}>
              <button className={styles.primaryButton} type="button" onClick={saveDraft} title="Save this project">
                <Icon name="save" size={14} />
                Save Project
              </button>
              {draft.mode === 'autonomous' ? (
                <button className={styles.secondaryButton} type="button" onClick={saveDraftAndViewOrganization} title="Save this autonomous project and view its team organization">
                  <Icon name="network" size={14} />
                  Save And View Team
                </button>
              ) : (
                <button className={styles.secondaryButton} type="button" onClick={saveDraftAndOpenProjectChat} title="Save this project and open chat">
                  <Icon name="chat" size={14} />
                  Save And Open Chat
                </button>
              )}
            </div>
          </section>
        )}
  
        {visibleActiveSection === 'guided' && (
          <section className={styles.detailPanel}>
            <h3>Standard Projects</h3>
            <div className={styles.projectList}>
              {guidedProjects.map(project => renderProjectCard(project, 'chat'))}
              {guidedProjects.length === 0 && <span className={styles.mutedText}>No standard projects yet.</span>}
            </div>
          </section>
        )}
  
        {visibleActiveSection === 'autonomous' && (
          <>
            <section className={styles.detailPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Selected Autonomous Project</h3>
                  <span>{selectedAutonomousProject?.name ?? 'No autonomous project selected'}</span>
                </div>
              </div>
              {renderAutonomousProjectSelector()}
            </section>
            <section className={styles.detailPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Autonomous Project Organization</h3>
                  <span>{selectedAutonomousProject?.name ?? 'Select or create an autonomous project'}</span>
                </div>
                {selectedAutonomousProject && (
                  <div className={styles.panelActions}>
                    <button className={styles.secondaryButton} type="button" onClick={() => editProject(selectedAutonomousProject)} title="Edit project staffing and team assignments">
                      <Icon name="users" size={14} />
                      Edit Project Members
                    </button>
                  </div>
                )}
              </div>
              {selectedAutonomousProject ? (
                <>
                  <p className={styles.mutedText}>{summarizeProjectGoals(selectedAutonomousProject)}</p>
                  <div className={styles.projectTeamDiagram}>
                    {selectedAutonomousSupervisor ? (
                      <div className={styles.projectSupervisorNode}>
                        <span>Supervisor acting for human</span>
                        <strong>{selectedAutonomousSupervisor.name}</strong>
                        <em>{selectedAutonomousSupervisor.role} / {selectedAutonomousProject.permissionMode === 'full-access' ? 'Full permission' : 'Supervised'}</em>
                      </div>
                    ) : (
                      <span className={styles.mutedText}>No supervisor assigned.</span>
                    )}
                    <div className={styles.employeeGrid}>
                      {selectedAutonomousTeams.map(team => renderProjectTeamCard(team, { compact: true }))}
                      {selectedAutonomousTeams.length === 0 && <span className={styles.mutedText}>No teams assigned to this project.</span>}
                    </div>
                    <div className={styles.projectSupervisorRow}>
                      <span>Direct employees</span>
                      <strong>{selectedAutonomousDirectEmployees.length}</strong>
                      <em>Assigned outside teams</em>
                    </div>
                    <div className={styles.employeeGrid}>
                      {selectedAutonomousDirectEmployees.map(employee => renderEmployeeCard(employee, { compact: true }))}
                      {selectedAutonomousDirectEmployees.length === 0 && <span className={styles.mutedText}>No direct employees assigned outside teams.</span>}
                    </div>
                  </div>
                  <div className={styles.toolRouterActions}>
                    <button className={styles.secondaryButton} type="button" onClick={() => onChangeSection('board')} title="Open the task board for this autonomous project">
                      <Icon name="board" size={14} />
                      Task Board
                    </button>
                    <button className={styles.secondaryButton} type="button" onClick={() => onChangeSection('chat')} title="Open team chat for this autonomous project">
                      <Icon name="message" size={14} />
                      Team Chat
                    </button>
                    <button className={styles.secondaryButton} type="button" onClick={() => onChangeSection('deliverables')} title="View deliverables for this autonomous project">
                      <Icon name="archive" size={14} />
                      Deliverables
                    </button>
                  </div>
                </>
              ) : (
                <span className={styles.mutedText}>No autonomous project yet.</span>
              )}
            </section>
            <section className={styles.detailPanel}>
              <h3>Autonomous Projects</h3>
              <div className={styles.projectList}>
                {autonomousProjects.map(project => renderProjectCard(project, 'organization'))}
                {autonomousProjects.length === 0 && <span className={styles.mutedText}>No autonomous projects yet.</span>}
              </div>
            </section>
          </>
        )}
  
        {visibleActiveSection === 'insights' && (
          <>
            <section className={styles.detailPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Selected Project</h3>
                  <span>{selectedProject?.name ?? 'No project selected'}</span>
                </div>
              </div>
              {renderProjectSelector()}
            </section>
            {selectedProject ? renderProjectInsights(selectedProject) : <span className={styles.mutedText}>Select a project to see insights.</span>}
          </>
        )}
  
        {visibleActiveSection === 'execution' && (
          <>
            <section className={styles.detailPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Selected Project</h3>
                  <span>{selectedProject?.name ?? 'No project selected'}</span>
                </div>
              </div>
              {renderProjectSelector()}
            </section>
            {selectedProject ? renderExecutionConsole(selectedProject) : <span className={styles.mutedText}>Select a project to see execution state.</span>}
          </>
        )}
  
        {visibleActiveSection === 'artifacts' && (
          <>
            <section className={styles.detailPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Selected Project</h3>
                  <span>{selectedProject?.name ?? 'No project selected'}</span>
                </div>
              </div>
              {renderProjectSelector()}
            </section>
            {selectedProject ? renderArtifactsExplorer(selectedProject) : <span className={styles.mutedText}>Select a project to see artifacts.</span>}
          </>
        )}
  
        {visibleActiveSection === 'timeline' && (
          <>
            <section className={styles.detailPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Selected Project</h3>
                  <span>{selectedProject?.name ?? 'No project selected'}</span>
                </div>
              </div>
              {renderProjectSelector()}
            </section>
            {selectedProject ? renderProjectTimeline(selectedProject) : <span className={styles.mutedText}>Select a project to see timeline.</span>}
          </>
        )}
  
        {visibleActiveSection === 'governance' && (
          <>
            <section className={styles.detailPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Selected Project</h3>
                  <span>{selectedProject?.name ?? 'No project selected'}</span>
                </div>
              </div>
              {renderProjectSelector()}
            </section>
            {selectedProject ? renderGovernance(selectedProject) : <span className={styles.mutedText}>Select a project to see governance.</span>}
          </>
        )}
  
        {visibleActiveSection === 'board' && (
          <section className={styles.detailPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Task Board</h3>
                <span>{selectedAutonomousProject?.name ?? 'No autonomous project selected'}</span>
              </div>
            </div>
            {renderAutonomousProjectSelector()}
            {selectedAutonomousProject ? renderTaskBoard(selectedAutonomousProject) : <span className={styles.mutedText}>Select an autonomous project to see its task board.</span>}
          </section>
        )}
  
        {visibleActiveSection === 'chat' && (
          <section className={styles.detailPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Team Chat</h3>
                <span>{selectedAutonomousProject?.name ?? 'No autonomous project selected'}</span>
              </div>
            </div>
            {renderAutonomousProjectSelector()}
            {selectedAutonomousProject ? renderTeamChat(selectedAutonomousProject) : <span className={styles.mutedText}>Select an autonomous project to see employee chat.</span>}
          </section>
        )}
  
        {visibleActiveSection === 'deliverables' && (
          <section className={styles.detailPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Deliverables</h3>
                <span>{selectedAutonomousProject?.name ?? 'No autonomous project selected'}</span>
              </div>
            </div>
            {renderAutonomousProjectSelector()}
            {selectedAutonomousProject ? renderDeliverables(selectedAutonomousProject) : <span className={styles.mutedText}>Select an autonomous project to see deliverables.</span>}
          </section>
        )}
  
        {visibleActiveSection === 'context' && (
          <>
            <section className={styles.detailPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Files</h3>
                  <span title={appInfo?.workspacePath || undefined}>
                    {workspacePath === '.' ? appInfo?.workspacePath || '.' : workspacePath}
                  </span>
                </div>
                <div className={styles.panelActions}>
                  <button className={styles.secondaryButton} type="button" onClick={onGoToWorkspaceParent} disabled={workspacePath === '.' || isLoadingWorkspaceEntries}>
                    <Icon name="arrow-left" size={14} />
                    Up
                  </button>
                  <button className={styles.secondaryButton} type="button" onClick={onRefreshWorkspace} disabled={isLoadingWorkspaceEntries}>
                    <Icon name="refresh" size={14} />
                    Refresh
                  </button>
                </div>
              </div>
  
              {workspaceBrowserError && (
                <span className={styles.inlineError}>{workspaceBrowserError}</span>
              )}
              {workspaceActionMessage && !workspaceBrowserError && (
                <span className={styles.inlineSuccess}>{workspaceActionMessage}</span>
              )}
  
              <div className={styles.fileBrowser} aria-label="Workspace files">
                {isLoadingWorkspaceEntries && (
                  <span className={styles.mutedText}>Loading files...</span>
                )}
  
                {!isLoadingWorkspaceEntries && workspaceEntries.length === 0 && !workspaceBrowserError && (
                  <span className={styles.mutedText}>No files in this directory</span>
                )}
  
                {!isLoadingWorkspaceEntries && workspaceEntries.map(entry => {
                  const entryPath = joinWorkspacePath(workspacePath, entry.name);
  
                  return (
                    <div
                      className={entry.type === 'directory' ? styles.fileEntryDirectory : styles.fileEntry}
                      key={`${entry.type}-${entry.name}`}
                      title={entry.name}
                    >
                      <button
                        className={styles.fileEntryMain}
                        type="button"
                        onClick={() => entry.type === 'directory' ? onOpenWorkspaceEntry(entry) : onOpenWorkspacePath(entryPath)}
                      >
                        <span><Icon name={entry.type === 'directory' ? 'folder' : 'file'} size={13} />{entry.type === 'directory' ? 'Folder' : 'File'}</span>
                        <strong>{entry.name}</strong>
                        <em>{entry.type === 'directory' ? 'Directory' : formatFileSize(entry.size)}</em>
                      </button>
                      <div className={styles.fileEntryActions}>
                        <button className={styles.textButton} type="button" onClick={() => onOpenWorkspacePath(entryPath)}>
                          <Icon name="external" size={13} />
                          Open
                        </button>
                        <button className={styles.textButton} type="button" onClick={() => onRevealWorkspacePath(entryPath)}>
                          <Icon name="folder-open" size={13} />
                          Reveal
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
  
            <div className={styles.detailGrid}>
              <section className={styles.detailPanel}>
                <h3>Model</h3>
                <dl className={styles.detailList}>
                  <div>
                    <dt>Provider</dt>
                    <dd>{activeProviderLabel}</dd>
                  </div>
                  <div>
                    <dt>Model</dt>
                    <dd>{appConfig?.model || activeProviderDefault.model}</dd>
                  </div>
                  <div>
                    <dt>Base URL</dt>
                    <dd>{appConfig?.baseUrl || activeProviderDefault.baseUrl || 'Provider default'}</dd>
                  </div>
                  <div>
                    <dt>Context</dt>
                    <dd>{appConfig?.contextTokens ?? activeProviderDefault.contextTokens}</dd>
                  </div>
                </dl>
              </section>
              <section className={styles.detailPanel}>
                <h3>Session</h3>
                <dl className={styles.detailList}>
                  <div>
                    <dt>Current</dt>
                    <dd title={currentSessionTitle}>{currentSessionTitle}</dd>
                  </div>
                  <div>
                    <dt>Saved chats</dt>
                    <dd>{sessionCount}</dd>
                  </div>
                  <div>
                    <dt>Input tokens</dt>
                    <dd>{tokenUsage.inputTokens}</dd>
                  </div>
                  <div>
                    <dt>Output tokens</dt>
                    <dd>{tokenUsage.outputTokens}</dd>
                  </div>
                </dl>
              </section>
              <section className={styles.detailPanel}>
                <h3>Runtime</h3>
                <dl className={styles.detailList}>
                  <div>
                    <dt>App</dt>
                    <dd>{appInfo ? `${appInfo.platform} ${appInfo.arch}` : 'Unknown'}</dd>
                  </div>
                  <div>
                    <dt>Mode</dt>
                    <dd>{appInfo?.isDev ? 'Development' : 'Production'}</dd>
                  </div>
                  <div>
                    <dt>Viewport</dt>
                    <dd>{viewportSize.width} x {viewportSize.height}</dd>
                  </div>
                  <div>
                    <dt>State keys</dt>
                    <dd>{Object.keys(appState).length}</dd>
                  </div>
                  <div>
                    <dt>MCP servers</dt>
                    <dd>{mcpServers.length}</dd>
                  </div>
                  <div>
                    <dt>MCP tools</dt>
                    <dd>{mcpTools.length}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </>
        )}
  
        {visibleActiveSection === 'overview' && (
          <>
            <div className={styles.detailHero}>
              <span className={styles.detailEyebrow}>Current workspace</span>
              <h2>{workspaceTitle}</h2>
              <p title={appInfo?.workspacePath || undefined}>{appInfo?.workspacePath || 'Workspace path unavailable'}</p>
            </div>
  
            <div className={styles.detailGrid}>
              <section className={styles.detailPanel}>
                <h3>Model</h3>
                <dl className={styles.detailList}>
                  <div>
                    <dt>Provider</dt>
                    <dd>{activeProviderLabel}</dd>
                  </div>
                  <div>
                    <dt>Model</dt>
                    <dd>{appConfig?.model || activeProviderDefault.model}</dd>
                  </div>
                  <div>
                    <dt>Base URL</dt>
                    <dd>{appConfig?.baseUrl || activeProviderDefault.baseUrl || 'Provider default'}</dd>
                  </div>
                  <div>
                    <dt>Context</dt>
                    <dd>{appConfig?.contextTokens ?? activeProviderDefault.contextTokens}</dd>
                  </div>
                </dl>
              </section>
  
              <section className={styles.detailPanel}>
                <h3>Workspace State</h3>
                <dl className={styles.detailList}>
                  <div>
                    <dt>Tool calls</dt>
                    <dd>{appConfig?.enableLlmTools ? 'Enabled' : 'Disabled'}</dd>
                  </div>
                  <div>
                    <dt>MCP servers</dt>
                    <dd>{mcpServers.length}</dd>
                  </div>
                  <div>
                    <dt>MCP tools</dt>
                    <dd>{mcpTools.length}</dd>
                  </div>
                  <div>
                    <dt>State keys</dt>
                    <dd>{Object.keys(appState).length}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </>
        )}
  
        {visibleActiveSection === 'files' && (
          <section className={styles.detailPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Files</h3>
                <span title={appInfo?.workspacePath || undefined}>
                  {workspacePath === '.' ? appInfo?.workspacePath || '.' : workspacePath}
                </span>
              </div>
              <div className={styles.panelActions}>
                <button className={styles.secondaryButton} type="button" onClick={onGoToWorkspaceParent} disabled={workspacePath === '.' || isLoadingWorkspaceEntries}>
                  <Icon name="arrow-left" size={14} />
                  Up
                </button>
                <button className={styles.secondaryButton} type="button" onClick={onRefreshWorkspace} disabled={isLoadingWorkspaceEntries}>
                  <Icon name="refresh" size={14} />
                  Refresh
                </button>
              </div>
            </div>
  
            {workspaceBrowserError && (
              <span className={styles.inlineError}>{workspaceBrowserError}</span>
            )}
            {workspaceActionMessage && !workspaceBrowserError && (
              <span className={styles.inlineSuccess}>{workspaceActionMessage}</span>
            )}
  
            <div className={styles.fileBrowser} aria-label="Workspace files">
              {isLoadingWorkspaceEntries && (
                <span className={styles.mutedText}>Loading files...</span>
              )}
  
              {!isLoadingWorkspaceEntries && workspaceEntries.length === 0 && !workspaceBrowserError && (
                <span className={styles.mutedText}>No files in this directory</span>
              )}
  
              {!isLoadingWorkspaceEntries && workspaceEntries.map(entry => {
                const entryPath = joinWorkspacePath(workspacePath, entry.name);
  
                return (
                  <div
                    className={entry.type === 'directory' ? styles.fileEntryDirectory : styles.fileEntry}
                    key={`${entry.type}-${entry.name}`}
                    title={entry.name}
                  >
                    <button
                      className={styles.fileEntryMain}
                      type="button"
                      onClick={() => entry.type === 'directory' ? onOpenWorkspaceEntry(entry) : onOpenWorkspacePath(entryPath)}
                    >
                      <span><Icon name={entry.type === 'directory' ? 'folder' : 'file'} size={13} />{entry.type === 'directory' ? 'Folder' : 'File'}</span>
                      <strong>{entry.name}</strong>
                      <em>{entry.type === 'directory' ? 'Directory' : formatFileSize(entry.size)}</em>
                    </button>
                    <div className={styles.fileEntryActions}>
                      <button className={styles.textButton} type="button" onClick={() => onOpenWorkspacePath(entryPath)}>
                        <Icon name="external" size={13} />
                        Open
                      </button>
                      <button className={styles.textButton} type="button" onClick={() => onRevealWorkspacePath(entryPath)}>
                        <Icon name="folder-open" size={13} />
                        Reveal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
  
        {visibleActiveSection === 'session' && (
          <section className={styles.detailPanel}>
            <h3>Session</h3>
            <dl className={styles.detailList}>
              <div>
                <dt>Current</dt>
                <dd title={currentSessionTitle}>{currentSessionTitle}</dd>
              </div>
              <div>
                <dt>Saved chats</dt>
                <dd>{sessionCount}</dd>
              </div>
              <div>
                <dt>Input tokens</dt>
                <dd>{tokenUsage.inputTokens}</dd>
              </div>
              <div>
                <dt>Output tokens</dt>
                <dd>{tokenUsage.outputTokens}</dd>
              </div>
            </dl>
          </section>
        )}
  
        {visibleActiveSection === 'runtime' && (
          <section className={styles.detailPanel}>
            <h3>Runtime</h3>
            <dl className={styles.detailList}>
              <div>
                <dt>App</dt>
                <dd>{appInfo ? `${appInfo.platform} ${appInfo.arch}` : 'Unknown'}</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>{appInfo?.isDev ? 'Development' : 'Production'}</dd>
              </div>
              <div>
                <dt>Viewport</dt>
                <dd>{viewportSize.width} x {viewportSize.height}</dd>
              </div>
              <div>
                <dt>State keys</dt>
                <dd>{Object.keys(appState).length}</dd>
              </div>
              <div>
                <dt>MCP servers</dt>
                <dd>{mcpServers.length}</dd>
              </div>
              <div>
                <dt>MCP tools</dt>
                <dd>{mcpTools.length}</dd>
              </div>
            </dl>
          </section>
        )}
      </section>
    );
  }
  
  function ToolsView({
    activeSection,
    tools,
    mcpTools,
    mcpServers,
    appConfig,
    routerMessage,
    toolActivities,
    onToggleModelTool,
    onApplyToolPreset,
    onSetToolPermission,
    onApplyPermissionPreset,
    onRunCommand,
    onOpenWorkspacePath,
    onRevealWorkspacePath,
    onRefresh,
    onClearActivities,
  }: {
    activeSection: ToolsSectionId;
    tools: Tool[];
    mcpTools: McpToolInfo[];
    mcpServers: McpServerInfo[];
    appConfig: AppConfig | null;
    routerMessage: string;
    toolActivities: ToolActivity[];
    onToggleModelTool: (toolName: string, exposed: boolean) => void;
    onApplyToolPreset: (preset: 'all' | 'read-only' | 'mutating-off') => void;
    onSetToolPermission: (toolName: string, permission: ToolPermissionMode) => void;
    onApplyPermissionPreset: (preset: 'allow-all' | 'ask-mutating' | 'deny-mutating') => void;
    onRunCommand: (command: string, cwd?: string) => void;
    onOpenWorkspacePath: (targetPath: string) => void;
    onRevealWorkspacePath: (targetPath: string) => void;
    onRefresh: () => void;
    onClearActivities: () => void;
  }) {
    const exposedToolCount = tools.filter(tool => isToolExposedToModel(tool, appConfig)).length;
    const toolGroups = groupToolsByCategory(tools);
    const policyCounts = tools.reduce<Record<ToolPermissionMode, number>>(
      (counts, tool) => {
        counts[getToolPermissionPolicy(tool, appConfig)] += 1;
        return counts;
      },
      { allow: 0, ask: 0, deny: 0 },
    );
    return (
      <section className={styles.detailView} aria-label="Tools">
        {(activeSection === 'bridge' || activeSection === 'mcp') && (
          <div className={styles.pageActionBar}>
            <button className={styles.secondaryButton} type="button" onClick={onRefresh}>
              <Icon name="refresh" size={14} />
              Refresh
            </button>
          </div>
        )}
  
        {activeSection === 'bridge' && (
          <section className={styles.detailPanel}>
            <h3>Bridge Tools</h3>
            <div className={styles.toolRouterSummary}>
              <div>
                <span>Model exposure</span>
                <strong>{exposedToolCount} / {tools.length}</strong>
              </div>
              <div>
                <span>Tool calls</span>
                <strong>{appConfig?.enableLlmTools ? 'Enabled' : 'Disabled'}</strong>
              </div>
              <div>
                <span>Ask policy</span>
                <strong>{policyCounts.ask}</strong>
              </div>
              <div>
                <span>Denied</span>
                <strong>{policyCounts.deny}</strong>
              </div>
            </div>
            <div className={styles.toolRouterActions}>
              <button className={styles.secondaryButton} type="button" onClick={() => onApplyToolPreset('all')}>
                <Icon name="check" size={14} />
                Expose all
              </button>
              <button className={styles.secondaryButton} type="button" onClick={() => onApplyToolPreset('read-only')}>
                <Icon name="shield" size={14} />
                Read-only only
              </button>
              <button className={styles.secondaryButton} type="button" onClick={() => onApplyToolPreset('mutating-off')}>
                <Icon name="x" size={14} />
                Hide mutating
              </button>
              <button className={styles.secondaryButton} type="button" onClick={() => onApplyPermissionPreset('allow-all')}>
                <Icon name="check" size={14} />
                Allow all
              </button>
              <button className={styles.secondaryButton} type="button" onClick={() => onApplyPermissionPreset('ask-mutating')}>
                <Icon name="shield" size={14} />
                Ask mutating
              </button>
              <button className={styles.secondaryButton} type="button" onClick={() => onApplyPermissionPreset('deny-mutating')}>
                <Icon name="lock" size={14} />
                Deny mutating
              </button>
            </div>
            {routerMessage && <span className={styles.toolRouterMessage}>{routerMessage}</span>}
            <div className={styles.toolCatalog}>
              {toolGroups.map(group => (
                <section className={styles.toolCatalogGroup} key={group.id}>
                  <h4>{group.label}</h4>
                  {group.tools.map(tool => {
                    const exposed = isToolExposedToModel(tool, appConfig);
                    const permission = getToolPermissionPolicy(tool, appConfig);
  
                    return (
                      <article className={styles.toolCatalogItem} key={tool.name}>
                        <div>
                          <strong>{tool.name}</strong>
                          <span>{tool.readOnly ? 'Read-only' : 'Can change workspace'}</span>
                        </div>
                        <p>{tool.description}</p>
                        <div className={styles.toolExposureRow}>
                          <span>{exposed ? 'Exposed to model' : 'Hidden from model'}</span>
                          <button
                            className={exposed ? styles.toolExposureButton : styles.toolExposureButtonOff}
                            type="button"
                            onClick={() => onToggleModelTool(tool.name, !exposed)}
                          >
                            <Icon name={exposed ? 'x' : 'check'} size={13} />
                            {exposed ? 'Hide' : 'Expose'}
                          </button>
                        </div>
                        <label className={styles.toolPermissionRow}>
                          <span>Permission</span>
                          <select
                            value={permission}
                            onChange={event => onSetToolPermission(tool.name, event.target.value as ToolPermissionMode)}
                          >
                            {TOOL_PERMISSION_OPTIONS.map(option => (
                              <option value={option.value} key={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                      </article>
                    );
                  })}
                </section>
              ))}
              {tools.length === 0 && <span className={styles.mutedText}>No bridge tools available</span>}
            </div>
          </section>
        )}
  
        {activeSection === 'mcp' && (
          <section className={styles.detailPanel}>
            <h3>MCP Registry</h3>
            <dl className={styles.detailList}>
              <div>
                <dt>Servers</dt>
                <dd>{mcpServers.length}</dd>
              </div>
              <div>
                <dt>Tools</dt>
                <dd>{mcpTools.length}</dd>
              </div>
              <div>
                <dt>Execution policy</dt>
                <dd>{getToolPermissionPolicy({ name: 'mcp.callTool', description: '', inputSchema: {} }, appConfig)}</dd>
              </div>
            </dl>
  
            <div className={styles.toolCatalog}>
              {mcpServers.map(server => (
                <article className={styles.toolCatalogItem} key={`${server.scope ?? 'unknown'}-${server.name}`}>
                  <div>
                    <strong>{server.name}</strong>
                    <span className={[
                      styles.toolStatusBadge,
                      server.status === 'connected' ? styles.toolStatusConnected : '',
                      server.status === 'error' ? styles.toolStatusError : '',
                    ].filter(Boolean).join(' ')}
                    >
                      {server.status}
                    </span>
                  </div>
                  <p>
                    {server.type}
                    {server.scope ? ` / ${server.scope}` : ''}
                    {server.error ? ` / ${server.error}` : ''}
                  </p>
                </article>
              ))}
              {mcpServers.length === 0 && <span className={styles.mutedText}>No MCP servers configured</span>}
            </div>
  
            <div className={styles.tagList}>
              {mcpTools.map(tool => (
                <span className={styles.tag} key={`${tool.serverKey ?? tool.serverName}-${tool.toolName}`}>
                  {tool.serverScope ? `${tool.serverScope}:` : ''}{tool.serverName}.{tool.toolName}
                </span>
              ))}
              {mcpTools.length === 0 && <span className={styles.mutedText}>No executable stdio MCP tools discovered yet</span>}
            </div>
          </section>
        )}
  
        {activeSection === 'command' && (
          <RunCommandPanel onRunCommand={onRunCommand} />
        )}
  
        {activeSection === 'activity' && (
          <ToolActivityPanel
            activities={toolActivities}
            onClear={onClearActivities}
            onOpenWorkspacePath={onOpenWorkspacePath}
            onRevealWorkspacePath={onRevealWorkspacePath}
          />
        )}
  
        {activeSection === 'plugins' && (
          <PluginSkillPanel appConfig={appConfig} />
        )}
      </section>
    );
  }
  
  function HistoryView({
    activeSection,
    records,
    storageInfo,
    message,
    exportText,
    onRefresh,
    onDeleteRecord,
    onRestoreChat,
    onExportRecords,
  }: {
    activeSection: HistorySectionId;
    records: LocalHistoryRecord[];
    storageInfo: LocalHistoryStorageInfo;
    message: string;
    exportText: string;
    onRefresh: () => void;
    onDeleteRecord: (recordId: string) => void;
    onRestoreChat: (record: LocalHistoryRecord) => void;
    onExportRecords: (type?: LocalHistoryRecordType) => void;
  }) {
    const automationRecords = records.filter(record => record.type === 'automation-run');
    const projectEventRecords = records.filter(record => record.type === 'project-event');
    const projectActivityRecords = records.filter(record => record.type === 'automation-run' || record.type === 'project-event');
    const visibleRecords = activeSection === 'automation'
      ? automationRecords
      : activeSection === 'events'
        ? projectEventRecords
        : projectActivityRecords;
    const [historyDeleteTarget, setHistoryDeleteTarget] = useState<DeleteTarget<'record'> | null>(null);
  
    function openHistoryDeleteConfirmation(record: LocalHistoryRecord) {
      setHistoryDeleteTarget({
        kind: 'record',
        id: record.id,
        name: getHistoryRecordTitle(record),
        detail: 'Delete this local history record.',
        impact: [
          `${getHistoryRecordTypeLabel(record.type)} record will be removed from local history storage.`,
          record.workspacePath ? `Workspace: ${record.workspacePath}` : 'This does not delete workspace files or project artifacts.',
        ],
      });
    }
  
    function closeHistoryDeleteConfirmation() {
      setHistoryDeleteTarget(null);
    }
  
    function confirmHistoryDelete() {
      if (!historyDeleteTarget) {
        return;
      }
      onDeleteRecord(historyDeleteTarget.id);
      closeHistoryDeleteConfirmation();
    }
  
    function renderHistoryDeleteConfirmation() {
      if (!historyDeleteTarget) {
        return null;
      }
  
      return (
        <WorkbenchEditorPanel
          title="Delete record"
          subtitle={historyDeleteTarget.name}
          onClose={closeHistoryDeleteConfirmation}
          footer={(
            <div className={styles.toolRouterActions}>
              <button className={styles.dangerButton} type="button" onClick={confirmHistoryDelete}>
                <Icon name="trash" size={14} />
                Confirm Delete
              </button>
              <button className={styles.secondaryButton} type="button" onClick={closeHistoryDeleteConfirmation}>
                <Icon name="x" size={14} />
                Cancel
              </button>
            </div>
          )}
        >
          <section className={styles.deleteConfirmation}>
            <strong>{historyDeleteTarget.detail}</strong>
            <span>This action updates local History state immediately.</span>
            <ul>
              {historyDeleteTarget.impact.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </WorkbenchEditorPanel>
      );
    }
  
    async function copyExportText() {
      if (exportText) {
        await navigator.clipboard.writeText(exportText);
      }
    }
  
    function downloadExportText() {
      if (!exportText) {
        return;
      }
  
      const blob = new Blob([exportText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `code-agent-history-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  
    return (
      <section className={styles.settingsView} aria-label="Project activity">
        <div className={`${styles.settingsDialog} ${styles.settingsPageForm}`} role="region" aria-label="Project activity">
          <div className={historyDeleteTarget ? `${styles.settingsContent} ${styles.workbenchSplitWithRail}` : styles.settingsContent}>
            <div className={styles.pageActionBar}>
              <button className={styles.secondaryButton} type="button" onClick={onRefresh}>
                <Icon name="refresh" size={14} />
                Refresh
              </button>
            </div>
  
            {message && <p className={styles.inlineSuccess}>{message}</p>}
            {historyDeleteTarget && renderHistoryDeleteConfirmation()}
  
            {activeSection === 'overview' && (
              <>
                <SettingsSection title="Storage">
                  <dl className={styles.detailList}>
                    <div>
                      <dt>Records</dt>
                      <dd>{projectActivityRecords.length}</dd>
                    </div>
                    <div>
                      <dt>Automation</dt>
                      <dd>{automationRecords.length}</dd>
                    </div>
                    <div>
                      <dt>Project events</dt>
                      <dd>{projectEventRecords.length}</dd>
                    </div>
                  </dl>
                  <p className={styles.mutedText} title={storageInfo.storagePath}>Storage path: {storageInfo.storagePath || 'Unavailable'}</p>
                </SettingsSection>
                <HistoryRecordList
                  records={projectActivityRecords.slice(0, 12)}
                  onRequestDeleteRecord={openHistoryDeleteConfirmation}
                  onRestoreChat={onRestoreChat}
                />
              </>
            )}
  
            {(activeSection === 'automation' || activeSection === 'events') && (
              <HistoryRecordList
                records={visibleRecords}
                onRequestDeleteRecord={openHistoryDeleteConfirmation}
                onRestoreChat={onRestoreChat}
              />
            )}
  
            {activeSection === 'export' && (
              <>
                <SettingsSection title="Export History">
                  <p className={styles.mutedText}>Exports are local JSON snapshots. They do not include provider API keys.</p>
                  <div className={styles.toolRouterActions}>
                    <button className={styles.secondaryButton} type="button" onClick={() => onExportRecords('automation-run')}>
                      <Icon name="bot" size={14} />
                      Export Automation
                    </button>
                    <button className={styles.secondaryButton} type="button" onClick={() => onExportRecords('project-event')}>
                      <Icon name="activity" size={14} />
                      Export Project Events
                    </button>
                  </div>
                </SettingsSection>
  
                <SettingsSection title="Export Data">
                  <textarea value={exportText} readOnly rows={14} placeholder="Choose an export option above." />
                  <div className={styles.toolRouterActions}>
                    <button className={styles.secondaryButton} type="button" disabled={!exportText} onClick={copyExportText}>
                      <Icon name="file" size={14} />
                      Copy JSON
                    </button>
                    <button className={styles.secondaryButton} type="button" disabled={!exportText} onClick={downloadExportText}>
                      <Icon name="download" size={14} />
                      Download JSON
                    </button>
                  </div>
                </SettingsSection>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }
  
  function HistoryRecordList({
    records,
    onRequestDeleteRecord,
    onRestoreChat,
  }: {
    records: LocalHistoryRecord[];
    onRequestDeleteRecord: (record: LocalHistoryRecord) => void;
    onRestoreChat: (record: LocalHistoryRecord) => void;
  }) {
    return (
      <SettingsSection title="Records">
        <div className={styles.toolCatalog}>
          {records.map(record => (
            <article className={styles.toolCatalogItem} key={record.id}>
              <div>
                <strong>{getHistoryRecordTitle(record)}</strong>
                <span>{getHistoryRecordTypeLabel(record.type)}</span>
              </div>
              <p>{getHistoryRecordSummary(record)}</p>
              <p>{new Date(record.updatedAt).toLocaleString()}</p>
              {record.workspacePath && <p title={record.workspacePath}>Workspace: {record.workspacePath}</p>}
              <div className={styles.toolRouterActions}>
                {record.type === 'chat-session' && (
                  <button className={styles.secondaryButton} type="button" onClick={() => onRestoreChat(record)}>
                    <Icon name="rotate" size={14} />
                    Restore Chat
                  </button>
                )}
                <button className={styles.dangerButton} type="button" onClick={() => onRequestDeleteRecord(record)}>
                  <Icon name="trash" size={14} />
                  Delete
                </button>
              </div>
            </article>
          ))}
          {records.length === 0 && <span className={styles.mutedText}>No history records in this section.</span>}
        </div>
      </SettingsSection>
    );
  }
  
  function createAutomationDraftId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  
  function createVirtualTeamMemberDraft(role = 'Developer'): VirtualTeamMember {
    return {
      id: createAutomationDraftId('member'),
      name: role,
      role,
      goal: getDefaultTeamGoal(role),
      tools: getDefaultTeamTools(role),
    };
  }
  
  function createVirtualTeamDraft(workspacePath: string, providerId?: string): VirtualTeamBlueprint {
    const members = [
      createVirtualTeamMemberDraft('Supervisor'),
      createVirtualTeamMemberDraft('Project Manager'),
      createVirtualTeamMemberDraft('Developer'),
      createVirtualTeamMemberDraft('QA'),
    ];
    const now = Date.now();
  
    return {
      id: createAutomationDraftId('team'),
      name: 'Autonomous project team',
      objective: 'Build and validate the software project from the human blueprint.',
      workspacePath,
      permissionMode: 'full-access',
      maxIterations: 1,
      providerId,
      providerConfig: { requireQaSignoff: true },
      supervisorId: members[0].id,
      members,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
  }
  
  function cloneVirtualTeamForDraft(team: VirtualTeamBlueprint, workspacePath: string): VirtualTeamBlueprint {
    const members = team.members.map(member => ({
      ...member,
      tools: [...member.tools],
    }));
    const supervisorId = members.some(member => member.id === team.supervisorId)
      ? team.supervisorId
      : members[0]?.id ?? '';
  
    return {
      ...team,
      workspacePath: team.workspacePath ?? workspacePath,
      permissionMode: team.permissionMode ?? 'full-access',
      maxIterations: team.maxIterations ?? 1,
      providerId: team.providerId,
      providerConfig: team.providerConfig ? { ...team.providerConfig } : undefined,
      supervisorId,
      members,
    };
  }
  
  function getTeamPermissionLabel(mode?: VirtualTeamPermissionMode): string {
    return mode === 'supervised' ? 'Supervised' : 'Full access';
  }
  
  function formatTeamTools(tools: string[]): string {
    return tools.join(', ');
  }
  
  function createPermissionTool(toolName: string): Tool {
    const readOnly = !['bash.run', 'fs.write', 'fs.undoLastWrite', 'mcp.callTool'].includes(toolName);
    return {
      name: toolName,
      description: '',
      inputSchema: {},
      readOnly,
    };
  }
  
  function AutomationView({
    providerId,
    activeSection,
    skills,
    tasks,
    taskRuns,
    schedulerStatus,
    remoteControl,
    teams,
    teamRuns,
    runningTeamIds,
    roles,
    employees,
    appConfig,
    workspacePath,
    message,
    exportText,
    importText,
    onRefresh,
    onSetSkillEnabled,
    onExportProject,
    onImportTextChange,
    onImportProject,
    onSaveTask,
    onRunTask,
    onSetTaskEnabled,
    onDeleteTask,
    onUpdateRemoteControl,
    onCreatePairingCode,
    onRevokeRemoteDevice,
    onCreateDefaultTeam,
    onSaveTeam,
    onRunTeam,
    onDeleteTeam,
    onSetToolPermission,
    onApplyPermissionPreset,
  }: {
    providerId?: string;
    activeSection: AutomationSectionId;
    skills: SkillManifest[];
    tasks: ScheduledTask[];
    taskRuns: AutomationRunRecord[];
    schedulerStatus: AutomationSchedulerStatus;
    remoteControl: RemoteControlState;
    teams: VirtualTeamBlueprint[];
    teamRuns: VirtualTeamRunRecord[];
    runningTeamIds: Set<string>;
    roles: VirtualRoleDefinition[];
    employees: VirtualEmployeeProfile[];
    appConfig: AppConfig | null;
    workspacePath: string;
    message: string;
    exportText: string;
    importText: string;
    onRefresh: () => void;
    onSetSkillEnabled: (skillId: string, enabled: boolean) => void;
    onExportProject: (includeRuns: boolean) => void;
    onImportTextChange: (value: string) => void;
    onImportProject: () => void;
    onSaveTask: (task: Partial<ScheduledTask>) => void;
    onRunTask: (taskId: string) => void;
    onSetTaskEnabled: (taskId: string, enabled: boolean) => void;
    onDeleteTask: (taskId: string) => void;
    onUpdateRemoteControl: (update: Partial<RemoteControlState>) => void;
    onCreatePairingCode: (deviceName?: string) => void;
    onRevokeRemoteDevice: (deviceId: string) => void;
    onCreateDefaultTeam: (objective: string) => void;
    onSaveTeam: (team: Partial<VirtualTeamBlueprint>) => void;
    onRunTeam: (teamId: string) => void;
    onDeleteTeam: (teamId: string) => void;
    onSetToolPermission: (toolName: string, mode: ToolPermissionMode) => void;
    onApplyPermissionPreset: (preset: 'allow-all' | 'ask-mutating' | 'deny-mutating') => void;
  }) {
    const [taskName, setTaskName] = useState('Daily project check');
    const [taskPrompt, setTaskPrompt] = useState('Summarize git status, failing tests, and next actions for this workspace.');
    const [taskInterval, setTaskInterval] = useState(1440);
    const [taskRetryEnabled, setTaskRetryEnabled] = useState(false);
    const [taskMaxRetries, setTaskMaxRetries] = useState(1);
    const [taskRetryDelay, setTaskRetryDelay] = useState(15);
    const [taskNotifySuccess, setTaskNotifySuccess] = useState(false);
    const [taskNotifyFailure, setTaskNotifyFailure] = useState(true);
    const [taskNotificationChannel, setTaskNotificationChannel] = useState<'desktop' | 'remote' | 'none'>('desktop');
    const [taskMissedRunPolicy, setTaskMissedRunPolicy] = useState<'run-once' | 'skip'>('run-once');
    const [taskDraftId, setTaskDraftId] = useState('');
    const [taskEnabled, setTaskEnabled] = useState(true);
    const [deviceName, setDeviceName] = useState('Phone');
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [selectedSharedEmployeeId, setSelectedSharedEmployeeId] = useState('');
    const [teamDraft, setTeamDraft] = useState<VirtualTeamBlueprint>(() => createVirtualTeamDraft(workspacePath, providerId));
    const [automationEditorPanel, setAutomationEditorPanel] = useState<AutomationEditorPanelId | null>(null);
    const [automationDeleteTarget, setAutomationDeleteTarget] = useState<DeleteTarget<AutomationDeleteKind> | null>(null);
    const [scheduledTaskView, setScheduledTaskView] = useState<RecordViewMode>('table');
    const selectedTeam = teams.find(team => team.id === selectedTeamId);
    const recentTeamRuns = selectedTeamId
      ? teamRuns.filter(run => run.teamId === selectedTeamId)
      : teamRuns;
    const taskRailOpen = automationEditorPanel === 'task' || (automationEditorPanel === 'delete' && automationDeleteTarget?.kind === 'task');
    const teamRailOpen = automationEditorPanel === 'team' || (automationEditorPanel === 'delete' && automationDeleteTarget?.kind === 'team');
  
    useEffect(() => {
      if (!selectedTeamId && teams[0]) {
        setSelectedTeamId(teams[0].id);
        setTeamDraft(cloneVirtualTeamForDraft(teams[0], workspacePath));
      }
    }, [selectedTeamId, teams, workspacePath]);
  
    function closeAutomationEditorPanel() {
      setAutomationEditorPanel(null);
      setAutomationDeleteTarget(null);
    }
  
    function openAutomationDeleteConfirmation(target: DeleteTarget<AutomationDeleteKind>) {
      setAutomationDeleteTarget(target);
      setAutomationEditorPanel('delete');
    }
  
    function confirmAutomationDelete() {
      if (!automationDeleteTarget) {
        return;
      }
  
      if (automationDeleteTarget.kind === 'task') {
        onDeleteTask(automationDeleteTarget.id);
      } else if (automationDeleteTarget.kind === 'team') {
        onDeleteTeam(automationDeleteTarget.id);
      } else if (automationDeleteTarget.kind === 'device') {
        onRevokeRemoteDevice(automationDeleteTarget.id);
      }
  
      closeAutomationEditorPanel();
    }
  
    function openNewTaskEditor() {
      setAutomationDeleteTarget(null);
      setTaskDraftId('');
      setTaskName('Daily project check');
      setTaskPrompt('Summarize git status, failing tests, and next actions for this workspace.');
      setTaskInterval(1440);
      setTaskRetryEnabled(false);
      setTaskMaxRetries(1);
      setTaskRetryDelay(15);
      setTaskNotifySuccess(false);
      setTaskNotifyFailure(true);
      setTaskNotificationChannel('desktop');
      setTaskMissedRunPolicy('run-once');
      setTaskEnabled(true);
      setAutomationEditorPanel('task');
    }
  
    function openTaskEditor(task: ScheduledTask) {
      setAutomationDeleteTarget(null);
      setTaskDraftId(task.id);
      setTaskName(task.name);
      setTaskPrompt(task.prompt);
      setTaskInterval(task.intervalMinutes);
      setTaskRetryEnabled(Boolean(task.retryPolicy?.enabled));
      setTaskMaxRetries(task.retryPolicy?.maxRetries ?? 1);
      setTaskRetryDelay(task.retryPolicy?.retryDelayMinutes ?? 15);
      setTaskNotifySuccess(Boolean(task.notificationPolicy?.onSuccess));
      setTaskNotifyFailure(task.notificationPolicy?.onFailure !== false);
      setTaskNotificationChannel(task.notificationPolicy?.channel ?? 'desktop');
      setTaskMissedRunPolicy(task.missedRunPolicy ?? 'run-once');
      setTaskEnabled(task.enabled);
      setAutomationEditorPanel('task');
    }
  
    function saveTaskDraft() {
      onSaveTask({
        id: taskDraftId || undefined,
        name: taskName,
        prompt: taskPrompt,
        intervalMinutes: taskInterval,
        enabled: taskEnabled,
        retryPolicy: {
          enabled: taskRetryEnabled,
          maxRetries: taskMaxRetries,
          retryDelayMinutes: taskRetryDelay,
        },
        notificationPolicy: {
          onSuccess: taskNotifySuccess,
          onFailure: taskNotifyFailure,
          channel: taskNotificationChannel,
        },
        missedRunPolicy: taskMissedRunPolicy,
      });
      closeAutomationEditorPanel();
    }
  
    function startNewTeamDraft() {
      const draft = createVirtualTeamDraft(workspacePath, providerId);
      setSelectedTeamId('');
      setTeamDraft(draft);
      setAutomationDeleteTarget(null);
      setAutomationEditorPanel('team');
    }
  
    function selectTeam(team: VirtualTeamBlueprint) {
      setSelectedTeamId(team.id);
      setTeamDraft(cloneVirtualTeamForDraft(team, workspacePath));
      setAutomationDeleteTarget(null);
      setAutomationEditorPanel('team');
    }
  
    function updateTeamDraft(update: Partial<VirtualTeamBlueprint>) {
      setTeamDraft(current => ({
        ...current,
        ...update,
        updatedAt: Date.now(),
      }));
    }
  
    function updateTeamMember(index: number, update: Partial<VirtualTeamMember>) {
      setTeamDraft(current => {
        const members = current.members.map((member, memberIndex) => (
          memberIndex === index ? { ...member, ...update } : member
        ));
        const supervisorId = members.some(member => member.id === current.supervisorId)
          ? current.supervisorId
          : members[0]?.id ?? '';
  
        return {
          ...current,
          members,
          supervisorId,
          updatedAt: Date.now(),
        };
      });
    }
  
    function addTeamMember(role = 'Developer') {
      setTeamDraft(current => {
        const member = createVirtualTeamMemberDraft(role);
        return {
          ...current,
          members: [...current.members, member],
          supervisorId: current.supervisorId || member.id,
          updatedAt: Date.now(),
        };
      });
    }
  
    function addSharedEmployeeToTeam(employeeId: string) {
      const employee = employees.find(candidate => candidate.id === employeeId);
      if (!employee) {
        return;
      }
  
      const role = getEmployeeRoleDefinition(employee, roles);
      const member: VirtualTeamMember = {
        id: `member-${employee.id}`,
        name: employee.name,
        role: role?.title ?? employee.role,
        goal: role?.defaultGoal ?? getDefaultTeamGoal(employee.role),
        tools: role?.defaultTools ?? getDefaultTeamTools(employee.role),
      };
  
      setTeamDraft(current => {
        const members = [
          member,
          ...current.members.filter(candidate => candidate.id !== member.id),
        ];
        return {
          ...current,
          members,
          supervisorId: current.supervisorId || (role?.canSupervise ? member.id : members[0]?.id ?? ''),
          updatedAt: Date.now(),
        };
      });
    }
  
    function deleteTeamMember(memberId: string) {
      setTeamDraft(current => {
        const members = current.members.filter(member => member.id !== memberId);
        return {
          ...current,
          members,
          supervisorId: current.supervisorId === memberId ? members[0]?.id ?? '' : current.supervisorId,
          updatedAt: Date.now(),
        };
      });
    }
  
    function saveTeamDraft() {
      onSaveTeam({
        ...teamDraft,
        permissionMode: teamDraft.permissionMode ?? 'full-access',
        maxIterations: Math.max(1, Math.min(5, Math.floor(Number(teamDraft.maxIterations ?? 1) || 1))),
        providerId: teamDraft.providerId,
        providerConfig: teamDraft.providerConfig ? { ...teamDraft.providerConfig } : undefined,
        members: teamDraft.members.map(member => ({
          ...member,
          name: member.name.trim() || member.role.trim() || 'Team member',
          role: member.role.trim() || 'Contributor',
          goal: member.goal.trim() || getDefaultTeamGoal(member.role),
          tools: normalizeToolNameList(member.tools),
        })),
      });
      closeAutomationEditorPanel();
    }
  
    function buildScheduledTaskDeleteTarget(task: ScheduledTask): DeleteTarget<AutomationDeleteKind> {
      return {
        kind: 'task',
        id: task.id,
        name: task.name,
        detail: 'Delete this scheduled automation task.',
        impact: [
          `The ${task.enabled ? 'enabled' : 'disabled'} schedule running every ${task.intervalMinutes} minute(s) will be removed.`,
          'Existing task run history remains visible until history retention removes it.',
        ],
      };
    }
  
    function buildAutomationTeamDeleteTarget(team: VirtualTeamBlueprint): DeleteTarget<AutomationDeleteKind> {
      return {
        kind: 'team',
        id: team.id,
        name: team.name,
        detail: 'Delete this automation team blueprint.',
        impact: [
          `${team.members.length} virtual team member definition(s) will be removed from this blueprint.`,
          'Existing team run records are not deleted by this action.',
        ],
      };
    }
  
    function buildRemoteDeviceDeleteTarget(device: RemoteControlState['approvedDevices'][number]): DeleteTarget<AutomationDeleteKind> {
      return {
        kind: 'device',
        id: device.id,
        name: device.name,
        detail: 'Revoke this approved remote-control device.',
        impact: [
          'The device token will no longer be accepted for remote approvals.',
          device.lastSeenAt
            ? `Last seen ${new Date(device.lastSeenAt).toLocaleString()}.`
            : `Paired ${new Date(device.createdAt).toLocaleString()}.`,
        ],
      };
    }
  
    function getScheduledTaskPolicyLabels(task: ScheduledTask) {
      const retryLabel = task.retryPolicy?.enabled
        ? `${task.retryAttempts ?? 0}/${task.retryPolicy.maxRetries} retry`
        : 'Retry off';
      const notifyLabel = `${task.notificationPolicy?.channel ?? 'desktop'} notifications`;
  
      return { retryLabel, notifyLabel };
    }
  
    function renderScheduledTaskRow(task: ScheduledTask) {
      const { retryLabel, notifyLabel } = getScheduledTaskPolicyLabels(task);
  
      return (
        <article className={styles.workbenchRecordRow} key={task.id}>
          <div className={styles.workbenchRecordPrimary}>
            <strong>{task.name}</strong>
            <span>{task.enabled ? 'Enabled' : 'Disabled'} / {task.lastStatus ?? 'never run'}</span>
          </div>
          <span className={styles.workbenchRecordCell}>
            Every {task.intervalMinutes} min
          </span>
          <span className={styles.workbenchRecordCell} title={new Date(task.nextRunAt).toLocaleString()}>
            Next {new Date(task.nextRunAt).toLocaleString()}
          </span>
          <span className={styles.workbenchRecordCell} title={`${task.prompt} / ${retryLabel} / ${notifyLabel}`}>
            {retryLabel} / {notifyLabel}
          </span>
          <div className={`${styles.workbenchRecordActions} ${styles.workbenchRecordActionsWide}`}>
            <button className={styles.secondaryButton} type="button" onClick={() => openTaskEditor(task)}>
              <Icon name="edit" size={14} />
              Edit
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => onRunTask(task.id)}>
              <Icon name="play" size={14} />
              Run Now
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => onSetTaskEnabled(task.id, !task.enabled)}>
              <Icon name={task.enabled ? 'pause' : 'play'} size={14} />
              {task.enabled ? 'Disable' : 'Enable'}
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => openAutomationDeleteConfirmation(buildScheduledTaskDeleteTarget(task))}>
              <Icon name="trash" size={14} />
              Delete
            </button>
          </div>
        </article>
      );
    }
  
    function renderScheduledTaskCard(task: ScheduledTask) {
      const { retryLabel, notifyLabel } = getScheduledTaskPolicyLabels(task);
  
      return (
        <article className={styles.projectCard} key={task.id}>
          <div className={styles.projectCardHeader}>
            <div>
              <strong>{task.name}</strong>
              <span>{task.enabled ? 'Enabled' : 'Disabled'} / {task.lastStatus ?? 'never run'}</span>
            </div>
          </div>
          <p title={task.prompt}>{task.prompt}</p>
          <dl className={styles.projectCardMeta}>
            <div>
              <dt>Cadence</dt>
              <dd>Every {task.intervalMinutes} min</dd>
            </div>
            <div>
              <dt>Next Run</dt>
              <dd title={new Date(task.nextRunAt).toLocaleString()}>{new Date(task.nextRunAt).toLocaleString()}</dd>
            </div>
          </dl>
          <div className={styles.projectChipList}>
            <span className={styles.projectChip}>{retryLabel}</span>
            <span className={styles.projectChip}>{notifyLabel}</span>
            <span className={styles.projectChip}>{task.missedRunPolicy ?? 'run-once'}</span>
          </div>
          <div className={styles.projectCardActions}>
            <button className={styles.secondaryButton} type="button" onClick={() => openTaskEditor(task)}>
              <Icon name="edit" size={14} />
              Edit
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => onRunTask(task.id)}>
              <Icon name="play" size={14} />
              Run Now
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => onSetTaskEnabled(task.id, !task.enabled)}>
              <Icon name={task.enabled ? 'pause' : 'play'} size={14} />
              {task.enabled ? 'Disable' : 'Enable'}
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => openAutomationDeleteConfirmation(buildScheduledTaskDeleteTarget(task))}>
              <Icon name="trash" size={14} />
              Delete
            </button>
          </div>
        </article>
      );
    }
  
    function renderAutomationTeamRow(team: VirtualTeamBlueprint) {
      const teamIsRunning = runningTeamIds.has(team.id) || team.lastStatus === 'running';
      const status = teamIsRunning ? 'running' : team.status;
      const governance = `${team.maxIterations ?? 1} iteration(s) / QA ${team.providerConfig?.requireQaSignoff === true ? 'required' : 'optional'}`;
      const rowClassName = team.id === selectedTeamId
        ? `${styles.workbenchRecordRow} ${styles.workbenchRecordRowSelected}`
        : styles.workbenchRecordRow;
  
      return (
        <article className={rowClassName} key={team.id}>
          <div className={styles.workbenchRecordPrimary}>
            <strong>{team.name}</strong>
            <span title={team.workspacePath ?? workspacePath}>{team.workspacePath ?? workspacePath}</span>
          </div>
          <span className={styles.workbenchRecordCell}>
            {status} / {getTeamPermissionLabel(team.permissionMode)}
          </span>
          <span className={styles.workbenchRecordCell}>
            {team.members.length} member(s) / {governance}
          </span>
          <span className={styles.workbenchRecordCell} title={`${team.objective}${team.lastResult ? ` / ${team.lastResult}` : ''}`}>
            {team.objective}
          </span>
          <div className={`${styles.workbenchRecordActions} ${styles.workbenchRecordActionsWide}`}>
            <button className={styles.secondaryButton} type="button" onClick={() => selectTeam(team)} disabled={teamIsRunning}>
              <Icon name="edit" size={14} />
              Edit
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => onRunTeam(team.id)} disabled={teamIsRunning}>
              <Icon name={teamIsRunning ? 'activity' : 'play'} size={14} />
              {teamIsRunning ? 'Running...' : 'Run Team'}
            </button>
            <button
              className={styles.dangerButton}
              type="button"
              onClick={() => openAutomationDeleteConfirmation(buildAutomationTeamDeleteTarget(team))}
              disabled={teamIsRunning}
            >
              <Icon name="trash" size={14} />
              Delete
            </button>
          </div>
        </article>
      );
    }
  
    function renderAutomationDeleteConfirmation() {
      if (!automationDeleteTarget) {
        return null;
      }
  
      return (
        <WorkbenchEditorPanel
          title={`Delete ${automationDeleteTarget.kind}`}
          subtitle={automationDeleteTarget.name}
          onClose={closeAutomationEditorPanel}
          footer={(
            <div className={styles.toolRouterActions}>
              <button className={styles.dangerButton} type="button" onClick={confirmAutomationDelete}>
                <Icon name="trash" size={14} />
                Confirm Delete
              </button>
              <button className={styles.secondaryButton} type="button" onClick={closeAutomationEditorPanel}>
                <Icon name="x" size={14} />
                Cancel
              </button>
            </div>
          )}
        >
          <section className={styles.deleteConfirmation}>
            <strong>{automationDeleteTarget.detail}</strong>
            <span>This action updates local Automation state immediately.</span>
            <ul>
              {automationDeleteTarget.impact.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </WorkbenchEditorPanel>
      );
    }
  
    async function copyAutomationExportText() {
      if (exportText) {
        await navigator.clipboard.writeText(exportText);
      }
    }
  
    function downloadAutomationExportText() {
      if (!exportText) {
        return;
      }
  
      const blob = new Blob([exportText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `code-agent-automation-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  
    return (
      <section className={styles.settingsView} aria-label="Automation">
        <div className={`${styles.settingsDialog} ${styles.settingsPageForm}`} role="region" aria-label="Automation">
          <div className={styles.settingsContent}>
            <div className={styles.pageActionBar}>
              <button className={styles.secondaryButton} type="button" onClick={onRefresh}>
                <Icon name="refresh" size={14} />
                Refresh
              </button>
            </div>
  
            {message && <p className={styles.inlineSuccess}>{message}</p>}
  
            {activeSection === 'skills' && (
                <>
                  <SettingsSection title="Workspace Skills">
                    <p className={styles.mutedText}>Workspace skills are discovered from `.code-agent/skills` and `skills`.</p>
                    <div className={styles.toolCatalog}>
                      {skills.map(skill => (
                        <article className={styles.toolCatalogItem} key={skill.id}>
                          <div>
                            <strong>{skill.name}</strong>
                            <span>{skill.enabled ? 'Enabled' : 'Disabled'} / {skill.source}</span>
                          </div>
                          <p>{skill.description || 'No description provided.'}</p>
                          <p title={skill.path}>{skill.path}</p>
                          <div className={styles.toolRouterActions}>
                            <button className={styles.secondaryButton} type="button" onClick={() => onSetSkillEnabled(skill.id, !skill.enabled)}>
                              <Icon name={skill.enabled ? 'pause' : 'play'} size={14} />
                              {skill.enabled ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                        </article>
                      ))}
                      {skills.length === 0 && <span className={styles.mutedText}>No workspace skills found yet.</span>}
                    </div>
                  </SettingsSection>
  
                  <SettingsSection title="Shareable Project Bundle">
                    <p className={styles.mutedText}>Export tasks, teams, and skill policies for this workspace. Local remote devices, API keys, and pairing secrets are not included.</p>
                    <div className={styles.toolRouterActions}>
                      <button className={styles.secondaryButton} type="button" onClick={() => onExportProject(false)}>
                        <Icon name="download" size={14} />
                        Export Config
                      </button>
                      <button className={styles.secondaryButton} type="button" onClick={() => onExportProject(true)}>
                        <Icon name="archive" size={14} />
                        Export With Runs
                      </button>
                      <button className={styles.secondaryButton} type="button" disabled={!exportText} onClick={copyAutomationExportText}>
                        <Icon name="file" size={14} />
                        Copy Export
                      </button>
                      <button className={styles.secondaryButton} type="button" disabled={!exportText} onClick={downloadAutomationExportText}>
                        <Icon name="download" size={14} />
                        Download Export
                      </button>
                      <button className={styles.primaryButton} type="button" onClick={onImportProject} disabled={!importText.trim()}>
                        <Icon name="folder-open" size={14} />
                        Import JSON
                      </button>
                    </div>
                    <div className={styles.settingsGrid}>
                      <label className={`${styles.field} ${styles.fieldWide}`}>
                        <span>Export JSON</span>
                        <textarea value={exportText} readOnly rows={8} placeholder="Exported automation JSON appears here." />
                      </label>
                      <label className={`${styles.field} ${styles.fieldWide}`}>
                        <span>Import JSON</span>
                        <textarea value={importText} onChange={event => onImportTextChange(event.target.value)} rows={8} placeholder="Paste a CodeAgent automation export JSON object." />
                      </label>
                    </div>
                  </SettingsSection>
                </>
              )}
  
              {activeSection === 'tasks' && (
                <div className={taskRailOpen ? `${styles.workbenchSplit} ${styles.workbenchSplitWithRail}` : styles.workbenchSplit}>
                  <div className={styles.workbenchMainStack}>
                    <SettingsSection title="Scheduler">
                    <dl className={styles.detailList}>
                      <div>
                        <dt>Status</dt>
                        <dd>{schedulerStatus.running ? 'Running' : 'Stopped'}</dd>
                      </div>
                      <div>
                        <dt>Tick</dt>
                        <dd>{Math.round(schedulerStatus.intervalMs / 1000)}s</dd>
                      </div>
                      <div>
                        <dt>Active tasks</dt>
                        <dd>{schedulerStatus.runningTaskIds.length}</dd>
                      </div>
                    </dl>
                    <p className={styles.mutedText}>Scheduled tasks use the bridge tool permission policy below. Virtual teams can also be set to full access in the team panel when trusted autonomous work should not pause for approvals.</p>
                    <div className={styles.toolRouterActions}>
                      <button className={styles.primaryButton} type="button" onClick={openNewTaskEditor}>
                        New Task
                      </button>
                    </div>
                  </SettingsSection>
  
                    <SettingsSection title="Configured Tasks">
                      <div className={styles.recordSectionToolbar}>
                        <RecordViewToggle view={scheduledTaskView} onChange={setScheduledTaskView} label="Scheduled task list view" />
                      </div>
                      {scheduledTaskView === 'table' ? (
                        <div className={styles.workbenchRecordList}>
                          <div className={`${styles.workbenchRecordRow} ${styles.workbenchRecordHeader}`}>
                            <span>Task</span>
                            <span>Cadence</span>
                            <span>Next run</span>
                            <span>Policy</span>
                            <span>Actions</span>
                          </div>
                          {tasks.map(task => renderScheduledTaskRow(task))}
                          {tasks.length === 0 && <span className={styles.workbenchEmptyState}>No scheduled tasks configured.</span>}
                        </div>
                      ) : (
                        <div className={styles.recordCardGrid}>
                          {tasks.map(task => renderScheduledTaskCard(task))}
                          {tasks.length === 0 && <span className={styles.workbenchEmptyState}>No scheduled tasks configured.</span>}
                        </div>
                      )}
                    </SettingsSection>
  
                    <SettingsSection title="Recent Task Runs">
                    <div className={styles.toolCatalog}>
                      {taskRuns.slice(0, 8).map(run => (
                        <article className={styles.toolCatalogItem} key={run.id}>
                          <div>
                            <strong>{run.taskName}</strong>
                            <span>{run.status}</span>
                          </div>
                          <p>{run.result ?? run.error ?? 'Running...'}</p>
                          <p>{new Date(run.startedAt).toLocaleString()}</p>
                        </article>
                      ))}
                      {taskRuns.length === 0 && <span className={styles.mutedText}>No task runs yet.</span>}
                    </div>
                    </SettingsSection>
                  </div>
  
                  {automationEditorPanel === 'task' && (
                    <WorkbenchEditorPanel
                      title={taskDraftId ? 'Edit Scheduled Task' : 'New Scheduled Task'}
                      subtitle="Prompt, cadence, retries, notifications, and missed-run handling"
                      onClose={closeAutomationEditorPanel}
                      footer={(
                        <div className={styles.toolRouterActions}>
                          <button className={styles.primaryButton} type="button" onClick={saveTaskDraft}>
                            <Icon name="save" size={14} />
                            Save Task
                          </button>
                          <button className={styles.secondaryButton} type="button" onClick={openNewTaskEditor}>
                            <Icon name="rotate" size={14} />
                            Reset New
                          </button>
                        </div>
                      )}
                    >
                      <div className={styles.settingsGrid}>
                        <label className={styles.field}>
                          <span>Name</span>
                          <input value={taskName} onChange={event => setTaskName(event.target.value)} />
                        </label>
                        <label className={styles.field}>
                          <span>Enabled</span>
                          <select value={taskEnabled ? 'yes' : 'no'} onChange={event => setTaskEnabled(event.target.value === 'yes')}>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>Interval minutes</span>
                          <input
                            type="number"
                            min={1}
                            value={taskInterval}
                            onChange={event => setTaskInterval(Math.max(1, Number(event.target.value) || 1))}
                          />
                        </label>
                        <label className={`${styles.field} ${styles.fieldWide}`}>
                          <span>Prompt</span>
                          <textarea value={taskPrompt} onChange={event => setTaskPrompt(event.target.value)} rows={4} />
                        </label>
                        <label className={styles.field}>
                          <span>Retry failed runs</span>
                          <select value={taskRetryEnabled ? 'enabled' : 'disabled'} onChange={event => setTaskRetryEnabled(event.target.value === 'enabled')}>
                            <option value="disabled">Disabled</option>
                            <option value="enabled">Enabled</option>
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>Max retries</span>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            value={taskMaxRetries}
                            onChange={event => setTaskMaxRetries(Math.max(0, Math.min(10, Number(event.target.value) || 0)))}
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Retry delay minutes</span>
                          <input
                            type="number"
                            min={1}
                            max={1440}
                            value={taskRetryDelay}
                            onChange={event => setTaskRetryDelay(Math.max(1, Math.min(1440, Number(event.target.value) || 1)))}
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Notify on success</span>
                          <select value={taskNotifySuccess ? 'yes' : 'no'} onChange={event => setTaskNotifySuccess(event.target.value === 'yes')}>
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>Notify on failure</span>
                          <select value={taskNotifyFailure ? 'yes' : 'no'} onChange={event => setTaskNotifyFailure(event.target.value === 'yes')}>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>Notification channel</span>
                          <select value={taskNotificationChannel} onChange={event => setTaskNotificationChannel(event.target.value as 'desktop' | 'remote' | 'none')}>
                            <option value="desktop">Desktop</option>
                            <option value="remote">Remote</option>
                            <option value="none">None</option>
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>Missed runs</span>
                          <select value={taskMissedRunPolicy} onChange={event => setTaskMissedRunPolicy(event.target.value as 'run-once' | 'skip')}>
                            <option value="run-once">Run once after restart</option>
                            <option value="skip">Skip and resume schedule</option>
                          </select>
                        </label>
                      </div>
                    </WorkbenchEditorPanel>
                  )}
                  {automationEditorPanel === 'delete' && automationDeleteTarget?.kind === 'task' && renderAutomationDeleteConfirmation()}
                </div>
              )}
  
              {activeSection === 'remote' && (
                <>
                  <SettingsSection title="Remote Access">
                    <dl className={styles.detailList}>
                      <div>
                        <dt>Status</dt>
                        <dd>{remoteControl.enabled ? 'Enabled' : 'Disabled'}</dd>
                      </div>
                      <div>
                        <dt>Mode</dt>
                        <dd>{remoteControl.mode}</dd>
                      </div>
                      <div>
                        <dt>Devices</dt>
                        <dd>{remoteControl.approvedDevices.length}</dd>
                      </div>
                      <div>
                        <dt>Pending approvals</dt>
                        <dd>{remoteControl.pendingActions?.length ?? 0}</dd>
                      </div>
                    </dl>
                    <div className={styles.settingsGrid}>
                      <label className={styles.field}>
                        <span>Device name</span>
                        <input value={deviceName} onChange={event => setDeviceName(event.target.value)} />
                      </label>
                    </div>
                    <div className={styles.toolRouterActions}>
                      <button className={styles.secondaryButton} type="button" onClick={() => onUpdateRemoteControl({ enabled: !remoteControl.enabled, mode: remoteControl.enabled ? 'disabled' : 'local-network' })}>
                        <Icon name={remoteControl.enabled ? 'pause' : 'play'} size={14} />
                        {remoteControl.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button className={styles.primaryButton} type="button" onClick={() => onCreatePairingCode(deviceName)}>
                        <Icon name="phone" size={14} />
                        Pair Device
                      </button>
                    </div>
                  </SettingsSection>
  
                  {remoteControl.pairingCode && (
                    <SettingsSection title="Pairing Code">
                      <div className={styles.pairingCode}>
                        <span>Pairing code</span>
                        <strong>{remoteControl.pairingCode}</strong>
                        {remoteControl.pairingExpiresAt && <em>Expires {new Date(remoteControl.pairingExpiresAt).toLocaleTimeString()}</em>}
                      </div>
                    </SettingsSection>
                  )}
  
                  {(remoteControl.serverUrl || (remoteControl.localNetworkUrls?.length ?? 0) > 0) && (
                    <SettingsSection title="Remote URL">
                      <div className={styles.pairingCode}>
                        <span>Remote URL</span>
                        <strong>{remoteControl.localNetworkUrls?.[0] ?? remoteControl.serverUrl}</strong>
                        {remoteControl.serverUrl && <em>{remoteControl.serverUrl}</em>}
                      </div>
                    </SettingsSection>
                  )}
  
                  <SettingsSection title="Managed Relay">
                    <dl className={styles.detailList}>
                      <div>
                        <dt>Status</dt>
                        <dd>{remoteControl.relay?.enrollmentStatus ?? 'not-configured'}</dd>
                      </div>
                      <div>
                        <dt>Broker</dt>
                        <dd>{remoteControl.relay?.brokerUrl ?? 'Not configured'}</dd>
                      </div>
                      <div>
                        <dt>Account</dt>
                        <dd>{remoteControl.relay?.accountId ?? 'Not configured'}</dd>
                      </div>
                      <div>
                        <dt>Device</dt>
                        <dd>{remoteControl.relay?.deviceId ?? 'Not configured'}</dd>
                      </div>
                    </dl>
                    <p className={styles.mutedText}>Off-network relay control stays disabled until the managed relay implements identity, encryption, token rotation, audit propagation, and emergency revocation.</p>
                  </SettingsSection>
  
                  <SettingsSection title="Approved Devices">
                    <div className={styles.toolCatalog}>
                      {remoteControl.approvedDevices.map(device => (
                        <article className={styles.toolCatalogItem} key={device.id}>
                          <div>
                            <strong>{device.name}</strong>
                            <span>{device.lastSeenAt ? 'Seen recently' : 'Paired'}</span>
                          </div>
                          <p>Paired {new Date(device.createdAt).toLocaleString()}</p>
                          {device.lastSeenAt && <p>Last seen {new Date(device.lastSeenAt).toLocaleString()}</p>}
                          <div className={styles.toolRouterActions}>
                            <button className={styles.dangerButton} type="button" onClick={() => openAutomationDeleteConfirmation(buildRemoteDeviceDeleteTarget(device))}>
                              <Icon name="trash" size={14} />
                              Revoke
                            </button>
                          </div>
                        </article>
                      ))}
                      {remoteControl.approvedDevices.length === 0 && <span className={styles.mutedText}>No approved remote devices.</span>}
                    </div>
                  </SettingsSection>
  
                  <SettingsSection title="Remote Audit Log">
                    <div className={styles.toolCatalog}>
                      {(remoteControl.auditLog ?? []).slice(0, 12).map(event => (
                        <article className={styles.toolCatalogItem} key={event.id}>
                          <div>
                            <strong>{event.message}</strong>
                            <span>{event.type}</span>
                          </div>
                          <p>{new Date(event.createdAt).toLocaleString()}</p>
                          {event.deviceName && <p>Device: {event.deviceName}</p>}
                        </article>
                      ))}
                      {(remoteControl.auditLog ?? []).length === 0 && <span className={styles.mutedText}>No remote-control audit events yet.</span>}
                    </div>
                  </SettingsSection>
                  {automationEditorPanel === 'delete' && automationDeleteTarget?.kind === 'device' && renderAutomationDeleteConfirmation()}
                </>
              )}
  
              {activeSection === 'permissions' && (
                <>
                  <SettingsSection title="Unattended Execution Policy">
                    <p className={styles.mutedText}>Scheduled tasks and supervised virtual teams use these desktop tool policies. Full-access virtual teams skip approval popups but still stay inside workspace and command safety boundaries.</p>
                    <div className={styles.toolRouterActions}>
                      <button className={styles.secondaryButton} type="button" onClick={() => onApplyPermissionPreset('allow-all')}>
                        <Icon name="check" size={14} />
                        Allow All Tools
                      </button>
                      <button className={styles.secondaryButton} type="button" onClick={() => onApplyPermissionPreset('ask-mutating')}>
                        <Icon name="shield" size={14} />
                        Ask Before Changes
                      </button>
                      <button className={styles.dangerButton} type="button" onClick={() => onApplyPermissionPreset('deny-mutating')}>
                        <Icon name="lock" size={14} />
                        Deny Mutating Tools
                      </button>
                    </div>
                  </SettingsSection>
  
                  <SettingsSection title="Key Automation Tools">
                    <div className={styles.toolCatalog}>
                      {AUTOMATION_PERMISSION_TOOLS.map(toolName => {
                        const permission = getToolPermissionPolicy(createPermissionTool(toolName), appConfig);
                        return (
                          <label className={styles.toolPermissionRow} key={toolName}>
                            <span>{toolName}</span>
                            <select value={permission} onChange={event => onSetToolPermission(toolName, event.target.value as ToolPermissionMode)}>
                              <option value="allow">Allow</option>
                              <option value="ask">Ask</option>
                              <option value="deny">Deny</option>
                            </select>
                          </label>
                        );
                      })}
                    </div>
                  </SettingsSection>
                </>
              )}
          </div>
        </div>
      </section>
    );
  }
  
  function RunCommandPanel({
    onRunCommand,
  }: {
    onRunCommand: (command: string, cwd?: string) => void;
  }) {
    const [command, setCommand] = useState('');
    const [cwd, setCwd] = useState('.');
    const helperCommands = [
      { label: 'Git status', command: 'git status --short --branch' },
      { label: 'Git diff', command: 'git diff --stat' },
      { label: 'Branch', command: 'git branch --show-current' },
      { label: 'NPM scripts', command: 'npm run' },
      { label: 'Dev servers', command: 'lsof -iTCP -sTCP:LISTEN -P -n' },
    ];
  
    return (
      <section className={styles.detailPanel}>
        <h3>Run Command</h3>
        <p className={styles.mutedText}>Commands run through `bash.run`, stay inside the workspace, and require approval before execution.</p>
        <div className={styles.commandRunner}>
          <label className={styles.field}>
            <span>Command</span>
            <input value={command} onChange={event => setCommand(event.target.value)} placeholder="npm test" />
          </label>
          <label className={styles.field}>
            <span>Working directory</span>
            <input value={cwd} onChange={event => setCwd(event.target.value)} placeholder="." />
          </label>
          <button className={styles.primaryButton} type="button" onClick={() => onRunCommand(command, cwd)}>
            <Icon name="terminal" size={14} />
            Review Run
          </button>
        </div>
        <div className={styles.toolRouterActions}>
          {helperCommands.map(helper => (
            <button
              className={styles.secondaryButton}
              type="button"
              key={helper.label}
              onClick={() => setCommand(helper.command)}
            >
              <Icon name="terminal" size={14} />
              {helper.label}
            </button>
          ))}
        </div>
      </section>
    );
  }
  
  function PluginSkillPanel({ appConfig }: { appConfig: AppConfig | null }) {
    const pluginDirs = readCliOption(appConfig, 'pluginDirs') || 'Default plugin paths';
    const agentsJson = readCliOption(appConfig, 'agentsJson') || 'Not configured';
    const mcpConfig = readCliOption(appConfig, 'mcpConfig') || 'Default MCP config';
  
    return (
      <section className={styles.detailPanel}>
        <h3>Plugins & Skills</h3>
        <dl className={styles.detailList}>
          <div>
            <dt>Plugin dirs</dt>
            <dd title={pluginDirs}>{pluginDirs}</dd>
          </div>
          <div>
            <dt>Agents JSON</dt>
            <dd title={agentsJson}>{agentsJson}</dd>
          </div>
          <div>
            <dt>MCP config</dt>
            <dd title={mcpConfig}>{mcpConfig}</dd>
          </div>
        </dl>
        <p className={styles.mutedText}>Manage plugin, skill, and MCP paths from Settings. Executable local MCP tools appear in the registry above.</p>
      </section>
    );
  }
  
  

  return {
    projects: ProjectsView,
    tools: ToolsView,
    automation: AutomationView,
    history: HistoryView,
  };
}

const renderer: FeaturePackageRendererModule = defineFeaturePackageRenderer({
  packageId: 'software-developer',
  createContribution(host): FeaturePackageRendererContribution {
    return {
      views: createSoftwareDeveloperRendererViews(host),
      workflowDefaults: {
        getDefaultGoal: getDefaultTeamGoal,
        getDefaultTools: getDefaultTeamTools,
      },
    };
  },
});

export default renderer;
