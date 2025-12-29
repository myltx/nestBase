<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({
  name: 'TagSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const model = defineModel<Api.SystemManage.TagSearchParams>('model', {
  required: true
});

function reset() {
  emit('reset');
}

function search() {
  emit('search');
}
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <NCollapse :default-expanded-names="['tag-search']">
      <NCollapseItem :title="$t('common.search')" name="tag-search">
        <NForm :model="model" label-placement="left" :label-width="80">
          <NGrid responsive="screen" item-responsive>
            <NFormItemGi span="24 s:12 m:6" :label="$t('page.manage.tag.name')" path="name" class="pr-24px">
              <NInput v-model:value="model.name" :placeholder="$t('page.manage.tag.form.name')" />
            </NFormItemGi>
            <!--
 <NFormItemGi span="24 s:12" :label="$t('page.manage.tag.slug')" path="slug" class="pr-24px">
              <NInput v-model:value="model.slug" :placeholder="$t('page.manage.tag.form.slug')" />
            </NFormItemGi>
-->
            <NFormItemGi span="18">
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
