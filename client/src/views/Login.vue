<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const password = ref('')
const router = useRouter()
const route = useRoute()
const store = useAuthStore()

const onSubmit = async () => {
  try {
    await store.login(username.value, password.value)
    router.push(route.query.redirect || '/')
  } catch (e) {
    // 已在 api 攔截器 alert
  }
}
</script>

<template>
  <div class="h-screen flex items-center justify-center bg-gray-100">
    <el-form
      @submit.prevent="onSubmit"
      class="w-80 bg-white rounded-2xl shadow-xl p-8 space-y-6"
    >
      <h1 class="text-2xl text-center font-bold">系統登入</h1>
      <el-input v-model="username" placeholder="使用者名稱" clearable />
      <el-input v-model="password" type="password" placeholder="密碼" show-password />
      <el-button type="primary" class="w-full" native-type="submit">登入</el-button>
    </el-form>
  </div>
</template>

<style scoped>
</style>
