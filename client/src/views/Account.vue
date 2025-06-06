<script setup>
import { useAuthStore } from '../stores/auth'

const store = useAuthStore()
</script>

<template>
  <h1 class="text-2xl font-bold mb-4">帳號資訊</h1>
  <el-form label-position="top" class="w-full max-w-md space-y-4">
    <el-form-item label="使用者名稱">
      <el-input v-model="store.user.username" disabled />
    </el-form-item>
    <el-form-item label="Email">
      <el-input v-model="store.user.email" disabled />
    </el-form-item>
    <el-form-item label="角色">
      <el-input v-model="store.user.role" disabled />
    </el-form-item>
    <el-form-item label="建立時間" v-if="store.user.createdAt">
      <el-input :model-value="new Date(store.user.createdAt).toLocaleString()" disabled />
    </el-form-item>
    <el-form-item label="更新時間" v-if="store.user.updatedAt">
      <el-input :model-value="new Date(store.user.updatedAt).toLocaleString()" disabled />
    </el-form-item>
  </el-form>
</template>
