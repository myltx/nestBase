import { request } from '@/service/request';

/** get project list */
export function fetchGetProjectList(params?: Api.SystemManage.ProjectSearchParams) {
  return request<Api.SystemManage.ProjectList>({
    url: '/projects',
    method: 'get',
    params,
  });
}

/** get project detail */
export function fetchGetProject(id: string) {
  return request<Api.SystemManage.Project>({
    url: `/projects/${id}`,
    method: 'get',
  });
}

/** create project */
export function createProject(data: Api.SystemManage.CreateProject) {
  return request<Api.SystemManage.Project>({
    url: '/projects',
    method: 'post',
    data,
  });
}

/** update project */
export function updateProject(data: Api.SystemManage.UpdateProject) {
  return request<Api.SystemManage.Project>({
    url: `/projects/${data.id}`,
    method: 'patch',
    data,
  });
}

/** delete project */
export function deleteProject(id: string) {
  return request<void>({
    url: `/projects/${id}`,
    method: 'delete',
  });
}

/** get tech stack list */
export function fetchGetTechStack() {
  return request<string[]>({
    url: '/projects/tech-stack',
    method: 'get',
  });
}
