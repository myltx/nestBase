<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { deleteDictionary, fetchGetDictionaryList } from '@/service/api/dictionary';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import { useBoolean } from '@sa/hooks';
import DictionaryOperateModal from './modules/dictionary-operate-modal.vue';
import DictionaryItemList from './modules/dictionary-item-list.vue';

defineOptions({
  name: 'DictionaryManage',
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
} = useTable<Api.SystemManage.Dictionary>({
  apiFn: fetchGetDictionaryList,
  apiParams: {
    current: 1,
    size: 10,
    keyword: undefined,
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48,
    },
    {
      key: 'name',
      title: '字典名称',
      minWidth: 120,
    },
    {
      key: 'code',
      title: '字典编码',
      minWidth: 120,
      render: (row) => <NTag>{row.code}</NTag>,
    },
    {
      key: 'description',
      title: '描述',
      minWidth: 150,
      ellipsis: {
        tooltip: true,
      },
    },
    {
      key: 'isActive',
      title: '状态',
      align: 'center',
      width: 80,
      render: (row) => {
        return row.isActive ? (
          <NTag type="success" size="small">
            启用
          </NTag>
        ) : (
          <NTag type="error" size="small">
            禁用
          </NTag>
        );
      },
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 200,
      render: (row) => (
        <div class="flex-center gap-8px">
          <NButton type="primary" ghost size="small" onClick={() => handleManageItems(row)}>
            配置数据
          </NButton>
          <NButton size="small" onClick={() => handleEdit(row.id)}>
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

const { bool: itemsVisible, setTrue: openItemsDrawer } = useBoolean();
const currentDictionary = ref<Api.SystemManage.Dictionary | null>(null);

function handleManageItems(row: Api.SystemManage.Dictionary) {
  currentDictionary.value = row;
  openItemsDrawer();
}

async function handleDelete(id: string) {
  const { error } = await deleteDictionary(id);
  if (!error) {
    onDeleted();
  }
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="字典管理" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @add="handleAdd"
          @delete="onBatchDeleted"
          @refresh="getData"
        >
          <template #default>
            <div class="flex gap-4">
              <NInput
                v-model:value="searchParams.keyword"
                placeholder="搜索名称或编码"
                clearable
                @keyup.enter="getDataByPage"
              />
              <NButton type="primary" ghost @click="getDataByPage"> 搜索 </NButton>
            </div>
          </template>
        </TableHeaderOperation>
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
      <DictionaryOperateModal
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getData"
      />
      <DictionaryItemList
        v-model:visible="itemsVisible"
        :dictionary-id="currentDictionary?.id"
        :dictionary-name="currentDictionary?.name"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
