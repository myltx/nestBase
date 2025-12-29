import { ServicePrefixEnum } from '@/enum/commonEnum';
import { RequestEnum } from '@/enum/httpEnum';
import { request } from '../request';

export function fetchGetCategoryTree() {
  return request<Api.SystemManage.CategoryTree[]>({
    url: `${ServicePrefixEnum.CATEGORY}`,
    method: RequestEnum.GET
  });
}

export function createCategory(data: Api.SystemManage.CreateCategory) {
  return request<Api.CommonResponse<string>>({
    url: `${ServicePrefixEnum.CATEGORY}`,
    method: RequestEnum.POST,
    data
  });
}

export function updateCategory(data: Api.SystemManage.UpdateCategory) {
  const { id, ...rest } = data;
  return request<Api.CommonResponse<string>>({
    url: `${ServicePrefixEnum.CATEGORY}/${id}`,
    method: RequestEnum.PATCH,
    data: rest
  });
}

export function deleteCategory(id: string) {
  return request<Api.CommonResponse<null>>({
    url: `${ServicePrefixEnum.CATEGORY}/${id}`,
    method: RequestEnum.DELETE
  });
}
