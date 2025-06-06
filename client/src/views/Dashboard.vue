<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const summary = ref({ totalSpent: 0, totalEnq: 0, avgCost: 0 })

async function fetchSummary() {
  const { data } = await api.get('/analytics')
  summary.value = data
}

onMounted(fetchSummary)
</script>

<template>
  <h1 class="text-2xl font-bold mb-4">儀表板</h1>
  <el-row :gutter="20" class="mb-4">
    <el-col :span="8">
      <el-card>
        <div class="text-xl">總花費</div>
        <div class="text-2xl font-bold">{{ summary.totalSpent }}</div>
      </el-card>
    </el-col>
    <el-col :span="8">
      <el-card>
        <div class="text-xl">總詢價數</div>
        <div class="text-2xl font-bold">{{ summary.totalEnq }}</div>
      </el-card>
    </el-col>
    <el-col :span="8">
      <el-card>
        <div class="text-xl">平均成本</div>
        <div class="text-2xl font-bold">{{ summary.avgCost }}</div>
      </el-card>
    </el-col>
  </el-row>
</template>
