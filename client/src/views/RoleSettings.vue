<!-- RoleSettings.vue (PrimeVue Refactored) -->
<template>
  <Card>
    <template #title>
      <div class="flex justify-content-between align-items-center">
        <h1 class="text-2xl font-bold">角色权限管理</h1>
        <Button label="新增角色" icon="pi pi-plus" @click="openCreate" />
      </div>
    </template>
    <template #content>
      <DataTable :value="roles" :loading="loading" responsiveLayout="scroll">
        <Column field="name" header="角色名称" :sortable="true"></Column>
        <Column field="permissions" header="权限">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-1">
              <Tag v-for="perm in data.permissions" :key="perm" :value="getPermissionLabel(perm)" />
            </div>
          </template>
        </Column>
        <Column header="日誌可查看者">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="viewer in getViewerLabels(data.workDiaryViewers)"
                :key="viewer.id"
                :value="viewer.label"
                severity="info"
              />
              <span v-if="!getViewerLabels(data.workDiaryViewers).length" class="text-gray-500 text-sm">
                （未設定）
              </span>
            </div>
          </template>
        </Column>
        <Column header="操作" :exportable="false" style="min-width:8rem">
          <template #body="{ data }">
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="openEdit(data)" />
            <Button icon="pi pi-trash" class="p-button-rounded p-button-warning" @click="confirmDeleteRole(data)" />
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <Dialog v-model:visible="dialog" :header="editing ? '编辑角色' : '新增角色'" :modal="true" class="p-fluid w-full md:w-40rem">
    <div class="field">
      <label for="name">角色名称</label>
      <InputText id="name" v-model.trim="form.name" required="true" autofocus />
    </div>
    <div class="field">
      <label>权限</label>
      <PickList v-model="permissionsForPickList" listStyle="height:200px" dataKey="value">
        <template #sourceheader>可选</template>
        <template #targetheader>已选</template>
        <template #item="slotProps">
          <span>{{ slotProps.item.label }}</span>
        </template>
      </PickList>
    </div>
    <div class="field">
      <label>菜单</label>
       <PickList v-model="menusForPickList" listStyle="height:200px" dataKey="value">
        <template #sourceheader>可选</template>
        <template #targetheader>已选</template>
        <template #item="slotProps">
          <span>{{ slotProps.item.label }}</span>
        </template>
      </PickList>
    </div>
    <div class="field">
      <label>工作日誌可查看者</label>
      <MultiSelect
        v-model="form.workDiaryViewers"
        :options="userOptions"
        optionLabel="label"
        optionValue="value"
        display="chip"
        placeholder="選擇帳號"
        class="w-full"
      />
      <small class="text-gray-500">若角色無需限制，保留空白即可。</small>
    </div>
    <template #footer>
      <Button label="取消" icon="pi pi-times" class="p-button-text" @click="dialog = false"/>
      <Button :label="editing ? '更新' : '建立'" icon="pi pi-check" @click="submit" />
    </template>
  </Dialog>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { fetchRoles, createRole, updateRole, deleteRole, fetchPermissions, fetchMenus } from '../services/roles'
import { fetchUsers } from '../services/user'
import { PERMISSION_NAMES } from '../permissionNames'
import { MENU_NAMES } from '../menuNames'
import { useAuthStore } from '../stores/auth'

// PrimeVue Components
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import PickList from 'primevue/picklist'
import Tag from 'primevue/tag'
import MultiSelect from 'primevue/multiselect'

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()
const authStore = useAuthStore()

if (!authStore.hasPermission('role:manage')) {
  router.replace('/')
}

const loading = ref(true)
const roles = ref([])
const allPermissions = ref([])
const allMenus = ref([])
const allUsers = ref([])
const dialog = ref(false)
const editing = ref(false)
const form = ref({ name: '', permissions: [], menus: [], workDiaryViewers: [] })

const permissionsForPickList = ref([[], []])
const menusForPickList = ref([[], []])
const userOptions = computed(() =>
  allUsers.value.map((user) => ({
    label: user.name || user.username || user.email || user._id,
    value: user._id || user.id
  }))
)
const userLabelMap = computed(() => {
  const map = new Map()
  userOptions.value.forEach((option) => {
    if (option.value) map.set(option.value, option.label)
  })
  return map
})

const normalizeViewerIds = (value) => {
  if (!value) return []
  const list = Array.isArray(value) ? value : [value]
  const seen = new Set()
  list.forEach((item) => {
    const id = item?._id || item?.id || item
    if (id) seen.add(id)
  })
  return Array.from(seen)
}

const getViewerLabels = (value) =>
  normalizeViewerIds(value).map((id) => ({
    id,
    label: userLabelMap.value.get(id) || id
  }))

const getPermissionLabel = (permValue) => {
    const perm = allPermissions.value.find(p => p.value === permValue)
    return perm ? perm.label : permValue
}

const loadRoles = async () => {
  loading.value = true
  try {
    roles.value = await fetchRoles()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load roles', life: 3000 })
  } finally {
    loading.value = false
  }
}

const loadPermissions = async () => {
  try {
    const codes = await fetchPermissions()
    allPermissions.value = codes.map(code => ({ value: code, label: PERMISSION_NAMES[code] || code }))
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load permissions', life: 3000 })
  }
}

const loadMenus = async () => {
  try {
    const codes = await fetchMenus()
    allMenus.value = codes.map(code => ({ value: code, label: MENU_NAMES[code] || code }))
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load menus', life: 3000 })
  }
}

const loadUsers = async () => {
  try {
    const users = await fetchUsers({ limit: 500 })
    const list = Array.isArray(users?.records)
      ? users.records
      : Array.isArray(users)
      ? users
      : []
    allUsers.value = list
  } catch (error) {
    toast.add({ severity: 'warn', summary: '提示', detail: '使用者清單載入失敗', life: 3000 })
  }
}

const openCreate = () => {
  editing.value = false
  form.value = { name: '', permissions: [], menus: [], workDiaryViewers: [] }
  permissionsForPickList.value = [allPermissions.value, []]
  menusForPickList.value = [allMenus.value, []]
  dialog.value = true
}

const openEdit = (role) => {
  editing.value = true
  form.value = { ...role, workDiaryViewers: normalizeViewerIds(role.workDiaryViewers) }
  
  const selectedPerms = new Set(role.permissions || [])
  const sourcePerms = allPermissions.value.filter(p => !selectedPerms.has(p.value))
  const targetPerms = allPermissions.value.filter(p => selectedPerms.has(p.value))
  permissionsForPickList.value = [sourcePerms, targetPerms]

  const selectedMenus = new Set(role.menus || [])
  const sourceMenus = allMenus.value.filter(m => !selectedMenus.has(m.value))
  const targetMenus = allMenus.value.filter(m => selectedMenus.has(m.value))
  menusForPickList.value = [sourceMenus, targetMenus]

  dialog.value = true
}

const submit = async () => {
  if (!form.value.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Role name is required', life: 3000 })
    return
  }

  try {
    const data = {
      name: form.value.name,
      permissions: permissionsForPickList.value[1].map(p => p.value),
      menus: menusForPickList.value[1].map(m => m.value),
      workDiaryViewers: normalizeViewerIds(form.value.workDiaryViewers)
    }
    if (editing.value) {
      await updateRole(form.value._id, data)
      toast.add({ severity: 'success', summary: 'Success', detail: 'Role updated', life: 3000 })
    } else {
      await createRole(data)
      toast.add({ severity: 'success', summary: 'Success', detail: 'Role created', life: 3000 })
    }
    dialog.value = false
    loadRoles()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Operation failed', life: 3000 })
  }
}

const confirmDeleteRole = (role) => {
  confirm.require({
    message: `確定要刪除「${role.name}」嗎？`,
    header: '刪除確認',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deleteRole(role._id)
        toast.add({ severity: 'success', summary: 'Success', detail: 'Role deleted', life: 3000 })
        loadRoles()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Deletion failed', life: 3000 })
      }
    }
  });
}

onMounted(async () => {
  await Promise.all([loadPermissions(), loadMenus(), loadUsers()])
  loadRoles()
})
</script>
