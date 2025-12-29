<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Vditor from 'vditor';
import 'vditor/dist/index.css';

interface Props {
  modelValue: string;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  height: 320
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const elRef = ref<HTMLElement | null>(null);
const editorRef = ref<Vditor>();

onMounted(() => {
  if (!elRef.value) return;

  editorRef.value = new Vditor(elRef.value, {
    height: props.height,
    mode: 'sv',
    cache: {
      enable: false
    },
    value: props.modelValue || '',
    input(value) {
      emit('update:modelValue', value);
    }
  });
});

watch(
  () => props.modelValue,
  value => {
    const editor = editorRef.value;
    if (editor && value !== editor.getValue()) {
      editor.setValue(value || '');
    }
  }
);

onBeforeUnmount(() => {
  editorRef.value?.destroy?.();
  editorRef.value = undefined;
});
</script>

<template>
  <div ref="elRef" class="markdown-editor" />
</template>

<style scoped>
.markdown-editor :deep(.vditor) {
  border-radius: 6px;
  border: 1px solid var(--n-border-color);
}
</style>
