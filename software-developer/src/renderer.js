import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// @ts-nocheck
/**
 * Software Developer desktop renderer.
 *
 * This implementation lives with the feature package. The core desktop renderer
 * supplies framework UI primitives and service callbacks through the host
 * contract; professional workflow presentation remains package-owned.
 */
import React, { useEffect, useRef, useState } from 'react';
import { getDefaultTeamGoal, getDefaultTeamTools } from './project-defaults';
export function createSoftwareDeveloperRendererViews(host) {
    const { AUTOMATION_PERMISSION_TOOLS, DEFAULT_AUTONOMOUS_ROLES, DEFAULT_EMPLOYEE_PERMISSIONS, DEFAULT_PROJECT_ARTIFACTS, PROJECT_LIST_PAGE_SIZE, TOOL_PERMISSION_OPTIONS, Icon, InlineApprovalQueue, MessageItem, RecordViewToggle, ToolActivityPanel, createDefaultProjectTeams, createProjectReadyMessages, createProjectTeamId, createSoftwareProjectDraft, createVirtualEmployeeProfile, createVirtualRoleDefinition, formatFileSize, formatImageAttachmentSummary, formatProjectOutputSource, formatProjectStatus, getDefaultRoleId, getEmployeeRoleDefinition, getHistoryRecordSummary, getHistoryRecordTitle, getHistoryRecordTypeLabel, getPathBasename, getProjectAssignedEmployees, getProjectAutomationTeamId, getProjectChatKey, getProjectStaffingEmployees, getProjectSupervisor, getProjectTeams, getProviderDefault, getRoleDefinitionById, getTeamMembers, getTeamSupervisor, getToolPermissionPolicy, getToolResultPath, groupMessagesByAssistantRun, groupToolsByCategory, isProjectToolActivity, isReviewForProjectChat, isSupervisorEmployee, isToolExposedToModel, joinWorkspacePath, normalizeStringList, normalizeToolNameList, readCliOption, styles, summarizeProjectGoals, summarizeToolResult } = host;
    function SettingsSection({ title, children, }) {
        return (_jsxs("section", { className: styles.settingsSection, children: [title && _jsx("h3", { children: title }), children] }));
    }
    function WorkbenchEditorPanel({ title, subtitle, children, footer, onClose, wide = false, bodyClassName, }) {
        return (_jsxs("aside", { className: wide ? `${styles.workbenchEditorPanel} ${styles.workbenchEditorPanelWide}` : styles.workbenchEditorPanel, "aria-label": title, children: [_jsxs("div", { className: styles.workbenchEditorHeader, children: [_jsxs("div", { children: [_jsx("h3", { children: title }), subtitle && _jsx("span", { children: subtitle })] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: onClose, title: "Close this panel", children: [_jsx(Icon, { name: "x", size: 14 }), "Close"] })] }), _jsx("div", { className: bodyClassName ? `${styles.workbenchEditorBody} ${bodyClassName}` : styles.workbenchEditorBody, children: children }), footer && (_jsx("div", { className: styles.workbenchEditorFooter, children: footer }))] }));
    }
    function ProjectsView({ activeSection, appInfo, appConfig, appState, activeProviderLabel, activeProviderDefault, viewportSize, tokenUsage, toolActivities, teamRuns, runningProjectIds, currentSessionTitle, sessionCount, projects, activeProjectId, roles, employees, projectTeams, projectChatMessages, fileWriteReviews, commandReviews, toolPermissionReviews, projectGeneratedOutputs, projectChatSendingKeys, workspacePath, workspaceEntries, workspaceBrowserError, workspaceActionMessage, isLoadingWorkspaceEntries, onOpenWorkspaceEntry, onOpenWorkspacePath, onRevealWorkspacePath, onGoToWorkspaceParent, onRefreshWorkspace, mcpServers, mcpTools, onSaveProject, onSaveRole, onDeleteRole, onSaveEmployee, onDeleteEmployee, onSaveTeam, onDeleteTeam, onSelectProject, onSetProjectStatus, onDeleteProject, onSendProjectChat, onResolveFileWrite, onResolveCommand, onResolveToolPermission, onChangeSection, }) {
        const visibleActiveSection = ['studio', 'roles', 'employees', 'teams'].includes(activeSection)
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
        function getProjectLatestRun(project) {
            if (project.mode !== 'autonomous') {
                return undefined;
            }
            const automationTeamId = getProjectAutomationTeamId(project.id);
            return teamRuns
                .filter(run => run.teamId === automationTeamId)
                .sort((left, right) => right.startedAt - left.startedAt)[0];
        }
        function getProjectEffectiveStatus(project) {
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
        const staffedProjectCount = projects.filter(project => (project.mode === 'guided'
            ? project.assignedEmployeeIds.length > 0
            : Boolean(project.supervisorEmployeeId || project.assignedEmployeeIds.length > 0 || project.assignedTeamIds.length > 0))).length;
        const deliverableCount = projects.reduce((total, project) => total + project.artifacts.length, 0);
        const projectModeMetrics = [
            { label: 'Standard', value: guidedProjects.length, className: styles.projectMetricGuided },
            { label: 'Fully autonomous', value: autonomousProjects.length, className: styles.projectMetricAutonomous },
        ];
        const projectStatusMetrics = [
            ['Active', 'active', styles.projectMetricActive],
            ['Planning', 'planning', styles.projectMetricPlanning],
            ['Blocked', 'blocked', styles.projectMetricBlocked],
            ['Stopped', 'stopped', styles.projectMetricStopped],
            ['Done', 'done', styles.projectMetricDone],
            ['Idea', 'idea', styles.projectMetricIdea],
        ].map(([label, status, className]) => ({
            label,
            value: projects.filter(project => getProjectEffectiveStatus(project) === status).length,
            className,
        }));
        const projectStaffingMetrics = [
            { label: 'Staffed', value: staffedProjectCount, className: styles.projectMetricStaffed },
            { label: 'Needs staffing', value: Math.max(0, projects.length - staffedProjectCount), className: styles.projectMetricNeedsStaffing },
        ];
        const [draft, setDraft] = useState(() => createSoftwareProjectDraft(appInfo?.workspacePath));
        const [roleDraft, setRoleDraft] = useState(() => createVirtualRoleDefinition('Developer'));
        const [employeeDraft, setEmployeeDraft] = useState(() => createVirtualEmployeeProfile('Developer'));
        const [teamDraft, setTeamDraft] = useState(() => createDefaultProjectTeams()[0]);
        const [profileEmployeeId, setProfileEmployeeId] = useState('');
        const [projectEditorPanel, setProjectEditorPanel] = useState(null);
        const [projectDeleteTarget, setProjectDeleteTarget] = useState(null);
        const [projectActionProjectId, setProjectActionProjectId] = useState('');
        const [projectChatDrafts, setProjectChatDrafts] = useState({});
        const [activityRunSelections, setActivityRunSelections] = useState({});
        const [copiedProjectMessageId, setCopiedProjectMessageId] = useState(null);
        const [projectPortfolioView, setProjectPortfolioView] = useState('table');
        const [roleListView, setRoleListView] = useState('table');
        const [employeeListView, setEmployeeListView] = useState('table');
        const [teamListView, setTeamListView] = useState('table');
        const [projectPage, setProjectPage] = useState(1);
        const projectPageCount = Math.max(1, Math.ceil(projects.length / PROJECT_LIST_PAGE_SIZE));
        const normalizedProjectPage = Math.min(projectPage, projectPageCount);
        const projectPageStartIndex = (normalizedProjectPage - 1) * PROJECT_LIST_PAGE_SIZE;
        const visibleProjects = projects.slice(projectPageStartIndex, projectPageStartIndex + PROJECT_LIST_PAGE_SIZE);
        const projectPageFirstRecord = projects.length === 0 ? 0 : projectPageStartIndex + 1;
        const projectPageLastRecord = Math.min(projectPageStartIndex + PROJECT_LIST_PAGE_SIZE, projects.length);
        const projectChatTranscriptRef = useRef(null);
        const profileEmployee = employees.find(employee => employee.id === profileEmployeeId);
        const projectActionProject = projects.find(project => project.id === projectActionProjectId)
            ?? selectedProject;
        const projectWidePanels = [
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
        function editProject(project) {
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
        function updateDraft(update) {
            setDraft(current => ({
                ...current,
                ...update,
                updatedAt: Date.now(),
            }));
        }
        function saveDraft() {
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
        function openProjectDeleteConfirmation(target) {
            setProfileEmployeeId('');
            setProjectActionProjectId(target.kind === 'project' ? target.id : '');
            setProjectDeleteTarget(target);
            setProjectEditorPanel('delete');
        }
        function openProjectActionPanel(project, panel) {
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
            }
            else if (projectDeleteTarget.kind === 'role') {
                onDeleteRole(projectDeleteTarget.id);
            }
            else if (projectDeleteTarget.kind === 'employee') {
                onDeleteEmployee(projectDeleteTarget.id);
            }
            else if (projectDeleteTarget.kind === 'team') {
                onDeleteTeam(projectDeleteTarget.id);
            }
            closeProjectEditorPanel();
        }
        function openNewRoleEditor() {
            setRoleDraft(createVirtualRoleDefinition('Developer'));
            setProjectDeleteTarget(null);
            setProjectEditorPanel('role');
        }
        function openRoleEditor(role) {
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
        function openEmployeeEditor(employee) {
            setEmployeeDraft({
                ...employee,
                permissions: [...employee.permissions],
            });
            setProjectDeleteTarget(null);
            setProjectEditorPanel('employee');
        }
        function openEmployeeProfile(employeeId) {
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
        function openProjectTeamEditor(team) {
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
        function selectEmployeeRole(roleId) {
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
        function selectTeamSupervisor(employeeId) {
            setTeamDraft(current => ({
                ...current,
                supervisorEmployeeId: employeeId,
                memberEmployeeIds: current.memberEmployeeIds.filter(id => id !== employeeId),
                updatedAt: Date.now(),
            }));
        }
        function toggleTeamMember(employeeId) {
            setTeamDraft(current => {
                const members = new Set(current.memberEmployeeIds);
                if (members.has(employeeId)) {
                    members.delete(employeeId);
                }
                else {
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
        function toggleDraftEmployee(employeeId) {
            setDraft(current => {
                const assigned = new Set(current.assignedEmployeeIds);
                if (assigned.has(employeeId)) {
                    assigned.delete(employeeId);
                }
                else {
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
        function selectDraftSupervisor(employeeId) {
            const supervisor = employees.find(employee => employee.id === employeeId);
            updateDraft({
                supervisorEmployeeId: employeeId,
                supervisorRole: supervisor ? getEmployeeRoleDefinition(supervisor, roles)?.title ?? supervisor.role : 'Supervisor',
                assignedEmployeeIds: draft.assignedEmployeeIds.filter(id => id !== employeeId),
            });
        }
        function toggleDraftTeam(teamId) {
            setDraft(current => {
                const assigned = new Set(current.assignedTeamIds);
                if (assigned.has(teamId)) {
                    assigned.delete(teamId);
                }
                else {
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
        function buildProjectDeleteTarget(project) {
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
        function buildRoleDeleteTarget(role) {
            const affectedEmployees = employees.filter(employee => (employee.roleId === role.id || employee.role.toLowerCase() === role.title.toLowerCase()));
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
        function buildEmployeeDeleteTarget(employee) {
            const assignedProjects = projects.filter(project => (project.supervisorEmployeeId === employee.id || project.assignedEmployeeIds.includes(employee.id)));
            const assignedTeams = projectTeams.filter(team => (team.supervisorEmployeeId === employee.id || team.memberEmployeeIds.includes(employee.id)));
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
        function buildProjectTeamDeleteTarget(team) {
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
        function renderRoleRow(role) {
            const assignedEmployees = employees.filter(employee => (employee.roleId === role.id || employee.role.toLowerCase() === role.title.toLowerCase()));
            const summary = `${role.responsibilities.length} responsibilities / ${role.defaultTools.length} tools`;
            return (_jsxs("article", { className: styles.workbenchRecordRow, children: [_jsxs("div", { className: styles.workbenchRecordPrimary, children: [_jsx("strong", { children: role.title }), _jsxs("span", { children: [assignedEmployees.length, " employee profile(s)"] })] }), _jsx("span", { className: styles.workbenchRecordCell, children: role.canSupervise ? 'Supervisor-capable' : 'Contributor' }), _jsx("span", { className: styles.workbenchRecordCell, title: role.defaultGoal, children: role.defaultGoal }), _jsx("span", { className: styles.workbenchRecordCell, children: summary }), _jsxs("div", { className: styles.workbenchRecordActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openRoleEditor(role), title: `Edit role ${role.title}`, children: [_jsx(Icon, { name: "edit", size: 14 }), "Edit"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openProjectDeleteConfirmation(buildRoleDeleteTarget(role)), disabled: roles.length <= 1, title: `Delete role ${role.title}`, children: [_jsx(Icon, { name: "trash", size: 14 }), "Delete"] })] })] }, role.id));
        }
        function renderRoleCard(role) {
            const assignedEmployees = employees.filter(employee => (employee.roleId === role.id || employee.role.toLowerCase() === role.title.toLowerCase()));
            const summary = `${role.responsibilities.length} responsibilities / ${role.defaultTools.length} tools`;
            return (_jsxs("article", { className: styles.projectCard, children: [_jsx("div", { className: styles.projectCardHeader, children: _jsxs("div", { children: [_jsx("strong", { children: role.title }), _jsxs("span", { children: [assignedEmployees.length, " employee profile(s)"] })] }) }), _jsx("p", { title: role.defaultGoal, children: role.defaultGoal }), _jsxs("dl", { className: styles.projectCardMeta, children: [_jsxs("div", { children: [_jsx("dt", { children: "Scope" }), _jsx("dd", { children: role.canSupervise ? 'Supervisor-capable' : 'Contributor' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Definition" }), _jsx("dd", { children: summary })] })] }), _jsxs("div", { className: styles.projectChipList, children: [role.responsibilities.slice(0, 4).map(responsibility => (_jsx("span", { className: styles.projectChip, children: responsibility }, responsibility))), role.responsibilities.length > 4 && _jsxs("span", { className: styles.projectChip, children: ["+", role.responsibilities.length - 4] })] }), _jsxs("div", { className: styles.projectCardActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openRoleEditor(role), title: `Edit role ${role.title}`, children: [_jsx(Icon, { name: "edit", size: 14 }), "Edit"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openProjectDeleteConfirmation(buildRoleDeleteTarget(role)), disabled: roles.length <= 1, title: `Delete role ${role.title}`, children: [_jsx(Icon, { name: "trash", size: 14 }), "Delete"] })] })] }, role.id));
        }
        function renderEmployeeRow(employee) {
            const role = getEmployeeRoleDefinition(employee, roles);
            const teamsForEmployee = projectTeams.filter(team => (team.supervisorEmployeeId === employee.id || team.memberEmployeeIds.includes(employee.id)));
            const projectsForEmployee = projects.filter(project => (project.supervisorEmployeeId === employee.id ||
                project.assignedEmployeeIds.includes(employee.id) ||
                getProjectTeams(project, projectTeams).some(team => (team.supervisorEmployeeId === employee.id || team.memberEmployeeIds.includes(employee.id)))));
            const activeWork = employee.currentTask || role?.defaultGoal || 'No current task';
            return (_jsxs("article", { className: styles.workbenchRecordRow, children: [_jsxs("div", { className: styles.workbenchRecordPrimary, children: [_jsx("strong", { children: employee.name }), _jsxs("span", { children: [projectsForEmployee.length, " project(s) / ", teamsForEmployee.length, " team(s)"] })] }), _jsx("span", { className: styles.workbenchRecordCell, title: role?.title ?? employee.role, children: role?.title ?? employee.role }), _jsxs("span", { className: styles.workbenchRecordCell, children: [employee.status, " / ", employee.model] }), _jsx("span", { className: styles.workbenchRecordCell, title: activeWork, children: activeWork }), _jsxs("div", { className: `${styles.workbenchRecordActions} ${styles.workbenchRecordActionsWide}`, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openEmployeeProfile(employee.id), title: `View profile for ${employee.name}`, children: [_jsx(Icon, { name: "user", size: 14 }), "Profile"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openEmployeeEditor(employee), title: `Edit employee ${employee.name}`, children: [_jsx(Icon, { name: "edit", size: 14 }), "Edit"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openProjectDeleteConfirmation(buildEmployeeDeleteTarget(employee)), title: `Delete employee ${employee.name}`, children: [_jsx(Icon, { name: "trash", size: 14 }), "Delete"] })] })] }, employee.id));
        }
        function renderEmployeeCard(employee, options = {}) {
            const role = getEmployeeRoleDefinition(employee, roles);
            return (_jsxs("article", { className: styles.employeeCard, children: [_jsxs("div", { className: styles.employeeCardHeader, children: [_jsx("span", { className: styles.employeeAvatar, children: employee.name.slice(0, 2).toUpperCase() }), _jsxs("div", { children: [_jsx("strong", { children: employee.name }), _jsxs("span", { children: [role?.title ?? employee.role, " / ", employee.status] })] })] }), !options.compact && _jsx("p", { children: role?.defaultGoal ?? employee.currentTask }), _jsx("div", { className: styles.projectChipList, children: (role?.responsibilities ?? employee.permissions).slice(0, 4).map(responsibility => (_jsx("span", { className: styles.projectChip, children: responsibility }, responsibility))) })] }, employee.id));
        }
        function renderEmployeeManagementCard(employee) {
            const role = getEmployeeRoleDefinition(employee, roles);
            const teamsForEmployee = projectTeams.filter(team => (team.supervisorEmployeeId === employee.id || team.memberEmployeeIds.includes(employee.id)));
            const projectsForEmployee = projects.filter(project => (project.supervisorEmployeeId === employee.id ||
                project.assignedEmployeeIds.includes(employee.id) ||
                getProjectTeams(project, projectTeams).some(team => (team.supervisorEmployeeId === employee.id || team.memberEmployeeIds.includes(employee.id)))));
            const activeWork = employee.currentTask || role?.defaultGoal || 'No current task';
            return (_jsxs("article", { className: styles.projectCard, children: [_jsxs("div", { className: styles.employeeCardHeader, children: [_jsx("span", { className: styles.employeeAvatar, children: employee.name.slice(0, 2).toUpperCase() }), _jsxs("div", { children: [_jsx("strong", { children: employee.name }), _jsxs("span", { children: [role?.title ?? employee.role, " / ", employee.status] })] })] }), _jsx("p", { title: activeWork, children: activeWork }), _jsxs("dl", { className: styles.projectCardMeta, children: [_jsxs("div", { children: [_jsx("dt", { children: "Assignments" }), _jsxs("dd", { children: [projectsForEmployee.length, " project(s), ", teamsForEmployee.length, " team(s)"] })] }), _jsxs("div", { children: [_jsx("dt", { children: "Model" }), _jsx("dd", { children: employee.model })] })] }), _jsx("div", { className: styles.projectChipList, children: (role?.responsibilities ?? employee.permissions).slice(0, 4).map(responsibility => (_jsx("span", { className: styles.projectChip, children: responsibility }, responsibility))) }), _jsxs("div", { className: styles.projectCardActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openEmployeeProfile(employee.id), title: `View profile for ${employee.name}`, children: [_jsx(Icon, { name: "user", size: 14 }), "Profile"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openEmployeeEditor(employee), title: `Edit employee ${employee.name}`, children: [_jsx(Icon, { name: "edit", size: 14 }), "Edit"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openProjectDeleteConfirmation(buildEmployeeDeleteTarget(employee)), title: `Delete employee ${employee.name}`, children: [_jsx(Icon, { name: "trash", size: 14 }), "Delete"] })] })] }, employee.id));
        }
        function renderEmployeeProfile(employee) {
            const role = getEmployeeRoleDefinition(employee, roles);
            const teamsForEmployee = projectTeams.filter(team => (team.supervisorEmployeeId === employee.id || team.memberEmployeeIds.includes(employee.id)));
            const projectsForEmployee = projects.filter(project => (project.supervisorEmployeeId === employee.id ||
                project.assignedEmployeeIds.includes(employee.id) ||
                getProjectTeams(project, projectTeams).some(team => (team.supervisorEmployeeId === employee.id || team.memberEmployeeIds.includes(employee.id)))));
            return (_jsxs(_Fragment, { children: [_jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Model" }), _jsx("dd", { children: employee.model })] }), _jsxs("div", { children: [_jsx("dt", { children: "Teams" }), _jsx("dd", { children: teamsForEmployee.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "Projects" }), _jsx("dd", { children: projectsForEmployee.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "Current task" }), _jsx("dd", { children: employee.currentTask })] })] }), _jsx("div", { className: styles.projectChipList, children: (role?.responsibilities ?? employee.permissions).map(item => (_jsx("span", { className: styles.projectChip, children: item }, item))) })] }));
        }
        function renderProjectTeamRow(team) {
            const supervisor = getTeamSupervisor(team, employees);
            const members = getTeamMembers(team, employees);
            const assignedProjects = projects.filter(project => project.assignedTeamIds.includes(team.id));
            return (_jsxs("article", { className: styles.workbenchRecordRow, children: [_jsxs("div", { className: styles.workbenchRecordPrimary, children: [_jsx("strong", { children: team.name }), _jsxs("span", { children: [assignedProjects.length, " assigned project(s)"] })] }), _jsx("span", { className: styles.workbenchRecordCell, title: supervisor?.name ?? 'Unassigned', children: supervisor?.name ?? 'Unassigned' }), _jsxs("span", { className: styles.workbenchRecordCell, children: [members.length, " member(s)"] }), _jsx("span", { className: styles.workbenchRecordCell, title: team.mission, children: team.mission }), _jsxs("div", { className: styles.workbenchRecordActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openProjectTeamEditor(team), title: `Edit team ${team.name}`, children: [_jsx(Icon, { name: "edit", size: 14 }), "Edit"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openProjectDeleteConfirmation(buildProjectTeamDeleteTarget(team)), title: `Delete team ${team.name}`, children: [_jsx(Icon, { name: "trash", size: 14 }), "Delete"] })] })] }, team.id));
        }
        function renderProjectTeamCard(team, options = {}) {
            const supervisor = getTeamSupervisor(team, employees);
            const members = getTeamMembers(team, employees);
            return (_jsxs("article", { className: styles.employeeCard, children: [_jsxs("div", { className: styles.employeeCardHeader, children: [_jsx("span", { className: styles.employeeAvatar, children: team.name.slice(0, 2).toUpperCase() }), _jsxs("div", { children: [_jsx("strong", { children: team.name }), _jsxs("span", { children: ["Supervisor: ", supervisor?.name ?? 'Unassigned'] })] })] }), _jsx("p", { children: team.mission }), _jsxs("div", { className: styles.projectChipList, children: [members.slice(0, options.compact ? 3 : 6).map(member => (_jsx("span", { className: styles.projectChip, children: member.name }, member.id))), members.length === 0 && _jsx("span", { className: styles.projectChip, children: "No members" })] })] }, team.id));
        }
        function renderProjectTeamManagementCard(team) {
            const supervisor = getTeamSupervisor(team, employees);
            const members = getTeamMembers(team, employees);
            const assignedProjects = projects.filter(project => project.assignedTeamIds.includes(team.id));
            return (_jsxs("article", { className: styles.projectCard, children: [_jsx("div", { className: styles.projectCardHeader, children: _jsxs("div", { children: [_jsx("strong", { children: team.name }), _jsxs("span", { children: [assignedProjects.length, " assigned project(s)"] })] }) }), _jsx("p", { title: team.mission, children: team.mission }), _jsxs("dl", { className: styles.projectCardMeta, children: [_jsxs("div", { children: [_jsx("dt", { children: "Supervisor" }), _jsx("dd", { children: supervisor?.name ?? 'Unassigned' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Members" }), _jsxs("dd", { children: [members.length, " member(s)"] })] })] }), _jsxs("div", { className: styles.projectChipList, children: [members.slice(0, 6).map(member => (_jsx("span", { className: styles.projectChip, children: member.name }, member.id))), members.length === 0 && _jsx("span", { className: styles.projectChip, children: "No members" })] }), _jsxs("div", { className: styles.projectCardActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openProjectTeamEditor(team), title: `Edit team ${team.name}`, children: [_jsx(Icon, { name: "edit", size: 14 }), "Edit"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openProjectDeleteConfirmation(buildProjectTeamDeleteTarget(team)), title: `Delete team ${team.name}`, children: [_jsx(Icon, { name: "trash", size: 14 }), "Delete"] })] })] }, team.id));
        }
        function getBoardTasks(project) {
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
        function renderTaskBoard(project) {
            const tasks = getBoardTasks(project);
            const columns = [
                { id: 'todo', title: 'Todo' },
                { id: 'doing', title: 'Doing' },
                { id: 'review', title: 'Review' },
                { id: 'done', title: 'Done' },
            ];
            return (_jsx("div", { className: styles.projectBoard, children: columns.map(column => {
                    const columnTasks = tasks.filter(task => task.status === column.id);
                    return (_jsxs("section", { className: styles.projectBoardColumn, children: [_jsxs("div", { className: styles.projectBoardColumnHeader, children: [_jsx("strong", { children: column.title }), _jsx("span", { children: columnTasks.length })] }), columnTasks.map(task => (_jsxs("article", { className: styles.projectTaskCard, children: [_jsx("strong", { children: task.title }), _jsxs("span", { children: [task.employee?.name ?? 'Unassigned', " / ", task.employee ? getEmployeeRoleDefinition(task.employee, roles)?.title ?? task.employee.role : 'Contributor'] }), 'detail' in task && typeof task.detail === 'string' && task.detail && _jsx("span", { children: task.detail })] }, `${column.id}-${task.title}`)))] }, column.id));
                }) }));
        }
        function renderTeamChat(project) {
            const supervisor = getProjectSupervisor(project, employees, roles);
            const assignedTeams = getProjectTeams(project, projectTeams);
            const assigned = getProjectStaffingEmployees(project, employees, roles, projectTeams)
                .filter(employee => employee.id !== supervisor?.id);
            const chatEmployees = [supervisor, ...assigned].filter((employee) => Boolean(employee));
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
            return (_jsxs("div", { className: styles.projectChatList, children: [messages.map((message, index) => (_jsxs("article", { className: styles.projectChatMessage, children: [_jsx("span", { className: styles.employeeAvatar, children: message.author?.name.slice(0, 2).toUpperCase() ?? 'CA' }), _jsxs("div", { children: [_jsx("strong", { children: message.author?.name ?? 'CodeAgent' }), _jsx("p", { children: message.text })] })] }, `${message.author?.id ?? 'system'}-${index}`))), chatEmployees.length === 0 && _jsx("span", { className: styles.mutedText, children: "Assign employees to start team chat." })] }));
        }
        function renderDeliverables(project) {
            const latestRun = getProjectLatestRun(project);
            const effectiveStatus = getProjectEffectiveStatus(project);
            const projectRootPath = project.workspacePath ?? appInfo?.workspacePath ?? workspacePath;
            const projectAutomationTeamId = getProjectAutomationTeamId(project.id);
            function resolveDeliverablePath(targetPath) {
                if (!targetPath.trim()) {
                    return projectRootPath;
                }
                return targetPath.startsWith('/')
                    ? targetPath
                    : joinWorkspacePath(projectRootPath, targetPath);
            }
            function getExpectedArtifactPath(artifact, index) {
                const slug = artifact.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `artifact-${index + 1}`;
                return `artifacts/${slug}.md`;
            }
            function renderDeliverableActions(targetPath, label = 'Open') {
                const resolvedPath = resolveDeliverablePath(targetPath);
                return (_jsxs("div", { className: styles.projectDeliverableActions, children: [_jsxs("button", { className: styles.textButton, type: "button", onClick: () => onOpenWorkspacePath(resolvedPath), title: `Open ${resolvedPath}`, children: [_jsx(Icon, { name: "external", size: 13 }), label] }), _jsxs("button", { className: styles.textButton, type: "button", onClick: () => onRevealWorkspacePath(resolvedPath), title: `Reveal ${resolvedPath}`, children: [_jsx(Icon, { name: "folder-open", size: 13 }), "Reveal"] })] }));
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
                .map((activity) => {
                const outputPath = getToolResultPath(activity);
                if (!outputPath) {
                    return null;
                }
                const absolutePath = activity.result && typeof activity.result === 'object' && typeof activity.result.absolutePath === 'string'
                    ? String(activity.result.absolutePath)
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
                .filter((output) => Boolean(output));
            const generatedOutputs = [
                ...(projectGeneratedOutputs[project.id] ?? []),
                ...activityOutputs,
            ].reduce((outputs, output) => {
                if (!outputs.some(candidate => (candidate.id === output.id ||
                    candidate.path === output.path ||
                    Boolean(candidate.absolutePath && output.absolutePath && candidate.absolutePath === output.absolutePath)))) {
                    outputs.push(output);
                }
                return outputs;
            }, []).sort((left, right) => right.updatedAt - left.updatedAt);
            return (_jsxs("div", { className: styles.projectDeliverables, children: [generatedOutputs.length > 0 && (_jsxs("div", { className: styles.projectDeliverableGroupHeader, children: [_jsx("strong", { children: "Generated files" }), _jsxs("span", { children: [generatedOutputs.length, " tracked output", generatedOutputs.length === 1 ? '' : 's'] })] })), generatedOutputs.map(output => (_jsxs("article", { className: styles.projectDeliverableCard, children: [_jsxs("div", { children: [_jsx("strong", { title: output.absolutePath ?? output.path, children: output.path }), _jsx("span", { children: formatProjectOutputSource(output.source) })] }), _jsx("p", { children: output.summary || `${output.toolName} at ${new Date(output.updatedAt).toLocaleString()}` }), renderDeliverableActions(output.absolutePath ?? output.path, 'Open file')] }, `generated-${output.id}`))), latestRun?.artifactPath && (_jsxs("article", { className: styles.projectDeliverableCard, children: [_jsxs("div", { children: [_jsx("strong", { children: "Automation run artifact" }), _jsx("span", { children: latestRun.status === 'succeeded' ? 'Completed' : latestRun.status })] }), _jsx("p", { children: latestRun.artifactPath }), renderDeliverableActions(latestRun.artifactPath, 'Open artifact')] })), project.artifacts.map((artifact, index) => (_jsxs("article", { className: styles.projectDeliverableCard, children: [_jsxs("div", { children: [_jsx("strong", { children: artifact }), _jsx("span", { children: effectiveStatus === 'done' ? 'Completed' : index < 2 ? 'Draft planned' : 'Queued' })] }), _jsx("p", { children: effectiveStatus === 'done'
                                    ? latestRun?.summary ?? 'Completed by the latest autonomous project run.'
                                    : index < 2 ? 'Ready to be produced by the assigned team.' : 'Will be generated after upstream work completes.' }), effectiveStatus === 'done' && renderDeliverableActions(getExpectedArtifactPath(artifact, index), 'Open expected file')] }, artifact))), assignmentOutputs.map(output => (_jsxs("article", { className: styles.projectDeliverableCard, children: [_jsxs("div", { children: [_jsx("strong", { children: output.title }), _jsx("span", { children: output.status })] }), _jsx("p", { children: output.detail }), output.workspacePath && renderDeliverableActions(output.workspacePath, 'Open workspace')] }, `assignment-${output.title}`))), project.artifacts.length === 0 && generatedOutputs.length === 0 && assignmentOutputs.length === 0 && !latestRun?.artifactPath && (_jsx("span", { className: styles.mutedText, children: "No deliverables or run artifacts recorded yet." }))] }));
        }
        function getProjectPanelMessages(project, channel) {
            const projectChatKey = getProjectChatKey(project.id, channel);
            return projectChatMessages[projectChatKey] ?? createProjectReadyMessages(project, channel);
        }
        function updateProjectChatDraft(project, channel, value) {
            const projectChatKey = getProjectChatKey(project.id, channel);
            setProjectChatDrafts(current => ({
                ...current,
                [projectChatKey]: value,
            }));
        }
        function submitProjectChatDraft(project, channel) {
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
        function handleProjectChatKeyDown(event, project, channel) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submitProjectChatDraft(project, channel);
            }
        }
        async function copyProjectMessage(message) {
            try {
                const imageSummary = formatImageAttachmentSummary(message.imageAttachments ?? []);
                await navigator.clipboard.writeText(imageSummary ? `${message.content}\n\nAttached images: ${imageSummary}` : message.content);
                setCopiedProjectMessageId(message.id);
                window.setTimeout(() => setCopiedProjectMessageId(null), 1500);
            }
            catch {
                // Copy feedback is non-critical in the project side panel.
            }
        }
        function renderProjectChatSurface(project, channel) {
            const projectChatKey = getProjectChatKey(project.id, channel);
            const panelMessages = getProjectPanelMessages(project, channel);
            const draftValue = projectChatDrafts[projectChatKey] ?? '';
            const isProjectSending = projectChatSendingKeys.has(projectChatKey);
            const scopedFileWriteReviews = fileWriteReviews.filter(review => isReviewForProjectChat(review, project.id, channel));
            const scopedCommandReviews = commandReviews.filter(review => isReviewForProjectChat(review, project.id, channel));
            const scopedToolPermissionReviews = toolPermissionReviews.filter(review => isReviewForProjectChat(review, project.id, channel));
            return (_jsxs("section", { className: styles.projectChatSurface, children: [_jsxs("div", { className: styles.projectChatTranscript, ref: projectChatTranscriptRef, children: [groupMessagesByAssistantRun(panelMessages).map(({ message, activities }) => (_jsx(MessageItem, { message: message, activities: activities, copied: copiedProjectMessageId === message.id, onCopy: () => copyProjectMessage(message) }, message.id))), _jsx(InlineApprovalQueue, { fileWriteReviews: scopedFileWriteReviews, commandReviews: scopedCommandReviews, toolPermissionReviews: scopedToolPermissionReviews, onResolveFileWrite: onResolveFileWrite, onResolveCommand: onResolveCommand, onResolveToolPermission: onResolveToolPermission }), isProjectSending && (_jsxs("div", { className: styles.typingIndicator, role: "status", children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {})] }))] }), _jsxs("form", { className: styles.projectChatComposer, onSubmit: event => {
                            event.preventDefault();
                            submitProjectChatDraft(project, channel);
                        }, children: [_jsx("textarea", { value: draftValue, onChange: event => updateProjectChatDraft(project, channel, event.target.value), onKeyDown: event => handleProjectChatKeyDown(event, project, channel), placeholder: channel === 'team' ? 'Direct the supervisor or team…' : 'Ask about this project…', rows: 2, disabled: isProjectSending, "aria-label": channel === 'team' ? 'Team chat message' : 'Project chat message' }), _jsxs("div", { className: styles.composerToolbar, children: [_jsxs("div", { className: styles.composerMeta, children: [_jsxs("span", { className: styles.projectComposerIdentity, title: channel === 'team'
                                                    ? 'Instructions are handled by this autonomous project’s supervisor and team'
                                                    : 'This agent can use tools within the project working folder', children: [_jsx(Icon, { name: channel === 'team' ? 'network' : 'bot', size: 13 }), channel === 'team' ? 'Project supervisor' : 'Project agent'] }), _jsxs("label", { className: styles.projectComposerPermission, title: "Permission level for this project", children: [_jsx(Icon, { name: "lock", size: 12 }), _jsx("span", { className: styles.visuallyHidden, children: "Project permissions" }), _jsxs("select", { value: project.permissionMode, onChange: event => onSaveProject({
                                                            ...project,
                                                            permissionMode: event.target.value,
                                                            updatedAt: Date.now(),
                                                        }), disabled: isProjectSending, "aria-label": "Project permissions", children: [_jsx("option", { value: "supervised", children: "Ask for risky actions" }), _jsx("option", { value: "full-access", children: "Full project access" })] })] }), _jsx("span", { title: project.workspacePath, children: getPathBasename(project.workspacePath) })] }), _jsxs("div", { className: styles.composerActions, children: [draftValue && (_jsx("button", { className: styles.composerClearButton, type: "button", onClick: () => updateProjectChatDraft(project, channel, ''), disabled: isProjectSending, title: "Clear the draft message", children: "Clear input" })), _jsxs("button", { className: styles.primaryButton, type: "submit", disabled: isProjectSending || !draftValue.trim(), title: "Send this project message (Command+Enter)", children: [_jsx(Icon, { name: "send", size: 14 }), "Send", _jsx("kbd", { children: "\u2318\u21B5" })] })] })] })] })] }));
        }
        function renderAutonomousProjectSelector() {
            if (autonomousProjects.length === 0) {
                return _jsx("span", { className: styles.mutedText, children: "Create an autonomous project before using this view." });
            }
            return (_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Autonomous project" }), _jsx("select", { value: selectedAutonomousProject?.id ?? '', onChange: event => onSelectProject(event.target.value), children: autonomousProjects.map(project => (_jsx("option", { value: project.id, children: project.name }, project.id))) })] }));
        }
        function renderProjectSelector() {
            if (projects.length === 0) {
                return _jsx("span", { className: styles.mutedText, children: "Create a project before using this view." });
            }
            return (_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Project" }), _jsx("select", { value: selectedProject?.id ?? '', onChange: event => onSelectProject(event.target.value), children: projects.map(project => (_jsxs("option", { value: project.id, children: [project.name, " / ", project.mode === 'autonomous' ? 'autonomous' : 'guided'] }, project.id))) })] }));
        }
        function renderProjectInsights(project) {
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
            ].filter((item) => Boolean(item));
            const signals = [
                { title: 'Staffing', detail: `${assignedTeams.length} team(s), ${assignedStaff.length} total employee(s)` },
                { title: 'Delivery shape', detail: `${project.artifacts.length} artifact(s), ${getBoardTasks(project).length} planned task(s)` },
                { title: 'Execution posture', detail: project.permissionMode === 'full-access' ? 'Supervisor has full project permission' : 'Risky actions require approval' },
            ];
            return (_jsxs("div", { className: styles.detailGrid, children: [_jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Risk Signals" }), _jsxs("div", { className: styles.projectDeliverables, children: [risks.map(risk => (_jsxs("article", { className: styles.projectDeliverableCard, children: [_jsxs("div", { children: [_jsx("strong", { children: risk.title }), _jsx("span", { children: risk.level })] }), _jsx("p", { children: risk.detail })] }, risk.title))), risks.length === 0 && _jsx("span", { className: styles.mutedText, children: "No immediate project risks detected." })] })] }), _jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Operational Signals" }), _jsx("div", { className: styles.projectDeliverables, children: signals.map(signal => (_jsxs("article", { className: styles.projectDeliverableCard, children: [_jsxs("div", { children: [_jsx("strong", { children: signal.title }), _jsx("span", { children: formatProjectStatus(effectiveStatus) })] }), _jsx("p", { children: signal.detail })] }, signal.title))) })] })] }));
        }
        function renderExecutionConsole(project) {
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
            const activityEntries = [];
            const pushActivity = (entry) => {
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
            return (_jsxs("section", { className: styles.detailPanel, children: [_jsxs("div", { className: styles.panelHeader, children: [_jsxs("div", { children: [_jsx("h3", { children: "Activity Timeline" }), _jsx("span", { children: visibleRun
                                            ? `${visibleRun.id === latestRun?.id ? 'Current run' : 'Past run'}: ${visibleRun.status} / ${projectToolActivities.length} tool call(s)`
                                            : 'No automation run yet' })] }), projectRunRecords.length > 0 && (_jsxs("label", { className: styles.activityRunPicker, children: [_jsx("span", { children: "Run" }), _jsx("select", { value: visibleRun?.id ?? '', onChange: event => setActivityRunSelections(current => ({
                                            ...current,
                                            [project.id]: event.target.value,
                                        })), children: projectRunRecords.map((run, index) => (_jsxs("option", { value: run.id, children: [index === 0 ? 'Current' : 'Past', " / ", run.status, " / ", new Date(run.startedAt).toLocaleString()] }, run.id))) })] }))] }), _jsxs("div", { className: styles.projectTimeline, children: [timelineEntries.map(entry => (_jsxs("article", { className: styles.projectTimelineItem, children: [_jsx("div", { className: styles.projectTimelineMarker }), _jsxs("div", { className: styles.projectTimelineContent, children: [_jsxs("div", { className: styles.projectTimelineContentHeader, children: [_jsx("strong", { children: entry.title }), _jsx("time", { dateTime: new Date(entry.timestamp).toISOString(), children: new Date(entry.timestamp).toLocaleString() })] }), _jsx("span", { children: entry.employee }), _jsx("p", { children: entry.summary }), _jsx("em", { children: entry.status })] })] }, entry.id))), timelineEntries.length === 0 && (_jsx("span", { className: styles.mutedText, children: isProjectRunning ? 'Automation run is starting.' : 'No activity recorded for this project yet.' }))] })] }));
        }
        function renderArtifactsExplorer(project) {
            return (_jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Artifact Explorer" }), _jsxs("div", { className: styles.projectDeliverables, children: [project.artifacts.map((artifact, index) => {
                                const slug = artifact.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `artifact-${index + 1}`;
                                return (_jsxs("article", { className: styles.projectDeliverableCard, children: [_jsxs("div", { children: [_jsx("strong", { children: artifact }), _jsx("span", { children: index < 2 ? 'Planned' : 'Queued' })] }), _jsx("p", { children: `artifacts/${slug}.md` })] }, artifact));
                            }), project.artifacts.length === 0 && _jsx("span", { className: styles.mutedText, children: "No artifacts defined." })] })] }));
        }
        function renderProjectTimeline(project) {
            const tasks = getBoardTasks(project);
            return (_jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Timeline" }), _jsx("div", { className: styles.projectDeliverables, children: tasks.map((task, index) => (_jsxs("article", { className: styles.projectDeliverableCard, children: [_jsxs("div", { children: [_jsx("strong", { children: task.title }), _jsx("span", { children: task.status })] }), _jsx("p", { children: task.employee ? `${task.employee.name} / ${getEmployeeRoleDefinition(task.employee, roles)?.title ?? task.employee.role}` : 'Unassigned' })] }, `${task.title}-${index}`))) })] }));
        }
        function renderGovernance(project) {
            const projectSupervisor = getProjectSupervisor(project, employees, roles);
            return (_jsxs("div", { className: styles.detailGrid, children: [_jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Approval Policy" }), _jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Mode" }), _jsx("dd", { children: project.permissionMode === 'full-access' ? 'Full supervisor permission' : 'Supervised approvals' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Supervisor" }), _jsx("dd", { children: projectSupervisor?.name ?? 'Unassigned' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Status" }), _jsx("dd", { children: formatProjectStatus(getProjectEffectiveStatus(project)) })] })] })] }), _jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Tool Posture" }), _jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Provider" }), _jsx("dd", { children: activeProviderLabel })] }), _jsxs("div", { children: [_jsx("dt", { children: "MCP tools" }), _jsx("dd", { children: mcpTools.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "MCP servers" }), _jsx("dd", { children: mcpServers.length })] })] })] })] }));
        }
        function renderProjectFormFields() {
            return (_jsxs("div", { className: styles.settingsGrid, children: [_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Project name" }), _jsx("input", { value: draft.name, onChange: event => updateDraft({ name: event.target.value }) })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Status" }), _jsxs("select", { value: draft.status, onChange: event => updateDraft({ status: event.target.value }), children: [_jsx("option", { value: "idea", children: "Idea" }), _jsx("option", { value: "planning", children: "Planning" }), _jsx("option", { value: "active", children: "Running" }), _jsx("option", { value: "stopped", children: "Stopped" }), _jsx("option", { value: "blocked", children: "Blocked" }), _jsx("option", { value: "done", children: "Done" })] })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Workspace path" }), _jsx("input", { value: draft.workspacePath ?? appInfo?.workspacePath ?? '', onChange: event => updateDraft({ workspacePath: event.target.value }) })] }), _jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Idea" }), _jsx("textarea", { value: draft.idea, onChange: event => updateDraft({ idea: event.target.value }), rows: 4 })] }), _jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Goals" }), _jsx("textarea", { value: draft.goals, onChange: event => updateDraft({ goals: event.target.value }), rows: 4 })] }), _jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Software artifacts" }), _jsx("textarea", { value: draft.artifacts.join('\n'), onChange: event => updateDraft({ artifacts: normalizeStringList(event.target.value.split('\n'), DEFAULT_PROJECT_ARTIFACTS) }), rows: 6 })] }), _jsxs("label", { className: `${styles.employeeAssignOption} ${styles.fieldWide}`, children: [_jsx("input", { type: "checkbox", checked: draft.mode === 'autonomous', onChange: event => updateDraft({
                                    mode: event.target.checked ? 'autonomous' : 'guided',
                                    permissionMode: event.target.checked ? 'full-access' : 'supervised',
                                    assignedEmployeeIds: event.target.checked ? draft.assignedEmployeeIds : [],
                                    assignedTeamIds: event.target.checked ? draft.assignedTeamIds : [],
                                    teamRoles: event.target.checked ? draft.teamRoles : [],
                                }) }), _jsx("span", { children: "Fully autonomous" }), _jsx("em", { children: "A supervisor and virtual team manage planning and execution. You can start, pause, or rerun the project." })] }), draft.mode === 'autonomous' && (_jsxs(_Fragment, { children: [_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Supervisor employee" }), _jsx("select", { value: draft.supervisorEmployeeId, onChange: event => selectDraftSupervisor(event.target.value), children: employees.map(employee => (_jsxs("option", { value: employee.id, children: [employee.name, " / ", getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role] }, employee.id))) })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Execution permissions" }), _jsxs("select", { value: draft.permissionMode, onChange: event => updateDraft({ permissionMode: event.target.value }), children: [_jsx("option", { value: "full-access", children: "Full access supervisor" }), _jsx("option", { value: "supervised", children: "Ask for risky actions" })] })] }), _jsxs("div", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Assigned teams" }), _jsxs("div", { className: styles.employeeAssignGrid, children: [projectTeams.map(team => (_jsxs("label", { className: styles.employeeAssignOption, children: [_jsx("input", { type: "checkbox", checked: draft.assignedTeamIds.includes(team.id), onChange: () => toggleDraftTeam(team.id) }), _jsx("span", { children: team.name }), _jsx("em", { children: team.mission })] }, team.id))), projectTeams.length === 0 && _jsx("span", { className: styles.mutedText, children: "Create teams before assigning them to a project." })] })] }), _jsxs("div", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Direct employees" }), _jsx("div", { className: styles.employeeAssignGrid, children: employees
                                            .filter(employee => employee.id !== draft.supervisorEmployeeId)
                                            .map(employee => (_jsxs("label", { className: styles.employeeAssignOption, children: [_jsx("input", { type: "checkbox", checked: draft.assignedEmployeeIds.includes(employee.id), onChange: () => toggleDraftEmployee(employee.id) }), _jsx("span", { children: employee.name }), _jsx("em", { children: getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role })] }, employee.id))) })] })] }))] }));
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
            return (_jsx(WorkbenchEditorPanel, { title: projects.some(project => project.id === draft.id) ? 'Edit Project' : 'New Project', subtitle: draft.mode === 'autonomous' ? 'Project details with autonomous staffing and execution' : 'Project details, workspace, goals, and deliverables', onClose: closeProjectEditorPanel, footer: (_jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.primaryButton, type: "button", onClick: saveProjectDraftAndClose, title: "Save this project and close the panel", children: [_jsx(Icon, { name: "save", size: 14 }), "Save Project"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: saveProjectDraftAndOpenPrimaryAction, title: draft.mode === 'autonomous' ? 'Save this project and open its team view' : 'Save this project and open its chat', children: [_jsx(Icon, { name: draft.mode === 'autonomous' ? 'network' : 'chat', size: 14 }), draft.mode === 'autonomous' ? 'Save And View Team' : 'Save And Open Chat'] })] })), children: renderProjectFormFields() }));
        }
        function renderProjectDeleteConfirmation() {
            if (!projectDeleteTarget) {
                return null;
            }
            return (_jsx(WorkbenchEditorPanel, { title: `Delete ${projectDeleteTarget.kind}`, subtitle: projectDeleteTarget.name, onClose: closeProjectEditorPanel, footer: (_jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.dangerButton, type: "button", onClick: confirmProjectDelete, title: `Confirm deletion of ${projectDeleteTarget.name}`, children: [_jsx(Icon, { name: "trash", size: 14 }), "Confirm Delete"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: closeProjectEditorPanel, title: "Cancel deletion and close the panel", children: [_jsx(Icon, { name: "x", size: 14 }), "Cancel"] })] })), children: _jsxs("section", { className: styles.deleteConfirmation, children: [_jsx("strong", { children: projectDeleteTarget.detail }), _jsx("span", { children: "This action updates local Project Studio state immediately." }), _jsx("ul", { children: projectDeleteTarget.impact.map(item => (_jsx("li", { children: item }, item))) })] }) }));
        }
        function renderGuidedProjectChat(project) {
            return (_jsxs("div", { className: styles.projectRailChatBody, children: [_jsx("p", { className: styles.mutedText, children: summarizeProjectGoals(project) }), renderProjectChatSurface(project, 'guided')] }));
        }
        function renderProjectOrganization(project) {
            const supervisor = getProjectSupervisor(project, employees, roles);
            const assignedTeams = getProjectTeams(project, projectTeams);
            const directEmployees = getProjectAssignedEmployees(project, employees, roles);
            return (_jsx(_Fragment, { children: _jsxs("section", { className: styles.detailPanel, children: [_jsxs("div", { className: styles.panelHeader, children: [_jsxs("div", { children: [_jsx("h3", { children: "Team Organization" }), _jsx("span", { children: project.name })] }), _jsx("button", { className: styles.secondaryButton, type: "button", onClick: () => editProject(project), title: "Edit project staffing and team assignments", children: "Edit Members" })] }), _jsx("p", { className: styles.mutedText, children: summarizeProjectGoals(project) }), _jsxs("div", { className: styles.projectTeamDiagram, children: [supervisor ? (_jsxs("div", { className: styles.projectSupervisorNode, children: [_jsx("span", { children: "Supervisor acting for human" }), _jsx("strong", { children: supervisor.name }), _jsxs("em", { children: [getEmployeeRoleDefinition(supervisor, roles)?.title ?? supervisor.role, " / ", project.permissionMode === 'full-access' ? 'Full permission' : 'Supervised'] })] })) : (_jsx("span", { className: styles.mutedText, children: "No supervisor assigned." })), _jsxs("div", { className: styles.employeeGrid, children: [assignedTeams.map(team => renderProjectTeamCard(team, { compact: true })), assignedTeams.length === 0 && _jsx("span", { className: styles.mutedText, children: "No teams assigned to this project." })] }), _jsxs("div", { className: styles.projectSupervisorRow, children: [_jsx("span", { children: "Direct employees" }), _jsx("strong", { children: directEmployees.length }), _jsx("em", { children: "Assigned outside teams" })] }), _jsxs("div", { className: styles.employeeGrid, children: [directEmployees.map(employee => renderEmployeeCard(employee, { compact: true })), directEmployees.length === 0 && _jsx("span", { className: styles.mutedText, children: "No direct employees assigned outside teams." })] })] })] }) }));
        }
        function renderProjectActionPanel() {
            const project = projectActionProject;
            if (!project) {
                return null;
            }
            if (projectEditorPanel === 'project-chat') {
                return (_jsx(WorkbenchEditorPanel, { title: "Project Chat", subtitle: project.name, onClose: closeProjectEditorPanel, wide: true, bodyClassName: styles.projectChatPanelBody, children: renderGuidedProjectChat(project) }));
            }
            if (projectEditorPanel === 'project-org') {
                return (_jsx(WorkbenchEditorPanel, { title: "Team Organization", subtitle: project.name, onClose: closeProjectEditorPanel, wide: true, children: renderProjectOrganization(project) }));
            }
            if (projectEditorPanel === 'project-board') {
                return (_jsx(WorkbenchEditorPanel, { title: "Task Board", subtitle: project.name, onClose: closeProjectEditorPanel, wide: true, children: renderTaskBoard(project) }));
            }
            if (projectEditorPanel === 'project-execution') {
                return (_jsx(WorkbenchEditorPanel, { title: "Activity", subtitle: project.name, onClose: closeProjectEditorPanel, wide: true, children: renderExecutionConsole(project) }));
            }
            if (projectEditorPanel === 'project-team-chat') {
                return (_jsx(WorkbenchEditorPanel, { title: "Team Chat", subtitle: project.name, onClose: closeProjectEditorPanel, wide: true, children: _jsxs("div", { className: styles.projectRailChatBody, children: [_jsx("p", { className: styles.mutedText, children: summarizeProjectGoals(project) }), renderProjectChatSurface(project, 'team')] }) }));
            }
            if (projectEditorPanel === 'project-deliverables') {
                return (_jsx(WorkbenchEditorPanel, { title: "Deliverables", subtitle: project.name, onClose: closeProjectEditorPanel, wide: true, children: renderDeliverables(project) }));
            }
            return null;
        }
        function getLifecycleButton(project, showLabel = false) {
            if (project.mode !== 'autonomous') {
                return null;
            }
            const effectiveStatus = getProjectEffectiveStatus(project);
            const buttonClassName = showLabel ? styles.secondaryButton : `${styles.secondaryButton} ${styles.projectIconButton}`;
            const iconSize = showLabel ? 14 : 15;
            const renderLifecycleButton = (status, icon, label, title) => (_jsxs("button", { className: buttonClassName, type: "button", onClick: () => onSetProjectStatus(project.id, status), title: title, "aria-label": title, children: [_jsx(Icon, { name: icon, size: iconSize }), showLabel && label] }));
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
        function renderProjectPortfolioActions(project, variant) {
            const showLabel = variant === 'expanded';
            const buttonClassName = showLabel ? styles.secondaryButton : `${styles.secondaryButton} ${styles.projectIconButton}`;
            const iconSize = showLabel ? 14 : 15;
            const actionsClassName = showLabel
                ? styles.projectCardActions
                : `${styles.workbenchRecordActions} ${styles.projectRecordActions}`;
            const renderActionButton = (panel, icon, label, title) => (_jsxs("button", { className: buttonClassName, type: "button", onClick: () => openProjectActionPanel(project, panel), title: title, "aria-label": title, children: [_jsx(Icon, { name: icon, size: iconSize }), showLabel && label] }));
            return (_jsxs("div", { className: actionsClassName, children: [project.mode === 'guided' ? (_jsxs(_Fragment, { children: [renderActionButton('project-chat', 'chat', 'Chat', 'Open this project chat'), renderActionButton('project-deliverables', 'archive', 'Deliverables', 'View project deliverables')] })) : (_jsxs(_Fragment, { children: [getLifecycleButton(project, showLabel), renderActionButton('project-org', 'network', 'Team', 'View team organization for this project'), renderActionButton('project-board', 'board', 'Board', 'Open this project task board'), renderActionButton('project-execution', 'activity', 'Activity', 'Open this project activity'), renderActionButton('project-team-chat', 'message', 'Team Chat', 'Open this autonomous team chat'), renderActionButton('project-deliverables', 'archive', 'Deliverables', 'View project deliverables')] })), _jsxs("button", { className: buttonClassName, type: "button", onClick: () => editProject(project), title: "Edit this project", "aria-label": "Edit this project", children: [_jsx(Icon, { name: "edit", size: iconSize }), showLabel && 'Edit'] }), _jsxs("button", { className: buttonClassName, type: "button", onClick: () => openProjectDeleteConfirmation(buildProjectDeleteTarget(project)), title: "Delete this project", "aria-label": "Delete this project", children: [_jsx(Icon, { name: "trash", size: iconSize }), showLabel && 'Delete'] })] }));
        }
        function renderProjectRow(project) {
            const assignedTeams = getProjectTeams(project, projectTeams);
            const assignedStaff = getProjectStaffingEmployees(project, employees, roles, projectTeams);
            const effectiveStatus = getProjectEffectiveStatus(project);
            return (_jsxs("article", { className: `${styles.workbenchRecordRow} ${styles.projectRecordRow} ${getProjectStatusRowClassName(effectiveStatus)}`, children: [_jsxs("div", { className: styles.workbenchRecordPrimary, children: [_jsx("strong", { children: project.name }), _jsxs("span", { children: [project.mode === 'autonomous' ? 'Fully autonomous' : 'Standard', " / ", formatProjectStatus(effectiveStatus)] })] }), _jsx("span", { className: styles.workbenchRecordCell, title: summarizeProjectGoals(project), children: summarizeProjectGoals(project) }), _jsx("span", { className: styles.workbenchRecordCell, children: project.mode === 'autonomous'
                            ? `${assignedTeams.length} team(s), ${assignedStaff.length} employee(s)`
                            : `${project.artifacts.length} deliverable(s)` }), _jsx("span", { className: styles.workbenchRecordCell, title: project.workspacePath ?? appInfo?.workspacePath ?? undefined, children: project.workspacePath ?? workspaceTitle }), renderProjectPortfolioActions(project, 'compact')] }, project.id));
        }
        function renderProjectCard(project, action) {
            const effectiveStatus = getProjectEffectiveStatus(project);
            const cardClassName = [
                styles.projectCard,
                getProjectStatusCardClassName(effectiveStatus),
                project.id === selectedProject?.id ? styles.projectCardSelected : '',
            ].filter(Boolean).join(' ');
            return (_jsxs("article", { className: cardClassName, children: [_jsxs("div", { className: styles.projectCardHeader, children: [_jsxs("div", { children: [_jsx("strong", { children: project.name }), _jsxs("span", { children: [project.mode === 'autonomous' ? 'Fully autonomous' : 'Standard project', " / ", formatProjectStatus(effectiveStatus)] })] }), _jsxs("button", { className: styles.textButton, type: "button", onClick: () => editProject(project), title: "Edit this project", children: [_jsx(Icon, { name: "edit", size: 13 }), "Edit"] })] }), _jsx("p", { children: summarizeProjectGoals(project) }), _jsxs("div", { className: styles.projectChipList, children: [project.artifacts.slice(0, 4).map(artifact => (_jsx("span", { className: styles.projectChip, children: artifact }, artifact))), project.artifacts.length > 4 && _jsxs("span", { className: styles.projectChip, children: ["+", project.artifacts.length - 4] })] }), project.mode === 'autonomous' && (_jsxs("div", { className: styles.projectSupervisorRow, children: [_jsx("span", { children: "Supervisor" }), _jsx("strong", { children: project.supervisorRole }), _jsx("em", { children: project.permissionMode === 'full-access' ? 'Full permission' : 'Supervised' })] })), _jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", title: action === 'organization' ? 'View this project team' : 'Open this project chat', onClick: () => {
                                    if (action === 'organization') {
                                        openProjectActionPanel(project, 'project-org');
                                        return;
                                    }
                                    openProjectActionPanel(project, 'project-chat');
                                }, children: [_jsx(Icon, { name: action === 'organization' ? 'network' : 'chat', size: 14 }), action === 'organization' ? 'Team' : 'Open Chat'] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onSelectProject(project.id), title: "Select this project", children: [_jsx(Icon, { name: "check", size: 14 }), "Select"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openProjectDeleteConfirmation(buildProjectDeleteTarget(project)), title: "Delete this project", children: [_jsx(Icon, { name: "trash", size: 14 }), "Delete"] })] })] }, project.id));
        }
        function renderProjectPortfolioCard(project) {
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
            return (_jsxs("article", { className: cardClassName, children: [_jsxs("div", { className: styles.projectCardHeader, children: [_jsxs("div", { children: [_jsx("strong", { children: project.name }), _jsxs("span", { children: [project.mode === 'autonomous' ? 'Fully autonomous' : 'Standard project', " / ", formatProjectStatus(effectiveStatus)] })] }), _jsx("span", { className: `${styles.projectStatusBadge} ${getProjectStatusBadgeClassName(effectiveStatus)}`, children: formatProjectStatus(effectiveStatus) })] }), _jsx("p", { title: summarizeProjectGoals(project), children: summarizeProjectGoals(project) }), _jsxs("dl", { className: styles.projectCardMeta, children: [_jsxs("div", { children: [_jsx("dt", { children: "Scope" }), _jsx("dd", { children: project.mode === 'autonomous'
                                            ? `${assignedTeams.length} team(s), ${assignedStaff.length} employee(s)`
                                            : `${project.artifacts.length} deliverable(s)` })] }), _jsxs("div", { children: [_jsx("dt", { children: "Workspace" }), _jsx("dd", { title: workspace, children: workspace })] })] }), _jsxs("div", { className: styles.projectChipList, children: [project.artifacts.slice(0, 4).map(artifact => (_jsx("span", { className: styles.projectChip, children: artifact }, artifact))), project.artifacts.length > 4 && _jsxs("span", { className: styles.projectChip, children: ["+", project.artifacts.length - 4] })] }), renderProjectPortfolioActions(project, 'expanded')] }, project.id));
        }
        function renderProjectMetricBar(segments, total) {
            const visibleSegments = segments.filter(segment => segment.value > 0);
            return (_jsxs("div", { className: styles.projectMetricChart, children: [_jsx("div", { className: styles.projectMetricBar, "aria-label": "Project metric distribution", children: visibleSegments.length > 0 ? visibleSegments.map(segment => {
                            const width = total > 0 ? Math.max(8, (segment.value / total) * 100) : 0;
                            return (_jsx("span", { className: `${styles.projectMetricSegment} ${segment.className}`, style: { width: `${width}%` }, title: `${segment.label}: ${segment.value}` }, segment.label));
                        }) : _jsx("span", { className: styles.projectMetricEmpty, children: "No data" }) }), _jsx("div", { className: styles.projectMetricLegend, children: segments.map(segment => (_jsxs("span", { children: [_jsx("i", { className: segment.className }), segment.label, ": ", segment.value] }, segment.label))) })] }));
        }
        function getProjectStatusRowClassName(status) {
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
        function getProjectStatusCardClassName(status) {
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
        function getProjectStatusBadgeClassName(status) {
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
            return (_jsxs("div", { className: styles.projectPager, children: [_jsxs("span", { children: ["Showing ", projectPageFirstRecord, "-", projectPageLastRecord, " of ", projects.length] }), _jsxs("div", { className: styles.projectPagerControls, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => setProjectPage(page => Math.max(1, page - 1)), disabled: normalizedProjectPage <= 1, title: "Previous project page", children: [_jsx(Icon, { name: "chevron-left", size: 14 }), "Previous"] }), _jsxs("strong", { children: ["Page ", normalizedProjectPage, " / ", projectPageCount] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => setProjectPage(page => Math.min(projectPageCount, page + 1)), disabled: normalizedProjectPage >= projectPageCount, title: "Next project page", children: ["Next", _jsx(Icon, { name: "chevron-right", size: 14 })] })] })] }));
        }
        const projectDetailViewClassName = projectRailOpen
            ? `${styles.detailView} ${styles.detailViewWithRail} ${projectRailWide ? styles.detailViewWithWideRail : ''}`
            : styles.detailView;
        return (_jsxs("section", { className: projectDetailViewClassName, "aria-label": "Projects", children: [projectEditorPanel === 'project' && renderProjectFormPanel(), projectEditorPanel === 'delete' && renderProjectDeleteConfirmation(), renderProjectActionPanel(), visibleActiveSection === 'studio' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.detailHero, children: [_jsx("span", { className: styles.detailEyebrow, children: "Current workspace" }), _jsx("h2", { children: "Turn ideas into software projects" }), _jsx("p", { title: appInfo?.workspacePath || undefined, children: appInfo?.workspacePath || 'Workspace path unavailable' })] }), _jsxs("div", { className: styles.detailGrid, children: [_jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Project Portfolio" }), _jsxs("div", { className: styles.projectMetricHeadline, children: [_jsx("strong", { children: projects.length }), _jsx("span", { children: "Total project(s)" })] }), renderProjectMetricBar(projectModeMetrics, projects.length), _jsx("p", { className: styles.mutedText, children: "Use project row actions to open chat, team, board, or deliverables." })] }), _jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Project Status" }), _jsxs("div", { className: styles.projectMetricHeadline, children: [_jsx("strong", { children: activeProjects.length }), _jsx("span", { children: "Active project(s)" })] }), renderProjectMetricBar(projectStatusMetrics, projects.length), _jsx("p", { className: styles.mutedText, children: "Fully autonomous projects can run in the background; the table below is the source of project navigation." })] }), _jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Project Staffing" }), _jsxs("div", { className: styles.projectMetricHeadline, children: [_jsx("strong", { children: employees.length }), _jsx("span", { children: "Employee profile(s)" })] }), renderProjectMetricBar(projectStaffingMetrics, projects.length), _jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Roles" }), _jsx("dd", { children: roles.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "Teams" }), _jsx("dd", { children: projectTeams.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "Deliverables" }), _jsx("dd", { children: deliverableCount })] })] })] })] }), _jsxs("section", { className: styles.detailPanel, children: [_jsxs("div", { className: styles.panelHeader, children: [_jsxs("div", { children: [_jsx("h3", { children: "Projects" }), _jsxs("span", { children: [projects.length, " saved project(s)"] })] }), _jsxs("div", { className: styles.panelActions, children: [_jsx(RecordViewToggle, { view: projectPortfolioView, onChange: setProjectPortfolioView, label: "Project list view" }), _jsxs("button", { className: styles.primaryButton, type: "button", onClick: startDraft, title: "Create a software project", children: [_jsx(Icon, { name: "plus", size: 14 }), "New Project"] })] })] }), _jsx("div", { className: styles.projectStatusLegend, "aria-label": "Project status color legend", children: projectStatusMetrics.map(segment => (_jsxs("span", { title: `${segment.label}: ${segment.value} project(s)`, children: [_jsx("i", { className: segment.className }), segment.label] }, segment.label))) }), projectPortfolioView === 'table' ? (_jsxs("div", { className: `${styles.workbenchRecordList} ${styles.projectRecordList}`, children: [_jsxs("div", { className: `${styles.workbenchRecordRow} ${styles.workbenchRecordHeader} ${styles.projectRecordRow}`, children: [_jsx("span", { children: "Project" }), _jsx("span", { children: "Goal" }), _jsx("span", { children: "Scope" }), _jsx("span", { children: "Workspace" }), _jsx("span", { children: "Actions" })] }), visibleProjects.map(project => renderProjectRow(project)), projects.length === 0 && _jsx("span", { className: styles.workbenchEmptyState, children: "No software projects created yet." })] })) : (_jsxs("div", { className: styles.projectPortfolioGrid, children: [visibleProjects.map(project => renderProjectPortfolioCard(project)), projects.length === 0 && _jsx("span", { className: styles.workbenchEmptyState, children: "No software projects created yet." })] })), renderProjectPagination()] })] })), visibleActiveSection === 'roles' && (_jsxs("div", { className: styles.workbenchSplit, children: [_jsxs("section", { className: `${styles.detailPanel} ${styles.workbenchMain}`, children: [_jsxs("div", { className: styles.panelHeader, children: [_jsxs("div", { children: [_jsx("h3", { children: "Roles" }), _jsxs("span", { children: [roles.length, " project role definition(s)"] })] }), _jsxs("div", { className: styles.panelActions, children: [_jsx(RecordViewToggle, { view: roleListView, onChange: setRoleListView, label: "Role list view" }), _jsxs("button", { className: styles.primaryButton, type: "button", onClick: openNewRoleEditor, title: "Create a new role definition", children: [_jsx(Icon, { name: "plus", size: 14 }), "New Role"] })] })] }), roleListView === 'table' ? (_jsxs("div", { className: styles.workbenchRecordList, children: [_jsxs("div", { className: `${styles.workbenchRecordRow} ${styles.workbenchRecordHeader}`, children: [_jsx("span", { children: "Role" }), _jsx("span", { children: "Scope" }), _jsx("span", { children: "Default goal" }), _jsx("span", { children: "Definition" }), _jsx("span", { children: "Actions" })] }), roles.map(role => renderRoleRow(role)), roles.length === 0 && _jsx("span", { className: styles.mutedText, children: "No roles configured." })] })) : (_jsxs("div", { className: styles.recordCardGrid, children: [roles.map(role => renderRoleCard(role)), roles.length === 0 && _jsx("span", { className: styles.workbenchEmptyState, children: "No roles configured." })] }))] }), projectEditorPanel === 'role' && (_jsx(WorkbenchEditorPanel, { title: roles.some(role => role.id === roleDraft.id) ? 'Edit Role' : 'New Role', subtitle: "Responsibilities, default goal, and tool expectations", onClose: closeProjectEditorPanel, footer: (_jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.primaryButton, type: "button", onClick: saveRoleDraft, title: "Save this role definition", children: [_jsx(Icon, { name: "save", size: 14 }), "Save Role"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: openNewRoleEditor, title: "Reset the form for a new role", children: [_jsx(Icon, { name: "rotate", size: 14 }), "Reset New"] })] })), children: _jsxs("div", { className: styles.settingsGrid, children: [_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Role title" }), _jsx("input", { value: roleDraft.title, onChange: event => setRoleDraft(current => ({ ...current, title: event.target.value, updatedAt: Date.now() })) })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Can supervise" }), _jsxs("select", { value: roleDraft.canSupervise ? 'yes' : 'no', onChange: event => setRoleDraft(current => ({ ...current, canSupervise: event.target.value === 'yes', updatedAt: Date.now() })), children: [_jsx("option", { value: "no", children: "No" }), _jsx("option", { value: "yes", children: "Yes" })] })] }), _jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Default goal" }), _jsx("textarea", { value: roleDraft.defaultGoal, onChange: event => setRoleDraft(current => ({ ...current, defaultGoal: event.target.value, updatedAt: Date.now() })), rows: 3 })] }), _jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Responsibilities" }), _jsx("textarea", { value: roleDraft.responsibilities.join('\n'), onChange: event => setRoleDraft(current => ({
                                                    ...current,
                                                    responsibilities: normalizeStringList(event.target.value.split('\n'), ['Deliver assigned project responsibilities.']),
                                                    updatedAt: Date.now(),
                                                })), rows: 7 })] }), _jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Default tools" }), _jsx("textarea", { value: roleDraft.defaultTools.join('\n'), onChange: event => setRoleDraft(current => ({
                                                    ...current,
                                                    defaultTools: normalizeStringList(event.target.value.split('\n'), getDefaultTeamTools(current.title)),
                                                    updatedAt: Date.now(),
                                                })), rows: 4 })] })] }) }))] })), visibleActiveSection === 'employees' && (_jsxs("div", { className: styles.workbenchSplit, children: [_jsxs("section", { className: `${styles.detailPanel} ${styles.workbenchMain}`, children: [_jsxs("div", { className: styles.panelHeader, children: [_jsxs("div", { children: [_jsx("h3", { children: "Employees" }), _jsxs("span", { children: [employees.length, " reusable employee profile(s)"] })] }), _jsxs("div", { className: styles.panelActions, children: [_jsx(RecordViewToggle, { view: employeeListView, onChange: setEmployeeListView, label: "Employee list view" }), _jsxs("button", { className: styles.primaryButton, type: "button", onClick: openNewEmployeeEditor, title: "Create a new employee profile", children: [_jsx(Icon, { name: "plus", size: 14 }), "New Employee"] })] })] }), employeeListView === 'table' ? (_jsxs("div", { className: styles.workbenchRecordList, children: [_jsxs("div", { className: `${styles.workbenchRecordRow} ${styles.workbenchRecordHeader}`, children: [_jsx("span", { children: "Employee" }), _jsx("span", { children: "Role" }), _jsx("span", { children: "Status" }), _jsx("span", { children: "Current work" }), _jsx("span", { children: "Actions" })] }), employees.map(employee => renderEmployeeRow(employee)), employees.length === 0 && _jsx("span", { className: styles.workbenchEmptyState, children: "No employees configured." })] })) : (_jsxs("div", { className: styles.recordCardGrid, children: [employees.map(employee => renderEmployeeManagementCard(employee)), employees.length === 0 && _jsx("span", { className: styles.workbenchEmptyState, children: "No employees configured." })] }))] }), projectEditorPanel === 'employee-profile' && profileEmployee && (_jsx(WorkbenchEditorPanel, { title: profileEmployee.name, subtitle: `${getEmployeeRoleDefinition(profileEmployee, roles)?.title ?? profileEmployee.role} / ${profileEmployee.status}`, onClose: closeProjectEditorPanel, children: renderEmployeeProfile(profileEmployee) })), projectEditorPanel === 'employee' && (_jsx(WorkbenchEditorPanel, { title: employees.some(employee => employee.id === employeeDraft.id) ? 'Edit Employee' : 'New Employee', subtitle: "Role, model, permissions, and current assignment", onClose: closeProjectEditorPanel, footer: (_jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.primaryButton, type: "button", onClick: saveEmployeeDraft, title: "Save this employee profile", children: [_jsx(Icon, { name: "save", size: 14 }), "Save Employee"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: openNewEmployeeEditor, title: "Reset the form for a new employee", children: [_jsx(Icon, { name: "rotate", size: 14 }), "Reset New"] })] })), children: _jsxs("div", { className: styles.settingsGrid, children: [_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Name" }), _jsx("input", { value: employeeDraft.name, onChange: event => setEmployeeDraft(current => ({ ...current, name: event.target.value, updatedAt: Date.now() })) })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Role" }), _jsx("select", { value: employeeDraft.roleId || getDefaultRoleId(employeeDraft.role), onChange: event => selectEmployeeRole(event.target.value), children: roles.map(role => (_jsx("option", { value: role.id, children: role.title }, role.id))) })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Model" }), _jsx("input", { value: employeeDraft.model, onChange: event => setEmployeeDraft(current => ({ ...current, model: event.target.value, updatedAt: Date.now() })) })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Status" }), _jsxs("select", { value: employeeDraft.status, onChange: event => setEmployeeDraft(current => ({ ...current, status: event.target.value, updatedAt: Date.now() })), children: [_jsx("option", { value: "idle", children: "Idle" }), _jsx("option", { value: "working", children: "Working" }), _jsx("option", { value: "approval", children: "Needs approval" })] })] }), _jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Current task" }), _jsx("input", { value: employeeDraft.currentTask, onChange: event => setEmployeeDraft(current => ({ ...current, currentTask: event.target.value, updatedAt: Date.now() })) })] }), _jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Permissions" }), _jsx("textarea", { value: employeeDraft.permissions.join('\n'), onChange: event => setEmployeeDraft(current => ({
                                                    ...current,
                                                    permissions: normalizeStringList(event.target.value.split('\n'), DEFAULT_EMPLOYEE_PERMISSIONS),
                                                    updatedAt: Date.now(),
                                                })), rows: 5 })] })] }) }))] })), visibleActiveSection === 'teams' && (_jsxs("div", { className: styles.workbenchSplit, children: [_jsxs("section", { className: `${styles.detailPanel} ${styles.workbenchMain}`, children: [_jsxs("div", { className: styles.panelHeader, children: [_jsxs("div", { children: [_jsx("h3", { children: "Teams" }), _jsxs("span", { children: [projectTeams.length, " reusable project team(s)"] })] }), _jsxs("div", { className: styles.panelActions, children: [_jsx(RecordViewToggle, { view: teamListView, onChange: setTeamListView, label: "Team list view" }), _jsxs("button", { className: styles.primaryButton, type: "button", onClick: openNewProjectTeamEditor, title: "Create a new reusable team", children: [_jsx(Icon, { name: "plus", size: 14 }), "New Team"] })] })] }), teamListView === 'table' ? (_jsxs("div", { className: styles.workbenchRecordList, children: [_jsxs("div", { className: `${styles.workbenchRecordRow} ${styles.workbenchRecordHeader}`, children: [_jsx("span", { children: "Team" }), _jsx("span", { children: "Supervisor" }), _jsx("span", { children: "Members" }), _jsx("span", { children: "Mission" }), _jsx("span", { children: "Actions" })] }), projectTeams.map(team => renderProjectTeamRow(team)), projectTeams.length === 0 && _jsx("span", { className: styles.workbenchEmptyState, children: "No project teams configured." })] })) : (_jsxs("div", { className: styles.recordCardGrid, children: [projectTeams.map(team => renderProjectTeamManagementCard(team)), projectTeams.length === 0 && _jsx("span", { className: styles.workbenchEmptyState, children: "No project teams configured." })] }))] }), projectEditorPanel === 'team' && (_jsx(WorkbenchEditorPanel, { title: projectTeams.some(team => team.id === teamDraft.id) ? 'Edit Team' : 'New Team', subtitle: "Mission, supervisor, and members", onClose: closeProjectEditorPanel, footer: (_jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.primaryButton, type: "button", onClick: saveTeamDraft, title: "Save this reusable team", children: [_jsx(Icon, { name: "save", size: 14 }), "Save Team"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: openNewProjectTeamEditor, title: "Reset the form for a new team", children: [_jsx(Icon, { name: "rotate", size: 14 }), "Reset New"] })] })), children: _jsxs("div", { className: styles.settingsGrid, children: [_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Team name" }), _jsx("input", { value: teamDraft.name, onChange: event => setTeamDraft(current => ({ ...current, name: event.target.value, updatedAt: Date.now() })) })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Supervisor" }), _jsx("select", { value: teamDraft.supervisorEmployeeId, onChange: event => selectTeamSupervisor(event.target.value), children: employees.map(employee => (_jsxs("option", { value: employee.id, children: [employee.name, " / ", getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role] }, employee.id))) })] }), _jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Mission" }), _jsx("textarea", { value: teamDraft.mission, onChange: event => setTeamDraft(current => ({ ...current, mission: event.target.value, updatedAt: Date.now() })), rows: 4 })] }), _jsxs("div", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Members" }), _jsx("div", { className: styles.employeeAssignGrid, children: employees
                                                    .filter(employee => employee.id !== teamDraft.supervisorEmployeeId)
                                                    .map(employee => (_jsxs("label", { className: styles.employeeAssignOption, children: [_jsx("input", { type: "checkbox", checked: teamDraft.memberEmployeeIds.includes(employee.id), onChange: () => toggleTeamMember(employee.id) }), _jsx("span", { children: employee.name }), _jsx("em", { children: getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role })] }, employee.id))) })] })] }) }))] })), visibleActiveSection === 'new' && (_jsxs("section", { className: styles.detailPanel, children: [_jsx("div", { className: styles.panelHeader, children: _jsxs("div", { children: [_jsx("h3", { children: "Project Definition" }), _jsx("span", { children: draft.mode === 'autonomous' ? 'Fully autonomous execution enabled' : 'Standard project' })] }) }), _jsxs("div", { className: styles.settingsGrid, children: [_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Project name" }), _jsx("input", { value: draft.name, onChange: event => updateDraft({ name: event.target.value }) })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Status" }), _jsxs("select", { value: draft.status, onChange: event => updateDraft({ status: event.target.value }), children: [_jsx("option", { value: "idea", children: "Idea" }), _jsx("option", { value: "planning", children: "Planning" }), _jsx("option", { value: "active", children: "Running" }), _jsx("option", { value: "stopped", children: "Stopped" }), _jsx("option", { value: "blocked", children: "Blocked" }), _jsx("option", { value: "done", children: "Done" })] })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Workspace path" }), _jsx("input", { value: draft.workspacePath ?? appInfo?.workspacePath ?? '', onChange: event => updateDraft({ workspacePath: event.target.value }) })] }), _jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Idea" }), _jsx("textarea", { value: draft.idea, onChange: event => updateDraft({ idea: event.target.value }), rows: 4 })] }), _jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Goals" }), _jsx("textarea", { value: draft.goals, onChange: event => updateDraft({ goals: event.target.value }), rows: 4 })] }), _jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Software artifacts" }), _jsx("textarea", { value: draft.artifacts.join('\n'), onChange: event => updateDraft({ artifacts: normalizeStringList(event.target.value.split('\n'), DEFAULT_PROJECT_ARTIFACTS) }), rows: 6 })] }), _jsxs("label", { className: `${styles.employeeAssignOption} ${styles.fieldWide}`, children: [_jsx("input", { type: "checkbox", checked: draft.mode === 'autonomous', onChange: event => updateDraft({
                                                mode: event.target.checked ? 'autonomous' : 'guided',
                                                permissionMode: event.target.checked ? 'full-access' : 'supervised',
                                                assignedEmployeeIds: event.target.checked ? draft.assignedEmployeeIds : [],
                                                assignedTeamIds: event.target.checked ? draft.assignedTeamIds : [],
                                                teamRoles: event.target.checked ? draft.teamRoles : [],
                                            }) }), _jsx("span", { children: "Fully autonomous" }), _jsx("em", { children: "A supervisor and virtual team manage this project on your behalf." })] }), draft.mode === 'autonomous' && (_jsxs(_Fragment, { children: [_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Supervisor employee" }), _jsx("select", { value: draft.supervisorEmployeeId, onChange: event => selectDraftSupervisor(event.target.value), children: employees.map(employee => (_jsxs("option", { value: employee.id, children: [employee.name, " / ", getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role] }, employee.id))) })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Execution permissions" }), _jsxs("select", { value: draft.permissionMode, onChange: event => updateDraft({ permissionMode: event.target.value }), children: [_jsx("option", { value: "full-access", children: "Full access supervisor" }), _jsx("option", { value: "supervised", children: "Ask for risky actions" })] })] }), _jsxs("div", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Assigned teams" }), _jsxs("div", { className: styles.employeeAssignGrid, children: [projectTeams.map(team => (_jsxs("label", { className: styles.employeeAssignOption, children: [_jsx("input", { type: "checkbox", checked: draft.assignedTeamIds.includes(team.id), onChange: () => toggleDraftTeam(team.id) }), _jsx("span", { children: team.name }), _jsx("em", { children: team.mission })] }, team.id))), projectTeams.length === 0 && _jsx("span", { className: styles.mutedText, children: "Create teams before assigning them to a project." })] })] }), _jsxs("div", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Direct employees" }), _jsx("div", { className: styles.employeeAssignGrid, children: employees
                                                        .filter(employee => employee.id !== draft.supervisorEmployeeId)
                                                        .map(employee => (_jsxs("label", { className: styles.employeeAssignOption, children: [_jsx("input", { type: "checkbox", checked: draft.assignedEmployeeIds.includes(employee.id), onChange: () => toggleDraftEmployee(employee.id) }), _jsx("span", { children: employee.name }), _jsx("em", { children: getEmployeeRoleDefinition(employee, roles)?.title ?? employee.role })] }, employee.id))) })] })] }))] }), _jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.primaryButton, type: "button", onClick: saveDraft, title: "Save this project", children: [_jsx(Icon, { name: "save", size: 14 }), "Save Project"] }), draft.mode === 'autonomous' ? (_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: saveDraftAndViewOrganization, title: "Save this autonomous project and view its team organization", children: [_jsx(Icon, { name: "network", size: 14 }), "Save And View Team"] })) : (_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: saveDraftAndOpenProjectChat, title: "Save this project and open chat", children: [_jsx(Icon, { name: "chat", size: 14 }), "Save And Open Chat"] }))] })] })), visibleActiveSection === 'guided' && (_jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Standard Projects" }), _jsxs("div", { className: styles.projectList, children: [guidedProjects.map(project => renderProjectCard(project, 'chat')), guidedProjects.length === 0 && _jsx("span", { className: styles.mutedText, children: "No standard projects yet." })] })] })), visibleActiveSection === 'autonomous' && (_jsxs(_Fragment, { children: [_jsxs("section", { className: styles.detailPanel, children: [_jsx("div", { className: styles.panelHeader, children: _jsxs("div", { children: [_jsx("h3", { children: "Selected Autonomous Project" }), _jsx("span", { children: selectedAutonomousProject?.name ?? 'No autonomous project selected' })] }) }), renderAutonomousProjectSelector()] }), _jsxs("section", { className: styles.detailPanel, children: [_jsxs("div", { className: styles.panelHeader, children: [_jsxs("div", { children: [_jsx("h3", { children: "Autonomous Project Organization" }), _jsx("span", { children: selectedAutonomousProject?.name ?? 'Select or create an autonomous project' })] }), selectedAutonomousProject && (_jsx("div", { className: styles.panelActions, children: _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => editProject(selectedAutonomousProject), title: "Edit project staffing and team assignments", children: [_jsx(Icon, { name: "users", size: 14 }), "Edit Project Members"] }) }))] }), selectedAutonomousProject ? (_jsxs(_Fragment, { children: [_jsx("p", { className: styles.mutedText, children: summarizeProjectGoals(selectedAutonomousProject) }), _jsxs("div", { className: styles.projectTeamDiagram, children: [selectedAutonomousSupervisor ? (_jsxs("div", { className: styles.projectSupervisorNode, children: [_jsx("span", { children: "Supervisor acting for human" }), _jsx("strong", { children: selectedAutonomousSupervisor.name }), _jsxs("em", { children: [selectedAutonomousSupervisor.role, " / ", selectedAutonomousProject.permissionMode === 'full-access' ? 'Full permission' : 'Supervised'] })] })) : (_jsx("span", { className: styles.mutedText, children: "No supervisor assigned." })), _jsxs("div", { className: styles.employeeGrid, children: [selectedAutonomousTeams.map(team => renderProjectTeamCard(team, { compact: true })), selectedAutonomousTeams.length === 0 && _jsx("span", { className: styles.mutedText, children: "No teams assigned to this project." })] }), _jsxs("div", { className: styles.projectSupervisorRow, children: [_jsx("span", { children: "Direct employees" }), _jsx("strong", { children: selectedAutonomousDirectEmployees.length }), _jsx("em", { children: "Assigned outside teams" })] }), _jsxs("div", { className: styles.employeeGrid, children: [selectedAutonomousDirectEmployees.map(employee => renderEmployeeCard(employee, { compact: true })), selectedAutonomousDirectEmployees.length === 0 && _jsx("span", { className: styles.mutedText, children: "No direct employees assigned outside teams." })] })] }), _jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onChangeSection('board'), title: "Open the task board for this autonomous project", children: [_jsx(Icon, { name: "board", size: 14 }), "Task Board"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onChangeSection('chat'), title: "Open team chat for this autonomous project", children: [_jsx(Icon, { name: "message", size: 14 }), "Team Chat"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onChangeSection('deliverables'), title: "View deliverables for this autonomous project", children: [_jsx(Icon, { name: "archive", size: 14 }), "Deliverables"] })] })] })) : (_jsx("span", { className: styles.mutedText, children: "No autonomous project yet." }))] }), _jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Autonomous Projects" }), _jsxs("div", { className: styles.projectList, children: [autonomousProjects.map(project => renderProjectCard(project, 'organization')), autonomousProjects.length === 0 && _jsx("span", { className: styles.mutedText, children: "No autonomous projects yet." })] })] })] })), visibleActiveSection === 'insights' && (_jsxs(_Fragment, { children: [_jsxs("section", { className: styles.detailPanel, children: [_jsx("div", { className: styles.panelHeader, children: _jsxs("div", { children: [_jsx("h3", { children: "Selected Project" }), _jsx("span", { children: selectedProject?.name ?? 'No project selected' })] }) }), renderProjectSelector()] }), selectedProject ? renderProjectInsights(selectedProject) : _jsx("span", { className: styles.mutedText, children: "Select a project to see insights." })] })), visibleActiveSection === 'execution' && (_jsxs(_Fragment, { children: [_jsxs("section", { className: styles.detailPanel, children: [_jsx("div", { className: styles.panelHeader, children: _jsxs("div", { children: [_jsx("h3", { children: "Selected Project" }), _jsx("span", { children: selectedProject?.name ?? 'No project selected' })] }) }), renderProjectSelector()] }), selectedProject ? renderExecutionConsole(selectedProject) : _jsx("span", { className: styles.mutedText, children: "Select a project to see execution state." })] })), visibleActiveSection === 'artifacts' && (_jsxs(_Fragment, { children: [_jsxs("section", { className: styles.detailPanel, children: [_jsx("div", { className: styles.panelHeader, children: _jsxs("div", { children: [_jsx("h3", { children: "Selected Project" }), _jsx("span", { children: selectedProject?.name ?? 'No project selected' })] }) }), renderProjectSelector()] }), selectedProject ? renderArtifactsExplorer(selectedProject) : _jsx("span", { className: styles.mutedText, children: "Select a project to see artifacts." })] })), visibleActiveSection === 'timeline' && (_jsxs(_Fragment, { children: [_jsxs("section", { className: styles.detailPanel, children: [_jsx("div", { className: styles.panelHeader, children: _jsxs("div", { children: [_jsx("h3", { children: "Selected Project" }), _jsx("span", { children: selectedProject?.name ?? 'No project selected' })] }) }), renderProjectSelector()] }), selectedProject ? renderProjectTimeline(selectedProject) : _jsx("span", { className: styles.mutedText, children: "Select a project to see timeline." })] })), visibleActiveSection === 'governance' && (_jsxs(_Fragment, { children: [_jsxs("section", { className: styles.detailPanel, children: [_jsx("div", { className: styles.panelHeader, children: _jsxs("div", { children: [_jsx("h3", { children: "Selected Project" }), _jsx("span", { children: selectedProject?.name ?? 'No project selected' })] }) }), renderProjectSelector()] }), selectedProject ? renderGovernance(selectedProject) : _jsx("span", { className: styles.mutedText, children: "Select a project to see governance." })] })), visibleActiveSection === 'board' && (_jsxs("section", { className: styles.detailPanel, children: [_jsx("div", { className: styles.panelHeader, children: _jsxs("div", { children: [_jsx("h3", { children: "Task Board" }), _jsx("span", { children: selectedAutonomousProject?.name ?? 'No autonomous project selected' })] }) }), renderAutonomousProjectSelector(), selectedAutonomousProject ? renderTaskBoard(selectedAutonomousProject) : _jsx("span", { className: styles.mutedText, children: "Select an autonomous project to see its task board." })] })), visibleActiveSection === 'chat' && (_jsxs("section", { className: styles.detailPanel, children: [_jsx("div", { className: styles.panelHeader, children: _jsxs("div", { children: [_jsx("h3", { children: "Team Chat" }), _jsx("span", { children: selectedAutonomousProject?.name ?? 'No autonomous project selected' })] }) }), renderAutonomousProjectSelector(), selectedAutonomousProject ? renderTeamChat(selectedAutonomousProject) : _jsx("span", { className: styles.mutedText, children: "Select an autonomous project to see employee chat." })] })), visibleActiveSection === 'deliverables' && (_jsxs("section", { className: styles.detailPanel, children: [_jsx("div", { className: styles.panelHeader, children: _jsxs("div", { children: [_jsx("h3", { children: "Deliverables" }), _jsx("span", { children: selectedAutonomousProject?.name ?? 'No autonomous project selected' })] }) }), renderAutonomousProjectSelector(), selectedAutonomousProject ? renderDeliverables(selectedAutonomousProject) : _jsx("span", { className: styles.mutedText, children: "Select an autonomous project to see deliverables." })] })), visibleActiveSection === 'context' && (_jsxs(_Fragment, { children: [_jsxs("section", { className: styles.detailPanel, children: [_jsxs("div", { className: styles.panelHeader, children: [_jsxs("div", { children: [_jsx("h3", { children: "Files" }), _jsx("span", { title: appInfo?.workspacePath || undefined, children: workspacePath === '.' ? appInfo?.workspacePath || '.' : workspacePath })] }), _jsxs("div", { className: styles.panelActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: onGoToWorkspaceParent, disabled: workspacePath === '.' || isLoadingWorkspaceEntries, children: [_jsx(Icon, { name: "arrow-left", size: 14 }), "Up"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: onRefreshWorkspace, disabled: isLoadingWorkspaceEntries, children: [_jsx(Icon, { name: "refresh", size: 14 }), "Refresh"] })] })] }), workspaceBrowserError && (_jsx("span", { className: styles.inlineError, children: workspaceBrowserError })), workspaceActionMessage && !workspaceBrowserError && (_jsx("span", { className: styles.inlineSuccess, children: workspaceActionMessage })), _jsxs("div", { className: styles.fileBrowser, "aria-label": "Workspace files", children: [isLoadingWorkspaceEntries && (_jsx("span", { className: styles.mutedText, children: "Loading files..." })), !isLoadingWorkspaceEntries && workspaceEntries.length === 0 && !workspaceBrowserError && (_jsx("span", { className: styles.mutedText, children: "No files in this directory" })), !isLoadingWorkspaceEntries && workspaceEntries.map(entry => {
                                            const entryPath = joinWorkspacePath(workspacePath, entry.name);
                                            return (_jsxs("div", { className: entry.type === 'directory' ? styles.fileEntryDirectory : styles.fileEntry, title: entry.name, children: [_jsxs("button", { className: styles.fileEntryMain, type: "button", onClick: () => entry.type === 'directory' ? onOpenWorkspaceEntry(entry) : onOpenWorkspacePath(entryPath), children: [_jsxs("span", { children: [_jsx(Icon, { name: entry.type === 'directory' ? 'folder' : 'file', size: 13 }), entry.type === 'directory' ? 'Folder' : 'File'] }), _jsx("strong", { children: entry.name }), _jsx("em", { children: entry.type === 'directory' ? 'Directory' : formatFileSize(entry.size) })] }), _jsxs("div", { className: styles.fileEntryActions, children: [_jsxs("button", { className: styles.textButton, type: "button", onClick: () => onOpenWorkspacePath(entryPath), children: [_jsx(Icon, { name: "external", size: 13 }), "Open"] }), _jsxs("button", { className: styles.textButton, type: "button", onClick: () => onRevealWorkspacePath(entryPath), children: [_jsx(Icon, { name: "folder-open", size: 13 }), "Reveal"] })] })] }, `${entry.type}-${entry.name}`));
                                        })] })] }), _jsxs("div", { className: styles.detailGrid, children: [_jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Model" }), _jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Provider" }), _jsx("dd", { children: activeProviderLabel })] }), _jsxs("div", { children: [_jsx("dt", { children: "Model" }), _jsx("dd", { children: appConfig?.model || activeProviderDefault.model })] }), _jsxs("div", { children: [_jsx("dt", { children: "Base URL" }), _jsx("dd", { children: appConfig?.baseUrl || activeProviderDefault.baseUrl || 'Provider default' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Context" }), _jsx("dd", { children: appConfig?.contextTokens ?? activeProviderDefault.contextTokens })] })] })] }), _jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Session" }), _jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Current" }), _jsx("dd", { title: currentSessionTitle, children: currentSessionTitle })] }), _jsxs("div", { children: [_jsx("dt", { children: "Saved chats" }), _jsx("dd", { children: sessionCount })] }), _jsxs("div", { children: [_jsx("dt", { children: "Input tokens" }), _jsx("dd", { children: tokenUsage.inputTokens })] }), _jsxs("div", { children: [_jsx("dt", { children: "Output tokens" }), _jsx("dd", { children: tokenUsage.outputTokens })] })] })] }), _jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Runtime" }), _jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "App" }), _jsx("dd", { children: appInfo ? `${appInfo.platform} ${appInfo.arch}` : 'Unknown' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Mode" }), _jsx("dd", { children: appInfo?.isDev ? 'Development' : 'Production' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Viewport" }), _jsxs("dd", { children: [viewportSize.width, " x ", viewportSize.height] })] }), _jsxs("div", { children: [_jsx("dt", { children: "State keys" }), _jsx("dd", { children: Object.keys(appState).length })] }), _jsxs("div", { children: [_jsx("dt", { children: "MCP servers" }), _jsx("dd", { children: mcpServers.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "MCP tools" }), _jsx("dd", { children: mcpTools.length })] })] })] })] })] })), visibleActiveSection === 'overview' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.detailHero, children: [_jsx("span", { className: styles.detailEyebrow, children: "Current workspace" }), _jsx("h2", { children: workspaceTitle }), _jsx("p", { title: appInfo?.workspacePath || undefined, children: appInfo?.workspacePath || 'Workspace path unavailable' })] }), _jsxs("div", { className: styles.detailGrid, children: [_jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Model" }), _jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Provider" }), _jsx("dd", { children: activeProviderLabel })] }), _jsxs("div", { children: [_jsx("dt", { children: "Model" }), _jsx("dd", { children: appConfig?.model || activeProviderDefault.model })] }), _jsxs("div", { children: [_jsx("dt", { children: "Base URL" }), _jsx("dd", { children: appConfig?.baseUrl || activeProviderDefault.baseUrl || 'Provider default' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Context" }), _jsx("dd", { children: appConfig?.contextTokens ?? activeProviderDefault.contextTokens })] })] })] }), _jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Workspace State" }), _jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Tool calls" }), _jsx("dd", { children: appConfig?.enableLlmTools ? 'Enabled' : 'Disabled' })] }), _jsxs("div", { children: [_jsx("dt", { children: "MCP servers" }), _jsx("dd", { children: mcpServers.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "MCP tools" }), _jsx("dd", { children: mcpTools.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "State keys" }), _jsx("dd", { children: Object.keys(appState).length })] })] })] })] })] })), visibleActiveSection === 'files' && (_jsxs("section", { className: styles.detailPanel, children: [_jsxs("div", { className: styles.panelHeader, children: [_jsxs("div", { children: [_jsx("h3", { children: "Files" }), _jsx("span", { title: appInfo?.workspacePath || undefined, children: workspacePath === '.' ? appInfo?.workspacePath || '.' : workspacePath })] }), _jsxs("div", { className: styles.panelActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: onGoToWorkspaceParent, disabled: workspacePath === '.' || isLoadingWorkspaceEntries, children: [_jsx(Icon, { name: "arrow-left", size: 14 }), "Up"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: onRefreshWorkspace, disabled: isLoadingWorkspaceEntries, children: [_jsx(Icon, { name: "refresh", size: 14 }), "Refresh"] })] })] }), workspaceBrowserError && (_jsx("span", { className: styles.inlineError, children: workspaceBrowserError })), workspaceActionMessage && !workspaceBrowserError && (_jsx("span", { className: styles.inlineSuccess, children: workspaceActionMessage })), _jsxs("div", { className: styles.fileBrowser, "aria-label": "Workspace files", children: [isLoadingWorkspaceEntries && (_jsx("span", { className: styles.mutedText, children: "Loading files..." })), !isLoadingWorkspaceEntries && workspaceEntries.length === 0 && !workspaceBrowserError && (_jsx("span", { className: styles.mutedText, children: "No files in this directory" })), !isLoadingWorkspaceEntries && workspaceEntries.map(entry => {
                                    const entryPath = joinWorkspacePath(workspacePath, entry.name);
                                    return (_jsxs("div", { className: entry.type === 'directory' ? styles.fileEntryDirectory : styles.fileEntry, title: entry.name, children: [_jsxs("button", { className: styles.fileEntryMain, type: "button", onClick: () => entry.type === 'directory' ? onOpenWorkspaceEntry(entry) : onOpenWorkspacePath(entryPath), children: [_jsxs("span", { children: [_jsx(Icon, { name: entry.type === 'directory' ? 'folder' : 'file', size: 13 }), entry.type === 'directory' ? 'Folder' : 'File'] }), _jsx("strong", { children: entry.name }), _jsx("em", { children: entry.type === 'directory' ? 'Directory' : formatFileSize(entry.size) })] }), _jsxs("div", { className: styles.fileEntryActions, children: [_jsxs("button", { className: styles.textButton, type: "button", onClick: () => onOpenWorkspacePath(entryPath), children: [_jsx(Icon, { name: "external", size: 13 }), "Open"] }), _jsxs("button", { className: styles.textButton, type: "button", onClick: () => onRevealWorkspacePath(entryPath), children: [_jsx(Icon, { name: "folder-open", size: 13 }), "Reveal"] })] })] }, `${entry.type}-${entry.name}`));
                                })] })] })), visibleActiveSection === 'session' && (_jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Session" }), _jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Current" }), _jsx("dd", { title: currentSessionTitle, children: currentSessionTitle })] }), _jsxs("div", { children: [_jsx("dt", { children: "Saved chats" }), _jsx("dd", { children: sessionCount })] }), _jsxs("div", { children: [_jsx("dt", { children: "Input tokens" }), _jsx("dd", { children: tokenUsage.inputTokens })] }), _jsxs("div", { children: [_jsx("dt", { children: "Output tokens" }), _jsx("dd", { children: tokenUsage.outputTokens })] })] })] })), visibleActiveSection === 'runtime' && (_jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Runtime" }), _jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "App" }), _jsx("dd", { children: appInfo ? `${appInfo.platform} ${appInfo.arch}` : 'Unknown' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Mode" }), _jsx("dd", { children: appInfo?.isDev ? 'Development' : 'Production' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Viewport" }), _jsxs("dd", { children: [viewportSize.width, " x ", viewportSize.height] })] }), _jsxs("div", { children: [_jsx("dt", { children: "State keys" }), _jsx("dd", { children: Object.keys(appState).length })] }), _jsxs("div", { children: [_jsx("dt", { children: "MCP servers" }), _jsx("dd", { children: mcpServers.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "MCP tools" }), _jsx("dd", { children: mcpTools.length })] })] })] }))] }));
    }
    function ToolsView({ activeSection, tools, mcpTools, mcpServers, appConfig, routerMessage, toolActivities, onToggleModelTool, onApplyToolPreset, onSetToolPermission, onApplyPermissionPreset, onRunCommand, onOpenWorkspacePath, onRevealWorkspacePath, onRefresh, onClearActivities, }) {
        const exposedToolCount = tools.filter(tool => isToolExposedToModel(tool, appConfig)).length;
        const toolGroups = groupToolsByCategory(tools);
        const policyCounts = tools.reduce((counts, tool) => {
            counts[getToolPermissionPolicy(tool, appConfig)] += 1;
            return counts;
        }, { allow: 0, ask: 0, deny: 0 });
        return (_jsxs("section", { className: styles.detailView, "aria-label": "Tools", children: [(activeSection === 'bridge' || activeSection === 'mcp') && (_jsx("div", { className: styles.pageActionBar, children: _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: onRefresh, children: [_jsx(Icon, { name: "refresh", size: 14 }), "Refresh"] }) })), activeSection === 'bridge' && (_jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Bridge Tools" }), _jsxs("div", { className: styles.toolRouterSummary, children: [_jsxs("div", { children: [_jsx("span", { children: "Model exposure" }), _jsxs("strong", { children: [exposedToolCount, " / ", tools.length] })] }), _jsxs("div", { children: [_jsx("span", { children: "Tool calls" }), _jsx("strong", { children: appConfig?.enableLlmTools ? 'Enabled' : 'Disabled' })] }), _jsxs("div", { children: [_jsx("span", { children: "Ask policy" }), _jsx("strong", { children: policyCounts.ask })] }), _jsxs("div", { children: [_jsx("span", { children: "Denied" }), _jsx("strong", { children: policyCounts.deny })] })] }), _jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onApplyToolPreset('all'), children: [_jsx(Icon, { name: "check", size: 14 }), "Expose all"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onApplyToolPreset('read-only'), children: [_jsx(Icon, { name: "shield", size: 14 }), "Read-only only"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onApplyToolPreset('mutating-off'), children: [_jsx(Icon, { name: "x", size: 14 }), "Hide mutating"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onApplyPermissionPreset('allow-all'), children: [_jsx(Icon, { name: "check", size: 14 }), "Allow all"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onApplyPermissionPreset('ask-mutating'), children: [_jsx(Icon, { name: "shield", size: 14 }), "Ask mutating"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onApplyPermissionPreset('deny-mutating'), children: [_jsx(Icon, { name: "lock", size: 14 }), "Deny mutating"] })] }), routerMessage && _jsx("span", { className: styles.toolRouterMessage, children: routerMessage }), _jsxs("div", { className: styles.toolCatalog, children: [toolGroups.map(group => (_jsxs("section", { className: styles.toolCatalogGroup, children: [_jsx("h4", { children: group.label }), group.tools.map(tool => {
                                            const exposed = isToolExposedToModel(tool, appConfig);
                                            const permission = getToolPermissionPolicy(tool, appConfig);
                                            return (_jsxs("article", { className: styles.toolCatalogItem, children: [_jsxs("div", { children: [_jsx("strong", { children: tool.name }), _jsx("span", { children: tool.readOnly ? 'Read-only' : 'Can change workspace' })] }), _jsx("p", { children: tool.description }), _jsxs("div", { className: styles.toolExposureRow, children: [_jsx("span", { children: exposed ? 'Exposed to model' : 'Hidden from model' }), _jsxs("button", { className: exposed ? styles.toolExposureButton : styles.toolExposureButtonOff, type: "button", onClick: () => onToggleModelTool(tool.name, !exposed), children: [_jsx(Icon, { name: exposed ? 'x' : 'check', size: 13 }), exposed ? 'Hide' : 'Expose'] })] }), _jsxs("label", { className: styles.toolPermissionRow, children: [_jsx("span", { children: "Permission" }), _jsx("select", { value: permission, onChange: event => onSetToolPermission(tool.name, event.target.value), children: TOOL_PERMISSION_OPTIONS.map(option => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] })] }, tool.name));
                                        })] }, group.id))), tools.length === 0 && _jsx("span", { className: styles.mutedText, children: "No bridge tools available" })] })] })), activeSection === 'mcp' && (_jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "MCP Registry" }), _jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Servers" }), _jsx("dd", { children: mcpServers.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "Tools" }), _jsx("dd", { children: mcpTools.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "Execution policy" }), _jsx("dd", { children: getToolPermissionPolicy({ name: 'mcp.callTool', description: '', inputSchema: {} }, appConfig) })] })] }), _jsxs("div", { className: styles.toolCatalog, children: [mcpServers.map(server => (_jsxs("article", { className: styles.toolCatalogItem, children: [_jsxs("div", { children: [_jsx("strong", { children: server.name }), _jsx("span", { className: [
                                                        styles.toolStatusBadge,
                                                        server.status === 'connected' ? styles.toolStatusConnected : '',
                                                        server.status === 'error' ? styles.toolStatusError : '',
                                                    ].filter(Boolean).join(' '), children: server.status })] }), _jsxs("p", { children: [server.type, server.scope ? ` / ${server.scope}` : '', server.error ? ` / ${server.error}` : ''] })] }, `${server.scope ?? 'unknown'}-${server.name}`))), mcpServers.length === 0 && _jsx("span", { className: styles.mutedText, children: "No MCP servers configured" })] }), _jsxs("div", { className: styles.tagList, children: [mcpTools.map(tool => (_jsxs("span", { className: styles.tag, children: [tool.serverScope ? `${tool.serverScope}:` : '', tool.serverName, ".", tool.toolName] }, `${tool.serverKey ?? tool.serverName}-${tool.toolName}`))), mcpTools.length === 0 && _jsx("span", { className: styles.mutedText, children: "No executable stdio MCP tools discovered yet" })] })] })), activeSection === 'command' && (_jsx(RunCommandPanel, { onRunCommand: onRunCommand })), activeSection === 'activity' && (_jsx(ToolActivityPanel, { activities: toolActivities, onClear: onClearActivities, onOpenWorkspacePath: onOpenWorkspacePath, onRevealWorkspacePath: onRevealWorkspacePath })), activeSection === 'plugins' && (_jsx(PluginSkillPanel, { appConfig: appConfig }))] }));
    }
    function HistoryView({ activeSection, records, storageInfo, message, exportText, onRefresh, onDeleteRecord, onRestoreChat, onExportRecords, }) {
        const automationRecords = records.filter(record => record.type === 'automation-run');
        const projectEventRecords = records.filter(record => record.type === 'project-event');
        const projectActivityRecords = records.filter(record => record.type === 'automation-run' || record.type === 'project-event');
        const visibleRecords = activeSection === 'automation'
            ? automationRecords
            : activeSection === 'events'
                ? projectEventRecords
                : projectActivityRecords;
        const [historyDeleteTarget, setHistoryDeleteTarget] = useState(null);
        function openHistoryDeleteConfirmation(record) {
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
            return (_jsx(WorkbenchEditorPanel, { title: "Delete record", subtitle: historyDeleteTarget.name, onClose: closeHistoryDeleteConfirmation, footer: (_jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.dangerButton, type: "button", onClick: confirmHistoryDelete, children: [_jsx(Icon, { name: "trash", size: 14 }), "Confirm Delete"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: closeHistoryDeleteConfirmation, children: [_jsx(Icon, { name: "x", size: 14 }), "Cancel"] })] })), children: _jsxs("section", { className: styles.deleteConfirmation, children: [_jsx("strong", { children: historyDeleteTarget.detail }), _jsx("span", { children: "This action updates local History state immediately." }), _jsx("ul", { children: historyDeleteTarget.impact.map(item => (_jsx("li", { children: item }, item))) })] }) }));
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
        return (_jsx("section", { className: styles.settingsView, "aria-label": "Project activity", children: _jsx("div", { className: `${styles.settingsDialog} ${styles.settingsPageForm}`, role: "region", "aria-label": "Project activity", children: _jsxs("div", { className: historyDeleteTarget ? `${styles.settingsContent} ${styles.workbenchSplitWithRail}` : styles.settingsContent, children: [_jsx("div", { className: styles.pageActionBar, children: _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: onRefresh, children: [_jsx(Icon, { name: "refresh", size: 14 }), "Refresh"] }) }), message && _jsx("p", { className: styles.inlineSuccess, children: message }), historyDeleteTarget && renderHistoryDeleteConfirmation(), activeSection === 'overview' && (_jsxs(_Fragment, { children: [_jsxs(SettingsSection, { title: "Storage", children: [_jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Records" }), _jsx("dd", { children: projectActivityRecords.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "Automation" }), _jsx("dd", { children: automationRecords.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "Project events" }), _jsx("dd", { children: projectEventRecords.length })] })] }), _jsxs("p", { className: styles.mutedText, title: storageInfo.storagePath, children: ["Storage path: ", storageInfo.storagePath || 'Unavailable'] })] }), _jsx(HistoryRecordList, { records: projectActivityRecords.slice(0, 12), onRequestDeleteRecord: openHistoryDeleteConfirmation, onRestoreChat: onRestoreChat })] })), (activeSection === 'automation' || activeSection === 'events') && (_jsx(HistoryRecordList, { records: visibleRecords, onRequestDeleteRecord: openHistoryDeleteConfirmation, onRestoreChat: onRestoreChat })), activeSection === 'export' && (_jsxs(_Fragment, { children: [_jsxs(SettingsSection, { title: "Export History", children: [_jsx("p", { className: styles.mutedText, children: "Exports are local JSON snapshots. They do not include provider API keys." }), _jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onExportRecords('automation-run'), children: [_jsx(Icon, { name: "bot", size: 14 }), "Export Automation"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onExportRecords('project-event'), children: [_jsx(Icon, { name: "activity", size: 14 }), "Export Project Events"] })] })] }), _jsxs(SettingsSection, { title: "Export Data", children: [_jsx("textarea", { value: exportText, readOnly: true, rows: 14, placeholder: "Choose an export option above." }), _jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", disabled: !exportText, onClick: copyExportText, children: [_jsx(Icon, { name: "file", size: 14 }), "Copy JSON"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", disabled: !exportText, onClick: downloadExportText, children: [_jsx(Icon, { name: "download", size: 14 }), "Download JSON"] })] })] })] }))] }) }) }));
    }
    function HistoryRecordList({ records, onRequestDeleteRecord, onRestoreChat, }) {
        return (_jsx(SettingsSection, { title: "Records", children: _jsxs("div", { className: styles.toolCatalog, children: [records.map(record => (_jsxs("article", { className: styles.toolCatalogItem, children: [_jsxs("div", { children: [_jsx("strong", { children: getHistoryRecordTitle(record) }), _jsx("span", { children: getHistoryRecordTypeLabel(record.type) })] }), _jsx("p", { children: getHistoryRecordSummary(record) }), _jsx("p", { children: new Date(record.updatedAt).toLocaleString() }), record.workspacePath && _jsxs("p", { title: record.workspacePath, children: ["Workspace: ", record.workspacePath] }), _jsxs("div", { className: styles.toolRouterActions, children: [record.type === 'chat-session' && (_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onRestoreChat(record), children: [_jsx(Icon, { name: "rotate", size: 14 }), "Restore Chat"] })), _jsxs("button", { className: styles.dangerButton, type: "button", onClick: () => onRequestDeleteRecord(record), children: [_jsx(Icon, { name: "trash", size: 14 }), "Delete"] })] })] }, record.id))), records.length === 0 && _jsx("span", { className: styles.mutedText, children: "No history records in this section." })] }) }));
    }
    function createAutomationDraftId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
    function createVirtualTeamMemberDraft(role = 'Developer') {
        return {
            id: createAutomationDraftId('member'),
            name: role,
            role,
            goal: getDefaultTeamGoal(role),
            tools: getDefaultTeamTools(role),
        };
    }
    function createVirtualTeamDraft(workspacePath, providerId) {
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
    function cloneVirtualTeamForDraft(team, workspacePath) {
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
    function getTeamPermissionLabel(mode) {
        return mode === 'supervised' ? 'Supervised' : 'Full access';
    }
    function formatTeamTools(tools) {
        return tools.join(', ');
    }
    function createPermissionTool(toolName) {
        const readOnly = !['bash.run', 'fs.write', 'fs.undoLastWrite', 'mcp.callTool'].includes(toolName);
        return {
            name: toolName,
            description: '',
            inputSchema: {},
            readOnly,
        };
    }
    function AutomationView({ providerId, activeSection, skills, tasks, taskRuns, schedulerStatus, remoteControl, teams, teamRuns, runningTeamIds, roles, employees, appConfig, workspacePath, message, exportText, importText, onRefresh, onSetSkillEnabled, onExportProject, onImportTextChange, onImportProject, onSaveTask, onRunTask, onSetTaskEnabled, onDeleteTask, onUpdateRemoteControl, onCreatePairingCode, onRevokeRemoteDevice, onCreateDefaultTeam, onSaveTeam, onRunTeam, onDeleteTeam, onSetToolPermission, onApplyPermissionPreset, }) {
        const [taskName, setTaskName] = useState('Daily project check');
        const [taskPrompt, setTaskPrompt] = useState('Summarize git status, failing tests, and next actions for this workspace.');
        const [taskInterval, setTaskInterval] = useState(1440);
        const [taskRetryEnabled, setTaskRetryEnabled] = useState(false);
        const [taskMaxRetries, setTaskMaxRetries] = useState(1);
        const [taskRetryDelay, setTaskRetryDelay] = useState(15);
        const [taskNotifySuccess, setTaskNotifySuccess] = useState(false);
        const [taskNotifyFailure, setTaskNotifyFailure] = useState(true);
        const [taskNotificationChannel, setTaskNotificationChannel] = useState('desktop');
        const [taskMissedRunPolicy, setTaskMissedRunPolicy] = useState('run-once');
        const [taskDraftId, setTaskDraftId] = useState('');
        const [taskEnabled, setTaskEnabled] = useState(true);
        const [deviceName, setDeviceName] = useState('Phone');
        const [selectedTeamId, setSelectedTeamId] = useState('');
        const [selectedSharedEmployeeId, setSelectedSharedEmployeeId] = useState('');
        const [teamDraft, setTeamDraft] = useState(() => createVirtualTeamDraft(workspacePath, providerId));
        const [automationEditorPanel, setAutomationEditorPanel] = useState(null);
        const [automationDeleteTarget, setAutomationDeleteTarget] = useState(null);
        const [scheduledTaskView, setScheduledTaskView] = useState('table');
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
        function openAutomationDeleteConfirmation(target) {
            setAutomationDeleteTarget(target);
            setAutomationEditorPanel('delete');
        }
        function confirmAutomationDelete() {
            if (!automationDeleteTarget) {
                return;
            }
            if (automationDeleteTarget.kind === 'task') {
                onDeleteTask(automationDeleteTarget.id);
            }
            else if (automationDeleteTarget.kind === 'team') {
                onDeleteTeam(automationDeleteTarget.id);
            }
            else if (automationDeleteTarget.kind === 'device') {
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
        function openTaskEditor(task) {
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
        function selectTeam(team) {
            setSelectedTeamId(team.id);
            setTeamDraft(cloneVirtualTeamForDraft(team, workspacePath));
            setAutomationDeleteTarget(null);
            setAutomationEditorPanel('team');
        }
        function updateTeamDraft(update) {
            setTeamDraft(current => ({
                ...current,
                ...update,
                updatedAt: Date.now(),
            }));
        }
        function updateTeamMember(index, update) {
            setTeamDraft(current => {
                const members = current.members.map((member, memberIndex) => (memberIndex === index ? { ...member, ...update } : member));
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
        function addSharedEmployeeToTeam(employeeId) {
            const employee = employees.find(candidate => candidate.id === employeeId);
            if (!employee) {
                return;
            }
            const role = getEmployeeRoleDefinition(employee, roles);
            const member = {
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
        function deleteTeamMember(memberId) {
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
        function buildScheduledTaskDeleteTarget(task) {
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
        function buildAutomationTeamDeleteTarget(team) {
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
        function buildRemoteDeviceDeleteTarget(device) {
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
        function getScheduledTaskPolicyLabels(task) {
            const retryLabel = task.retryPolicy?.enabled
                ? `${task.retryAttempts ?? 0}/${task.retryPolicy.maxRetries} retry`
                : 'Retry off';
            const notifyLabel = `${task.notificationPolicy?.channel ?? 'desktop'} notifications`;
            return { retryLabel, notifyLabel };
        }
        function renderScheduledTaskRow(task) {
            const { retryLabel, notifyLabel } = getScheduledTaskPolicyLabels(task);
            return (_jsxs("article", { className: styles.workbenchRecordRow, children: [_jsxs("div", { className: styles.workbenchRecordPrimary, children: [_jsx("strong", { children: task.name }), _jsxs("span", { children: [task.enabled ? 'Enabled' : 'Disabled', " / ", task.lastStatus ?? 'never run'] })] }), _jsxs("span", { className: styles.workbenchRecordCell, children: ["Every ", task.intervalMinutes, " min"] }), _jsxs("span", { className: styles.workbenchRecordCell, title: new Date(task.nextRunAt).toLocaleString(), children: ["Next ", new Date(task.nextRunAt).toLocaleString()] }), _jsxs("span", { className: styles.workbenchRecordCell, title: `${task.prompt} / ${retryLabel} / ${notifyLabel}`, children: [retryLabel, " / ", notifyLabel] }), _jsxs("div", { className: `${styles.workbenchRecordActions} ${styles.workbenchRecordActionsWide}`, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openTaskEditor(task), children: [_jsx(Icon, { name: "edit", size: 14 }), "Edit"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onRunTask(task.id), children: [_jsx(Icon, { name: "play", size: 14 }), "Run Now"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onSetTaskEnabled(task.id, !task.enabled), children: [_jsx(Icon, { name: task.enabled ? 'pause' : 'play', size: 14 }), task.enabled ? 'Disable' : 'Enable'] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openAutomationDeleteConfirmation(buildScheduledTaskDeleteTarget(task)), children: [_jsx(Icon, { name: "trash", size: 14 }), "Delete"] })] })] }, task.id));
        }
        function renderScheduledTaskCard(task) {
            const { retryLabel, notifyLabel } = getScheduledTaskPolicyLabels(task);
            return (_jsxs("article", { className: styles.projectCard, children: [_jsx("div", { className: styles.projectCardHeader, children: _jsxs("div", { children: [_jsx("strong", { children: task.name }), _jsxs("span", { children: [task.enabled ? 'Enabled' : 'Disabled', " / ", task.lastStatus ?? 'never run'] })] }) }), _jsx("p", { title: task.prompt, children: task.prompt }), _jsxs("dl", { className: styles.projectCardMeta, children: [_jsxs("div", { children: [_jsx("dt", { children: "Cadence" }), _jsxs("dd", { children: ["Every ", task.intervalMinutes, " min"] })] }), _jsxs("div", { children: [_jsx("dt", { children: "Next Run" }), _jsx("dd", { title: new Date(task.nextRunAt).toLocaleString(), children: new Date(task.nextRunAt).toLocaleString() })] })] }), _jsxs("div", { className: styles.projectChipList, children: [_jsx("span", { className: styles.projectChip, children: retryLabel }), _jsx("span", { className: styles.projectChip, children: notifyLabel }), _jsx("span", { className: styles.projectChip, children: task.missedRunPolicy ?? 'run-once' })] }), _jsxs("div", { className: styles.projectCardActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openTaskEditor(task), children: [_jsx(Icon, { name: "edit", size: 14 }), "Edit"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onRunTask(task.id), children: [_jsx(Icon, { name: "play", size: 14 }), "Run Now"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onSetTaskEnabled(task.id, !task.enabled), children: [_jsx(Icon, { name: task.enabled ? 'pause' : 'play', size: 14 }), task.enabled ? 'Disable' : 'Enable'] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => openAutomationDeleteConfirmation(buildScheduledTaskDeleteTarget(task)), children: [_jsx(Icon, { name: "trash", size: 14 }), "Delete"] })] })] }, task.id));
        }
        function renderAutomationTeamRow(team) {
            const teamIsRunning = runningTeamIds.has(team.id) || team.lastStatus === 'running';
            const status = teamIsRunning ? 'running' : team.status;
            const governance = `${team.maxIterations ?? 1} iteration(s) / QA ${team.providerConfig?.requireQaSignoff === true ? 'required' : 'optional'}`;
            const rowClassName = team.id === selectedTeamId
                ? `${styles.workbenchRecordRow} ${styles.workbenchRecordRowSelected}`
                : styles.workbenchRecordRow;
            return (_jsxs("article", { className: rowClassName, children: [_jsxs("div", { className: styles.workbenchRecordPrimary, children: [_jsx("strong", { children: team.name }), _jsx("span", { title: team.workspacePath ?? workspacePath, children: team.workspacePath ?? workspacePath })] }), _jsxs("span", { className: styles.workbenchRecordCell, children: [status, " / ", getTeamPermissionLabel(team.permissionMode)] }), _jsxs("span", { className: styles.workbenchRecordCell, children: [team.members.length, " member(s) / ", governance] }), _jsx("span", { className: styles.workbenchRecordCell, title: `${team.objective}${team.lastResult ? ` / ${team.lastResult}` : ''}`, children: team.objective }), _jsxs("div", { className: `${styles.workbenchRecordActions} ${styles.workbenchRecordActionsWide}`, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => selectTeam(team), disabled: teamIsRunning, children: [_jsx(Icon, { name: "edit", size: 14 }), "Edit"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onRunTeam(team.id), disabled: teamIsRunning, children: [_jsx(Icon, { name: teamIsRunning ? 'activity' : 'play', size: 14 }), teamIsRunning ? 'Running...' : 'Run Team'] }), _jsxs("button", { className: styles.dangerButton, type: "button", onClick: () => openAutomationDeleteConfirmation(buildAutomationTeamDeleteTarget(team)), disabled: teamIsRunning, children: [_jsx(Icon, { name: "trash", size: 14 }), "Delete"] })] })] }, team.id));
        }
        function renderAutomationDeleteConfirmation() {
            if (!automationDeleteTarget) {
                return null;
            }
            return (_jsx(WorkbenchEditorPanel, { title: `Delete ${automationDeleteTarget.kind}`, subtitle: automationDeleteTarget.name, onClose: closeAutomationEditorPanel, footer: (_jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.dangerButton, type: "button", onClick: confirmAutomationDelete, children: [_jsx(Icon, { name: "trash", size: 14 }), "Confirm Delete"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: closeAutomationEditorPanel, children: [_jsx(Icon, { name: "x", size: 14 }), "Cancel"] })] })), children: _jsxs("section", { className: styles.deleteConfirmation, children: [_jsx("strong", { children: automationDeleteTarget.detail }), _jsx("span", { children: "This action updates local Automation state immediately." }), _jsx("ul", { children: automationDeleteTarget.impact.map(item => (_jsx("li", { children: item }, item))) })] }) }));
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
        return (_jsx("section", { className: styles.settingsView, "aria-label": "Automation", children: _jsx("div", { className: `${styles.settingsDialog} ${styles.settingsPageForm}`, role: "region", "aria-label": "Automation", children: _jsxs("div", { className: styles.settingsContent, children: [_jsx("div", { className: styles.pageActionBar, children: _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: onRefresh, children: [_jsx(Icon, { name: "refresh", size: 14 }), "Refresh"] }) }), message && _jsx("p", { className: styles.inlineSuccess, children: message }), activeSection === 'skills' && (_jsxs(_Fragment, { children: [_jsxs(SettingsSection, { title: "Workspace Skills", children: [_jsx("p", { className: styles.mutedText, children: "Workspace skills are discovered from `.code-agent/skills` and `skills`." }), _jsxs("div", { className: styles.toolCatalog, children: [skills.map(skill => (_jsxs("article", { className: styles.toolCatalogItem, children: [_jsxs("div", { children: [_jsx("strong", { children: skill.name }), _jsxs("span", { children: [skill.enabled ? 'Enabled' : 'Disabled', " / ", skill.source] })] }), _jsx("p", { children: skill.description || 'No description provided.' }), _jsx("p", { title: skill.path, children: skill.path }), _jsx("div", { className: styles.toolRouterActions, children: _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onSetSkillEnabled(skill.id, !skill.enabled), children: [_jsx(Icon, { name: skill.enabled ? 'pause' : 'play', size: 14 }), skill.enabled ? 'Disable' : 'Enable'] }) })] }, skill.id))), skills.length === 0 && _jsx("span", { className: styles.mutedText, children: "No workspace skills found yet." })] })] }), _jsxs(SettingsSection, { title: "Shareable Project Bundle", children: [_jsx("p", { className: styles.mutedText, children: "Export tasks, teams, and skill policies for this workspace. Local remote devices, API keys, and pairing secrets are not included." }), _jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onExportProject(false), children: [_jsx(Icon, { name: "download", size: 14 }), "Export Config"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onExportProject(true), children: [_jsx(Icon, { name: "archive", size: 14 }), "Export With Runs"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", disabled: !exportText, onClick: copyAutomationExportText, children: [_jsx(Icon, { name: "file", size: 14 }), "Copy Export"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", disabled: !exportText, onClick: downloadAutomationExportText, children: [_jsx(Icon, { name: "download", size: 14 }), "Download Export"] }), _jsxs("button", { className: styles.primaryButton, type: "button", onClick: onImportProject, disabled: !importText.trim(), children: [_jsx(Icon, { name: "folder-open", size: 14 }), "Import JSON"] })] }), _jsxs("div", { className: styles.settingsGrid, children: [_jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Export JSON" }), _jsx("textarea", { value: exportText, readOnly: true, rows: 8, placeholder: "Exported automation JSON appears here." })] }), _jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Import JSON" }), _jsx("textarea", { value: importText, onChange: event => onImportTextChange(event.target.value), rows: 8, placeholder: "Paste a CodeAgent automation export JSON object." })] })] })] })] })), activeSection === 'tasks' && (_jsxs("div", { className: taskRailOpen ? `${styles.workbenchSplit} ${styles.workbenchSplitWithRail}` : styles.workbenchSplit, children: [_jsxs("div", { className: styles.workbenchMainStack, children: [_jsxs(SettingsSection, { title: "Scheduler", children: [_jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Status" }), _jsx("dd", { children: schedulerStatus.running ? 'Running' : 'Stopped' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Tick" }), _jsxs("dd", { children: [Math.round(schedulerStatus.intervalMs / 1000), "s"] })] }), _jsxs("div", { children: [_jsx("dt", { children: "Active tasks" }), _jsx("dd", { children: schedulerStatus.runningTaskIds.length })] })] }), _jsx("p", { className: styles.mutedText, children: "Scheduled tasks use the bridge tool permission policy below. Virtual teams can also be set to full access in the team panel when trusted autonomous work should not pause for approvals." }), _jsx("div", { className: styles.toolRouterActions, children: _jsx("button", { className: styles.primaryButton, type: "button", onClick: openNewTaskEditor, children: "New Task" }) })] }), _jsxs(SettingsSection, { title: "Configured Tasks", children: [_jsx("div", { className: styles.recordSectionToolbar, children: _jsx(RecordViewToggle, { view: scheduledTaskView, onChange: setScheduledTaskView, label: "Scheduled task list view" }) }), scheduledTaskView === 'table' ? (_jsxs("div", { className: styles.workbenchRecordList, children: [_jsxs("div", { className: `${styles.workbenchRecordRow} ${styles.workbenchRecordHeader}`, children: [_jsx("span", { children: "Task" }), _jsx("span", { children: "Cadence" }), _jsx("span", { children: "Next run" }), _jsx("span", { children: "Policy" }), _jsx("span", { children: "Actions" })] }), tasks.map(task => renderScheduledTaskRow(task)), tasks.length === 0 && _jsx("span", { className: styles.workbenchEmptyState, children: "No scheduled tasks configured." })] })) : (_jsxs("div", { className: styles.recordCardGrid, children: [tasks.map(task => renderScheduledTaskCard(task)), tasks.length === 0 && _jsx("span", { className: styles.workbenchEmptyState, children: "No scheduled tasks configured." })] }))] }), _jsx(SettingsSection, { title: "Recent Task Runs", children: _jsxs("div", { className: styles.toolCatalog, children: [taskRuns.slice(0, 8).map(run => (_jsxs("article", { className: styles.toolCatalogItem, children: [_jsxs("div", { children: [_jsx("strong", { children: run.taskName }), _jsx("span", { children: run.status })] }), _jsx("p", { children: run.result ?? run.error ?? 'Running...' }), _jsx("p", { children: new Date(run.startedAt).toLocaleString() })] }, run.id))), taskRuns.length === 0 && _jsx("span", { className: styles.mutedText, children: "No task runs yet." })] }) })] }), automationEditorPanel === 'task' && (_jsx(WorkbenchEditorPanel, { title: taskDraftId ? 'Edit Scheduled Task' : 'New Scheduled Task', subtitle: "Prompt, cadence, retries, notifications, and missed-run handling", onClose: closeAutomationEditorPanel, footer: (_jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.primaryButton, type: "button", onClick: saveTaskDraft, children: [_jsx(Icon, { name: "save", size: 14 }), "Save Task"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: openNewTaskEditor, children: [_jsx(Icon, { name: "rotate", size: 14 }), "Reset New"] })] })), children: _jsxs("div", { className: styles.settingsGrid, children: [_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Name" }), _jsx("input", { value: taskName, onChange: event => setTaskName(event.target.value) })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Enabled" }), _jsxs("select", { value: taskEnabled ? 'yes' : 'no', onChange: event => setTaskEnabled(event.target.value === 'yes'), children: [_jsx("option", { value: "yes", children: "Yes" }), _jsx("option", { value: "no", children: "No" })] })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Interval minutes" }), _jsx("input", { type: "number", min: 1, value: taskInterval, onChange: event => setTaskInterval(Math.max(1, Number(event.target.value) || 1)) })] }), _jsxs("label", { className: `${styles.field} ${styles.fieldWide}`, children: [_jsx("span", { children: "Prompt" }), _jsx("textarea", { value: taskPrompt, onChange: event => setTaskPrompt(event.target.value), rows: 4 })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Retry failed runs" }), _jsxs("select", { value: taskRetryEnabled ? 'enabled' : 'disabled', onChange: event => setTaskRetryEnabled(event.target.value === 'enabled'), children: [_jsx("option", { value: "disabled", children: "Disabled" }), _jsx("option", { value: "enabled", children: "Enabled" })] })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Max retries" }), _jsx("input", { type: "number", min: 0, max: 10, value: taskMaxRetries, onChange: event => setTaskMaxRetries(Math.max(0, Math.min(10, Number(event.target.value) || 0))) })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Retry delay minutes" }), _jsx("input", { type: "number", min: 1, max: 1440, value: taskRetryDelay, onChange: event => setTaskRetryDelay(Math.max(1, Math.min(1440, Number(event.target.value) || 1))) })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Notify on success" }), _jsxs("select", { value: taskNotifySuccess ? 'yes' : 'no', onChange: event => setTaskNotifySuccess(event.target.value === 'yes'), children: [_jsx("option", { value: "no", children: "No" }), _jsx("option", { value: "yes", children: "Yes" })] })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Notify on failure" }), _jsxs("select", { value: taskNotifyFailure ? 'yes' : 'no', onChange: event => setTaskNotifyFailure(event.target.value === 'yes'), children: [_jsx("option", { value: "yes", children: "Yes" }), _jsx("option", { value: "no", children: "No" })] })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Notification channel" }), _jsxs("select", { value: taskNotificationChannel, onChange: event => setTaskNotificationChannel(event.target.value), children: [_jsx("option", { value: "desktop", children: "Desktop" }), _jsx("option", { value: "remote", children: "Remote" }), _jsx("option", { value: "none", children: "None" })] })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Missed runs" }), _jsxs("select", { value: taskMissedRunPolicy, onChange: event => setTaskMissedRunPolicy(event.target.value), children: [_jsx("option", { value: "run-once", children: "Run once after restart" }), _jsx("option", { value: "skip", children: "Skip and resume schedule" })] })] })] }) })), automationEditorPanel === 'delete' && automationDeleteTarget?.kind === 'task' && renderAutomationDeleteConfirmation()] })), activeSection === 'remote' && (_jsxs(_Fragment, { children: [_jsxs(SettingsSection, { title: "Remote Access", children: [_jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Status" }), _jsx("dd", { children: remoteControl.enabled ? 'Enabled' : 'Disabled' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Mode" }), _jsx("dd", { children: remoteControl.mode })] }), _jsxs("div", { children: [_jsx("dt", { children: "Devices" }), _jsx("dd", { children: remoteControl.approvedDevices.length })] }), _jsxs("div", { children: [_jsx("dt", { children: "Pending approvals" }), _jsx("dd", { children: remoteControl.pendingActions?.length ?? 0 })] })] }), _jsx("div", { className: styles.settingsGrid, children: _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Device name" }), _jsx("input", { value: deviceName, onChange: event => setDeviceName(event.target.value) })] }) }), _jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onUpdateRemoteControl({ enabled: !remoteControl.enabled, mode: remoteControl.enabled ? 'disabled' : 'local-network' }), children: [_jsx(Icon, { name: remoteControl.enabled ? 'pause' : 'play', size: 14 }), remoteControl.enabled ? 'Disable' : 'Enable'] }), _jsxs("button", { className: styles.primaryButton, type: "button", onClick: () => onCreatePairingCode(deviceName), children: [_jsx(Icon, { name: "phone", size: 14 }), "Pair Device"] })] })] }), remoteControl.pairingCode && (_jsx(SettingsSection, { title: "Pairing Code", children: _jsxs("div", { className: styles.pairingCode, children: [_jsx("span", { children: "Pairing code" }), _jsx("strong", { children: remoteControl.pairingCode }), remoteControl.pairingExpiresAt && _jsxs("em", { children: ["Expires ", new Date(remoteControl.pairingExpiresAt).toLocaleTimeString()] })] }) })), (remoteControl.serverUrl || (remoteControl.localNetworkUrls?.length ?? 0) > 0) && (_jsx(SettingsSection, { title: "Remote URL", children: _jsxs("div", { className: styles.pairingCode, children: [_jsx("span", { children: "Remote URL" }), _jsx("strong", { children: remoteControl.localNetworkUrls?.[0] ?? remoteControl.serverUrl }), remoteControl.serverUrl && _jsx("em", { children: remoteControl.serverUrl })] }) })), _jsxs(SettingsSection, { title: "Managed Relay", children: [_jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Status" }), _jsx("dd", { children: remoteControl.relay?.enrollmentStatus ?? 'not-configured' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Broker" }), _jsx("dd", { children: remoteControl.relay?.brokerUrl ?? 'Not configured' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Account" }), _jsx("dd", { children: remoteControl.relay?.accountId ?? 'Not configured' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Device" }), _jsx("dd", { children: remoteControl.relay?.deviceId ?? 'Not configured' })] })] }), _jsx("p", { className: styles.mutedText, children: "Off-network relay control stays disabled until the managed relay implements identity, encryption, token rotation, audit propagation, and emergency revocation." })] }), _jsx(SettingsSection, { title: "Approved Devices", children: _jsxs("div", { className: styles.toolCatalog, children: [remoteControl.approvedDevices.map(device => (_jsxs("article", { className: styles.toolCatalogItem, children: [_jsxs("div", { children: [_jsx("strong", { children: device.name }), _jsx("span", { children: device.lastSeenAt ? 'Seen recently' : 'Paired' })] }), _jsxs("p", { children: ["Paired ", new Date(device.createdAt).toLocaleString()] }), device.lastSeenAt && _jsxs("p", { children: ["Last seen ", new Date(device.lastSeenAt).toLocaleString()] }), _jsx("div", { className: styles.toolRouterActions, children: _jsxs("button", { className: styles.dangerButton, type: "button", onClick: () => openAutomationDeleteConfirmation(buildRemoteDeviceDeleteTarget(device)), children: [_jsx(Icon, { name: "trash", size: 14 }), "Revoke"] }) })] }, device.id))), remoteControl.approvedDevices.length === 0 && _jsx("span", { className: styles.mutedText, children: "No approved remote devices." })] }) }), _jsx(SettingsSection, { title: "Remote Audit Log", children: _jsxs("div", { className: styles.toolCatalog, children: [(remoteControl.auditLog ?? []).slice(0, 12).map(event => (_jsxs("article", { className: styles.toolCatalogItem, children: [_jsxs("div", { children: [_jsx("strong", { children: event.message }), _jsx("span", { children: event.type })] }), _jsx("p", { children: new Date(event.createdAt).toLocaleString() }), event.deviceName && _jsxs("p", { children: ["Device: ", event.deviceName] })] }, event.id))), (remoteControl.auditLog ?? []).length === 0 && _jsx("span", { className: styles.mutedText, children: "No remote-control audit events yet." })] }) }), automationEditorPanel === 'delete' && automationDeleteTarget?.kind === 'device' && renderAutomationDeleteConfirmation()] })), activeSection === 'permissions' && (_jsxs(_Fragment, { children: [_jsxs(SettingsSection, { title: "Unattended Execution Policy", children: [_jsx("p", { className: styles.mutedText, children: "Scheduled tasks and supervised virtual teams use these desktop tool policies. Full-access virtual teams skip approval popups but still stay inside workspace and command safety boundaries." }), _jsxs("div", { className: styles.toolRouterActions, children: [_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onApplyPermissionPreset('allow-all'), children: [_jsx(Icon, { name: "check", size: 14 }), "Allow All Tools"] }), _jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => onApplyPermissionPreset('ask-mutating'), children: [_jsx(Icon, { name: "shield", size: 14 }), "Ask Before Changes"] }), _jsxs("button", { className: styles.dangerButton, type: "button", onClick: () => onApplyPermissionPreset('deny-mutating'), children: [_jsx(Icon, { name: "lock", size: 14 }), "Deny Mutating Tools"] })] })] }), _jsx(SettingsSection, { title: "Key Automation Tools", children: _jsx("div", { className: styles.toolCatalog, children: AUTOMATION_PERMISSION_TOOLS.map(toolName => {
                                            const permission = getToolPermissionPolicy(createPermissionTool(toolName), appConfig);
                                            return (_jsxs("label", { className: styles.toolPermissionRow, children: [_jsx("span", { children: toolName }), _jsxs("select", { value: permission, onChange: event => onSetToolPermission(toolName, event.target.value), children: [_jsx("option", { value: "allow", children: "Allow" }), _jsx("option", { value: "ask", children: "Ask" }), _jsx("option", { value: "deny", children: "Deny" })] })] }, toolName));
                                        }) }) })] }))] }) }) }));
    }
    function RunCommandPanel({ onRunCommand, }) {
        const [command, setCommand] = useState('');
        const [cwd, setCwd] = useState('.');
        const helperCommands = [
            { label: 'Git status', command: 'git status --short --branch' },
            { label: 'Git diff', command: 'git diff --stat' },
            { label: 'Branch', command: 'git branch --show-current' },
            { label: 'NPM scripts', command: 'npm run' },
            { label: 'Dev servers', command: 'lsof -iTCP -sTCP:LISTEN -P -n' },
        ];
        return (_jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Run Command" }), _jsx("p", { className: styles.mutedText, children: "Commands run through `bash.run`, stay inside the workspace, and require approval before execution." }), _jsxs("div", { className: styles.commandRunner, children: [_jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Command" }), _jsx("input", { value: command, onChange: event => setCommand(event.target.value), placeholder: "npm test" })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { children: "Working directory" }), _jsx("input", { value: cwd, onChange: event => setCwd(event.target.value), placeholder: "." })] }), _jsxs("button", { className: styles.primaryButton, type: "button", onClick: () => onRunCommand(command, cwd), children: [_jsx(Icon, { name: "terminal", size: 14 }), "Review Run"] })] }), _jsx("div", { className: styles.toolRouterActions, children: helperCommands.map(helper => (_jsxs("button", { className: styles.secondaryButton, type: "button", onClick: () => setCommand(helper.command), children: [_jsx(Icon, { name: "terminal", size: 14 }), helper.label] }, helper.label))) })] }));
    }
    function PluginSkillPanel({ appConfig }) {
        const pluginDirs = readCliOption(appConfig, 'pluginDirs') || 'Default plugin paths';
        const agentsJson = readCliOption(appConfig, 'agentsJson') || 'Not configured';
        const mcpConfig = readCliOption(appConfig, 'mcpConfig') || 'Default MCP config';
        return (_jsxs("section", { className: styles.detailPanel, children: [_jsx("h3", { children: "Plugins & Skills" }), _jsxs("dl", { className: styles.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "Plugin dirs" }), _jsx("dd", { title: pluginDirs, children: pluginDirs })] }), _jsxs("div", { children: [_jsx("dt", { children: "Agents JSON" }), _jsx("dd", { title: agentsJson, children: agentsJson })] }), _jsxs("div", { children: [_jsx("dt", { children: "MCP config" }), _jsx("dd", { title: mcpConfig, children: mcpConfig })] })] }), _jsx("p", { className: styles.mutedText, children: "Manage plugin, skill, and MCP paths from Settings. Executable local MCP tools appear in the registry above." })] }));
    }
    return { ProjectsView, ToolsView, AutomationView, HistoryView };
}
