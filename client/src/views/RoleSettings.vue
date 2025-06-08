<!-- RoleSettings.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchRoles, createRole, updateRole, deleteRole, fetchPermissions } from '../services/roles'
import { PERMISSION_NAMES } from '../permissionNames'
import { useAuthStore } from '../stores/auth'

const store = useAuthStore()
if (store.role !== 'manager') {
  window.location.href = '/'
}

const roles = ref([])
const dialog = ref(false)
const editing = ref(false)
const permissionList = ref([])
const form = ref({
  name: '',
  permissions: []
})

const loadRoles = async () => {
  roles.value = await fetchRoles()
}

const loadPermissions = async () => {
  const codes = await fetchPermissions()
  permissionList.value = codes.map(code => ({ value: code, label: PERMISSION_NAMES[code] }))
}

const openCreate = () => {
  editing.value = false
  form.value = { name: '', permissions: [] }
  dialog.value = true
}

const openEdit = r => {
  editing.value = true
  form.value = { ...r, permissions: Array.isArray(r.permissions) ? [...r.permissions] : [] }
  dialog.value = true
}

const submit = async () => {
  const data = {
    name: form.value.name,
    permissions: form.value.permissions
  }
  if (editing.value) {
    await updateRole(form.value._id, data)
    ElMessage.success('已更新角色')
  } else {
    await createRole(data)
    ElMessage.success('已建立角色')
  }
  dialog.value = false
  await loadRoles()
}

const removeRole = async r => {
  await ElMessageBox.confirm(`確定刪除「${r.name}」？`, '警告', {
    confirmButtonText: '刪除',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await deleteRole(r._id)
  ElMessage.success('已刪除角色')
  await loadRoles()
}

onMounted(() => {
  loadRoles()
  loadPermissions()
})
</script>

<template>
  <section class="p-6 space-y-6 bg-white text-gray-800">
    <h1 class="text-2xl font-bold">角色權限管理</h1>

    <el-button type="primary" @click="openCreate">＋ 新增角色</el-button>

    <el-table :data="roles" style="width:100%" stripe border>
      <el-table-column prop="name" label="角色名稱" />
      <el-table-column
        prop="permissions"
        label="權限"
        :formatter="(_, __, cell) => Array.isArray(cell) ? cell.join(', ') : ''"
      />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">編輯</el-button>
          <el-button link type="danger"  @click="removeRole(row)">刪除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog" :title="editing ? '編輯角色' : '新增角色'" width="420px">
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="角色名稱"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="權限">
          <el-checkbox-group v-model="form.permissions">
            <el-checkbox
              v-for="p in permissionList"
              :key="p.value"
              :label="p.value"
            >
              {{ p.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog=false">取消</el-button>
        <el-button type="primary" @click="submit">{{ editing ? '更新' : '建立' }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>
