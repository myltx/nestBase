import { request } from '@/service/request';

/** get dictionary list */
export function fetchGetDictionaryList(params?: Api.SystemManage.DictionarySearchParams) {
  return request<Api.SystemManage.DictionaryList>({
    url: '/dictionaries',
    method: 'get',
    params,
  });
}

/** get dictionary detail */
export function fetchGetDictionary(id: string) {
  return request<Api.SystemManage.Dictionary>({
    url: `/dictionaries/${id}`,
    method: 'get',
  });
}

/** create dictionary */
export function createDictionary(data: Api.SystemManage.CreateDictionary) {
  return request<Api.SystemManage.Dictionary>({
    url: '/dictionaries',
    method: 'post',
    data,
  });
}

/** update dictionary */
export function updateDictionary(data: Api.SystemManage.UpdateDictionary) {
  return request<Api.SystemManage.Dictionary>({
    url: `/dictionaries/${data.id}`,
    method: 'patch',
    data,
  });
}

/** delete dictionary */
export function deleteDictionary(id: string) {
  return request<void>({
    url: `/dictionaries/${id}`,
    method: 'delete',
  });
}

/** get dictionary items */
export function fetchGetDictionaryItems(dictionaryId: string) {
  return request<Api.SystemManage.DictionaryItem[]>({
    url: `/dictionaries/${dictionaryId}/items`,
    method: 'get',
  });
}

/** create dictionary item */
export function createDictionaryItem(
  dictionaryId: string,
  data: Api.SystemManage.CreateDictionaryItem,
) {
  return request<Api.SystemManage.DictionaryItem>({
    url: `/dictionaries/${dictionaryId}/items`,
    method: 'post',
    data,
  });
}

/** update dictionary item */
export function updateDictionaryItem(
  dictionaryId: string,
  data: Api.SystemManage.UpdateDictionaryItem,
) {
  return request<Api.SystemManage.DictionaryItem>({
    url: `/dictionaries/${dictionaryId}/items/${data.id}`,
    method: 'patch',
    data,
  });
}

/** delete dictionary item */
export function deleteDictionaryItem(dictionaryId: string, itemId: string) {
  return request<void>({
    url: `/dictionaries/${dictionaryId}/items/${itemId}`,
    method: 'delete',
  });
}
