<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';

interface Props {
  modelValue: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const uploading = ref(false);
const contentValue = computed({
  get: () => props.modelValue || '',
  set: val => emit('update:modelValue', val)
});

function handleBeforeUpload(options: { file: { file?: File } }) {
  const raw = options.file.file;
  if (!raw) {
    window.$message?.error($t('page.manage.content.uploadFailed'));
    return false;
  }

  uploading.value = true;

  const reader = new FileReader();
  reader.onload = () => {
    emit('update:modelValue', String(reader.result || ''));
    uploading.value = false;
    window.$message?.success($t('page.manage.content.uploadSuccess'));
  };
  reader.onerror = () => {
    uploading.value = false;
    window.$message?.error($t('page.manage.content.uploadFailed'));
  };

  reader.readAsText(raw);

  return false;
}
</script>

<template>
  <div class="flex flex-col gap-12px">
    <NAlert type="info" :show-icon="false">
      {{ $t('page.manage.content.form.uploadTip') }}
    </NAlert>
    <NUpload
      :max="1"
      accept=".md,.markdown,.txt"
      :default-upload="false"
      :show-file-list="false"
      :disabled="uploading"
      :on-before-upload="handleBeforeUpload"
    >
      <NButton type="primary" ghost :loading="uploading">
        <template #icon>
          <icon-ic-round-cloud-upload class="text-icon" />
        </template>
        {{ uploading ? $t('page.manage.content.uploading') : $t('page.manage.content.uploadButton') }}
      </NButton>
    </NUpload>
    <NInput v-model:value="contentValue" type="textarea" :autosize="{ minRows: 6, maxRows: 12 }" />
  </div>
</template>

<style scoped></style>
