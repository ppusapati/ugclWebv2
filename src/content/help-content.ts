import { resolveHelpRouteContext } from '~/config/route-registry';

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
    summary: 'Manage project records, ownership, scheduling context, and project-level task access.',
    routePatterns: ['/projects', '/projects/create', '/projects/:projectId', '/projects/:projectId/tasks', '/projects/:projectId/tasks/create'],
    quickActions: [
      'Create a project before assigning project-scoped tasks or documents.',
      'Open a project record to manage tasks, site details, and execution context.',
      'Keep project metadata current because downstream modules use it for filtering and reporting.',
    ],
    sections: [
      {
        title: 'What this page is for',
        bullets: [
          'Maintains the master list of active and historical projects.',
          'Acts as the starting point for project-specific workflows and task tracking.',
        ],
      },
      {
        title: 'Common actions',
        bullets: [
          'Create a new project with core identifiers and operational metadata.',
          'Open a project to review its related tasks and execution progress.',
          'Use filters to narrow the list when handling a large project portfolio.',
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
    summary: 'Define dynamic forms, submission rules, and workflow-enabled data capture without duplicating implementation logic.',
    routePatterns: ['/forms', '/forms/new', '/forms/:formCode', '/forms/:formCode/preview', '/masters/business/:code/forms', '/masters/business/:code/forms/:formCode'],
    quickActions: [
      'Use consistent naming for form code, title, and module assignment.',
      'Set permission and workflow fields carefully because they control who can submit and review.',
      'Preview the form before publishing changes to business users.',
    ],
    sections: [
      {
        title: 'What this page is for',
        bullets: [
          'Creates and manages metadata-driven forms used throughout the platform.',
          'Connects form structure with permissions, vertical access, and workflow behavior.',
        ],
      },
      {
        title: 'Workflow guidance',
        bullets: [
          'Use permissions as the primary access control rather than hard-coding roles into the form design.',
          'Treat workflow transitions as approval logic and the form definition as submission logic.',
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
      },
      {
        id: 'edit',
        title: 'Edit Form',
        routePatterns: ['/forms/:formCode', '/masters/business/:code/forms/:formCode'],
        summary: 'Update an existing form carefully to avoid breaking active operational usage.',
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
    summary: 'Browse and organize uploaded files, supporting records, and document categories needed for operations.',
    routePatterns: ['/documents'],
    quickActions: [
      'Use category filters first when a large document library is loaded.',
      'Keep naming and categorization consistent so retrieval stays reliable.',
      'Open the related business record when a document needs context before action.',
    ],
    sections: [
      {
        title: 'What this page is for',
        bullets: [
          'Centralizes document discovery and category-based browsing.',
          'Supports traceability between uploaded files and business records.',
        ],
      },
      {
        title: 'Common actions',
        bullets: [
          'Search or filter by category to reduce navigation time.',
          'Review document metadata before using a file as operational evidence.',
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
    summary: 'Configure state machines, transitions, and approval logic that govern operational review cycles.',
    routePatterns: ['/workflows'],
    quickActions: [
      'Define states and transitions before binding the workflow to live forms.',
      'Use permission-based transitions instead of role names for cleaner long-term maintenance.',
      'Test reject and revise paths as carefully as approval paths.',
    ],
    sections: [
      {
        title: 'What this page is for',
        bullets: [
          'Controls how submissions move through review and approval stages.',
          'Provides the authoritative configuration for status changes and review actions.',
        ],
      },
      {
        title: 'Workflow design guidance',
        bullets: [
          'Model explicit states for draft, submitted, review, approved, rejected, and revised flows.',
          'Require comments on reject and revision transitions where auditability matters.',
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

function buildHelpAnchor(topicId: string, variantId?: string): string {
  return variantId ? `${topicId}-${variantId}` : topicId;
}

export function resolveHelpContext(pathname: string): ResolvedHelpContext {
  const matchedRoute = resolveHelpRouteContext(pathname);
  if (matchedRoute) {
    const topic = helpTopics.find((item) => item.id === matchedRoute.topicId);
    const variant = topic?.variants?.find((item) => item.id === matchedRoute.variantId);

    if (topic) {
      return {
        topic,
        variant,
        anchor: buildHelpAnchor(topic.id, variant?.id),
      };
    }
  }

  const fallback = helpTopics.find((topic) => topic.id === 'general');
  if (fallback) {
    return {
      topic: fallback,
      variant: undefined,
      anchor: buildHelpAnchor(fallback.id),
    };
  }

  // The content set always includes a general fallback topic.
  const firstTopic = helpTopics[0];
  return {
    topic: firstTopic,
    variant: undefined,
    anchor: buildHelpAnchor(firstTopic.id),
  };
}

export function getHelpTopicByPath(pathname: string): HelpTopic {
  return resolveHelpContext(pathname).topic;
}