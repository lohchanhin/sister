<script setup>
import { ref, onMounted } from 'vue'
import { fetchFolders, createFolder, updateFolder, getFolder } from '../services/folders'
import { fetchAssets, uploadAsset } from '../services/assets'

const folders = ref([])
const assets = ref([])
const currentFolder = ref(null)
const detail = ref({ description: '', script: '' })
const showDetail = ref(false)
const newFolderName = ref('')

const loadData = async (id = null) => {
  folders.value = await fetchFolders(id)
  assets.value = await fetchAssets(id)
  currentFolder.value = id ? await getFolder(id) : null
}

onMounted(() => loadData())

const openFolder = (f) => {
  loadData(f._id)
}

const goUp = () => {
  loadData(currentFolder.value?.parentId || null)
}

const saveDetail = async () => {
  if (!currentFolder.value) return
  await updateFolder(currentFolder.value._id, detail.value)
  showDetail.value = false
  loadData(currentFolder.value._id)
}

const showDetailFor = (f) => {
  currentFolder.value = f
  detail.value.description = f.description || ''
  detail.value.script = f.script || ''
  showDetail.value = true
}

const createNewFolder = async () => {
  if (!newFolderName.value) return
  await createFolder({ name: newFolderName.value, parentId: currentFolder.value?._id })
  newFolderName.value = ''
  loadData(currentFolder.value?._id)
}

const onFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  await uploadAsset(file, currentFolder.value?._id)
  loadData(currentFolder.value?._id)
}
</script>

<template>
  <h1 class="text-2xl font-bold mb-4">素材庫</h1>
  <div class="mb-4 flex gap-2">
    <el-button @click="goUp" :disabled="!currentFolder">返回上層</el-button>
    <el-input v-model="newFolderName" placeholder="新增資料夾名稱" class="w-40" />
    <el-button type="primary" @click="createNewFolder">新增資料夾</el-button>
    <input type="file" @change="onFileChange" />
  </div>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <el-card v-for="f in folders" :key="f._id" class="cursor-pointer">
      <template #header>
        <div class="flex justify-between items-center">
          <span @click="openFolder(f)">📁 {{ f.name }}</span>
          <el-button size="small" @click.stop="showDetailFor(f)">詳細</el-button>
        </div>
      </template>
    </el-card>
    <el-card v-for="a in assets" :key="a._id">
      {{ a.filename }}
    </el-card>
  </div>
  <el-dialog v-model="showDetail" title="資料夾資訊">
    <el-form @submit.prevent>
      <el-form-item label="描述">
        <el-input v-model="detail.description" type="textarea" />
      </el-form-item>
      <el-form-item label="腳本需求">
        <el-input v-model="detail.script" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showDetail = false">取消</el-button>
      <el-button type="primary" @click="saveDetail">儲存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
</style>
