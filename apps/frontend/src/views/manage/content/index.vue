<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NPopconfirm, NSwitch, NTag } from 'naive-ui';
import { articleEditTypeRecord, articleStatusRecord } from '@/constants/business';
import { yesOrNoRecord } from '@/constants/common';
import {
  deleteArticle,
  fetchGetArticleList,
  updateArticleRecommend,
  updateArticleStatus,
  updateArticleTop,
} from '@/service/api/content';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import ArticleSearch from './modules/article-search.vue';
import ArticleOperateDrawer from './modules/article-operate-drawer.vue';
import ArticlePreviewModal from './modules/article-preview-modal.vue';

const appStore = useAppStore();
const statusActionId = ref<number | null>(null);
const topActionId = ref<number | null>(null);
const recommendActionId = ref<number | null>(null);
const deleteActionId = ref<number | null>(null);

const previewVisible = ref(false);
const previewArticleId = ref<number | null>(null);
const statusTagMap: Record<Api.SystemManage.ArticleStatus, NaiveUI.ThemeColor> = {
  DRAFT: 'default',
  PUBLISHED: 'success',
  OFFLINE: 'warning',
};
const booleanTagMap: Record<CommonType.YesOrNo, NaiveUI.ThemeColor> = {
  Y: 'primary',
  N: 'default',
};
const archiveEditorType: Api.SystemManage.ArticleEditType = 'UPLOAD';

const isArchiveArticle = (article: Api.SystemManage.Article) =>
  article.editorType === archiveEditorType;

const {
  columns,
  columnChecks,
  data,
  loading,
  getData,
  getDataByPage,
  mobilePagination,
  searchParams,
  resetSearchParams,
} = useTable({
  apiFn: fetchGetArticleList,
  showTotal: true,
  apiParams: {
    current: 1,
    size: 10,
    title: null,
    categoryId: null,
    status: null,
    isTop: null,
    isRecommend: null,
    editorType: null,
    dateRange: null,
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48,
    },
    {
      key: 'index',
      title: $t('common.index'),
      width: 64,
      align: 'center',
    },
    {
      key: 'title',
      title: $t('page.manage.content.articleTitle'),
      minWidth: 180,
    },
    {
      key: 'categoryId',
      title: $t('page.manage.content.category'),
      width: 120,
    },
    {
      key: 'tagIds',
      title: $t('page.manage.content.tagIds'),
      minWidth: 140,
      render: (row) => (row.tagIds && row.tagIds.length ? row.tagIds.join(', ') : '-'),
    },
    {
      key: 'authorName',
      title: $t('page.manage.content.author'),
      width: 120,
    },
    {
      key: 'status',
      title: $t('page.manage.content.statusTitle'),
      align: 'center',
      width: 150,
      render: (row) => {
        if (isArchiveArticle(row)) {
          return <NTag type={statusTagMap[row.status]}>{$t(articleStatusRecord[row.status])}</NTag>;
        }
        const uncheckedLabelKey =
          row.status === 'PUBLISHED'
            ? articleStatusRecord.OFFLINE
            : articleStatusRecord[row.status];
        return (
          <NSwitch
            size="small"
            value={row.status === 'PUBLISHED' ? 'PUBLISHED' : 'OFFLINE'}
            checked-value="PUBLISHED"
            unchecked-value="OFFLINE"
            loading={statusActionId.value === row.id}
            onUpdateValue={(value) => handleStatusSwitch(row, value === 'PUBLISHED')}
          >
            {{
              checked: () => $t(articleStatusRecord.PUBLISHED),
              unchecked: () => $t(uncheckedLabelKey),
            }}
          </NSwitch>
        );
      },
    },
    {
      key: 'isTop',
      title: $t('page.manage.content.isTop'),
      align: 'center',
      width: 100,
      render: (row) => {
        if (isArchiveArticle(row)) {
          const flag: CommonType.YesOrNo = row.isTop ? 'Y' : 'N';
          return <NTag type={booleanTagMap[flag]}>{$t(yesOrNoRecord[flag])}</NTag>;
        }
        return (
          <NSwitch
            size="small"
            value={row.isTop}
            loading={topActionId.value === row.id}
            onUpdateValue={(value) => toggleTop(row, value)}
          >
            {{
              checked: () => $t(yesOrNoRecord.Y),
              unchecked: () => $t(yesOrNoRecord.N),
            }}
          </NSwitch>
        );
      },
    },
    {
      key: 'isRecommend',
      title: $t('page.manage.content.isRecommend'),
      align: 'center',
      width: 120,
      render: (row) => {
        if (isArchiveArticle(row)) {
          const flag: CommonType.YesOrNo = row.isRecommend ? 'Y' : 'N';
          return <NTag type={booleanTagMap[flag]}>{$t(yesOrNoRecord[flag])}</NTag>;
        }
        return (
          <NSwitch
            size="small"
            value={row.isRecommend}
            loading={recommendActionId.value === row.id}
            onUpdateValue={(value) => toggleRecommend(row, value)}
          >
            {{
              checked: () => $t(yesOrNoRecord.Y),
              unchecked: () => $t(yesOrNoRecord.N),
            }}
          </NSwitch>
        );
      },
    },
    {
      key: 'editorType',
      title: $t('page.manage.content.editType'),
      align: 'center',
      width: 140,
      render: (row) => $t(articleEditTypeRecord[row.editorType]),
    },
    {
      key: 'publishTime',
      title: $t('page.manage.content.publishTime'),
      width: 180,
    },
    {
      key: 'updateTime',
      title: $t('page.manage.content.updateTime'),
      width: 180,
    },
    {
      key: 'viewCount',
      title: $t('page.manage.content.viewCount'),
      align: 'center',
      width: 100,
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      width: 220,
      align: 'center',
      render: (row) => {
        const disableModify = row.status === 'PUBLISHED';
        return (
          <div class="flex-center gap-8px">
            <NButton type="primary" ghost size="small" onClick={() => handlePreview(row)}>
              {$t('page.manage.content.preview')}
            </NButton>
            <NButton
              type="primary"
              ghost
              size="small"
              disabled={disableModify}
              onClick={() => edit(row.id)}
            >
              {$t('common.edit')}
            </NButton>
            {disableModify ? (
              <NButton type="error" ghost size="small" disabled>
                {$t('common.delete')}
              </NButton>
            ) : (
              <NPopconfirm showIcon={false} onPositiveClick={() => handleDelete(row)}>
                {{
                  default: () => $t('common.confirmDelete'),
                  trigger: () => (
                    <NButton
                      type="error"
                      ghost
                      size="small"
                      loading={deleteActionId.value === row.id}
                    >
                      {$t('common.delete')}
                    </NButton>
                  ),
                }}
              </NPopconfirm>
            )}
          </div>
        );
      },
    },
  ],
});

const {
  drawerVisible,
  operateType,
  editingData,
  handleAdd,
  handleEdit,
  checkedRowKeys,
  onBatchDeleted,
  onDeleted,
} = useTableOperate(data, getData);

function handlePreview(article: Api.SystemManage.Article) {
  previewArticleId.value = article.id;
  previewVisible.value = true;
}

function handleStatusSwitch(article: Api.SystemManage.Article, publish: boolean) {
  if (isArchiveArticle(article)) return;
  if (publish) {
    if (article.status === 'PUBLISHED') return;
    toggleStatus(article, 'PUBLISHED');
    return;
  }
  if (article.status !== 'PUBLISHED') return;
  toggleStatus(article, 'OFFLINE');
}

async function toggleStatus(
  article: Api.SystemManage.Article,
  targetStatus?: Api.SystemManage.ArticleStatus,
) {
  statusActionId.value = article.id;
  if (isArchiveArticle(article)) {
    statusActionId.value = null;
    return;
  }
  const nextStatus: Api.SystemManage.ArticleStatus =
    targetStatus ?? (article.status === 'PUBLISHED' ? 'OFFLINE' : 'PUBLISHED');

  if (nextStatus === article.status) {
    statusActionId.value = null;
    return;
  }

  try {
    await updateArticleStatus(article.id, nextStatus);
    article.status = nextStatus;
    window.$message?.success($t('common.updateSuccess'));
    await getData();
  } finally {
    statusActionId.value = null;
  }
}

async function toggleTop(article: Api.SystemManage.Article, nextValue?: boolean) {
  topActionId.value = article.id;
  if (isArchiveArticle(article)) {
    topActionId.value = null;
    return;
  }
  const target = typeof nextValue === 'boolean' ? nextValue : !article.isTop;

  if (target === article.isTop) {
    topActionId.value = null;
    return;
  }

  try {
    await updateArticleTop(article.id, target);
    article.isTop = target;
    window.$message?.success($t('common.updateSuccess'));
    await getData();
  } finally {
    topActionId.value = null;
  }
}

async function toggleRecommend(article: Api.SystemManage.Article, nextValue?: boolean) {
  recommendActionId.value = article.id;
  if (isArchiveArticle(article)) {
    recommendActionId.value = null;
    return;
  }
  const target = typeof nextValue === 'boolean' ? nextValue : !article.isRecommend;

  if (target === article.isRecommend) {
    recommendActionId.value = null;
    return;
  }

  try {
    await updateArticleRecommend(article.id, target);
    article.isRecommend = target;
    window.$message?.success($t('common.updateSuccess'));
    await getData();
  } finally {
    recommendActionId.value = null;
  }
}

async function handleBatchDelete() {
  if (!checkedRowKeys.value.length) return;
  const selectedIds = new Set(checkedRowKeys.value.map((key) => Number(key)));
  const deletableArticles = data.value.filter(
    (article) => selectedIds.has(article.id) && article.status !== 'PUBLISHED',
  );
  if (!deletableArticles.length) {
    window.$message?.warning($t('page.manage.content.publishedReadonlyTip'));
    return;
  }

  deleteActionId.value = -1;
  try {
    for (const article of deletableArticles) {
      await deleteArticle(article.id);
    }
    await onBatchDeleted();
  } finally {
    deleteActionId.value = null;
  }
}

async function handleDelete(article: Api.SystemManage.Article) {
  if (article.status === 'PUBLISHED') return;
  deleteActionId.value = article.id;
  try {
    await deleteArticle(article.id);
    await onDeleted();
  } finally {
    deleteActionId.value = null;
  }
}

function edit(id: number) {
  const article = data.value.find((item) => item.id === id);
  if (article?.status === 'PUBLISHED') {
    window.$message?.warning($t('page.manage.content.publishedReadonlyTip'));
    return;
  }
  handleEdit(id);
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <ArticleSearch
      v-model:model="searchParams"
      @reset="resetSearchParams"
      @search="() => getDataByPage(1)"
    />
    <NCard
      :title="$t('page.manage.content.title')"
      :bordered="false"
      size="small"
      class="card-wrapper sm:flex-1-hidden"
    >
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="1400"
        :loading="loading"
        :row-key="(row) => row.id"
        :pagination="mobilePagination"
        remote
        class="sm:h-full"
      />
      <ArticleOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
      <ArticlePreviewModal v-model:visible="previewVisible" :article-id="previewArticleId" />
    </NCard>
  </div>
</template>

<style scoped></style>
