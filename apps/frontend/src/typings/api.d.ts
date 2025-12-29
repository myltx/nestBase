/**
 * Namespace Api
 *
 * All backend api type
 */
declare namespace Api {
  namespace Common {
    /** common params of paginating */
    interface PaginatingCommonParams {
      /** current page number */
      current: number;
      /** page size */
      size: number;
      /** total count */
      total: number;
    }

    /** common params of paginating query list data */
    interface PaginatingQueryRecord<T = any> extends PaginatingCommonParams {
      records: T[];
    }

    /** common search params of table */
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    /**
     * enable status
     *
     * - "1": enabled
     * - "2": disabled
     */
    type EnableStatus = 1 | 2;

    /** common record */
    type CommonRecord<T = any> = {
      /** record id */
      id: number;
      /** record creator */
      createBy: string;
      /** record create time */
      createTime: string;
      /** record updater */
      updateBy: string;
      /** record update time */
      updateTime: string;
      /** record status */
      status: EnableStatus;
    } & T;
  }

  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    /** 登录返回的 Token 信息 */
    interface Token {
      accessToken: string;
      expiresIn: string;
    }

    /** 登录返回的用户信息 */
    interface User {
      id: string;
      email: string;
      userName: string;
      firstName: string;
      lastName: string;
      roles: string[];
      buttons: string[];
    }

    /** 登录接口 data 部分 */
    interface LoginData {
      user: User;
      token: Token;
    }

    /** 登录接口完整响应体 */
    interface LoginResponse {
      code: number;
      success: boolean;
      data: LoginData;
      message: string;
      timestamp: string;
    }

    /** request 返回的最终类型 */
    type LoginToken = LoginResponse;

    /** 创建用户信息类型 */
    interface CreateUser {
      email: string;
      userName: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      roleIds?: string[];
      avatar?: string;
      phone?: string;
      gender?: SystemManage.User['gender'];
      nickName?: string;
    }
    /** 更新用户信息类型 */
    interface UpdateUser {
      id: string;
      email: string;
      userName: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      roleIds?: string[];
      avatar?: string;
      phone?: string;
      gender?: SystemManage.User['gender'];
      nickName?: string;
    }

    /** 用户权限列表类型 */
    interface UserPermission {
      id: string;
      name: string;
      type: 'button' | 'menu';
      permission: string;
    }
  }

  /**
   * namespace Route
   *
   * backend api module: "route"
   */
  namespace Route {
    type ElegantConstRoute = import('@elegant-router/types').ElegantConstRoute;

    interface MenuRoute extends ElegantConstRoute {
      id: string;
    }

    interface UserRoute {
      routes: MenuRoute[];
      home: import('@elegant-router/types').LastLevelRouteKey;
    }
  }
}
