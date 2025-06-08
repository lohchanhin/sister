<!-- src/views/EmployeeManager.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchUsers, createUser, updateUser, deleteUser } from '../services/user'
import { fetchRoles } from '../services/roles'
import { useAuthStore } from '../stores/auth'   // 取當前登入者資訊

/* ---------- 角色選單 ---------- */
const roleOptions = ref([])

const loadRoles = async () => {
  const roles = await fetchRoles()
  console.log("roles:", roles);
  roleOptions.value = roles.map(r => ({ label: r.name, value: r.name }))
}

/* ---------- 權限檢查：非 manager 直接跳回首頁 ---------- */
const store = useAuthStore()
if (store.role !== 'manager') {
  window.location.href = '/'   // 或用 router.replace('/')
}

/* ---------- State ---------- */
const users = ref([])
const dialog = ref(false)
const editing = ref(false)        // true=編輯, false=新增
const form = ref({
  name: '',
  email: '',
  role: 'employee',
  password: ''                    // 新增 / 重設
})

/* ---------- Methods ---------- */
const loadUsers = async () => { users.value = await fetchUsers() }

/* 開新增/編輯 Dialog */
const openCreate = () => {
  editing.value = false
  form.value = { name: '', email: '', role: 'employee', password: '' }
  dialog.value = true
}
const openEdit = u => {
  editing.value = true
  form.value = { ...u, password: '' }   // 不顯示舊密碼
  dialog.value = true
}

/* 送出 */
const submit = async () => {
  if (!form.value.name.trim() || !form.value.email.trim()) return
  if (editing.value) {
    await updateUser(form.value._id, form.value)
    ElMessage.success('已更新帳號')
  } else {
    await createUser(form.value)
    ElMessage.success('已建立帳號')
  }
  dialog.value = false
  await loadUsers()
}

/* 刪除 */
const removeUser = async u => {
  await ElMessageBox.confirm(`確定刪除「${u.name}」？`, '警告', {
    confirmButtonText: '刪除', cancelButtonText: '取消', type: 'warning'
  })
  await deleteUser(u._id)
  ElMessage.success('已刪除帳號')
  await loadUsers()
}

onMounted(() => {
  loadUsers()
  loadRoles()
})
</script>

<template>
  <section class="p-6 space-y-6 bg-white text-gray-800">
    <h1 class="text-2xl font-bold">員工帳號管理</h1>

    <el-button type="primary" @click="openCreate">＋ 新增帳號</el-button>

    <!-- 使用者表格 -->
    <el-table :data="users" style="width:100%" stripe border>
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="email" label="Email" />
      <el-table-column prop="role" label="角色" :formatter="(_, __, cell) => {
        const list = roleOptions?.value ?? []      // 避免 undefined.find()
        const match = list.find(r => r.value === cell)
        return match ? match.label : cell          // 找不到就直接顯示原字串
      }" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">編輯</el-button>
          <el-button link type="danger" @click="removeUser(row)">刪除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增 / 編輯 Dialog -->
    <el-dialog v-model="dialog" :title="editing ? '編輯帳號' : '新增帳號'" width="420px">
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="Email"><el-input v-model="form.email" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" class="w-full">
            <el-option v-for="r in roleOptions" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="密碼" v-if="!editing || form.password">
          <el-input v-model="form.password" type="password" placeholder="留空則不變" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submit">{{ editing ? '更新' : '建立' }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>
