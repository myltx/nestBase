<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { createCategory, updateCategory } from '@/service/api/category';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'CategoryOperateModal'
});

interface Props {
  operateType: 'add' | 'edit';
  rowData?: Api.SystemManage.Category | null;
  parentId?: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{ (e: 'submitted'): void }>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

type Model = Pick<Api.SystemManage.Category, 'order' | 'name' | 'slug' | 'description' | 'parentId'>;

const model = ref<Model>(createDefaultModel());
const loading = ref(false);

const title = computed(() => {
  if (props.operateType === 'edit') {
    return $t('page.manage.category.editCategory');
  }
  return props.parentId ? $t('page.manage.category.addChild') : $t('page.manage.category.addRoot');
});

function createDefaultModel(parentId: string | null = props.parentId ?? null): Model {
  return {
    name: '',
    slug: '',
    description: '',
    parentId,
    order: null
  };
}

const rules: Record<keyof Model, App.Global.FormRule | App.Global.FormRule[]> = {
  name: defaultRequiredRule,
  slug: defaultRequiredRule,
  description: {},
  parentId: {},
  order: {}
};

watch(visible, val => {
  if (val) {
    if (props.operateType === 'edit' && props.rowData) {
      model.value = {
        name: props.rowData.name,
        slug: props.rowData.slug,
        description: props.rowData.description || '',
        parentId: props.rowData.parentId || null,
        order: props.rowData.order === undefined || props.rowData.order === null ? null : Number(props.rowData.order)
      };
    } else {
      model.value = createDefaultModel(props.parentId ?? null);
    }
    restoreValidation();
  }
});

async function handleSubmit() {
  loading.value = true;
  try {
    await validate();
    const payload: Api.SystemManage.CreateCategory = {
      name: model.value.name,
      slug: model.value.slug,
      description: model.value.description,
      parentId: model.value.parentId,
      order: model.value.order === null || model.value.order === undefined ? undefined : String(model.value.order)
    };
    if (props.operateType === 'edit' && props.rowData) {
      await updateCategory({ id: props.rowData.id, ...payload });
      window.$message?.success($t('common.updateSuccess'));
    } else {
      await createCategory(payload);
      window.$message?.success($t('common.addSuccess'));
    }
    emit('submitted');
    visible.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" :title="title" class="w-400px">
    <NForm ref="formRef" :model="model" :rules="rules" label-placement="top">
      <NFormItem :label="$t('page.manage.category.name')" path="name">
        <NInput v-model:value="model.name" :placeholder="$t('page.manage.category.form.name')" />
      </NFormItem>
      <NFormItem :label="$t('page.manage.category.slug')" path="slug">
        <NInput v-model:value="model.slug" :placeholder="$t('page.manage.category.form.slug')" />
      </NFormItem>
      <NFormItem :label="$t('page.manage.category.description')" path="description">
        <NInput
          v-model:value="model.description"
          type="textarea"
          :placeholder="$t('page.manage.category.form.description')"
        />
      </NFormItem>
      <NFormItem :label="$t('page.manage.category.order')" path="order">
        <NInputNumber v-model:value="model.order" :placeholder="$t('page.manage.category.form.order')" class="w-full" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
