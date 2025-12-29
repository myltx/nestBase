<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { articleEditTypeOptions, articleStatusOptions } from '@/constants/business';
import { fetchGetCategoryTree } from '@/service/api/category';
import { translateOptions } from '@/utils/common';
import { $t } from '@/locales';

defineOptions({
  name: 'ArticleSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const model = defineModel<Api.SystemManage.ArticleSearchParams>('model', {
  required: true
});

const statusOptions = computed(() => translateOptions(articleStatusOptions));
const editTypeOptions = computed(() => translateOptions(articleEditTypeOptions));
const booleanOptions = computed(() => [
  { label: $t('common.yesOrNo.yes'), value: true },
  { label: $t('common.yesOrNo.no'), value: false }
]);

const categoryOptions = ref<NaiveUI.CascaderOption[]>([]);
const categoryLoading = ref(false);

function reset() {
  emit('reset');
}

function search() {
  emit('search');
}

function transformCategoryToOptions(tree: Api.SystemManage.CategoryTree[]): NaiveUI.CascaderOption[] {
  return tree.map(item => ({
    label: item.name,
    value: item.id,
    children: item.children?.length ? transformCategoryToOptions(item.children) : undefined
  }));
}

async function loadCategories() {
  categoryLoading.value = true;
  try {
    const { data } = await fetchGetCategoryTree();
    categoryOptions.value = transformCategoryToOptions(data || []);
  } finally {
    categoryLoading.value = false;
  }
}

onMounted(() => {
  loadCategories();
});
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <NCollapse :default-expanded-names="['article-search']">
      <NCollapseItem :title="$t('common.search')" name="article-search">
        <NForm :model="model" label-placement="left" :label-width="96">
          <NGrid responsive="screen" item-responsive>
            <NFormItemGi
              span="24 s:12 m:6"
              class="pr-24px"
              :label="$t('page.manage.content.articleTitle')"
              path="title"
            >
              <NInput v-model:value="model.title" :placeholder="$t('page.manage.content.search.title')" />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" class="pr-24px" :label="$t('page.manage.content.category')" path="categoryId">
              <NCascader
                v-model:value="model.categoryId"
                :options="categoryOptions"
                :loading="categoryLoading"
                :leaf-only="true"
                clearable
                :placeholder="$t('page.manage.content.search.category')"
              />
            </NFormItemGi>
            <NFormItemGi
              span="24 s:12 m:6"
              class="pr-24px"
              :label="$t('page.manage.content.statusTitle')"
              path="status"
            >
              <NSelect
                v-model:value="model.status"
                clearable
                :options="statusOptions"
                :placeholder="$t('page.manage.content.search.status')"
              />
            </NFormItemGi>
            <NFormItemGi
              span="24 s:12 m:6"
              class="pr-24px"
              :label="$t('page.manage.content.editType')"
              path="editorType"
            >
              <NSelect
                v-model:value="model.editorType"
                clearable
                :options="editTypeOptions"
                :placeholder="$t('page.manage.content.search.editType')"
              />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" class="pr-24px" :label="$t('page.manage.content.isTop')" path="isTop">
              <NSelect
                v-model:value="model.isTop"
                clearable
                :options="booleanOptions"
                :placeholder="$t('page.manage.content.search.isTop')"
              />
            </NFormItemGi>
            <NFormItemGi
              span="24 s:12 m:6"
              class="pr-24px"
              :label="$t('page.manage.content.isRecommend')"
              path="isRecommend"
            >
              <NSelect
                v-model:value="model.isRecommend"
                clearable
                :options="booleanOptions"
                :placeholder="$t('page.manage.content.search.isRecommend')"
              />
            </NFormItemGi>
            <NFormItemGi
              span="24 s:12 m:12"
              class="pr-24px"
              :label="$t('page.manage.content.publishTime')"
              path="dateRange"
            >
              <NDatePicker
                v-model:formatted-value="model.dateRange"
                type="datetimerange"
                clearable
                :placeholder="$t('page.manage.content.search.publishTime')"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
            </NFormItemGi>
            <NFormItemGi span="24">
              <NSpace class="w-full" justify="end">
                <NButton @click="reset">
                  <template #icon>
                    <icon-ic-round-refresh class="text-icon" />
                  </template>
                  {{ $t('common.reset') }}
                </NButton>
                <NButton type="primary" ghost @click="search">
                  <template #icon>
                    <icon-ic-round-search class="text-icon" />
                  </template>
                  {{ $t('common.search') }}
                </NButton>
              </NSpace>
            </NFormItemGi>
          </NGrid>
        </NForm>
      </NCollapseItem>
    </NCollapse>
  </NCard>
</template>

<style scoped></style>
