import { apiRequest } from "@/lib/auth";

export interface UserRole {
  code: "ADMIN" | "TRUONG_HO" | "TRUONG_CHI" | "NGUOI_BINH_THUONG";
  name: string;
  permissions: string[];
}

export interface ManagedUser {
  id: string;
  employeeCode: string;
  name: string;
  roles: UserRole[];
  permissions: string[];
  defaultPath: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPayload {
  employeeCode: string;
  name: string;
  password: string;
  roleCode: string;
}

export interface UpdateUserPayload {
  name?: string;
  roleCode?: string;
}

export function getUsers() {
  return apiRequest<ManagedUser[]>("/users");
}

export function getUserRoles() {
  return apiRequest<UserRole[]>("/users/roles");
}

export function createUser(payload: UserPayload) {
  return apiRequest<ManagedUser>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(
  employeeCode: string,
  payload: UpdateUserPayload,
) {
  return apiRequest<ManagedUser>(`/users/${employeeCode}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function setUserStatus(employeeCode: string, isActive: boolean) {
  return apiRequest<ManagedUser>(`/users/${employeeCode}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export function deleteUser(employeeCode: string) {
  return apiRequest<{ employeeCode: string }>(`/users/${employeeCode}`, {
    method: "DELETE",
  });
}

export function resetUserPassword(employeeCode: string, password: string) {
  return apiRequest<ManagedUser>(`/users/${employeeCode}/password`, {
    method: "PATCH",
    body: JSON.stringify({ password }),
  });
}
