/**
 * 业务状态码定义
 * 0: 成功
 * 1xxx: 客户端错误
 * 2xxx: 服务器错误
 * 3xxx: 业务逻辑错误
 */

export enum BusinessCode {
  // 成功
  SUCCESS = 0,

  // 客户端错误 (1xxx)
  BAD_REQUEST = 1000,
  UNAUTHORIZED = 1001,
  FORBIDDEN = 1003,
  NOT_FOUND = 1004,
  VALIDATION_ERROR = 1005,
  CONFLICT = 1009,

  // 认证相关错误 (10xx)
  INVALID_CREDENTIALS = 1101,
  TOKEN_EXPIRED = 1102,
  TOKEN_INVALID = 1103,
  USER_NOT_FOUND = 1104,
  USER_ALREADY_EXISTS = 1105,
  EMAIL_ALREADY_EXISTS = 1106,
  USERNAME_ALREADY_EXISTS = 1107,
  CANNOT_REGISTER_ADMIN = 1108,

  // 资源相关错误 (12xx)
  RESOURCE_NOT_FOUND = 1201,
  RESOURCE_ALREADY_EXISTS = 1202,

  // 服务器错误 (2xxx)
  INTERNAL_SERVER_ERROR = 2000,
  DATABASE_ERROR = 2001,
  EXTERNAL_SERVICE_ERROR = 2002,
  SYSTEM_ERROR = 2003,
}

/**
 * HTTP 状态码到业务状态码的映射
 */
export const HTTP_TO_BUSINESS_CODE: Record<number, BusinessCode> = {
  200: BusinessCode.SUCCESS,
  201: BusinessCode.SUCCESS,
  400: BusinessCode.BAD_REQUEST,
  401: BusinessCode.UNAUTHORIZED,
  403: BusinessCode.FORBIDDEN,
  404: BusinessCode.NOT_FOUND,
  409: BusinessCode.CONFLICT,
  500: BusinessCode.INTERNAL_SERVER_ERROR,
};

/**
 * 业务状态码描述
 */
export const BUSINESS_CODE_MESSAGES: Record<BusinessCode, string> = {
  [BusinessCode.SUCCESS]: '操作成功',
  [BusinessCode.BAD_REQUEST]: '请求参数错误',
  [BusinessCode.UNAUTHORIZED]: '未授权',
  [BusinessCode.FORBIDDEN]: '禁止访问',
  [BusinessCode.NOT_FOUND]: '资源不存在',
  [BusinessCode.VALIDATION_ERROR]: '数据验证失败',
  [BusinessCode.CONFLICT]: '资源冲突',
  [BusinessCode.INVALID_CREDENTIALS]: '用户名或密码错误',
  [BusinessCode.TOKEN_EXPIRED]: 'Token 已过期',
  [BusinessCode.TOKEN_INVALID]: 'Token 无效',
  [BusinessCode.USER_NOT_FOUND]: '用户不存在',
  [BusinessCode.USER_ALREADY_EXISTS]: '用户已存在',
  [BusinessCode.EMAIL_ALREADY_EXISTS]: '邮箱已被注册',
  [BusinessCode.USERNAME_ALREADY_EXISTS]: '用户名已被使用',
  [BusinessCode.CANNOT_REGISTER_ADMIN]: '无法注册管理员账户',
  [BusinessCode.RESOURCE_NOT_FOUND]: '资源不存在',
  [BusinessCode.RESOURCE_ALREADY_EXISTS]: '资源已存在',
  [BusinessCode.INTERNAL_SERVER_ERROR]: '服务器内部错误',
  [BusinessCode.DATABASE_ERROR]: '数据库错误',
  [BusinessCode.EXTERNAL_SERVICE_ERROR]: '外部服务错误',
  [BusinessCode.SYSTEM_ERROR]: '系统错误',
};
