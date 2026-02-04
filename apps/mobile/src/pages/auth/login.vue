<script lang="ts" setup>
import { ref } from 'vue';
import { useTokenStore } from '@/store/token';

definePage({
  style: {
    navigationBarTitleText: '登录',
  },
});

const tokenStore = useTokenStore();
const username = ref('');
const password = ref('');

async function doLogin() {
  if (!username.value || !password.value) {
    uni.showToast({
      title: '请输入用户名和密码',
      icon: 'none',
    });
    return;
  }

  if (tokenStore.hasLogin) {
    uni.navigateBack();
    return;
  }

  try {
    await tokenStore.login({
      userName: username.value,
      password: password.value,
    });
    // 登录成功后的回调通常在 store 中处理或通过 redirect
    uni.navigateBack();
  } catch (error) {
    console.error('登录页面捕获错误:', error);
  }
}
</script>

<template>
  <view class="login-container p-8">
    <view class="mb-8 text-center text-2xl font-bold"> NestBase 登录 </view>

    <view class="form-item mb-4">
      <view class="mb-2 text-sm text-gray-500"> 用户名 </view>
      <input
        v-model="username"
        class="input-box w-full border border-gray-300 rounded p-3"
        type="text"
        placeholder="请输入用户名 (admin)"
      />
    </view>

    <view class="form-item mb-8">
      <view class="mb-2 text-sm text-gray-500"> 密码 </view>
      <input
        v-model="password"
        class="input-box w-full border border-gray-300 rounded p-3"
        type="password"
        placeholder="请输入密码 (admin123)"
      />
    </view>

    <button
      class="login-btn w-full rounded-lg bg-blue-500 py-3 text-white active:bg-blue-700 hover:bg-blue-600"
      @click="doLogin"
    >
      登录
    </button>
  </view>
</template>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background-color: #fff;
}
</style>
