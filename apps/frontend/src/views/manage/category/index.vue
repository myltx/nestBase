<script setup lang="ts">
import { h, onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NPopconfirm, NSpace } from 'naive-ui';
import { deleteCategory, fetchGetCategoryTree } from '@/service/api/category';
import { $t } from '@/locales';
import CategoryOperateModal from './modules/category-operate-modal.vue';

type OperateType = 'add' | 'edit';

const loading = ref(false);
const treeData = ref<Api.SystemManage.CategoryTree[]>([]);
const operateVisible = ref(false);
const operateType = ref<OperateType>('add');
const currentRow = ref<Api.SystemManage.Category | null>(null);
const currentParentId = ref<string | null>(null);

const columns = ref<NaiveUI.DataTableColumn[]>([
  {
    key: 'name',
    title: $t('page.manage.category.name'),
    minWidth: 200
  },
  {
    key: 'slug',
    title: $t('page.manage.category.slug'),
    minWidth: 160
  },
  {
    key: 'order',
    title: $t('page.manage.category.order'),
    width: 80,
    align: 'center'
  },
  {
    key: 'operate',
    title: $t('common.operate'),
    width: 260,
    render: row =>
      h('div', { class: 'flex gap-8px' }, [
        h(
          NButton,
          { size: 'small', ghost: true, type: 'primary', onClick: () => handleAddChild(row as Api.SystemManage.Category) },
          { default: () => $t('page.manage.category.addChild') }
        ),
        h(
          NButton,
          { size: 'small', ghost: true, onClick: () => handleEdit(row as Api.SystemManage.Category) },
          { default: () => $t('common.edit') }
        ),
        h(
          NPopconfirm,
          { onPositiveClick: () => handleDelete(row as Api.SystemManage.Category) },
          {
            trigger: () =>
              h(
                NButton,
                { size: 'small', ghost: true, type: 'error' },
                { default: () => $t('common.delete') }
              ),
            default: () => $t('common.confirmDelete')
          }
        )
      ])
  }
]);

async function getData() {
  loading.value = true;
  try {
    const { data } = await fetchGetCategoryTree();
    treeData.value = data || [];
  } finally {
    loading.value = false;
  }
}

function handleAddRoot() {
  operateType.value = 'add';
  currentRow.value = null;
  currentParentId.value = null;
  operateVisible.value = true;
}

function handleAddChild(row: Api.SystemManage.Category) {
  operateType.value = 'add';
  currentRow.value = null;
  currentParentId.value = row.id;
  operateVisible.value = true;
}

function handleEdit(row: Api.SystemManage.Category) {
  operateType.value = 'edit';
  currentRow.value = row;
  currentParentId.value = row.parentId || null;
  operateVisible.value = true;
}

async function handleDelete(row: Api.SystemManage.Category) {
  await deleteCategory(row.id);
  window.$message?.success($t('common.deleteSuccess'));
  getData();
}

function handleSubmitted() {
  getData();
}

function handleRefresh() {
  getData();
}

onMounted(() => {
  getData();
});
</script>

<template>
  <div class="flex-col-stretch gap-16px">
    <NCard :title="$t('page.manage.category.title')" :bordered="false" size="small">
      <template #header-extra>
        <NSpace>
          <NButton ghost :loading="loading" @click="handleRefresh">
            {{ $t('common.refresh') }}
          </NButton>
          <NButton type="primary" @click="handleAddRoot">
            {{ $t('page.manage.category.addRoot') }}
          </NButton>
        </NSpace>
      </template>
      <NDataTable
        :columns="columns"
        :data="treeData"
        :loading="loading"
        :row-key="row => row.id"
        children-key="children"
        size="small"
      />
    </NCard>
    <CategoryOperateModal
      v-model:visible="operateVisible"
      :operate-type="operateType"
      :row-data="currentRow"
      :parent-id="currentParentId"
      @submitted="handleSubmitted"
    />
  </div>
</template>

<style scoped></style>
