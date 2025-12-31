<script setup lang="tsx">
import { ref, watch } from 'vue';
import { NButton, NPopconfirm, NTag, NSpace } from 'naive-ui';
import { fetchGetDictionaryItems, deleteDictionaryItem } from '@/service/api/dictionary';
import { useBoolean } from '@sa/hooks';
import DictionaryItemOperateModal from './dictionary-item-operate-modal.vue';
import { $t } from '@/locales';

defineOptions({
  name: 'DictionaryItemList',
});

interface Props {
  dictionaryId?: string;
  dictionaryName?: string;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', {
  default: false,
});

const { bool: modalVisible, setTrue: openModal, setFalse: closeModal } = useBoolean();
const operateType = ref<NaiveUI.TableOperateType>('add');
const editingData = ref<Api.SystemManage.DictionaryItem | null>(null);
const data = ref<Api.SystemManage.DictionaryItem[]>([]);
const loading = ref(false);

async function getData() {
  if (!props.dictionaryId) return;

  loading.value = true;
  const { data: res, error } = await fetchGetDictionaryItems(props.dictionaryId);
  if (!error) {
    data.value = res || [];
  }
  loading.value = false;
}

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openModal();
}

function handleEdit(item: Api.SystemManage.DictionaryItem) {
  operateType.value = 'edit';
  editingData.value = item;
  openModal();
}

async function handleDelete(id: string) {
  if (!props.dictionaryId) return;
  const { error } = await deleteDictionaryItem(props.dictionaryId, id);
  if (!error) {
    window.$message?.success($t('common.deleteSuccess'));
    getData();
  }
}

watch(visible, (val) => {
  if (val && props.dictionaryId) {
    getData();
  }
});

const columns = [
  {
    title: '显示名称',
    key: 'label',
  },
  {
    title: '字典值',
    key: 'value',
    render: (row: Api.SystemManage.DictionaryItem) => (
      <NTag color={{ borderColor: row.color, textColor: row.color }} bordered>
        {row.value}
      </NTag>
    ),
  },
  {
    title: '排序',
    key: 'sort',
  },
  {
    title: '状态',
    key: 'status',
    render: (row: Api.SystemManage.DictionaryItem) => (
      <NTag type={row.status ? 'success' : 'error'}>{row.status ? '启用' : '禁用'}</NTag>
    ),
  },
  {
    title: '操作',
    key: 'operate',
    render: (row: Api.SystemManage.DictionaryItem) => (
      <NSpace>
        <NButton size="small" type="primary" ghost onClick={() => handleEdit(row)}>
          编辑
        </NButton>
        <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
          {{
            default: () => '确认删除该字典项吗？',
            trigger: () => (
              <NButton size="small" type="error" ghost>
                删除
              </NButton>
            ),
          }}
        </NPopconfirm>
      </NSpace>
    ),
  },
];
</script>

<template>
  <NDrawer v-model:show="visible" :width="720">
    <NDrawerContent :title="`字典项管理 - ${dictionaryName || ''}`">
      <div class="h-full flex flex-col gap-4">
        <div class="flex justify-end">
          <NButton type="primary" @click="handleAdd">
            <template #icon>
              <icon-ic-round-plus class="text-icon" />
            </template>
            新增字典项
          </NButton>
        </div>
        <NDataTable
          :columns="columns"
          :data="data"
          :loading="loading"
          size="small"
          class="flex-1"
        />
      </div>
    </NDrawerContent>
    <DictionaryItemOperateModal
      v-model:visible="modalVisible"
      :operate-type="operateType"
      :row-data="editingData"
      :dictionary-id="dictionaryId || ''"
      @submitted="getData"
    />
  </NDrawer>
</template>
