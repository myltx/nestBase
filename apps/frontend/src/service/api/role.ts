import { ServicePrefixEnum } from '@/enum/commonEnum';
import { RequestEnum } from '@/enum/httpEnum';
import { request } from '../request';

/**
 * 创建角色
 *
 */

export function createRole(data: Api.SystemManage.CreateRole) {
  return request<Api.CommonResponse<any>>({
    url: `${ServicePrefixEnum.ROLE}`,
    method: RequestEnum.POST,
    data,
  });
}

/**
 * 更新角色
 *
 */
export function updateRole(data: Api.SystemManage.UpdateRole) {
  return request<Api.Auth.LoginData>({
    url: `${ServicePrefixEnum.ROLE}/${data.id}`,
    method: RequestEnum.PATCH,
    data,
  });
}

/**
 * 删除角色
 *
 */
export function deleteRole(id: number) {
  return request<Api.Auth.LoginData>({
    url: `${ServicePrefixEnum.ROLE}/${id}`,
    method: RequestEnum.DELETE,
  });
}

/**
 * get all roles
 *
 * these roles are all enabled
 */
export function fetchGetAllRoles() {
  return request<Api.SystemManage.AllRole[]>({
    url: `${ServicePrefixEnum.ROLE}`,
    method: RequestEnum.GET,
  });
}

/** get role list */
export function fetchGetRoleList(params?: Api.SystemManage.RoleSearchParams) {
  return request<Api.SystemManage.RoleList>({
    url: `${ServicePrefixEnum.ROLE}`,
    method: RequestEnum.GET,
    params,
  });
}

/**
 * get role detail
 *
 * @param id role id
 */
export function fetchGetRole(id: string, params?: { include?: string }) {
  return request<Api.SystemManage.Role>({
    url: `${ServicePrefixEnum.ROLE}/${id}`,
    method: RequestEnum.GET,
    params,
  });
}

/**
 * Get users by role
 */
export function fetchGetUsersByRole(
  roleId: string,
  params?: Api.SystemManage.CommonSearchParams & { search?: string },
) {
  return request<Api.SystemManage.UserList>({
    url: `${ServicePrefixEnum.ROLE}/${roleId}/users`,
    method: RequestEnum.GET,
    params,
  });
}

/**
 * Add users to role
 */
export function addUsersToRole(roleId: string, userIds: string[]) {
  return request<Api.CommonResponse<any>>({
    url: `${ServicePrefixEnum.ROLE}/${roleId}/users`,
    method: RequestEnum.POST,
    data: { userIds },
  });
}

/**
 * Remove users from role
 */
export function removeUsersFromRole(roleId: string, userIds: string[]) {
  return request<Api.CommonResponse<any>>({
    url: `${ServicePrefixEnum.ROLE}/${roleId}/users`,
    method: RequestEnum.DELETE,
    data: { userIds },
  });
}

/**
 * Update role's users (overwrite)
 */
export function updateUserRoles(roleId: string, userIds: string[]) {
  return request<Api.CommonResponse<any>>({
    url: `${ServicePrefixEnum.ROLE}/${roleId}/users`,
    method: RequestEnum.PATCH,
    data: { userIds },
  });
}
