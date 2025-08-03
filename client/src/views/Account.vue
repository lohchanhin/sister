<!-- Account.vue (PrimeVue Refactored) -->
<template>
  <Card class="w-full md:w-30rem">
    <template #title>
      <h1 class="text-2xl font-bold">帐号资讯</h1>
    </template>
    <template #content>
      <form @submit.prevent="onSubmit" class="p-fluid">
        <div class="field">
          <label for="username">登录帐号</label>
          <InputText id="username" v-model.trim="username" />
        </div>
        <div class="field">
          <label for="name">姓名</label>
          <InputText id="name" v-model.trim="name" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <InputText id="email" v-model.trim="email" />
        </div>
        <div class="field">
          <label for="password">新密碼</label>
          <Password id="password" v-model="password" placeholder="留空则不变更" :feedback="false" toggleMask />
        </div>
        <Button type="submit" label="更新資料" class="w-full mt-4" />
      </form>
    </template>
  </Card>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'
import { useToast } from 'primevue/usetoast'

// PrimeVue Components
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

const toast = useToast()
const store = useAuthStore()

const username = ref(store.user?.username || '')
const name = ref(store.user?.name || '')
const email = ref(store.user?.email || '')
const password = ref('')

const onSubmit = async () => {
  try {
    const payload = { username: username.value, name: name.value, email: email.value }
    if (password.value) {
      payload.password = password.value
    }
    const { data } = await api.put('/user/profile', payload)
    store.user = data
    password.value = ''
    toast.add({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile', life: 3000 })
  }
}
</script>
