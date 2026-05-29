export interface RequestUser {
  id: string;
  employeeCode: string;
  name: string;
  roles: Array<{
    code: string;
    name: string;
  }>;
  permissions: string[];
  defaultPath: string;
}
