<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { articleStatusRecord, articleEditTypeRecord } from '@/constants/business';
import { fetchArticleDetail } from '@/service/api/content';
import { $t } from '@/locales';

defineOptions({
  name: 'ArticlePreviewDrawer'
});

interface Props {
  articleId?: number | string | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const article = ref<Api.SystemManage.Article | null>(null);
const loading = ref(false);

const tagList = computed(() => article.value?.tagIds ?? []);

const statusLabel = computed(() =>
  article.value ? $t(articleStatusRecord[article.value.status]) : '-'
);

const editTypeLabel = computed(() =>
  article.value ? $t(articleEditTypeRecord[article.value.editorType]) : '-'
);

const previewContent = computed(() => {
  if (!article.value) return '';
  if (article.value.editorType === 'RICHTEXT') {
    return article.value.contentHtml || '';
  }
  if (article.value.editorType === 'UPLOAD') {
    return article.value.contentRaw || '';
  }
  return article.value.contentMd || '';
});

async function loadDetail(id: number | string) {
  loading.value = true;
  try {
    const { data } = await fetchArticleDetail(id);
    article.value = data || null;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [visible.value, props.articleId] as const,
  ([show, id]) => {
    if (show && id != null) {
      loadDetail(id);
    } else if (!show) {
      article.value = null;
    }
  },
  { immediate: true }
);
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="520">
    <NDrawerContent :title="article?.title || $t('page.manage.content.preview')" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <div v-if="article?.coverImage" class="mb-12px">
          <img :src="article?.coverImage" alt="" class="max-h-200px w-full rounded-6px object-cover" />
        </div>
      <NDescriptions label-placement="top" bordered size="small">
        <NDescriptionsItem :label="$t('page.manage.content.articleTitle')">
          {{ article?.title || '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.content.articleSlug')">
          {{ article?.slug || '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.content.category')">
          {{ article?.categoryId || '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.content.author')">
          {{ article?.authorName || '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.content.statusTitle')">
          {{ statusLabel }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.content.editType')">
          {{ editTypeLabel }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.content.isTop')">
          {{ article?.isTop ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no') }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.content.isRecommend')">
          {{ article?.isRecommend ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no') }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.content.publishTime')">
          {{ article?.publishTime || '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.content.updateTime')">
          {{ article?.updateTime || '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.content.viewCount')">
          {{ article?.viewCount ?? 0 }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.content.tagIds')">
          <NTag v-for="tag in tagList" :key="tag" type="info" class="mr-8px mb-8px">
            {{ tag }}
          </NTag>
          <span v-if="tagList.length === 0">-</span>
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.content.summary')">
          <NScrollbar style="max-height: 160px">
            {{ props.article?.summary || '-' }}
          </NScrollbar>
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.content.content')">
          <NScrollbar style="max-height: 240px">
            <div v-if="article?.editorType === 'RICHTEXT'" v-html="previewContent" class="richtext-view" />
            <div v-else class="whitespace-pre-wrap">
              {{ previewContent || '-' }}
            </div>
          </NScrollbar>
        </NDescriptionsItem>
      </NDescriptions>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.richtext-view :deep(p) {
  margin: 0;
}
</style>
