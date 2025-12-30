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
