export interface HelpSection {
  title: string;
  bullets: string[];
}

export interface HelpVariant {
  id: string;
  title: string;
  routePatterns: string[];
  summary?: string;
  quickActions?: string[];
  sections?: HelpSection[];
}

export interface HelpTopic {
  id: string;
  title: string;
  summary: string;
  routePatterns: string[];
  sections: HelpSection[];
  quickActions?: string[];
  variants?: HelpVariant[];
}

export interface ResolvedHelpContext {
  topic: HelpTopic;
  variant?: HelpVariant;
  anchor: string;
}

export interface GuidedTourStep {
  id: string;
  title: string;
  path: string;
  selector: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  padding?: number;
  waitForMs?: number;
  purpose: string;
  fieldLevelGuidance: string[];
  generatedOutputUsage: string[];
}

export interface GuidedHelpTour {
  id: string;
  title: string;
  summary: string;
  topicId: string;
  /**
   * If set, only users with at least one of these roles will see this tour.
   * Omit or leave empty to show to all users.
   */
  requiredRoles?: string[];
  /**
   * If set, only users with at least one of these permissions will see this tour.
   * Omit or leave empty to show to all users.
   */
  requiredPermissions?: string[];
  steps: GuidedTourStep[];
}

export const helpTopics: HelpTopic[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    summary: 'Use the dashboard to monitor current activity, pending work, and module-level status at a glance.',
    routePatterns: ['/', '/dashboard'],
    quickActions: [
      'Review high-priority cards first to identify exceptions needing action.',
      'Use the module switcher in the header to jump into a working area.',
      'Move from summary widgets into detailed lists when a number needs investigation.',
    ],
    sections: [
      {
        title: 'What this page is for',
        bullets: [
          'Provides a landing view for operational status across the platform.',
          'Helps users decide which module or task needs attention next.',
        ],
      },
      {
        title: 'How to use it',
        bullets: [
          'Check totals and alerts before navigating to detailed screens.',
          'Treat dashboard values as entry points; use linked pages for edits or approvals.',
        ],
      },
    ],
  },
  {
    id: 'projects',
    title: 'Projects',
    summary: 'Manage project master records that drive task planning, execution ownership, reporting scope, and operational visibility.',
    routePatterns: ['/projects', '/projects/create', '/projects/:projectId', '/projects/:projectId/tasks', '/projects/:projectId/tasks/create'],
    quickActions: [
      'Create a project before assigning project-scoped tasks or documents.',
      'Open a project record to manage tasks, site details, and execution context.',
      'Keep project metadata current because downstream modules use it for filtering and reporting.',
    ],
    sections: [
      {
        title: 'Purpose',
        bullets: [
          'Maintains the authoritative list of projects used across tasks, submissions, dashboards, and analytics.',
          'Defines project identity and ownership so work can be correctly routed and audited.',
        ],
      },
      {
        title: 'How to use',
        bullets: [
          'Create the project first, then add project-scoped tasks from the project context.',
          'Use list filters to find active projects by status, owner, or timeline before opening details.',
          'Keep project metadata current so downstream forms and reports reflect accurate context.',
        ],
      },
      {
        title: 'Field-level guidance',
        bullets: [
          'Project name and code: use unique, searchable naming patterns that teams can recognize quickly.',
          'Business vertical and site context: set these correctly to keep access and reporting scoped properly.',
          'Dates and status: treat start date, target completion, and status as operational controls, not optional notes.',
          'Owner or responsible role: assign clear accountability so escalations and workflow tasks resolve correctly.',
        ],
      },
      {
        title: 'Generated output and usage',
        bullets: [
          'Project records become the parent context for task lists, progress tracking, and project dashboards.',
          'Project metadata is reused by reporting filters, analytics slices, and operational summaries.',
          'Accurate project setup reduces rework in task assignment, approval routing, and audit investigations.',
        ],
      },
    ],
    variants: [
      {
        id: 'list',
        title: 'Project List View',
        routePatterns: ['/projects'],
        summary: 'Use this screen to find, filter, and open projects for execution tracking.',
        quickActions: [
          'Use filters before opening records when project volume is high.',
          'Open project details to manage lifecycle actions rather than editing from summaries.',
        ],
      },
      {
        id: 'create',
        title: 'Create Project',
        routePatterns: ['/projects/create'],
        summary: 'Create a new project with complete ownership and planning metadata.',
        quickActions: [
          'Capture required metadata and validate values before saving.',
          'Add optional artifacts only after core project fields are complete.',
        ],
        sections: [
          {
            title: 'Field checklist before save',
            bullets: [
              'Use a stable project code that can be referenced in reports and integrations.',
              'Select the correct business and site context so downstream access behaves correctly.',
              'Set realistic date windows to support meaningful delay and progress analysis.',
            ],
          },
        ],
      },
      {
        id: 'project-task-list',
        title: 'Project Task List',
        routePatterns: ['/projects/:projectId/tasks'],
        summary: 'Review and manage tasks that belong to one project context.',
      },
      {
        id: 'project-task-create',
        title: 'Create Project Task',
        routePatterns: ['/projects/:projectId/tasks/create'],
        summary: 'Add a task directly under a project with correct assignment and due controls.',
      },
    ],
  },
  {
    id: 'forms',
    title: 'Form Builder',
    summary: 'Design metadata-driven forms that standardize data capture, enforce permissions, and connect directly to workflow approvals.',
    routePatterns: ['/forms', '/forms/new', '/forms/:formCode', '/forms/:formCode/preview', '/masters/business/:code/forms', '/masters/business/:code/forms/:formCode'],
    quickActions: [
      'Use consistent naming for form code, title, and module assignment.',
      'Set permission and workflow fields carefully because they control who can submit and review.',
      'Preview the form before publishing changes to business users.',
    ],
    sections: [
      {
        title: 'Purpose',
        bullets: [
          'Creates reusable form definitions used by operations, submissions, and approvals.',
          'Separates form schema from implementation code so business changes can ship faster and safer.',
        ],
      },
      {
        title: 'How to use',
        bullets: [
          'Start with a clear form purpose, then model sections and fields in the order users execute work.',
          'Attach required permission and workflow mapping before publishing to avoid unsecured submissions.',
          'Always preview and test with realistic user roles before enabling the form for production use.',
        ],
      },
      {
        title: 'Field-level guidance',
        bullets: [
          'Field label and code: use stable, human-readable labels and machine-safe keys for reporting and integrations.',
          'Field type: pick type by validation need (number/date/select/file), not by visual preference.',
          'Required and validation rules: mark fields required only when operationally mandatory to avoid user friction.',
          'Default value and help text: provide only when it reduces entry errors; avoid hidden assumptions in defaults.',
          'Dynamic options and dependencies: use conditional logic for context-aware forms, and test every branch in preview.',
        ],
      },
      {
        title: 'Generated output and usage',
        bullets: [
          'Published form definitions generate submission-ready interfaces for end users.',
          'Each submission creates structured records used by workflow transitions, review screens, and audit history.',
          'Field schema is reused by analytics and export layers, so stable field keys are critical for long-term reports.',
        ],
      },
    ],
    variants: [
      {
        id: 'list',
        title: 'Form Catalog',
        routePatterns: ['/forms', '/masters/business/:code/forms'],
        summary: 'Browse existing forms and open a definition for update or preview.',
      },
      {
        id: 'create',
        title: 'Create Form',
        routePatterns: ['/forms/new'],
        summary: 'Design a new form and align it with workflow and permission strategy.',
        sections: [
          {
            title: 'Create flow',
            bullets: [
              'Define title, code, and module first so navigation and ownership are clear.',
              'Add fields from core data to optional data, then configure validation and display logic.',
              'Bind required permission and workflow before final publish.',
            ],
          },
        ],
      },
      {
        id: 'edit',
        title: 'Edit Form',
        routePatterns: ['/forms/:formCode', '/masters/business/:code/forms/:formCode'],
        summary: 'Update an existing form carefully to avoid breaking active operational usage.',
        sections: [
          {
            title: 'Safe edit guidance',
            bullets: [
              'Avoid renaming field codes used by existing reports unless migration is planned.',
              'For major schema changes, validate against in-flight submissions and workflow states.',
            ],
          },
        ],
      },
      {
        id: 'preview',
        title: 'Form Preview',
        routePatterns: ['/forms/:formCode/preview'],
        summary: 'Validate field behavior and usability before publishing changes.',
      },
    ],
  },
  {
    id: 'tasks',
    title: 'Tasks',
    summary: 'Track operational work items, progress, assignments, approvals, and evidence on a per-task basis.',
    routePatterns: ['/tasks', '/tasks/:id'],
    quickActions: [
      'Review task status and due dates before making assignment changes.',
      'Use the task detail page for comments, evidence, and workflow actions.',
      'Keep required remarks and attachments complete where actions are controlled by workflow rules.',
    ],
    sections: [
      {
        title: 'What this page is for',
        bullets: [
          'Supports day-to-day execution and follow-up for project and operational work.',
          'Shows ownership, deadlines, and completion progress in one place.',
        ],
      },
      {
        title: 'Common actions',
        bullets: [
          'Create a task with the correct scope, assignee, and due date.',
          'Update status through the approved workflow instead of informal tracking.',
          'Use task details to capture notes and supporting evidence.',
        ],
      },
    ],
    variants: [
      {
        id: 'list',
        title: 'Task List View',
        routePatterns: ['/tasks'],
        summary: 'Use this screen to monitor and filter work queues quickly.',
      },
      {
        id: 'detail',
        title: 'Task Detail View',
        routePatterns: ['/tasks/:id'],
        summary: 'Use this screen for execution updates, remarks, workflow actions, and evidence.',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports And Dashboards',
    summary: 'Build analytics views, report definitions, and dashboard widgets that turn operational data into decision support.',
    routePatterns: [
      '/analytics/reports',
      '/analytics/reports/builder',
      '/analytics/reports/view/:id',
      '/analytics/dashboards',
      '/analytics/dashboards/builder',
      '/analytics/dashboards/view/:id',
    ],
    quickActions: [
      'Define report intent before adding fields or widgets.',
      'Validate filters and aggregation logic against real operational scenarios.',
      'Use preview or view screens to confirm chart output before wider rollout.',
    ],
    sections: [
      {
        title: 'What this page is for',
        bullets: [
          'Provides analytical builders and viewers for operational insights.',
          'Helps teams standardize how they visualize and export key business data.',
        ],
      },
      {
        title: 'Design tips',
        bullets: [
          'Prefer clear labels and limited metrics per view so the output stays actionable.',
          'Confirm that filters, date ranges, and grouping rules match business expectations.',
        ],
      },
    ],
    variants: [
      {
        id: 'report-list',
        title: 'Report Catalog',
        routePatterns: ['/analytics/reports'],
        summary: 'Browse report definitions and open report outputs.',
      },
      {
        id: 'report-builder',
        title: 'Report Builder',
        routePatterns: ['/analytics/reports/builder'],
        summary: 'Create or modify report logic, filters, and output structure.',
      },
      {
        id: 'report-view',
        title: 'Report View',
        routePatterns: ['/analytics/reports/view/:id'],
        summary: 'Inspect report output and validate chart or table correctness.',
      },
      {
        id: 'dashboard-builder',
        title: 'Dashboard Builder',
        routePatterns: ['/analytics/dashboards/builder'],
        summary: 'Compose dashboard widgets and layout for role-oriented visibility.',
      },
      {
        id: 'dashboard-view',
        title: 'Dashboard View',
        routePatterns: ['/analytics/dashboards/view/:id'],
        summary: 'Review dashboard widgets and drill down to source reports when needed.',
      },
    ],
  },
  {
    id: 'users-and-access',
    title: 'Users, Roles, Permissions, And Policies',
    summary: 'Manage user access, RBAC assignments, and authorization rules in a controlled, auditable way.',
    routePatterns: ['/users', '/rbac', '/rbac/*', '/policies', '/policies/*', '/attributes'],
    quickActions: [
      'Change permissions through roles and policies rather than one-off manual exceptions.',
      'Check business or site scope when a user should not receive system-wide access.',
      'Validate changes with realistic user scenarios after updating access rules.',
    ],
    sections: [
      {
        title: 'What this page is for',
        bullets: [
          'Controls who can see data, perform actions, and approve workflows.',
          'Provides the administrative surfaces for RBAC and ABAC configuration.',
        ],
      },
      {
        title: 'Access model guidance',
        bullets: [
          'Assign permissions to roles, then roles to users, to keep access maintainable.',
          'Use policies and attributes where rules depend on business context or ownership.',
        ],
      },
    ],
    variants: [
      {
        id: 'users',
        title: 'User Management',
        routePatterns: ['/users'],
        summary: 'Create and maintain user identities, assignments, and active status.',
      },
      {
        id: 'roles-and-permissions',
        title: 'Roles And Permissions',
        routePatterns: ['/rbac', '/rbac/*'],
        summary: 'Manage reusable permission sets and role assignments.',
      },
      {
        id: 'policies',
        title: 'ABAC Policies',
        routePatterns: ['/policies', '/policies/*'],
        summary: 'Configure policy rules that evaluate contextual attributes and conditions.',
      },
      {
        id: 'attributes',
        title: 'Attribute Management',
        routePatterns: ['/attributes'],
        summary: 'Define attribute dictionaries used in ABAC rules and evaluation contexts.',
      },
    ],
  },
  {
    id: 'documents',
    title: 'Documents',
    summary: 'Manage operational documents so teams can upload evidence, find files quickly, and maintain record traceability.',
    routePatterns: ['/documents'],
    quickActions: [
      'Use category filters first when a large document library is loaded.',
      'Keep naming and categorization consistent so retrieval stays reliable.',
      'Open the related business record when a document needs context before action.',
    ],
    sections: [
      {
        title: 'Purpose',
        bullets: [
          'Centralizes document intake and retrieval across projects and business processes.',
          'Preserves traceability between uploaded files and related operational records.',
        ],
      },
      {
        title: 'How to use',
        bullets: [
          'Use category and search filters first, then narrow by project or context when needed.',
          'Review metadata and ownership before treating a document as evidence in approvals.',
          'Keep naming and tags consistent so documents remain discoverable over time.',
        ],
      },
      {
        title: 'Field-level guidance',
        bullets: [
          'Document title and filename: use descriptive names with project or activity context.',
          'Category and tags: select accurate categories to support fast retrieval and reporting.',
          'Linked entity reference: map document to the right project, task, or submission to preserve traceability.',
          'Version or upload time: use latest approved files in operational decisions and keep older versions for audit context.',
        ],
      },
      {
        title: 'Generated output and usage',
        bullets: [
          'Uploaded files become accessible evidence for tasks, submissions, and review decisions.',
          'Document metadata supports compliance trails, search indexing, and operational reporting.',
          'Well-categorized documents reduce turnaround time during audits and issue investigations.',
        ],
      },
    ],
    variants: [
      {
        id: 'library',
        title: 'Document Library',
        routePatterns: ['/documents'],
        summary: 'Browse, filter, and open documents from a centralized library view.',
        sections: [
          {
            title: 'Library usage',
            bullets: [
              'Use category filters and keyword search together for precise retrieval.',
              'Verify linked context before using a file in approvals or field operations.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    summary: 'Review alerts, message activity, and delivery preferences so important actions are not missed.',
    routePatterns: ['/notifications', '/notifications/preferences', '/chat', '/chats'],
    quickActions: [
      'Use notification preferences to control which events require immediate attention.',
      'Review unread items before closing the page to avoid missing workflow actions.',
      'Open related records directly from a notification when available.',
    ],
    sections: [
      {
        title: 'What this page is for',
        bullets: [
          'Surfaces user-facing alerts and communication activity.',
          'Helps teams respond quickly to approvals, changes, and collaboration needs.',
        ],
      },
      {
        title: 'Common actions',
        bullets: [
          'Inspect recent notifications for pending approvals or operational exceptions.',
          'Adjust preferences to reduce noise while keeping critical events enabled.',
        ],
      },
    ],
  },
  {
    id: 'workflows',
    title: 'Workflow Management',
    summary: 'Design approval state machines that govern submission lifecycle, decision controls, and audit-ready transition history.',
    routePatterns: ['/workflows'],
    quickActions: [
      'Define states and transitions before binding the workflow to live forms.',
      'Use permission-based transitions instead of role names for cleaner long-term maintenance.',
      'Test reject and revise paths as carefully as approval paths.',
    ],
    sections: [
      {
        title: 'Purpose',
        bullets: [
          'Defines how records move across draft, review, approval, rejection, and revision stages.',
          'Provides controlled transitions so approvals are policy-driven and auditable.',
        ],
      },
      {
        title: 'How to use',
        bullets: [
          'Model states first, then transitions, then transition permissions in that exact order.',
          'Bind workflow only after testing normal path, reject path, and revise path with realistic scenarios.',
          'Use required comments on review actions where decision rationale must be audited.',
        ],
      },
      {
        title: 'Field-level guidance',
        bullets: [
          'State code and label: keep state codes stable and labels user-friendly for status displays.',
          'Transition action and label: action names should be machine-consistent, labels should match user language.',
          'Permission binding: map transition permissions to capabilities, not person names or temporary roles.',
          'Final state flag: mark terminal states correctly so records cannot re-enter closed flows accidentally.',
          'Requires comment flag: enable on reject or revise transitions to improve accountability and rework quality.',
        ],
      },
      {
        title: 'Generated output and usage',
        bullets: [
          'Workflow definitions generate valid transition rules used by submissions and task detail actions.',
          'Runtime transition history becomes an audit trail for who changed what, when, and why.',
          'Configured statuses feed dashboards and reports for pending approvals and bottleneck analysis.',
        ],
      },
    ],
    variants: [
      {
        id: 'builder',
        title: 'Workflow Builder',
        routePatterns: ['/workflows'],
        summary: 'Build and maintain workflow definitions used by form submission and approval processes.',
        sections: [
          {
            title: 'Builder checklist',
            bullets: [
              'Create clear state progression from draft to final states.',
              'Validate each transition with its permission before publishing.',
              'Test revision loops to ensure submitters can recover cleanly.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'profile',
    title: 'Profile',
    summary: 'Maintain personal account details, security settings, and user-specific preferences.',
    routePatterns: ['/profile', '/change-password'],
    quickActions: [
      'Keep profile details current so ownership and communication data stay accurate.',
      'Use password and account settings screens for user-level security maintenance.',
    ],
    sections: [
      {
        title: 'What this page is for',
        bullets: [
          'Lets users manage their own identity and account preferences.',
          'Provides a safe place for self-service account maintenance.',
        ],
      },
    ],
  },
  {
    id: 'masters-and-business',
    title: 'Masters, Business Verticals, And Sites',
    summary: 'Configure foundational master data such as modules, business verticals, sites, and attendance settings.',
    routePatterns: [
      '/masters/module',
      '/masters/sites',
      '/masters/sites/new',
      '/masters/sites/:id/edit',
      '/masters/sites/:id/access',
      '/masters/attendance',
      '/masters/business',
      '/masters/business/:code',
      '/masters/business/:code/roles',
      '/masters/business/:code/sites',
      '/masters/business/:code/sites/new',
      '/masters/business/:code/sites/:id/edit',
      '/masters/business/:code/sites/:id/access',
      '/masters/business/:code/attendance',
    ],
    quickActions: [
      'Treat master data as platform configuration and validate impact before editing production records.',
      'Use business-vertical and site scoping carefully so permissions and submissions stay correctly partitioned.',
      'Review access configuration after site or business updates.',
    ],
    sections: [
      {
        title: 'What this page is for',
        bullets: [
          'Maintains core reference entities used across modules.',
          'Provides the organizational structure for business, site, and operational access boundaries.',
        ],
      },
      {
        title: 'Common actions',
        bullets: [
          'Create or update site and business records with complete metadata.',
          'Manage scope-aware access for users who work in specific sites or verticals.',
          'Keep master records clean to prevent downstream reporting and workflow inconsistencies.',
        ],
      },
    ],
    variants: [
      {
        id: 'modules',
        title: 'Module Master',
        routePatterns: ['/masters/module'],
        summary: 'Maintain module definitions used in navigation and feature grouping.',
      },
      {
        id: 'business-verticals',
        title: 'Business Verticals',
        routePatterns: ['/masters/business', '/masters/business/:code', '/masters/business/:code/roles'],
        summary: 'Manage business-level structure, scope, and role organization.',
      },
      {
        id: 'sites',
        title: 'Site Management',
        routePatterns: ['/masters/sites', '/masters/business/:code/sites'],
        summary: 'Use site lists to organize operational locations and ownership context.',
      },
      {
        id: 'site-create-edit',
        title: 'Create And Edit Site',
        routePatterns: ['/masters/sites/new', '/masters/sites/:id/edit', '/masters/business/:code/sites/new', '/masters/business/:code/sites/:id/edit'],
        summary: 'Create or update site records with accurate location and organizational metadata.',
      },
      {
        id: 'site-access',
        title: 'Site Access Management',
        routePatterns: ['/masters/sites/:id/access', '/masters/business/:code/sites/:id/access'],
        summary: 'Control user access assignment for site-specific operations.',
      },
      {
        id: 'attendance',
        title: 'Attendance Master',
        routePatterns: ['/masters/attendance', '/masters/business/:code/attendance'],
        summary: 'Configure attendance-related master structures and mappings.',
      },
    ],
  },
  {
    id: 'submissions',
    title: 'Form Submissions',
    summary: 'Review and process submitted form records with workflow status, comments, and evidence context.',
    routePatterns: ['/masters/business/:code/submissions', '/masters/business/:code/submissions/:submissionId'],
    quickActions: [
      'Filter submissions by status or form to focus on pending decisions.',
      'Open submission details before approving, rejecting, or requesting revision.',
      'Capture required remarks for rejection or revision actions to maintain audit quality.',
    ],
    sections: [
      {
        title: 'What this page is for',
        bullets: [
          'Supports operational review and approval of submitted form records.',
          'Provides an auditable trail of state changes, decisions, and reviewer comments.',
        ],
      },
      {
        title: 'Decision guidance',
        bullets: [
          'Use configured workflow transitions only, not manual status overrides.',
          'Apply revision and rejection actions with clear comments so submitters can act quickly.',
        ],
      },
    ],
    variants: [
      {
        id: 'list',
        title: 'Submission List',
        routePatterns: ['/masters/business/:code/submissions'],
        summary: 'Use list filters to focus on pending review and action queues.',
      },
      {
        id: 'detail',
        title: 'Submission Detail',
        routePatterns: ['/masters/business/:code/submissions/:submissionId'],
        summary: 'Inspect record details before approval, rejection, or revision actions.',
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    summary: 'Configure and monitor external system integrations, connectors, and sync behavior.',
    routePatterns: ['/integrations', '/integrations/:id'],
    quickActions: [
      'Confirm endpoint and credential configuration before enabling a connector.',
      'Use detail views to inspect health, mapping, and operational status.',
      'Validate integration behavior with realistic data before broad rollout.',
    ],
    sections: [
      {
        title: 'What this page is for',
        bullets: [
          'Centralizes integration setup and visibility for connected services.',
          'Helps operations teams track sync reliability and connector state.',
        ],
      },
      {
        title: 'Operational tips',
        bullets: [
          'Treat integration updates as controlled changes and validate downstream effects.',
          'Use logs and status details to diagnose partial sync or mapping mismatches.',
        ],
      },
    ],
    variants: [
      {
        id: 'list',
        title: 'Integration Catalog',
        routePatterns: ['/integrations'],
        summary: 'Browse configured connectors and inspect their current health state.',
      },
      {
        id: 'detail',
        title: 'Integration Detail',
        routePatterns: ['/integrations/:id'],
        summary: 'Review connector mapping, settings, and run-state details.',
      },
    ],
  },
  {
    id: 'general',
    title: 'General Help',
    summary: 'Use this help when the current page does not yet have a dedicated topic or when you need guidance on general navigation.',
    routePatterns: [],
    quickActions: [
      'Use the module switcher in the header to move between business areas.',
      'Use the breadcrumb to return to parent screens without losing context.',
      'Open the Help Center for broader feature documentation and shared guidance.',
    ],
    sections: [
      {
        title: 'Navigation basics',
        bullets: [
          'The header provides cross-module navigation, notifications, profile access, and help.',
          'The left sidebar changes based on the active module and exposes section-level navigation.',
        ],
      },
      {
        title: 'When to use the Help Center',
        bullets: [
          'Use the full Help Center when you need process context spanning multiple modules.',
          'Use the in-page drawer when you need quick guidance without leaving your current work.',
        ],
      },
    ],
  },
];

export const guidedHelpTours: GuidedHelpTour[] = [
  {
    id: 'form-builder-tour',
    title: 'Guided Tour: Form Builder',
    summary: 'Design, validate, and publish forms with permission and workflow alignment.',
    topicId: 'forms',
    steps: [
      {
        id: 'forms-catalog',
        title: 'Step 1: Open Form Catalog',
        path: '/forms',
        selector: '[data-tour-id="forms-page-header"]',
        position: 'bottom',
        waitForMs: 12000,
        purpose: 'Review existing form definitions before creating a new one to avoid duplicate schemas.',
        fieldLevelGuidance: [
          'Check form code and title consistency across similar business processes.',
          'Inspect module and business scope before cloning or editing any definition.',
        ],
        generatedOutputUsage: [
          'Catalog entries represent reusable form schemas used by submission screens and reports.',
        ],
      },
      {
        id: 'forms-create',
        title: 'Step 2: Create Form Definition',
        path: '/forms/new',
        selector: '[data-tour-id="forms-builder-canvas"]',
        position: 'top',
        waitForMs: 12000,
        purpose: 'Capture form identity, module mapping, and core field structure.',
        fieldLevelGuidance: [
          'Use stable field keys and meaningful labels because downstream analytics rely on them.',
          'Choose field types by validation need, not by visual appearance.',
          'Mark required fields only when operationally mandatory.',
        ],
        generatedOutputUsage: [
          'Generated schema drives runtime form rendering for data-entry users.',
          'Field metadata feeds export/report layers and integration payloads.',
        ],
      },
      {
        id: 'forms-edit',
        title: 'Step 3: Edit Existing Form Safely',
        path: '/forms',
        selector: '[data-tour-id="forms-table"]',
        position: 'top',
        waitForMs: 12000,
        purpose: 'Update definitions with backward-compatible changes when submissions already exist.',
        fieldLevelGuidance: [
          'Avoid renaming existing field codes without a migration plan.',
          'Retest conditional logic paths after editing dependencies or default values.',
        ],
        generatedOutputUsage: [
          'Schema changes directly affect future submissions and validation behavior.',
        ],
      },
      {
        id: 'forms-preview-publish',
        title: 'Step 4: Preview And Publish',
        path: '/forms',
        selector: '[data-tour-id="forms-create-button"]',
        position: 'bottom',
        waitForMs: 12000,
        purpose: 'Validate user flow before enabling the form in production.',
        fieldLevelGuidance: [
          'Test required fields, date/number validation, and dependent dropdowns.',
          'Verify help text clarity for first-time users and approvers.',
        ],
        generatedOutputUsage: [
          'Published forms become available to end users and produce workflow-trackable submissions.',
        ],
      },
    ],
  },
  {
    id: 'workflow-builder-tour',
    title: 'Guided Tour: Workflow Builder',
    summary: 'Build state transitions, permission gates, and audit-ready approval flows.',
    topicId: 'workflows',
    steps: [
      {
        id: 'workflow-overview',
        title: 'Step 1: Workflow Management Overview',
        path: '/workflows',
        selector: '[data-tour-id="workflows-page-header"]',
        position: 'bottom',
        waitForMs: 12000,
        purpose: 'This is the central hub for all workflow definitions on the platform. Every form submission or approval process is governed by a workflow state machine defined here.',
        fieldLevelGuidance: [
          'Each workflow controls how a record moves through draft, review, approval, and final states.',
          'Workflows are reusable — one definition can be bound to multiple forms.',
          'Keep workflow names descriptive so operators can identify which process each one covers.',
        ],
        generatedOutputUsage: [
          'Workflow definitions power the action buttons, status badges, and transition history in submission screens.',
          'Once published, workflows generate audit-trail entries for every state change.',
        ],
      },
      {
        id: 'workflow-create',
        title: 'Step 2: Create a New Workflow',
        path: '/workflows',
        selector: '[data-tour-id="workflows-create-button"]',
        position: 'bottom',
        waitForMs: 12000,
        purpose: 'Use the Create button to open the Workflow Designer where you define states, transitions, and permission gates for a new approval process.',
        fieldLevelGuidance: [
          'Workflow code must be unique and stable — it is referenced by forms and integrations.',
          'Plan your states (e.g. Draft → Submitted → Approved) before entering the designer.',
          'Identify which roles or permissions own each transition before you start.',
        ],
        generatedOutputUsage: [
          'Each new workflow becomes available to bind to form definitions in the Form Builder.',
          'The designer generates the state machine schema that drives runtime approval behavior.',
        ],
      },
      {
        id: 'workflow-library',
        title: 'Step 3: Your Workflow Library',
        path: '/workflows',
        selector: '[data-tour-id="workflows-content"]',
        position: 'top',
        waitForMs: 12000,
        purpose: 'This area lists all existing workflow definitions. Each card shows the workflow name, code, and bound business verticals. Open any card to edit or extend it.',
        fieldLevelGuidance: [
          'Review state count and transition rules before modifying a live workflow.',
          'Avoid removing states that are currently in use by in-flight submissions.',
          'Check which forms reference a workflow before renaming its code.',
        ],
        generatedOutputUsage: [
          'Workflow cards link directly to the designer for full state and transition editing.',
          'Usage metadata on each card shows which business verticals the workflow is active in.',
        ],
      },
      {
        id: 'workflow-designer',
        title: 'Step 4: Working in the Designer',
        path: '/workflows',
        selector: '[data-tour-id="workflows-page-header"]',
        position: 'bottom',
        waitForMs: 12000,
        purpose: 'After clicking Create (or opening an existing workflow), the designer appears below the header. Build states first, then transitions, then set permission requirements on each transition.',
        fieldLevelGuidance: [
          'Add a clearly named initial state (e.g. "Draft") and at least one final state (e.g. "Approved").',
          'Each transition needs an action label (user-facing) and a permission key (access control).',
          'Enable "Requires comment" on Reject and Revise transitions to enforce decision rationale.',
          'Test reject and revision loops as carefully as the happy approval path.',
        ],
        generatedOutputUsage: [
          'Saved workflow definitions immediately become available for binding in the Form Builder.',
          'Every transition executed at runtime creates an immutable audit record with user, timestamp, and comment.',
          'Configured states feed pending-approval dashboards and bottleneck analytics.',
        ],
      },
    ],
  },
  {
    id: 'project-management-tour',
    title: 'Guided Tour: Project Management',
    summary: 'Create project masters, execute project tasks, and monitor progress with context integrity.',
    topicId: 'projects',
    steps: [
      {
        id: 'projects-list',
        title: 'Step 1: Project Portfolio View',
        path: '/projects',
        selector: '[data-tour-id="projects-page-header"]',
        position: 'bottom',
        waitForMs: 12000,
        purpose: 'Use the project list as the command center for active and historical projects.',
        fieldLevelGuidance: [
          'Filter by status, date range, and owner to isolate actionable projects.',
          'Verify project code and site context before opening details.',
        ],
        generatedOutputUsage: [
          'Portfolio data feeds project summary dashboards and execution tracking reports.',
        ],
      },
      {
        id: 'projects-create',
        title: 'Step 2: Create Project Master',
        path: '/projects/create',
        selector: '[data-tour-id="projects-create-form"]',
        position: 'top',
        waitForMs: 12000,
        purpose: 'Register new project identity and execution metadata.',
        fieldLevelGuidance: [
          'Use unique project code and clear naming for long-term retrieval.',
          'Set business vertical, site, owner, and timeline fields accurately at creation.',
        ],
        generatedOutputUsage: [
          'Project master becomes parent context for tasks, documents, and reporting filters.',
        ],
      },
      {
        id: 'projects-task-list',
        title: 'Step 3: Manage Project Tasks',
        path: '/projects',
        selector: '[data-tour-id="projects-grid"]',
        position: 'top',
        waitForMs: 12000,
        purpose: 'Move from project context into task planning and execution control.',
        fieldLevelGuidance: [
          'Define assignee, due date, priority, and workflow state for each task.',
          'Track remarks and evidence to support review and closure actions.',
        ],
        generatedOutputUsage: [
          'Task progress rolls up to project health indicators and timeline variance reports.',
        ],
      },
      {
        id: 'projects-monitoring',
        title: 'Step 4: Monitor Progress And Decisions',
        path: '/projects',
        selector: '[data-tour-id="projects-filters"]',
        position: 'bottom',
        waitForMs: 12000,
        purpose: 'Validate project execution using report and dashboard outputs.',
        fieldLevelGuidance: [
          'Cross-check delayed tasks, blockers, and approval bottlenecks by project.',
          'Use consistent status updates so KPI views remain trustworthy.',
        ],
        generatedOutputUsage: [
          'Project-level dashboards support planning reviews, governance meetings, and escalations.',
        ],
      },
    ],
  },
  {
    id: 'document-management-tour',
    title: 'Guided Tour: Document Management',
    summary: 'Organize, retrieve, and apply project and workflow evidence through document governance.',
    topicId: 'documents',
    steps: [
      {
        id: 'documents-library',
        title: 'Step 1: Open Document Library',
        path: '/documents',
        selector: '[data-tour-id="documents-page-header"]',
        position: 'bottom',
        waitForMs: 12000,
        purpose: 'Use the central library to browse all uploaded operational documents.',
        fieldLevelGuidance: [
          'Start with category and keyword filters before deep browsing.',
          'Validate project or record mapping from metadata before usage.',
        ],
        generatedOutputUsage: [
          'Library indexing enables quick retrieval during approvals, audits, and field verification.',
        ],
      },
      {
        id: 'documents-classification',
        title: 'Step 2: Classify Documents Correctly',
        path: '/documents',
        selector: '[data-tour-id="documents-category-sidebar"]',
        position: 'right',
        waitForMs: 12000,
        purpose: 'Maintain consistency in naming, tags, and context linkage.',
        fieldLevelGuidance: [
          'Use descriptive titles and standardized tags for repeatable search outcomes.',
          'Map each file to the correct project, task, or submission context.',
        ],
        generatedOutputUsage: [
          'Proper classification improves report quality and reduces audit turnaround time.',
        ],
      },
      {
        id: 'documents-usage-in-workflow',
        title: 'Step 3: Use Documents In Review Workflows',
        path: '/documents',
        selector: '[data-tour-id="documents-action-bar"]',
        position: 'bottom',
        waitForMs: 12000,
        purpose: 'Apply uploaded files as evidence in submission and approval decisions.',
        fieldLevelGuidance: [
          'Verify file version and upload timestamp before using it for final decisions.',
          'Capture remarks when evidence is missing or not acceptable.',
        ],
        generatedOutputUsage: [
          'Evidence-linked decisions strengthen auditability and compliance posture.',
        ],
      },
      {
        id: 'documents-traceability',
        title: 'Step 4: Ensure Traceability',
        path: '/documents',
        selector: '[data-tour-id="documents-list"]',
        position: 'top',
        waitForMs: 12000,
        purpose: 'Confirm that document lineage remains clear across lifecycle events.',
        fieldLevelGuidance: [
          'Retain previous versions when updates occur for historical trace support.',
          'Keep ownership and linkage metadata complete for governance checks.',
        ],
        generatedOutputUsage: [
          'Traceable document history supports dispute resolution, compliance audits, and root-cause analysis.',
        ],
      },
    ],
  },
];

function normalizePath(pathname: string): string {
  if (!pathname) {
    return '/';
  }

  if (pathname === '/') {
    return pathname;
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patternToRegex(pattern: string): RegExp {
  if (pattern === '/') {
    return /^\/$/;
  }

  const normalizedPattern = normalizePath(pattern);
  const escapedPattern = escapeRegex(normalizedPattern);
  const regexSource = escapedPattern
    .replace(/\\:([A-Za-z0-9_]+)/g, '[^/]+')
    .replace(/\\\*/g, '.*');

  return new RegExp(`^${regexSource}$`);
}

function getBestPatternScore(pathname: string, patterns: string[]): number {
  let bestScore = -1;

  for (const pattern of patterns) {
    const regex = patternToRegex(pattern);
    if (regex.test(pathname)) {
      const score = pattern.length;
      if (score > bestScore) {
        bestScore = score;
      }
    }
  }

  return bestScore;
}

function resolveBestVariant(pathname: string, topic: HelpTopic): { variant?: HelpVariant; score: number } {
  const variants = topic.variants || [];
  let matchedVariant: HelpVariant | undefined;
  let bestScore = -1;

  for (const variant of variants) {
    const score = getBestPatternScore(pathname, variant.routePatterns);
    if (score > bestScore) {
      bestScore = score;
      matchedVariant = variant;
    }
  }

  return {
    variant: bestScore >= 0 ? matchedVariant : undefined,
    score: bestScore,
  };
}

function buildHelpAnchor(topicId: string, variantId?: string): string {
  return variantId ? `${topicId}-${variantId}` : topicId;
}

export function resolveHelpContext(pathname: string): ResolvedHelpContext {
  const normalizedPath = normalizePath(pathname);
  const candidates = helpTopics
    .map((topic) => {
      const topicScore = getBestPatternScore(normalizedPath, topic.routePatterns);
      const variantMatch = resolveBestVariant(normalizedPath, topic);
      const effectiveScore = Math.max(topicScore, variantMatch.score);

      return {
        topic,
        variant: variantMatch.variant,
        score: effectiveScore,
      };
    })
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => right.score - left.score);

  const selected = candidates[0];
  if (selected) {
    return {
      topic: selected.topic,
      variant: selected.variant,
      anchor: buildHelpAnchor(selected.topic.id, selected.variant?.id),
    };
  }

  const fallback = helpTopics.find((topic) => topic.id === 'general')!;
  return {
    topic: fallback,
    variant: undefined,
    anchor: buildHelpAnchor(fallback.id),
  };
}

export function getHelpTopicByPath(pathname: string): HelpTopic {
  return resolveHelpContext(pathname).topic;
}

/**
 * Returns guided tours whose topicId matches the resolved topic for the given pathname.
 * Used by the help drawer to surface contextual "Start tour" actions.
 */
export function getToursForPath(pathname: string): GuidedHelpTour[] {
  const { topic } = resolveHelpContext(pathname);
  return guidedHelpTours.filter((tour) => tour.topicId === topic.id);
}