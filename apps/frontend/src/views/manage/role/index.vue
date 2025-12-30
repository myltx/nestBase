<script setup lang="tsx">
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { enableStatusRecord } from '@/constants/business';
import { deleteRole, fetchGetRoleList } from '@/service/api/role';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import RoleOperateDrawer from './modules/role-operate-drawer.vue';
import RoleSearch from './modules/role-search.vue';
import ButtonAuthModal from './modules/button-auth-modal.vue';
import UserAuthModal from './modules/user-auth-modal.vue';
import { useBoolean } from '@sa/hooks';
import { ref } from 'vue';

const appStore = useAppStore();

const {
  bool: buttonAuthVisible,
  setTrue: openButtonAuth,
  setFalse: closeButtonAuth,
} = useBoolean();
const { bool: userAuthVisible, setTrue: openUserAuth, setFalse: closeUserAuth } = useBoolean();
const roleId = ref<string>('');

function handleButtonAuth(id: string) {
  roleId.value = String(id);
  openButtonAuth();
}

function handleUserAuth(id: string) {
  roleId.value = String(id);
  openUserAuth();
}

const {
  columns,
  columnChecks,
  data,
  loading,
  getData,
  getDataByPage,
  mobilePagination,
  searchParams,
  resetSearchParams,
} = useTable({
  apiFn: fetchGetRoleList,
  apiParams: {
    current: 1,
    size: 10,
    // if you want to use the searchParams in Form, you need to define the following properties, and the value is null
    // the value can not be undefined, otherwise the property in Form will not be reactive
    status: null,
    name: null,
    code: null,
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48,
    },
    {
      key: 'index',
      title: $t('common.index'),
      width: 64,
      align: 'center',
    },
    {
      key: 'name',
      title: $t('page.manage.role.roleName'),
      align: 'center',
      minWidth: 120,
    },
    {
      key: 'code',
      title: $t('page.manage.role.roleCode'),
      align: 'center',
      minWidth: 120,
    },
    {
      key: 'description',
      title: $t('page.manage.role.roleDesc'),
      minWidth: 120,
    },
    {
      key: 'status',
      title: $t('page.manage.role.roleStatus'),
      align: 'center',
      width: 100,
      render: (row) => {
        if (row.status === null) {
          return null;
        }

        const tagMap: Record<Api.Common.EnableStatus, NaiveUI.ThemeColor> = {
          1: 'success',
          2: 'warning',
        };

        const label = $t(enableStatusRecord[row.status]);

        return <NTag type={tagMap[row.status]}>{label}</NTag>;
      },
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 280,
      fixed: 'right',
      render: (row) => {
        return (
          <div class="flex-center gap-8px">
            {/* 所有人都显示资源授权按钮 */}
            {/* <NButton type="primary" ghost size="small" onClick={() => edit(row.id)}>
              {$t('page.manage.role.resourcesAuth')}
            </NButton> */}
            {
              <NButton type="primary" ghost size="small" onClick={() => handleButtonAuth(row.id)}>
                {$t('page.manage.role.buttonAuth')}
              </NButton>
            }
            {
              <NButton type="primary" ghost size="small" onClick={() => handleUserAuth(row.id)}>
                {$t('page.manage.role.userAuth')}
              </NButton>
            }
            {
              <NButton type="primary" ghost size="small" onClick={() => edit(row.id)}>
                {$t('common.edit')}
              </NButton>
            }
            {/* 只有非管理员显示编辑和删除 */}
            {!row.isSystem && (
              <>
                <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
                  {{
                    default: () => $t('common.confirmDelete'),
                    trigger: () => (
                      <NButton type="error" ghost size="small">
                        {$t('common.delete')}
                      </NButton>
                    ),
                  }}
                </NPopconfirm>
              </>
            )}
          </div>
        );
      },
    },
  ],
});

const {
  drawerVisible,
  operateType,
  editingData,
  handleAdd,
  handleEdit,
  checkedRowKeys,
  onBatchDeleted,
  onDeleted,
  // closeDrawer
} = useTableOperate(data, getData);

async function handleBatchDelete() {
  // request
  console.log(checkedRowKeys.value);

  onBatchDeleted();
}

async function handleDelete(id: number) {
  const { error } = await deleteRole(id);
  if (!error) {
    onDeleted();
  }
}

function edit(id: number) {
  handleEdit(id);
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <RoleSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <NCard
      :title="$t('page.manage.role.title')"
      :bordered="false"
      size="small"
      class="card-wrapper sm:flex-1-hidden"
    >
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="1000"
        :loading="loading"
        remote
        :row-key="(row) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <RoleOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
      <ButtonAuthModal v-model:visible="buttonAuthVisible" :role-id="roleId" />
      <UserAuthModal v-model:visible="userAuthVisible" :role-id="roleId" />
    </NCard>
  </div>
</template>

<style scoped></style>
