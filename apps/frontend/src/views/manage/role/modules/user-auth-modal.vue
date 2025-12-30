<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NTransfer, NSpace, NButton } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { fetchGetUsersByRole, updateUserRoles } from '@/service/api/role';
import { fetchGetUserList } from '@/service/api/user';
import { $t } from '@/locales';

defineOptions({
  name: 'UserAuthModal',
});

interface Props {
  /** the roleId */
  roleId: string;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', {
  default: false,
});

const { bool: loading, setTrue: startLoading, setFalse: endLoading } = useBoolean();

const title = computed(() => $t('common.edit') + $t('page.manage.role.userAuth'));

interface TransferOption {
  label: string;
  value: string;
}

const allUsers = ref<TransferOption[]>([]);
const assignedUserIds = ref<string[]>([]);

/** Fetch all users for Transfer source */
async function getAllUsers() {
  // Fetch a large number to simulate "all" for now
  const { data, error } = await fetchGetUserList({ current: 1, size: 3000 });
  if (!error && data) {
    allUsers.value = data.records.map((user) => ({
      label: user.userName + (user.nickName ? ` (${user.nickName})` : ''),
      value: user.id,
    }));
  }
}

/** Fetch current assignments */
async function getAssignedUsers() {
  startLoading();
  // Fetch current role users
  const { data, error } = await fetchGetUsersByRole(props.roleId, {
    current: 1,
    size: 3000,
  });

  if (!error && data) {
    // Determine the items array whether it's 'records' or 'items' based on API response structure
    const items = (data as any).items || data.records || [];
    assignedUserIds.value = items.map((user: any) => user.id);
  }
  endLoading();
}

async function init() {
  // Parallel fetch
  await Promise.all([getAllUsers(), getAssignedUsers()]);
}

async function handleSubmit() {
  startLoading();
  const { error } = await updateUserRoles(props.roleId, assignedUserIds.value);
  if (!error) {
    window.$message?.success?.($t('common.updateSuccess'));
    visible.value = false;
  }
  endLoading();
}

function handleClose() {
  visible.value = false;
}

watch(visible, (val) => {
  if (val) {
    init();
  }
});
</script>

<template>
  <NModal v-model:show="visible" :title="title" preset="card" class="w-800px">
    <div class="h-400px flex justify-center">
      <NTransfer
        v-model:value="assignedUserIds"
        :options="allUsers"
        filterable
        virtual-scroll
        class="h-full w-full"
        source-title="未授权用户"
        target-title="已授权用户"
      />
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleClose">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
