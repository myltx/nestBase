<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter, type RouteLocationRaw } from 'vue-router';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/modules/app';
import { useAuthStore } from '@/store/modules/auth';
import { fetchGetArticleList } from '@/service/api/content';
import { fetchGetCategoryTree } from '@/service/api/category';
import { fetchGetTagList } from '@/service/api/tag';
import { articleStatusRecord } from '@/constants/business';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { $t } from '@/locales';

const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();

const metricsLoading = ref(false);
const listLoading = ref(false);
const articleStats = ref({
  total: 0,
  published: 0,
  draft: 0
});
const categoryCount = ref(0);
const tagCount = ref(0);
const latestArticles = ref<Api.SystemManage.Article[]>([]);

const gap = computed(() => (appStore.isMobile ? 0 : 16));
const greeting = computed(() =>
  $t('page.homePortal.greeting', {
    userName: authStore.userInfo.firstName || authStore.userInfo.userName || authStore.userInfo.email || 'Guest'
  })
);
const subtitle = computed(() => $t('page.homePortal.subtitle'));

const metricCards = computed(() => [
  {
    key: 'total',
    label: $t('page.homePortal.metrics.totalArticle'),
    value: articleStats.value.total,
    icon: 'mdi:newspaper-variant-outline',
    color: '#1d8ce0'
  },
  {
    key: 'published',
    label: $t('page.homePortal.metrics.published'),
    value: articleStats.value.published,
    icon: 'mdi:check-decagram-outline',
    color: '#18a058'
  },
  {
    key: 'draft',
    label: $t('page.homePortal.metrics.draft'),
    value: articleStats.value.draft,
    icon: 'mdi:draw-pen',
    color: '#f0a020'
  },
  {
    key: 'category',
    label: $t('page.homePortal.metrics.category'),
    value: categoryCount.value,
    icon: 'mdi:view-list-outline',
    color: '#8a63d2'
  },
  {
    key: 'tag',
    label: $t('page.homePortal.metrics.tag'),
    value: tagCount.value,
    icon: 'mdi:tag-outline',
    color: '#2d8cf0'
  }
]);

interface QuickLink {
  label: string;
  desc: string;
  route: RouteLocationRaw;
  icon: string;
}

const quickLinks = computed<QuickLink[]>(() => [
  {
    label: $t('page.homePortal.quickLinks.createContent'),
    desc: $t('page.homePortal.quickLinks.createContentDesc'),
    route: '/manage/content',
    icon: 'mdi:file-document-edit-outline'
  },
  {
    label: $t('page.homePortal.quickLinks.reviewDraft'),
    desc: $t('page.homePortal.quickLinks.reviewDraftDesc'),
    route: { path: '/manage/content', query: { status: 'DRAFT' } },
    icon: 'mdi:cog-refresh-outline'
  },
  {
    label: $t('page.homePortal.quickLinks.manageCategory'),
    desc: $t('page.homePortal.quickLinks.manageCategoryDesc'),
    route: '/manage/category',
    icon: 'mdi:shape-outline'
  },
  {
    label: $t('page.homePortal.quickLinks.manageTag'),
    desc: $t('page.homePortal.quickLinks.manageTagDesc'),
    route: '/manage/tag',
    icon: 'mdi:tag-multiple-outline'
  }
]);

const statusTagMap: Record<Api.SystemManage.ArticleStatus, NaiveUI.ThemeColor> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  OFFLINE: 'default'
};

onMounted(() => {
  refreshDashboard();
});

async function refreshDashboard() {
  metricsLoading.value = true;
  listLoading.value = true;
  try {
    await Promise.all([loadArticleStats(), loadTaxonomies(), loadLatestArticles()]);
  } finally {
    metricsLoading.value = false;
    listLoading.value = false;
  }
}

async function loadArticleStats() {
  const [{ data: totalData }, { data: draftData }, { data: publishedData }] = await Promise.all([
    fetchGetArticleList({ current: 1, size: 1 }),
    fetchGetArticleList({ current: 1, size: 1, status: 'DRAFT' }),
    fetchGetArticleList({ current: 1, size: 1, status: 'PUBLISHED' })
  ]);

  articleStats.value = {
    total: totalData?.total ?? 0,
    draft: draftData?.total ?? 0,
    published: publishedData?.total ?? 0
  };
}

async function loadTaxonomies() {
  const [{ data: categories }, { data: tagsData }] = await Promise.all([
    fetchGetCategoryTree(),
    fetchGetTagList({ current: 1, size: 1 })
  ]);

  categoryCount.value = calcCategoryCount(categories || []);
  tagCount.value = tagsData?.total ?? 0;
}

async function loadLatestArticles() {
  const { data } = await fetchGetArticleList({ current: 1, size: 5, status: null });
  latestArticles.value = data?.records || [];
}

function calcCategoryCount(tree: Api.SystemManage.CategoryTree[]): number {
  return tree.reduce((acc, item) => {
    const children = item.children?.length ? calcCategoryCount(item.children) : 0;
    return acc + 1 + children;
  }, 0);
}

function goTo(path: RouteLocationRaw) {
  router.push(path);
}

function formatTime(value?: string | null) {
  if (!value) return '--';
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}
</script>

<template>
  <div class="home-portal min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-16px">
        <div>
          <div class="text-20px font-600">{{ greeting }}</div>
          <div class="text-14px text-gray-500">{{ subtitle }}</div>
        </div>
        <NSpace>
          <NButton type="primary" @click="goTo('/manage/content')">
            {{ $t('page.homePortal.actions.create') }}
          </NButton>
          <NButton tertiary @click="refreshDashboard">{{ $t('common.refresh') }}</NButton>
        </NSpace>
      </div>
    </NCard>

    <NGrid :x-gap="gap" :y-gap="16" cols="24" responsive="screen" item-responsive>
      <NGi v-for="card in metricCards" :key="card.key" span="24 s:12 m:8 l:6">
        <NCard :bordered="false" class="card-wrapper h-full">
          <div class="flex items-center justify-between gap-12px">
            <div>
              <div class="text-13px text-gray-500">{{ card.label }}</div>
              <div class="text-28px font-600 leading-34px">
                <NSkeleton v-if="metricsLoading" width="80px" height="24px" />
                <template v-else>{{ card.value }}</template>
              </div>
            </div>
            <div class="rounded-12px p-12px" :style="{ background: card.color + '20' }">
              <SvgIcon :icon="card.icon" class="text-24px" :style="{ color: card.color }" />
            </div>
          </div>
        </NCard>
      </NGi>
    </NGrid>

    <NGrid :x-gap="gap" :y-gap="16" cols="24" responsive="screen" item-responsive>
      <NGi span="24 s:24 m:16">
        <NCard :title="$t('page.homePortal.latest.title')" class="card-wrapper h-full" :bordered="false">
          <template #header-extra>
            <NButton text type="primary" @click="goTo('/manage/content')">
              {{ $t('page.homePortal.latest.viewAll') }}
            </NButton>
          </template>
          <div v-if="listLoading">
            <NSkeleton v-for="i in 3" :key="i" height="60px" class="mb-12px" />
          </div>
          <div v-else-if="latestArticles.length === 0" class="text-center text-13px text-gray-500">
            {{ $t('common.noData') }}
          </div>
          <div v-else class="flex flex-col gap-12px">
            <div
              v-for="article in latestArticles"
              :key="article.id"
              class="rounded-12px border border-dashed border-[#ececec] px-16px py-12px"
            >
              <div class="flex flex-wrap items-center justify-between gap-8px">
                <div class="flex items-center gap-8px text-15px font-600">
                  <NTag :type="statusTagMap[article.status]" size="small">
                    {{ $t(articleStatusRecord[article.status]) }}
                  </NTag>
                  <span class="article-title">{{ article.title }}</span>
                </div>
                <div class="text-12px text-gray-500">{{ formatTime(article.updateTime || article.publishTime) }}</div>
              </div>
              <div class="mt-6px flex flex-wrap items-center gap-12px text-13px text-gray-500">
                <span>{{ $t('page.manage.content.author') }}：{{ article.authorName || '-' }}</span>
                <span>{{ $t('page.manage.content.category') }}：{{ article.categoryId || '-' }}</span>
                <div class="flex flex-wrap gap-4px">
                  <NTag v-for="tag in article.tagIds || []" :key="tag" size="small" type="info">
                    {{ tag }}
                  </NTag>
                </div>
              </div>
            </div>
          </div>
        </NCard>
      </NGi>
      <NGi span="24 s:24 m:8" class="flex flex-col gap-16px">
        <NCard :title="$t('page.homePortal.quickLinks.title')" class="card-wrapper" :bordered="false">
          <div class="flex flex-col gap-12px">
            <div
              v-for="item in quickLinks"
              :key="item.route"
              class="flex cursor-pointer items-center gap-12px rounded-12px border border-transparent px-8px py-6px transition-colors hover:border-primary"
              @click="goTo(item.route)"
            >
              <div class="rounded-full bg-primary bg-opacity-10 p-8px text-primary">
                <SvgIcon :icon="item.icon" class="text-18px" />
              </div>
              <div class="flex-1">
                <div class="text-14px font-600">{{ item.label }}</div>
                <div class="text-12px text-gray-500 quick-link-desc">{{ item.desc }}</div>
              </div>
              <NButton text type="primary">{{ $t('common.operate') }}</NButton>
            </div>
          </div>
        </NCard>
        <NCard :title="$t('page.homePortal.taxonomy.title')" class="card-wrapper" :bordered="false">
          <div class="flex flex-col gap-12px">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-13px text-gray-500">{{ $t('page.homePortal.taxonomy.category') }}</div>
                <div class="text-24px font-600">
                  <NSkeleton v-if="metricsLoading" width="60px" />
                  <template v-else>{{ categoryCount }}</template>
                </div>
              </div>
              <NButton text type="primary" @click="goTo('/manage/category')">
                {{ $t('page.homePortal.taxonomy.manage') }}
              </NButton>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-13px text-gray-500">{{ $t('page.homePortal.taxonomy.tag') }}</div>
                <div class="text-24px font-600">
                  <NSkeleton v-if="metricsLoading" width="60px" />
                  <template v-else>{{ tagCount }}</template>
                </div>
              </div>
              <NButton text type="primary" @click="goTo('/manage/tag')">
                {{ $t('page.homePortal.taxonomy.manage') }}
              </NButton>
            </div>
          </div>
        </NCard>
      </NGi>
    </NGrid>
  </div>
</template>

<style scoped>
.home-portal :deep(.n-card__content) {
  display: block;
}
.article-title {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.quick-link-desc {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
