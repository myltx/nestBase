<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { createTag, updateTag } from '@/service/api/tag';
import { $t } from '@/locales';

defineOptions({
  name: 'TagOperateDrawer'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.SystemManage.Tag | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{ (e: 'submitted'): void }>();

const visible = defineModel<boolean>('visible', { default: false });
const loading = ref(false);

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

type Model = {
  name: string;
  slug: string;
  description: string;
};

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    name: '',
    slug: '',
    description: ''
  };
}

const titleMap: Record<NaiveUI.TableOperateType, string> = {
  add: $t('page.manage.tag.addTag'),
  edit: $t('page.manage.tag.editTag')
};

const title = computed(() => titleMap[props.operateType]);

const rules: Record<keyof Model, App.Global.FormRule | App.Global.FormRule[]> = {
  name: defaultRequiredRule,
  slug: defaultRequiredRule,
  description: {}
};

watch(visible, val => {
  if (!val) return;
  if (props.operateType === 'edit' && props.rowData) {
    model.value = {
      name: props.rowData.name,
      slug: props.rowData.slug,
      description: props.rowData.description || ''
    };
  } else {
    model.value = createDefaultModel();
  }
  restoreValidation();
});

async function handleSubmit() {
  loading.value = true;
  try {
    await validate();
    if (props.operateType === 'edit' && props.rowData) {
      await updateTag({ id: props.rowData.id, ...model.value });
      window.$message?.success($t('common.updateSuccess'));
    } else {
      await createTag(model.value);
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
  <NDrawer v-model:show="visible" display-directive="show" :width="360" :mask-closable="false">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="top">
        <NFormItem :label="$t('page.manage.tag.name')" path="name">
          <NInput v-model:value="model.name" :placeholder="$t('page.manage.tag.form.name')" />
        </NFormItem>
        <NFormItem :label="$t('page.manage.tag.slug')" path="slug">
          <NInput v-model:value="model.slug" :placeholder="$t('page.manage.tag.form.slug')" />
        </NFormItem>
        <NFormItem :label="$t('page.manage.tag.description')" path="description">
          <NInput v-model:value="model.description" type="textarea" :placeholder="$t('page.manage.tag.form.description')" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace>
          <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="loading" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
