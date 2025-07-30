<!-- EmployeeManager.vue (PrimeVue Refactored) -->
<template>
  <Card>
    <template #title>
      <div class="flex justify-content-between align-items-center">
        <h1 class="text-2xl font-bold">員工帳號管理</h1>
        <Button label="新增帳號" icon="pi pi-plus" @click="openCreate" />
      </div>
    </template>
    <template #content>
      <DataTable :value="users" :loading="loading" responsiveLayout="scroll">
        <Column field="username" header="登入帳號" :sortable="true"></Column>
        <Column field="name" header="姓名" :sortable="true"></Column>
        <Column field="email" header="Email" :sortable="true"></Column>
        <Column field="role" header="角色" :sortable="true">
          <template #body="{ data }">
            {{ getRoleLabel(data.role) }}
          </template>
        </Column>
        <Column header="操作" :exportable="false" style="min-width:8rem">
          <template #body="{ data }">
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="openEdit(data)" />
            <Button icon="pi pi-trash" class="p-button-rounded p-button-warning" @click="confirmDeleteUser(data)" />
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <Dialog v-model:visible="dialog" :header="editing ? '編輯帳號' : '新增帳號'" :modal="true" class="p-fluid w-full md:w-30rem">
    <div class="field">
      <label for="username">登入帳號</label>
      <InputText id="username" v-model.trim="form.username" required="true" autofocus />
    </div>
    <div class="field">
      <label for="name">姓名</label>
      <InputText id="name" v-model.trim="form.name" required="true" />
    </div>
    <div class="field">
      <label for="email">Email</label>
      <InputText id="email" v-model.trim="form.email" required="true" />
    </div>
    <div class="field">
      <label for="role">角色</label>
      <Dropdown id="role" v-model="form.role" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="選擇角色" />
    </div>
    <div class="field">
      <label for="password">密碼</label>
      <Password id="password" v-model="form.password" :placeholder="editing ? '留空則不變' : ''" :feedback="false" toggleMask />
    </div>
    <template #footer>
      <Button label="取消" icon="pi pi-times" class="p-button-text" @click="dialog = false"/>
      <Button :label="editing ? '更新' : '建立'" icon="pi pi-check" @click="submit" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { fetchUsers, createUser, updateUser, deleteUser } from '../services/user'
import { fetchRoles } from '../services/roles'
import { useAuthStore } from '../stores/auth'

// PrimeVue Components
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Password from 'primevue/password'

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()
const authStore = useAuthStore()

if (!authStore.hasPermission('user:manage')) {
  router.replace('/')
}

const loading = ref(true)
const users = ref([])
const roleOptions = ref([])
const dialog = ref(false)
const editing = ref(false)
const form = ref({})

const getRoleLabel = (roleValue) => {
  const role = roleOptions.value.find(r => r.value === roleValue)
  return role ? role.label : roleValue
}

const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await fetchUsers()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load users', life: 3000 })
  } finally {
    loading.value = false
  }
}

const loadRoles = async () => {
  try {
    const roles = await fetchRoles()
    roleOptions.value = roles.map(r => ({ label: r.name, value: r.name }))
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load roles', life: 3000 })
  }
}

const openCreate = () => {
  editing.value = false
  form.value = { username: '', name: '', email: '', role: 'employee', password: '' }
  dialog.value = true
}

const openEdit = (user) => {
  editing.value = true
  form.value = { ...user, password: '' }
  dialog.value = true
}

const submit = async () => {
  if (!form.value.username || !form.value.name || !form.value.email) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill in all required fields', life: 3000 })
    return
  }

  try {
    if (editing.value) {
      await updateUser(form.value._id, form.value)
      toast.add({ severity: 'success', summary: 'Success', detail: 'User updated', life: 3000 })
    } else {
      await createUser(form.value)
      toast.add({ severity: 'success', summary: 'Success', detail: 'User created', life: 3000 })
    }
    dialog.value = false
    loadUsers()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Operation failed', life: 3000 })
  }
}

const confirmDeleteUser = (user) => {
  confirm.require({
    message: `確定要刪除「${user.name}」嗎？`,
    header: '刪除確認',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deleteUser(user._id)
        toast.add({ severity: 'success', summary: 'Success', detail: 'User deleted', life: 3000 })
        loadUsers()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Deletion failed', life: 3000 })
      }
    }
  });
}

onMounted(() => {
  loadUsers()
  loadRoles()
})
</script>
