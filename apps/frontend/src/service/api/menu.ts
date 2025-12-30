import { ServicePrefixEnum } from '@/enum/commonEnum';
import { RequestEnum } from '@/enum/httpEnum';
import { request } from '../request';

/**
 * 创建菜单
 *
 */

export function createMenu(data: Api.SystemManage.CreateMenu) {
  return request<Api.CommonResponse<any>>({
    url: `${ServicePrefixEnum.MENU}`,
    method: RequestEnum.POST,
    data,
  });
}
/**
 * 更新菜单
 *
 */

export function updateMenu(data: Api.SystemManage.UpdateMenu) {
  return request<Api.Auth.LoginData>({
    url: `${ServicePrefixEnum.MENU}/${data.id}`,
    method: RequestEnum.PATCH,
    data,
  });
}
/**
 * 删除菜单
 *
 */

export function deleteMenu(id: string) {
  return request<Api.Auth.LoginData>({
    url: `${ServicePrefixEnum.MENU}/${id}`,
    method: RequestEnum.DELETE,
  });
}
/**
 * 获取菜单路由名称
 *
 */
export function getMenuRouteNameList() {
  return request<string[]>({
    url: `${ServicePrefixEnum.MENU}/route-names`,
    method: RequestEnum.GET,
  });
}

/** get menu tree */
export function fetchGetMenuTree() {
  return request<Api.SystemManage.MenuTree[]>({
    url: `${ServicePrefixEnum.MENU}`,
    method: 'get',
    params: {
      format: 'tree',
    },
  });
}

/** get menu list */
export function fetchGetMenuList(params?: Api.SystemManage.CommonSearchParams) {
  return request<Api.SystemManage.MenuList>({
    url: `${ServicePrefixEnum.MENU}`,
    method: 'get',
    params,
  });
}

/** get all pages */
export function fetchGetAllPages() {
  return request<string[]>({
    url: '',
    method: 'get',
  });
}
