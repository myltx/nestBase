import { ServicePrefixEnum } from '@/enum/commonEnum';
import { RequestEnum } from '@/enum/httpEnum';
import { request } from '../request';

/** 获取文章列表 */
export function fetchGetArticleList(params?: Api.SystemManage.ArticleSearchParams) {
  const query = { ...(params || {}) } as Record<string, unknown>;

  if (params?.dateRange?.length === 2) {
    const [start, end] = params.dateRange;
    query.startPublishedAt = start;
    query.endPublishedAt = end;
  }

  delete query.dateRange;

  return request<Api.SystemManage.ArticleList>({
    url: `${ServicePrefixEnum.CONTENT}`,
    method: RequestEnum.GET,
    params: query,
  });
}

/** 新增文章 */
export function createArticle(data: Api.SystemManage.CreateArticle) {
  return request<Api.CommonResponse<number>>({
    url: `${ServicePrefixEnum.CONTENT}`,
    method: RequestEnum.POST,
    data,
  });
}

/** 更新文章 */
export function updateArticle(data: Api.SystemManage.UpdateArticle) {
  const { id, ...rest } = data;
  return request<Api.CommonResponse<number>>({
    url: `${ServicePrefixEnum.CONTENT}/${id}`,
    method: RequestEnum.PATCH,
    data: rest,
  });
}

/** 删除文章 */
export function deleteArticle(id: number) {
  return request<Api.CommonResponse<null>>({
    url: `${ServicePrefixEnum.CONTENT}/${id}`,
    method: RequestEnum.DELETE,
  });
}

/** 更新文章状态 */
export function updateArticleStatus(id: number, status: Api.SystemManage.ArticleStatus) {
  return request<Api.CommonResponse<null>>({
    url: `${ServicePrefixEnum.CONTENT}/${id}`,
    method: RequestEnum.PATCH,
    data: { status },
  });
}

/** 更新文章置顶状态 */
export function updateArticleTop(id: number, isTop: boolean) {
  return request<Api.CommonResponse<null>>({
    url: `${ServicePrefixEnum.CONTENT}/${id}`,
    method: RequestEnum.PATCH,
    data: { isTop },
  });
}

/** 更新文章推荐状态 */
export function updateArticleRecommend(id: number, isRecommend: boolean) {
  return request<Api.CommonResponse<null>>({
    url: `${ServicePrefixEnum.CONTENT}/${id}`,
    method: RequestEnum.PATCH,
    data: { isRecommend },
  });
}

/** 获取文章详情 */
export function fetchArticleDetail(id: number | string) {
  return request<Api.SystemManage.Article>({
    url: `${ServicePrefixEnum.CONTENT}/${id}`,
    method: RequestEnum.GET,
  });
}
