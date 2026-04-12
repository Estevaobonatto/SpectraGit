export type Section =
  | 'introduction'
  | 'architecture'
  | 'authentication'
  | 'setup'
  | 'users'
  | 'repositories'
  | 'branches'
  | 'commits'
  | 'issues'
  | 'pull-requests'
  | 'reviews'
  | 'tags'
  | 'releases'
  | 'notifications'
  | 'organizations'
  | 'collaborators'
  | 'activity'
  | 'integrations'
  | 'admin'
  | 'audit'
  | 'examples'
  | 'errors'
  | 'rate-limits'
  | 'user-guide'
  | 'manage-repos'
  | 'manage-issues'
  | 'manage-prs'
  | 'manage-orgs'
  | 'manage-reports'
  | 'git-guide';

export interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
  group: string;
}

export interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  admin?: boolean;
  pathParams?: Param[];
  queryParams?: Param[];
  body?: Param[];
  response?: string;
}

export interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}
