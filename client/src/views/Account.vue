<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const store = useAuthStore()
const username = ref(store.user?.username || '')
const name = ref(store.user?.name || '')
const email = ref(store.user?.email || '')
const password = ref('')

const onSubmit = async () => {
  try {
    const payload = { username: username.value, name: name.value, email: email.value }
    if (password.value) payload.password = password.value
    const { data } = await api.put('/user/profile', payload)
    store.user = data
    password.value = ''
    alert('更新成功')
  } catch (e) {
    // 錯誤已在攔截器處理
  }
}
</script>

<template>
  <h1 class="text-2xl font-bold mb-4">帳號資訊</h1>
  <el-form @submit.prevent="onSubmit" class="w-80 space-y-6">
    <el-input v-model="username" placeholder="登入帳號" clearable />
    <el-input v-model="name" placeholder="姓名" clearable />
    <el-input v-model="email" placeholder="Email" clearable />
    <el-input
      v-model="password"
      type="password"
      placeholder="新密碼"
      show-password
    />
    <el-button type="primary" class="w-full" native-type="submit">更新資料</el-button>
  </el-form>
</template>
