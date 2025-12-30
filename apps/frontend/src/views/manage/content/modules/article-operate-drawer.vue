<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { articleEditTypeOptions } from '@/constants/business';
import { createArticle, updateArticle } from '@/service/api/content';
import { fetchGetCategoryTree } from '@/service/api/category';
import { fetchGetTagList } from '@/service/api/tag';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { translateOptions } from '@/utils/common';
import { $t } from '@/locales';
import MarkdownEditor from './markdown-editor.vue';
import RichtextEditor from './richtext-editor.vue';
import UploadEditor from './upload-editor.vue';

defineOptions({
  name: 'ArticleOperateDrawer'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.SystemManage.Article | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const loading = ref(false);
const editTypeOptions = computed(() => translateOptions(articleEditTypeOptions));
const categoryOptions = ref<NaiveUI.CascaderOption[]>([]);
const tagOptions = ref<NaiveUI.SelectOption[]>([]);
const categoryLoading = ref(false);
const tagLoading = ref(false);

type Model = Api.SystemManage.CreateArticle;

const editorContentMap = ref<Record<Api.SystemManage.ArticleEditType, string>>({
  MARKDOWN: '',
  RICHTEXT: '',
  UPLOAD: ''
});

const model = ref<Model>(createDefaultModel());
const isArchiveEditor = computed(() => model.value.editorType === 'UPLOAD');

function createDefaultModel(): Model {
  return {
    title: '',
    slug: '',
    summary: '',
    editorType: 'MARKDOWN',
    contentMd: '',
    contentHtml: '',
    contentRaw: '',
    coverImage: '',
    categoryId: null,
    tagIds: [],
    authorName: '',
    publishTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    isTop: false,
    isRecommend: false
  };
}

const isEdit = computed(() => props.operateType === 'edit');

const drawerTitle = computed(() =>
  isEdit.value ? $t('page.manage.content.editArticle') : $t('page.manage.content.addArticle')
);

const booleanRule: App.Global.FormRule = {
  type: 'boolean',
  trigger: ['change']
};

const rules: Record<keyof Model, App.Global.FormRule | App.Global.FormRule[]> = {
  title: defaultRequiredRule,
  slug: {},
  summary: defaultRequiredRule,
  editorType: defaultRequiredRule,
  categoryId: defaultRequiredRule,
  tagIds: defaultRequiredRule,
  coverImage: defaultRequiredRule,
  authorName: defaultRequiredRule,
  publishTime: {},
  contentMd: {},
  contentHtml: {},
  contentRaw: {},
  isTop: booleanRule,
  isRecommend: booleanRule
};

const currentEditorContent = computed({
  get: () => editorContentMap.value[model.value.editorType] || '',
  set: val => {
    editorContentMap.value[model.value.editorType] = val;
  }
});

watch(
  () => model.value.editorType,
  value => {
    if (value === 'UPLOAD') {
      model.value.isTop = false;
      model.value.isRecommend = false;
    }
  }
);

function closeDrawer() {
  visible.value = false;
}

function resetEditorContent(article?: Api.SystemManage.Article | null) {
  editorContentMap.value = {
    MARKDOWN: article?.contentMd || '',
    RICHTEXT: article?.contentHtml || '',
    UPLOAD: article?.contentRaw || ''
  };
}

function transformCategoryToOptions(tree: Api.SystemManage.CategoryTree[]): NaiveUI.CascaderOption[] {
  return tree.map(item => ({
    label: item.name,
    value: item.id,
    children: item.children?.length ? transformCategoryToOptions(item.children) : undefined
  }));
}

function handleInitModel() {
  const article = props.rowData;
  if (article) {
    model.value = {
      title: article.title || '',
      slug: article.slug || '',
      summary: article.summary || '',
      editorType: article.editorType || 'MARKDOWN',
      contentMd: article.contentMd || '',
      contentHtml: article.contentHtml || '',
      contentRaw: article.contentRaw || '',
      coverImage: article.coverImage || '',
      categoryId: article.categoryId || null,
      tagIds: article.tagIds ? [...article.tagIds] : [],
      authorName: article.authorName || '',
      publishTime: article.publishTime || '',
      isTop: article.isTop ?? false,
      isRecommend: article.isRecommend ?? false
    };
    resetEditorContent(article);
  } else {
    model.value = createDefaultModel();
    resetEditorContent(null);
  }
}

async function handleSubmit() {
  loading.value = true;
  try {
    await validate();
    const payload: Api.SystemManage.CreateArticle = {
      title: model.value.title,
      slug: model.value.slug,
      summary: model.value.summary,
      editorType: model.value.editorType,
      coverImage: model.value.coverImage,
      categoryId: model.value.categoryId,
      tagIds: model.value.tagIds || [],
      authorName: model.value.authorName,
      publishedAt: model.value.publishTime ? new Date(model.value.publishTime).toISOString() : undefined,
      isTop: model.value.isTop,
      isRecommend: model.value.isRecommend
    };

    const contentValue = currentEditorContent.value;
    if (payload.editorType === 'MARKDOWN') {
      payload.contentMd = contentValue;
    } else if (payload.editorType === 'RICHTEXT') {
      payload.contentHtml = contentValue;
    } else {
      payload.contentRaw = contentValue;
    }

    if (isEdit.value && props.rowData) {
      await updateArticle({ ...payload, id: props.rowData.id });
      window.$message?.success($t('common.updateSuccess'));
    } else {
      await createArticle(payload);
      window.$message?.success($t('common.addSuccess'));
    }

    emit('submitted');
    closeDrawer();
  } finally {
    loading.value = false;
  }
}

watch(visible, value => {
  if (value) {
    handleInitModel();
    restoreValidation();
  }
});

async function loadCategories() {
  categoryLoading.value = true;
  try {
    const { data } = await fetchGetCategoryTree();
    categoryOptions.value = transformCategoryToOptions(data || []);
  } finally {
    categoryLoading.value = false;
  }
}

async function loadTags() {
  tagLoading.value = true;
  try {
    const { data } = await fetchGetTagList({ current: 1, size: 999 });
    const list = data?.records || [];
    tagOptions.value = list.map(item => ({ label: item.name, value: item.id }));
  } finally {
    tagLoading.value = false;
  }
}

onMounted(() => {
  loadCategories();
  loadTags();
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="520" :mask-closable="false">
    <NDrawerContent :title="drawerTitle" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="top">
        <NFormItem :label="$t('page.manage.content.articleTitle')" path="title">
          <NInput v-model:value="model.title" :placeholder="$t('page.manage.content.form.title')" />
        </NFormItem>
        <NFormItem :label="$t('page.manage.content.articleSlug')" path="slug">
          <NInput v-model:value="model.slug" :placeholder="$t('page.manage.content.form.slug')" />
        </NFormItem>
        <NFormItem :label="$t('page.manage.content.summary')" path="summary">
          <NInput
            v-model:value="model.summary"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            :placeholder="$t('page.manage.content.form.summary')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.manage.content.category')" path="categoryId">
          <NCascader
            v-model:value="model.categoryId"
            :options="categoryOptions"
            :loading="categoryLoading"
            :leaf-only="true"
            clearable
            :placeholder="$t('page.manage.content.form.category')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.manage.content.author')" path="authorName">
          <NInput v-model:value="model.authorName" :placeholder="$t('page.manage.content.form.author')" />
        </NFormItem>
        <NFormItem :label="$t('page.manage.content.coverImage')" path="coverImage">
          <NInput v-model:value="model.coverImage" :placeholder="$t('page.manage.content.form.coverImage')" />
        </NFormItem>
        <NFormItem :label="$t('page.manage.content.tagIds')" path="tagIds">
          <NSelect
            v-model:value="model.tagIds"
            multiple
            :options="tagOptions"
            :loading="tagLoading"
            clearable
            :placeholder="$t('page.manage.content.form.tagIds')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.manage.content.isTop')" path="isTop">
          <template v-if="isArchiveEditor">
            <NTag type="default">
              {{ model.isTop ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no') }}
            </NTag>
          </template>
          <template v-else>
            <NSwitch v-model:value="model.isTop">
              <template #checked>{{ $t('common.yesOrNo.yes') }}</template>
              <template #unchecked>{{ $t('common.yesOrNo.no') }}</template>
            </NSwitch>
          </template>
        </NFormItem>
        <NFormItem :label="$t('page.manage.content.isRecommend')" path="isRecommend">
          <template v-if="isArchiveEditor">
            <NTag type="default">
              {{ model.isRecommend ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no') }}
            </NTag>
          </template>
          <template v-else>
            <NSwitch v-model:value="model.isRecommend">
              <template #checked>{{ $t('common.yesOrNo.yes') }}</template>
              <template #unchecked">{{ $t('common.yesOrNo.no') }}</template>
            </NSwitch>
          </template>
        </NFormItem>
        <NFormItem :label="$t('page.manage.content.editType')" path="editorType">
          <NRadioGroup v-model:value="model.editorType">
            <NRadioButton
              v-for="item in editTypeOptions"
              :key="item.value"
              :value="item.value as Api.SystemManage.ArticleEditType"
            >
              {{ item.label }}
            </NRadioButton>
          </NRadioGroup>
        </NFormItem>
        <NFormItem :label="$t('page.manage.content.content')" path="content">
          <MarkdownEditor v-if="model.editorType === 'MARKDOWN'" v-model="currentEditorContent" />
          <RichtextEditor v-else-if="model.editorType === 'RICHTEXT'" v-model="currentEditorContent" />
          <UploadEditor v-else v-model="currentEditorContent" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace>
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="loading" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
