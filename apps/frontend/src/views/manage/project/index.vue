<script setup lang="tsx">
import { ref } from 'vue';
import { useBoolean } from '@sa/hooks';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import { deleteProject, fetchGetProjectList } from '@/service/api/project';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import ProjectOperateModal from './modules/project-operate-modal.vue';
import ProjectSearch from './modules/project-search.vue';

defineOptions({
  name: 'ProjectManage',
});

const {
  columns,
  columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  searchParams,
  resetSearchParams,
} = useTable<Api.SystemManage.Project>({
  apiFn: fetchGetProjectList,
  apiParams: {
    current: 1,
    size: 10,
    search: undefined,
    featured: undefined,
    tech: undefined,
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48,
    },
    {
      key: 'title',
      title: '标题',
      minWidth: 120,
    },
    {
      key: 'description',
      title: '描述',
      minWidth: 200,
      ellipsis: {
        tooltip: true,
      },
    },
    {
      key: 'tech',
      title: '技术栈',
      width: 200,
      render: (row) => {
        return (
          <NSpace size={4}>
            {row.tech.map((tag) => (
              <NTag size="small">{tag}</NTag>
            ))}
          </NSpace>
        );
      },
    },
    {
      key: 'featured',
      title: '精选',
      align: 'center',
      width: 80,
      render: (row) => {
        return row.featured ? (
          <NTag type="success" size="small">
            是
          </NTag>
        ) : (
          <NTag type="default" size="small">
            否
          </NTag>
        );
      },
    },
    {
      key: 'url',
      title: '链接',
      width: 150,
      render: (row) => {
        const links = [];
        if (row.url) {
          links.push(
            <a href={row.url} target="_blank" class="text-primary hover:underline mr-2">
              官网
            </a>,
          );
        }
        if (row.github) {
          links.push(
            <a href={row.github} target="_blank" class="text-primary hover:underline mr-2">
              GitHub
            </a>,
          );
        }
        if (row.demo) {
          links.push(
            <a href={row.demo} target="_blank" class="text-primary hover:underline">
              演示
            </a>,
          );
        }
        return <div class="flex items-center">{links}</div>;
      },
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 130,
      render: (row) => (
        <div class="flex-center gap-8px">
          <NButton type="primary" ghost size="small" onClick={() => edit(row.id)}>
            {$t('common.edit')}
          </NButton>
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
        </div>
      ),
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
} = useTableOperate(data, getData);

async function handleDelete(id: string) {
  // request
  const { error } = await deleteProject(id);
  if (!error) {
    onDeleted();
  }
}

function edit(id: string) {
  handleEdit(id);
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <ProjectSearch
      v-model:model="searchParams"
      @reset="resetSearchParams"
      @search="getDataByPage"
    />
    <NCard title="项目列表" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @add="handleAdd"
          @delete="onBatchDeleted"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!mobilePagination"
        :scroll-x="960"
        :loading="loading"
        remote
        :row-key="(row) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <ProjectOperateModal
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getData"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
