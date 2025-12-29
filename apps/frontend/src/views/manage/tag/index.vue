<script setup lang="tsx">
import { NButton, NCard, NDataTable, NPopconfirm } from 'naive-ui';
import { deleteTag, fetchGetTagList } from '@/service/api/tag';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import TagOperateDrawer from './modules/tag-operate-drawer.vue';
import TagSearch from './modules/tag-search.vue';

const {
  columns,
  columnChecks,
  data,
  loading,
  getData,
  getDataByPage,
  mobilePagination,
  searchParams,
  resetSearchParams
} = useTable({
  apiFn: fetchGetTagList,
  showTotal: true,
  apiParams: {
    current: 1,
    size: 10,
    search: null,
    slug: null
  },
  columns: () => [
    {
      type: 'selection',
      width: 48,
      align: 'center'
    },
    {
      key: 'index',
      title: $t('common.index'),
      width: 64,
      align: 'center'
    },
    {
      key: 'name',
      title: $t('page.manage.tag.name'),
      minWidth: 160
    },
    {
      key: 'slug',
      title: $t('page.manage.tag.slug'),
      minWidth: 160
    },
    {
      key: 'description',
      title: $t('page.manage.tag.description'),
      minWidth: 200
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      width: 160,
      align: 'center',
      render: row => (
        <div class="flex-center gap-8px">
          <NButton type="primary" ghost size="small" onClick={() => handleEditRow(row.id)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" ghost size="small">
                  {$t('common.delete')}
                </NButton>
              )
            }}
          </NPopconfirm>
        </div>
      )
    }
  ]
});

const {
  drawerVisible,
  operateType,
  editingData,
  handleAdd,
  handleEdit: openEdit,
  checkedRowKeys,
  onBatchDeleted,
  onDeleted
} = useTableOperate(data, getData);

async function handleBatchDelete() {
  if (!checkedRowKeys.value.length) return;
  await Promise.all(checkedRowKeys.value.map(id => deleteTag(String(id))));
  await onBatchDeleted();
}

async function handleDelete(id: number) {
  await deleteTag(String(id));
  await onDeleted();
}

function handleEditRow(id: number) {
  openEdit(id);
}
</script>

<template>
  <div class="flex-col-stretch gap-16px">
    <TagSearch v-model:model="searchParams" @reset="resetSearchParams" @search="() => getDataByPage(1)" />
    <NCard :title="$t('page.manage.tag.title')" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
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
        :loading="loading"
        :row-key="row => row.id"
        :pagination="mobilePagination"
        remote
      />
      <TagOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
