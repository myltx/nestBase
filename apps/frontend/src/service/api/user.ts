import { ServicePrefixEnum } from '@/enum/commonEnum';
import { RequestEnum } from '@/enum/httpEnum';
import { request } from '../request';

/**
 * 创建用户
 *
 */

export function createUser(data: Api.Auth.CreateUser) {
  return request<Api.Auth.LoginData>({
    url: `${ServicePrefixEnum.USER}`,
    method: RequestEnum.POST,
    data
  });
}

/**
 * 修改用户
 *
 */

export function updateUser(data: Api.Auth.UpdateUser) {
  return request<Api.Auth.LoginData>({
    url: `${ServicePrefixEnum.USER}/${data.id}`,
    method: RequestEnum.PATCH,
    data
  });
}

/** get user list */
export function fetchGetUserList(params?: Api.SystemManage.UserSearchParams) {
  return request<Api.SystemManage.UserList>({
    url: '/users',
    method: RequestEnum.GET,
    params
  });
}
