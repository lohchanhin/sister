<template>
  <div class="login-page">
    <Card class="login-card">
      <template #title>
        <div class="text-center text-2xl font-bold">系統登入</div>
      </template>
      <template #content>
        <form @submit.prevent="onSubmit" class="p-fluid">
          <div class="field">
            <span class="p-input-icon-left">
              <i class="pi pi-user" />
              <InputText id="username" v-model="username" placeholder="使用者名稱" />
            </span>
          </div>
          <div class="field">
            <Password
              id="password"
              v-model="password"
              placeholder="密碼"
              :feedback="false"
              toggleMask
            />
          </div>
          <Button type="submit" label="登入" class="w-full mt-4" />
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Card from 'primevue/card'

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
    // 可以在這裡觸發 PrimeVue 的 Toast 來顯示錯誤
    console.error('Login failed:', e)
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--surface-ground);
}

.login-card {
  width: 25rem;
  box-shadow: var(--elevation-4);
}
</style>