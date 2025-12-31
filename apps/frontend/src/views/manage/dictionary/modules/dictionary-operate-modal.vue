<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useNaiveForm } from '@/hooks/common/form';
import { createDictionary, updateDictionary } from '@/service/api/dictionary';
import { $t } from '@/locales';

defineOptions({
  name: 'DictionaryOperateModal',
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.SystemManage.Dictionary | null;
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
    add: '新增字典',
    edit: '编辑字典',
  };
  return titles[props.operateType];
});

type Model = Pick<Api.SystemManage.Dictionary, 'code' | 'name' | 'description' | 'isActive'>;

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    code: '',
    name: '',
    description: '',
    isActive: true,
  };
}

type RuleKey = Extract<keyof Model, 'code' | 'name'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  code: [{ required: true, message: '请输入字典编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
};

function handleUpdateModel(modelValue: Model, newOne: Model) {
  Object.assign(modelValue, newOne);
}

async function handleSubmit() {
  await validate();
  const closeModal = () => {
    visible.value = false;
    emit('submitted');
  };

  if (props.operateType === 'add') {
    const { error } = await createDictionary(model);
    if (!error) {
      window.$message?.success($t('common.addSuccess'));
      closeModal();
    }
  } else {
    if (!props.rowData?.id) return;
    const { error } = await updateDictionary({ ...model, id: props.rowData.id });
    if (!error) {
      window.$message?.success($t('common.updateSuccess'));
      closeModal();
    }
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
  <NModal v-model:show="visible" :title="title" preset="card" class="w-600px">
    <NForm
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="left"
      :label-width="100"
      require-mark-placement="right-hanging"
    >
      <NFormItem label="字典编码" path="code">
        <NInput
          v-model:value="model.code"
          placeholder="请输入字典编码"
          :disabled="operateType === 'edit'"
        />
      </NFormItem>
      <NFormItem label="字典名称" path="name">
        <NInput v-model:value="model.name" placeholder="请输入字典名称" />
      </NFormItem>
      <NFormItem label="描述" path="description">
        <NInput v-model:value="model.description" type="textarea" placeholder="请输入描述" />
      </NFormItem>
      <NFormItem label="状态" path="isActive">
        <NSwitch v-model:value="model.isActive">
          <template #checked>启用</template>
          <template #unchecked>禁用</template>
        </NSwitch>
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
