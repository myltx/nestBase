import { ServicePrefixEnum } from '@/enum/commonEnum';
import { RequestEnum } from '@/enum/httpEnum';
import { request } from '../request';

/** get constant routes */
export function fetchGetConstantRoutes() {
  return request<Api.Route.MenuRoute[]>({ url: `${ServicePrefixEnum.MENU}/constant-routes`, method: RequestEnum.GET });
}

/** get user routes */
export function fetchGetUserRoutes() {
  return request<Api.Route.MenuRoute[]>({ url: `${ServicePrefixEnum.MENU}/user-routes`, method: RequestEnum.GET });
}

/**
 * whether the route is exist
 *
 * @param routeName route name
 */
export function fetchIsRouteExist(routeName: string) {
  return request<boolean>({ url: `${ServicePrefixEnum.MENU}/route-exist/${routeName}`, method: RequestEnum.GET });
}
