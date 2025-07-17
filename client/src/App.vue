<template>
  <Toast />
  <ConfirmDialog />
  <router-view />
  <!-- UploadSnackbar 將在後續被 PrimeVue 的 Toast 通知替代 -->
  <!-- <UploadSnackbar /> -->
</template>

<script setup>
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
// import UploadSnackbar from './components/UploadSnackbar.vue'
</script>