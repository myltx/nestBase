<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { $t } from '@/locales';
import { useNaiveForm } from '@/hooks/common/form';
import { fetchGetTechStack } from '@/service/api/project';

defineOptions({
  name: 'ProjectSearch',
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useNaiveForm();

const model = defineModel<Api.SystemManage.ProjectSearchParams>('model', {
  required: true,
});

type RuleKey = Extract<keyof Api.SystemManage.ProjectSearchParams, 'search' | 'featured' | 'tech'>;

const rules = computed<Record<RuleKey, App.Global.FormRule[]>>(() => {
  return {
    search: [],
    featured: [],
    tech: [],
  };
});

const techOptions = ref<CommonType.Option<string>[]>([]);

async function getTechOptions() {
  const { data, error } = await fetchGetTechStack();
  if (!error && data) {
    techOptions.value = data.map((item: string) => ({
      label: item,
      value: item,
    }));
  }
}

async function reset() {
  await restoreValidation();
  emit('reset');
}

async function search() {
  await validate();
  emit('search');
}

const featuredOptions: CommonType.Option<boolean>[] = [
  { label: '是', value: true },
  { label: '否', value: false },
];

onMounted(() => {
  getTechOptions();
});
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <NForm
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="left"
      :label-width="80"
      size="small"
    >
      <NGrid responsive="screen" item-responsive>
        <NFormItemGi span="24 s:12 m:6" label="关键词" path="search" class="pr-24px">
          <NInput
            v-model:value="model.search"
            placeholder="请输入标题或描述关键词"
            clearable
            @keyup.enter="search"
          />
        </NFormItemGi>

        <NFormItemGi span="24 s:12 m:6" label="精选" path="featured" class="pr-24px">
          <NSelect
            v-model:value="model.featured"
            :options="featuredOptions"
            placeholder="请选择是否精选"
            clearable
          />
        </NFormItemGi>

        <NFormItemGi span="24 s:12 m:6" label="技术栈" path="tech" class="pr-24px">
          <NSelect
            v-model:value="model.tech"
            :options="techOptions"
            placeholder="请选择技术栈"
            clearable
            filterable
          />
        </NFormItemGi>

        <NFormItemGi span="24 s:12 m:6">
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
  </NCard>
</template>

<style scoped></style>
