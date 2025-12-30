<script setup lang="ts">
import { computed, ref, watch, h, defineComponent, nextTick } from 'vue';
import { NModal, NCard, NRadioGroup, NRadioButton, NScrollbar, NSpin, NTag } from 'naive-ui';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import { articleStatusRecord, articleEditTypeRecord } from '@/constants/business';
import { fetchArticleDetail } from '@/service/api/content';
import { $t } from '@/locales';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({
  name: 'ArticlePreviewModal',
});

interface Props {
  articleId?: number | string | null;
}

const props = defineProps<Props>();
const themeStore = useThemeStore();

const visible = defineModel<boolean>('visible', {
  default: false,
});

const article = ref<Api.SystemManage.Article | null>(null);
const loading = ref(false);
const activeDevice = ref<'pc' | 'mobile'>('pc');

const tagList = computed(() => article.value?.tagIds ?? []);

const statusLabel = computed(() =>
  article.value ? $t(articleStatusRecord[article.value.status]) : '-',
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

// Markdown Rendering Component
const MarkdownView = defineComponent({
  props: {
    content: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const divRef = ref<HTMLElement | null>(null);

    const renderMarkdown = async () => {
      if (!divRef.value || !props.content) return;
      await Vditor.preview(divRef.value, props.content, {
        mode: themeStore.darkMode ? 'dark' : 'light',
        theme: {
          current: themeStore.darkMode ? 'dark' : 'light',
        },
        hljs: {
          style: themeStore.darkMode ? 'dracula' : 'github',
        },
      });
    };

    watch(
      () => [props.content, themeStore.darkMode],
      () => {
        nextTick(renderMarkdown);
      },
      { immediate: true },
    );

    return () => h('div', { ref: divRef, class: 'markdown-body' });
  },
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
      activeDevice.value = 'pc';
    }
  },
  { immediate: true },
);

// Reusable content renderer to avoid code duplication in template
const RenderArticleContent = defineComponent({
  setup() {
    return () =>
      h('div', [
        // Header
        h('header', { class: 'mb-6 border-b pb-4' }, [
          h(
            'h1',
            { class: 'mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100' },
            article.value?.title || '-',
          ),
          h('div', { class: 'flex flex-wrap items-center gap-3 text-sm text-gray-500' }, [
            article.value?.authorName
              ? h('span', { class: 'font-medium text-blue-600' }, article.value.authorName)
              : null,
            h('span', article.value?.publishTime || article.value?.updateTime),
            h('div', { class: 'flex gap-2' }, [
              article.value?.status
                ? h(
                    NTag,
                    {
                      type: article.value.status === 'PUBLISHED' ? 'success' : 'default',
                      size: 'small',
                    },
                    () => statusLabel.value,
                  )
                : null,
              article.value?.isTop
                ? h(NTag, { type: 'error', size: 'small', bordered: true }, () =>
                    $t('page.manage.content.isTop'),
                  )
                : null,
              article.value?.isRecommend
                ? h(NTag, { type: 'warning', size: 'small', bordered: true }, () =>
                    $t('page.manage.content.isRecommend'),
                  )
                : null,
            ]),
          ]),
          tagList.value.length
            ? h(
                'div',
                { class: 'mt-3 flex flex-wrap gap-2' },
                tagList.value.map((tag) =>
                  h(NTag, { type: 'info', size: 'small', round: true }, () => `# ${tag}`),
                ),
              )
            : null,
        ]),

        // Cover Image
        article.value?.coverImage
          ? h('div', { class: 'mb-6 overflow-hidden rounded-lg' }, [
              h('img', {
                src: article.value.coverImage,
                alt: 'Cover',
                class: 'w-full object-cover',
              }),
            ])
          : null,

        // Summary
        article.value?.summary
          ? h(
              'div',
              {
                class:
                  'mb-8 rounded-l-4px border-l-4 border-gray-300 bg-gray-50 p-4 italic text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300',
              },
              article.value.summary,
            )
          : null,

        // Body
        h('article', { class: 'prose dark:prose-invert max-w-none' }, [
          !previewContent.value
            ? h('div', { class: 'py-10 text-center text-gray-400' }, $t('common.noData'))
            : article.value?.editorType === 'MARKDOWN'
              ? h(MarkdownView, { content: previewContent.value })
              : article.value?.editorType === 'RICHTEXT'
                ? h('div', { class: 'richtext-view', innerHTML: previewContent.value })
                : h('div', { class: 'whitespace-pre-wrap font-sans' }, previewContent.value),
        ]),
      ]);
  },
});
</script>

<template>
  <NModal v-model:show="visible" :auto-focus="false">
    <NCard
      preset="card"
      class="h-[90vh] w-[90vw] max-w-[1200px]"
      :title="$t('page.manage.content.preview')"
      size="small"
      :segmented="{
        content: true,
        footer: true,
      }"
      content-style="overflow: hidden; display: flex; flex-direction: column;"
    >
      <template #header-extra>
        <div class="flex items-center gap-4">
          <NRadioGroup v-model:value="activeDevice" size="small">
            <NRadioButton value="pc">
              <span class="icon-btn">🖥️ PC</span>
            </NRadioButton>
            <NRadioButton value="mobile">
              <span class="icon-btn">📱 Mobile</span>
            </NRadioButton>
          </NRadioGroup>
          <span class="text-gray-400">|</span>
        </div>
      </template>

      <div class="h-full flex justify-center bg-[#f0f2f5] p-4 dark:bg-[#101014] overflow-hidden">
        <NSpin :show="loading" class="h-full w-full flex justify-center">
          <!-- Mobile View Structure -->
          <div
            v-if="activeDevice === 'mobile'"
            class="mobile-device relative my-auto h-[667px] w-[375px] shrink-0 overflow-hidden rounded-[30px] border-[8px] border-gray-800 bg-white shadow-2xl dark:bg-[#18181c] dark:border-gray-700 flex flex-col"
          >
            <!-- Notch / Status Bar Area -->
            <div
              class="absolute top-0 left-0 right-0 z-10 flex h-8 justify-center bg-white/90 backdrop-blur-sm pointer-events-none dark:bg-[#18181c]/90"
            >
              <div class="mt-2 h-1 w-16 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            </div>

            <!-- Scrollable Screen Content -->
            <NScrollbar class="flex-1 pt-8" content-class="min-h-full">
              <div class="p-4 pb-8">
                <RenderArticleContent />
              </div>
            </NScrollbar>
          </div>

          <!-- PC View Structure -->
          <div
            v-else
            class="h-full w-full max-w-[1000px] rounded-lg bg-white shadow-sm dark:bg-[#18181c] overflow-hidden flex flex-col"
          >
            <NScrollbar class="flex-1 p-8">
              <RenderArticleContent />
            </NScrollbar>
          </div>
        </NSpin>
      </div>
    </NCard>
  </NModal>
</template>

<style scoped>
/* Rich text styles adjustment */
.richtext-view :deep(img),
.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
.richtext-view :deep(p) {
  margin-bottom: 1em;
  line-height: 1.6;
}
</style>
