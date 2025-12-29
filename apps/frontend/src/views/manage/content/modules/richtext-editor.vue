<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef } from 'vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';

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

const editorRef = shallowRef<IDomEditor>();

const valueHtml = computed({
  get: () => props.modelValue || '',
  set: val => {
    emit('update:modelValue', val);
  }
});

const toolbarConfig: Partial<IToolbarConfig> = {};

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '',
  MENU_CONF: {
    uploadImage: {
      // prevent actual upload in this demo
      server: '',
      base64LimitSize: 10 * 1024
    }
  }
};

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor;
}

onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
  editorRef.value = undefined;
});
</script>

<template>
  <div class="richtext-editor">
    <Toolbar
      :editor="editorRef"
      :default-config="toolbarConfig"
      class="rounded-t-6px border border-b-0 border-solid border-[var(--n-border-color)] bg-[var(--n-color)] px-12px"
      mode="default"
    />
    <Editor
      v-model="valueHtml"
      :default-config="editorConfig"
      mode="default"
      class="border border-solid border-[var(--n-border-color)] rounded-b-6px"
      :style="{ height: `${props.height}px` }"
      @onCreated="handleCreated"
    />
  </div>
</template>

<style scoped></style>
