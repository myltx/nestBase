declare namespace Api {
  /**
   * namespace SystemManage
   *
   * backend api module: "systemManage"
   */
  namespace SystemManage {
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    /** role */
    type Role = Common.CommonRecord<{
      /** role name */
      name: string;
      /** role code */
      code: string;
      /** role description */
      description: string;
      isSystem: boolean;
      /** role home route */
      home: string;
      /** menu id collection */
      menuIds?: string[];
      /** permission id collection */
      permissionIds?: string[];
    }>;

    /** role search params */
    type RoleSearchParams = CommonType.RecordNullable<
      Pick<Api.SystemManage.Role, 'name' | 'code' | 'status'> & CommonSearchParams
    >;

    /** role list */
    type RoleList = Common.PaginatingQueryRecord<Role>;

    /** all role */
    type AllRole = Pick<Role, 'id' | 'name' | 'code'>;

    /**
     * user gender
     *
     * - "1": "male"
     * - "2": "female"
     */
    type UserGender = 'MALE' | 'FEMALE' | 'UNKNOWN';

    /** user */
    type User = Common.CommonRecord<{
      /** user name */
      userName: string;
      /** user gender */
      gender: UserGender | null;
      /** user nick name */
      nickName: string;
      /** user phone */
      phone: string;
      /** user email */
      email: string;
      /** user role code collection */
      roleIds: string[];
      /** first name */
      firstName?: string;
      /** last name */
      lastName?: string;
    }>;

    /** user search params */
    type UserSearchParams = CommonType.RecordNullable<
      Pick<
        Api.SystemManage.User,
        'userName' | 'gender' | 'nickName' | 'phone' | 'email' | 'status'
      > &
        CommonSearchParams & {
          /** search keyword for general search */
          search?: string;
        }
    >;

    /** user list */
    type UserList = Common.PaginatingQueryRecord<User>;

    /**
     * menu type
     *
     * - "1": directory
     * - "2": menu
     */
    type MenuType = 1 | 2;

    type MenuButton = {
      /** button id (optional for creation, present in response) */
      id?: string;
      /**
       * button code
       *
       * it can be used to control the button permission
       */
      code: string;
      /** button description */
      desc: string;
    };

    /**
     * icon type
     *
     * - "1": iconify icon
     * - "2": local icon
     */
    type IconType = 1 | 2;

    type MenuPropsOfRoute = Pick<
      import('vue-router').RouteMeta,
      | 'i18nKey'
      | 'keepAlive'
      | 'constant'
      | 'order'
      | 'href'
      | 'hideInMenu'
      | 'activeMenu'
      | 'multiTab'
      | 'fixedIndexInTab'
      | 'query'
    >;

    type Menu = Common.CommonRecord<{
      /** parent menu id */
      parentId: number;
      /** menu type */
      menuType: MenuType;
      /** menu name */
      menuName: string;
      /** route name */
      routeName: string;
      /** route path */
      routePath: string;
      /** component */
      component?: string;
      /** iconify icon name or local icon name */
      icon: string;
      /** icon type */
      iconType: IconType;
      /** buttons */
      buttons?: MenuButton[] | null;
      /** children menu */
      children?: Menu[] | null;
    }> &
      MenuPropsOfRoute;

    /** create menu */
    type CreateMenu = {
      /** parent menu id */
      parentId: number;
      /** menu type */
      menuType: MenuType;
      /** menu name */
      menuName: string;
      /** route name */
      routeName: string;
      /** route path */
      routePath: string;
      /** component */
      component?: string;
      /** iconify icon name or local icon name */
      icon: string;
      /** icon type */
      iconType: IconType;
      /** buttons */
      buttons?: MenuButton[] | null;
      /** children menu */
      children?: Menu[] | null;
    } & MenuPropsOfRoute;

    type UpdateMenu = Partial<Omit<CreateMenu, 'parentId'>> & { id: number };

    /** menu list */
    type MenuList = Common.PaginatingQueryRecord<Menu>;

    type MenuTree = {
      id: string;
      label: string;
      pId: string;
      children?: MenuTree[];
    };

    /** create role */
    type CreateRole = Pick<
      Api.SystemManage.Role,
      'name' | 'code' | 'description' | 'home' | 'status'
    > & {
      menuIds?: string[];
      permissionIds?: string[];
    };

    /** update role */
    type UpdateRole = Partial<CreateRole> & { id: string };

    /** article status */
    type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE';

    /** article edit type */
    type ArticleEditType = 'MARKDOWN' | 'RICHTEXT' | 'UPLOAD';

    type Article = Omit<Api.Common.CommonRecord, 'status'> & {
      /** article title */
      title: string;
      /** article slug */
      slug?: string;
      /** article summary */
      summary?: string | null;
      /** editor type */
      editorType: ArticleEditType;
      /** markdown content */
      contentMd?: string | null;
      /** rich text(html) content */
      contentHtml?: string | null;
      /** raw uploaded content */
      contentRaw?: string | null;
      /** cover image url */
      coverImage?: string | null;
      /** belong category id */
      categoryId?: string | null;
      /** tag id list */
      tagIds: string[];
      /** author name */
      authorName: string;
      /** publish time */
      publishTime?: string | null;
      /** is top */
      isTop: boolean;
      /** is recommend */
      isRecommend: boolean;
      /** article status */
      status: ArticleStatus;
      /** view count */
      viewCount: number;
    };

    type ArticleSearchParams = CommonType.RecordNullable<
      {
        title: string;
        categoryId: string;
        status: ArticleStatus;
        editorType: ArticleEditType;
        isTop: boolean;
        isRecommend: boolean;
        dateRange: [string, string];
      } & CommonSearchParams
    >;

    type ArticleList = Common.PaginatingQueryRecord<Article>;

    type ArticlePayload = Pick<
      Article,
      | 'title'
      | 'slug'
      | 'summary'
      | 'editorType'
      | 'contentMd'
      | 'contentHtml'
      | 'contentRaw'
      | 'coverImage'
      | 'categoryId'
      | 'tagIds'
      | 'authorName'
      | 'publishTime'
      | 'isTop'
      | 'isRecommend'
    >;

    type CreateArticle = ArticlePayload;

    type UpdateArticle = ArticlePayload & { id: number };

    type Category = {
      id: string;
      name: string;
      slug: string;
      description?: string | null;
      parentId?: string | null;
      order?: number | string | null;
      children?: Category[];
    };

    type CategoryTree = Category;

    type CreateCategory = {
      name: string;
      slug: string;
      description?: string | null;
      parentId?: string | null;
      order?: number | string | null;
    };

    type UpdateCategory = Partial<CreateCategory> & { id: string };

    type Tag = {
      id: string;
      name: string;
      slug: string;
      description?: string | null;
      createTime?: string;
      updateTime?: string;
    };

    type TagList = Common.PaginatingQueryRecord<Tag>;

    type TagSearchParams = CommonType.RecordNullable<
      {
        search: string;
        slug: string;
      } & CommonSearchParams
    >;

    type CreateTag = {
      name: string;
      slug: string;
      description?: string | null;
    };

    type UpdateTag = Partial<CreateTag> & { id: string };
  }

  // 添加一个 通用的接口返回成功的类型
  type CommonResponse<T> = {
    code: number;
    message: string;
    data: T;
  };
}
