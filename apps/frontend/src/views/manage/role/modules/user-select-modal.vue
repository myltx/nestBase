<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue';
import { NDataTable, NModal, NInput, NButton, NSpace, NFormItem } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { fetchGetUserList } from '@/service/api/user';
import { $t } from '@/locales';

defineOptions({
  name: 'UserSelectModal',
});

const visible = defineModel<boolean>('visible', {
  default: false,
});

const emit = defineEmits<{
  (e: 'confirm', userIds: string[]): void;
}>();

const { bool: loading, setTrue: startLoading, setFalse: endLoading } = useBoolean();

const title = computed(() => $t('common.add') + $t('page.manage.user.common.user'));

type RowData = Api.SystemManage.User;

const data = ref<RowData[]>([]);
const checkedRowKeys = ref<string[]>([]);
const search = ref('');

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  onChange: (page: number) => {
    pagination.page = page;
    getData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    getData();
  },
});

const columns: any[] = [
  { type: 'selection', key: 'selection' },
  { key: 'userName', title: $t('page.manage.user.userName') },
  { key: 'nickName', title: $t('page.manage.user.nickName') },
  { key: 'email', title: $t('page.manage.user.userEmail') },
]; // Simple columns

async function getData() {
  startLoading();
  const { data: res, error } = await fetchGetUserList({
    current: pagination.page,
    size: pagination.pageSize,
    search: search.value,
    // status: '1' // Only enable?
  });

  if (!error && res) {
    data.value = res.records;
    pagination.itemCount = res.total;
  }
  endLoading();
}

function handleSearch() {
  pagination.page = 1;
  getData();
}

function handleSubmit() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.warning?.($t('page.manage.role.form.selectUser'));
    return;
  }
  emit('confirm', checkedRowKeys.value);
  // visible.value = false; // Let parent close? Or close here.
}

watch(visible, (val) => {
  if (val) {
    checkedRowKeys.value = [];
    search.value = '';
    getData();
  }
});

function handleUpdateCheckedRowKeys(keys: (string | number)[]) {
  checkedRowKeys.value = keys as string[];
}
</script>

<template>
  <NModal v-model:show="visible" :title="title" preset="card" class="w-700px">
    <NSpace vertical class="gap-16px">
      <div class="flex gap-12px">
        <NInput
          v-model:value="search"
          :placeholder="$t('common.keywordSearch')"
          class="w-240px"
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" @click="handleSearch">
          <icon-ic:round-search class="text-icon mr-4px" />
          {{ $t('common.search') }}
        </NButton>
      </div>

      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row) => row.id"
        @update:checked-row-keys="handleUpdateCheckedRowKeys"
      />
    </NSpace>

    <template #footer>
      <NSpace justify="end">
        <NButton size="small" @click="visible = false">
          {{ $t('common.cancel') }}
        </NButton>
        <NButton type="primary" size="small" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
