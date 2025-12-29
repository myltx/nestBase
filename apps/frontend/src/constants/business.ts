import { transformRecordToOption } from '@/utils/common';

export const enableStatusRecord: Record<Api.Common.EnableStatus, App.I18n.I18nKey> = {
  1: 'page.manage.common.status.enable',
  2: 'page.manage.common.status.disable'
};

export const enableStatusOptions = transformRecordToOption(enableStatusRecord);

export const userGenderRecord: Record<Api.SystemManage.UserGender, App.I18n.I18nKey> = {
  MALE: 'page.manage.user.gender.male',
  FEMALE: 'page.manage.user.gender.female',
  UNKNOWN: 'page.manage.user.gender.unknown'
};

export const userGenderOptions = transformRecordToOption(userGenderRecord);

export const menuTypeRecord: Record<Api.SystemManage.MenuType, App.I18n.I18nKey> = {
  1: 'page.manage.menu.type.directory',
  2: 'page.manage.menu.type.menu'
};

export const menuTypeOptions = transformRecordToOption(menuTypeRecord);

export const menuIconTypeRecord: Record<Api.SystemManage.IconType, App.I18n.I18nKey> = {
  '1': 'page.manage.menu.iconType.iconify',
  '2': 'page.manage.menu.iconType.local'
};

export const menuIconTypeOptions = transformRecordToOption(menuIconTypeRecord);

export const articleStatusRecord: Record<Api.SystemManage.ArticleStatus, App.I18n.I18nKey> = {
  DRAFT: 'page.manage.content.status.draft',
  PUBLISHED: 'page.manage.content.status.published',
  OFFLINE: 'page.manage.content.status.offline'
};

export const articleStatusOptions = transformRecordToOption(articleStatusRecord);

export const articleEditTypeRecord: Record<Api.SystemManage.ArticleEditType, App.I18n.I18nKey> = {
  MARKDOWN: 'page.manage.content.editTypeMap.markdown',
  RICHTEXT: 'page.manage.content.editTypeMap.richtext',
  UPLOAD: 'page.manage.content.editTypeMap.upload'
};

export const articleEditTypeOptions = transformRecordToOption(articleEditTypeRecord);
