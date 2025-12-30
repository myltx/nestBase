import { ServicePrefixEnum } from '@/enum/commonEnum';
import { RequestEnum } from '@/enum/httpEnum';
import { request } from '../request';

export function fetchGetTagList(params?: Api.SystemManage.TagSearchParams) {
  return request<Api.SystemManage.TagList>({
    url: `${ServicePrefixEnum.TAG}`,
    method: RequestEnum.GET,
    params,
  });
}

export function createTag(data: Api.SystemManage.CreateTag) {
  return request<Api.CommonResponse<string>>({
    url: `${ServicePrefixEnum.TAG}`,
    method: RequestEnum.POST,
    data,
  });
}

export function updateTag(data: Api.SystemManage.UpdateTag) {
  const { id, ...rest } = data;
  return request<Api.CommonResponse<string>>({
    url: `${ServicePrefixEnum.TAG}/${id}`,
    method: RequestEnum.PATCH,
    data: rest,
  });
}

export function deleteTag(id: string) {
  return request<Api.CommonResponse<null>>({
    url: `${ServicePrefixEnum.TAG}/${id}`,
    method: RequestEnum.DELETE,
  });
}
