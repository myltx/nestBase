import { ServicePrefixEnum } from '@/enum/commonEnum';
import { request } from '../request';

/**
 * Login
 *
 * @param userName User name
 * @param password Password
 */
export function fetchLogin(userName: string, password: string) {
  return request<Api.Auth.LoginData>({
    url: `${ServicePrefixEnum.AUTH}/login`,
    method: 'post',
    data: {
      userName,
      password,
    },
  });
}

/** Get user info */
export function fetchGetUserInfo() {
  return request<Api.Auth.User>({ url: `${ServicePrefixEnum.AUTH}/profile` });
}

export function fetchGetUserPermissionList() {
  return request<Api.Auth.UserPermission[]>({ url: `${ServicePrefixEnum.AUTH}/permissions` });
}

/** Get Bootstrap Data (User + Permissions + Menus) */
export function fetchBootstrap() {
  return request<Api.Auth.BootstrapData>({ url: `${ServicePrefixEnum.AUTH}/bootstrap` });
}

/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */
export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: `${ServicePrefixEnum.AUTH}/refreshToken`,
    method: 'post',
    data: {
      refreshToken,
    },
  });
}

/**
 * return custom backend error
 *
 * @param code error code
 * @param msg error message
 */
export function fetchCustomBackendError(code: string, msg: string) {
  return request({ url: `${ServicePrefixEnum.AUTH}/error`, params: { code, msg } });
}
