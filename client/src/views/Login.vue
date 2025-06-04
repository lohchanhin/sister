<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const password = ref('')
const router = useRouter()
const store = useAuthStore()

const onSubmit = async () => {
  try {
    await store.login(username.value, password.value)
    router.push('/') // 轉向首頁
  } catch (e) {
    // 已在 api 攔截器 alert
  }
}
</script>

<template>
  <div class="h-screen flex items-center justify-center bg-gray-100">
    <form
      @submit.prevent="onSubmit"
      class="w-80 bg-white rounded-2xl shadow-xl p-8 space-y-6"
    >
      <h1 class="text-2xl text-center font-bold">系統登入</h1>
      <input v-model="username" placeholder="使用者名稱" class="input" required />
      <input
        v-model="password"
        type="password"
        placeholder="密碼"
        class="input"
        required
      />
      <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
        登入
      </button>
    </form>
  </div>
</template>

<style scoped>
.input {
  @apply w-full border rounded px-3 py-2 focus:outline-none focus:ring;
}
</style>
