<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useBoolean } from '@sa/hooks';
import { fetchGetMenuTree } from '@/service/api/menu';
import { fetchGetRole, updateRole } from '@/service/api/role';
import { $t } from '@/locales';

defineOptions({
  name: 'ButtonAuthModal',
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

const title = computed(() => $t('common.edit') + $t('page.manage.role.buttonAuth'));

type TreeOption = {
  key: string;
  label: string;
  children?: TreeOption[];
  isLeaf?: boolean;
  checkboxDisabled?: boolean;
};

const tree = ref<TreeOption[]>([]);
const checks = ref<string[]>([]);

/**
 * Get menu tree and transform to tree options
 * Menus are nodes, Buttons are leaf nodes (children)
 */
async function getMenuTree() {
  const { error, data } = await fetchGetMenuTree();

  if (!error) {
    tree.value = transformMenuToTree(data || []);
  }
}

/**
 * Transform menu data to tree options
 */
function transformMenuToTree(menus: Api.SystemManage.Menu[]): TreeOption[] {
  return menus.map((menu) => {
    const children: TreeOption[] = [];

    // Add buttons as children
    if (menu.buttons && menu.buttons.length > 0) {
      children.push(
        ...menu.buttons.map((btn) => ({
          // key: `btn_${btn.id}`, // Add prefix to distinguish, though UUIDs should be unique.
          // Note: Actually permission ID is UUID.
          // If we use btn.id directly, we need to make sure Menu IDs don't collide?
          // Menu IDs are also UUIDs.
          // To be safe and able to filter on submit, let's use raw UUID for buttons (permissions)
          // and prefixed ID for menus?
          // Or strictly use ID.
          // Let's use `permission_${btn.id}` vs `menu_${menu.id}` to be absolutely clear.
          key: btn.id!, // Assuming id is present (we fixed backend)
          label: `${btn.desc} [${btn.code}]`,
          isLeaf: true,
        })),
      );
    }

    // Recursively add sub-menus
    if (menu.children && menu.children.length > 0) {
      children.push(...transformMenuToTree(menu.children));
    }

    return {
      key: `menu_${menu.id}`,
      label: `${menu.menuName} (${menu.routeName})`,
      children: children.length > 0 ? children : undefined,
      checkboxDisabled: true, // Disable selection for menu folders
    };
  });
}

async function getRoleData() {
  const { error, data } = await fetchGetRole(props.roleId, { include: 'permissions' });

  if (!error) {
    // Backend returns permissionIds. These are UUIDs of permissions (buttons).
    // Our tree keys for buttons are just the UUIDs.
    // Menus keys are `menu_${id}`.
    // So we just load permissionIds directly.
    checks.value = data.permissionIds || [];
  }
}

async function handleSubmit() {
  startLoading();
  // Filter out menu keys (those starting with 'menu_') and keep only permission IDs
  // Actually, if we used `btn.id` (UUID) as key, and `menu_${id}` for menus:
  // The checked keys might contain menu keys if NTree cascade checked them.
  // We should filter them out.
  const permissionIds = checks.value.filter((key) => !key.startsWith('menu_'));

  const { error } = await updateRole({
    id: props.roleId,
    permissionIds,
  });

  if (!error) {
    window.$message?.success?.($t('common.modifySuccess'));
    visible.value = false;
  }
  endLoading();
}

async function init() {
  startLoading();
  await Promise.all([getMenuTree(), getRoleData()]);
  endLoading();
}

watch(visible, (val) => {
  if (val) {
    init();
  }
});
</script>

<template>
  <NModal v-model:show="visible" :title="title" preset="card" class="w-480px">
    <NSpin :show="loading">
      <NTree
        v-model:checked-keys="checks"
        :data="tree"
        block-line
        checkable
        expand-on-click
        virtual-scroll
        class="h-400px"
      />
    </NSpin>
    <template #footer>
      <NSpace justify="end">
        <NButton size="small" class="mt-16px" @click="visible = false">
          {{ $t('common.cancel') }}
        </NButton>
        <NButton
          type="primary"
          size="small"
          class="mt-16px"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ $t('common.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
