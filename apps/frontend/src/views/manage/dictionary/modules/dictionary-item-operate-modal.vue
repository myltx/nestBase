<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useNaiveForm } from '@/hooks/common/form';
import { createDictionaryItem, updateDictionaryItem } from '@/service/api/dictionary';
import { $t } from '@/locales';

defineOptions({
  name: 'DictionaryItemOperateModal',
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.SystemManage.DictionaryItem | null;
  dictionaryId: string;
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
    add: '新增字典项',
    edit: '编辑字典项',
  };
  return titles[props.operateType];
});

type Model = Pick<Api.SystemManage.DictionaryItem, 'label' | 'value' | 'sort' | 'color' | 'status'>;

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    label: '',
    value: '',
    sort: 0,
    color: '#1890ff',
    status: true,
  };
}

type RuleKey = Extract<keyof Model, 'label' | 'value'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  label: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  value: [{ required: true, message: '请输入字典值', trigger: 'blur' }],
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
    const { error } = await createDictionaryItem(props.dictionaryId, model);
    if (!error) {
      window.$message?.success($t('common.addSuccess'));
      closeModal();
    }
  } else {
    if (!props.rowData?.id) return;
    const { error } = await updateDictionaryItem(props.dictionaryId, {
      ...model,
      id: props.rowData.id,
    });
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
      <NFormItem label="显示名称" path="label">
        <NInput v-model:value="model.label" placeholder="请输入显示名称" />
      </NFormItem>
      <NFormItem label="字典值" path="value">
        <NInput v-model:value="model.value" placeholder="请输入字典值" />
      </NFormItem>
      <NFormItem label="排序" path="sort">
        <NInputNumber v-model:value="model.sort" clearable />
      </NFormItem>
      <NFormItem label="颜色" path="color">
        <NColorPicker v-model:value="model.color" />
      </NFormItem>
      <NFormItem label="状态" path="status">
        <NSwitch v-model:value="model.status">
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
