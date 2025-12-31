<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useNaiveForm } from '@/hooks/common/form';
import { createProject, updateProject } from '@/service/api/project';
import { $t } from '@/locales';

defineOptions({
  name: 'ProjectOperateModal',
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit data */
  rowData?: Api.SystemManage.Project | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false,
});

const { formRef, validate, restoreValidation } = useNaiveForm();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '添加项目',
    edit: '编辑项目',
  };
  return titles[props.operateType];
});

type Model = Pick<
  Api.SystemManage.Project,
  'title' | 'description' | 'url' | 'tech' | 'github' | 'demo' | 'featured'
>;

const model: Model = reactive(createDefaultModel());

const loading = ref(false);

function createDefaultModel(): Model {
  return {
    title: '',
    description: '',
    url: '',
    tech: [],
    github: '',
    demo: '',
    featured: false,
  };
}

type RuleKey = Extract<keyof Model, 'title' | 'description' | 'tech'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  title: [{ required: true, message: '请输入项目标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入项目描述', trigger: 'blur' }],
  tech: [{ type: 'array', required: true, message: '请添加技术栈', trigger: 'change' }],
};

function handleUpdateModel(modelValue: Model, newOne: Model) {
  Object.assign(modelValue, newOne);
}

async function handleSubmit() {
  await validate();

  // Transform empty strings to null for URL fields to avoid validation errors
  const payload = { ...model };
  if (!payload.url) payload.url = null;
  if (!payload.github) payload.github = null;
  if (!payload.demo) payload.demo = null;

  loading.value = true;

  const closeModal = () => {
    visible.value = false;
    emit('submitted');
  };

  try {
    if (props.operateType === 'add') {
      const { error } = await createProject(payload);
      if (!error) {
        window.$message?.success($t('common.addSuccess'));
        closeModal();
      }
    } else {
      if (!props.rowData?.id) return;
      const { error } = await updateProject({ ...payload, id: props.rowData.id });
      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
        closeModal();
      }
    }
  } finally {
    loading.value = false;
  }
}

watch(visible, () => {
  if (visible.value) {
    if (props.operateType === 'edit' && props.rowData) {
      handleUpdateModel(model, props.rowData);
    } else {
      handleUpdateModel(model, createDefaultModel());
    }
    restoreValidation();
  }
});
</script>

<template>
  <NModal v-model:show="visible" :title="title" preset="card" class="w-800px">
    <NForm
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="left"
      :label-width="100"
      require-mark-placement="right-hanging"
    >
      <NFormItem label="标题" path="title">
        <NInput v-model:value="model.title" placeholder="请输入项目标题" />
      </NFormItem>

      <NFormItem label="描述" path="description">
        <NInput
          v-model:value="model.description"
          type="textarea"
          placeholder="请输入项目描述"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </NFormItem>

      <NFormItem label="URL" path="url">
        <NInput v-model:value="model.url" placeholder="请输入项目 URL" />
      </NFormItem>

      <NFormItem label="技术栈" path="tech">
        <NDynamicTags v-model:value="model.tech" />
      </NFormItem>

      <NFormItem label="GitHub" path="github">
        <NInput v-model:value="model.github" placeholder="请输入 GitHub 地址" />
      </NFormItem>

      <NFormItem label="演示地址" path="demo">
        <NInput v-model:value="model.demo" placeholder="请输入演示地址" />
      </NFormItem>

      <NFormItem label="精选" path="featured">
        <NSwitch v-model:value="model.featured" />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
