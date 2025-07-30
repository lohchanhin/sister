import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "../stores/auth"
import { useUploadStore } from "../stores/upload"
import { useProgressStore } from "../stores/progress"

import Login from "../views/Login.vue"
import DashboardLayout from "../layouts/DashboardLayout.vue"
import Dashboard from "../views/Dashboard.vue"
import Account from "../views/Account.vue"
import AssetLibrary from "../views/AssetLibrary.vue"
import ProductLibrary from "../views/ProductLibrary.vue"
import EmployeeManager from "../views/EmployeeManager.vue"
import RoleSettings from "../views/RoleSettings.vue"
import TagManager from "../views/TagManager.vue"
import ReviewSettings from "../views/ReviewSettings.vue"
import AdClients from "../views/AdClients.vue"
import AdPlatforms from "../views/AdPlatforms.vue"
import AdData from "../views/AdData.vue"

const routes = [
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { public: true },
  },
  {
    path: "/",
    component: DashboardLayout,
    children: [
      { path: "", redirect: "/dashboard" },
      { path: "dashboard", name: "Dashboard", component: Dashboard, meta: { menu: "dashboard" } },
      { path: "account", name: "Account", component: Account, meta: { menu: "account" } },
      { path: "assets/:folderId?", name: "Assets", component: AssetLibrary, meta: { menu: "assets" } },
      { path: "products/:folderId?", name: "Products", component: ProductLibrary, meta: { menu: "products" } },
      { path: "employees", name: "EmployeeManager", component: EmployeeManager, meta: { menu: "employees" } },
      { path: "roles", name: "RoleSettings", component: RoleSettings, meta: { menu: "roles" } },
      { path: "tags", name: "TagManager", component: TagManager, meta: { menu: "tags" } },
      { path: "review-settings", name: "ReviewSettings", component: ReviewSettings, meta: { menu: "review-settings" } },
      { path: "clients", name: "AdClients", component: AdClients, meta: { menu: "clients" } },
      { path: "platforms", name: "AdPlatforms", component: AdPlatforms, meta: { menu: "platforms" } },
      { path: "ad-data", name: "AdData", component: AdData, meta: { menu: "ad-data" } },
    ],
  },
  // 404
  { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/* -------- 路由守衛：驗證 JWT & 權限 -------- */
router.beforeEach((to) => {
  const uploadStore = useUploadStore()
  const progressStore = useProgressStore()
  const store = useAuthStore()

  if (uploadStore.hasPending) {
    const leave = window.confirm("仍有上傳任務進行中，確定要離開嗎？")
    if (!leave) return false
    uploadStore.cancelAll()
  }

  if (progressStore.hasActiveDownloads) {
    const leave = window.confirm("仍有下載任務進行中，離開會停止下載，確定要離開嗎？")
    if (!leave) return false
    progressStore.clearActiveDownloads()
  }

  if (to.meta.public) return true // 公開頁面

  // 若尚未登入，導向 login 並帶上 redirect
  if (!store.isAuthenticated) {
    return {
      path: "/login",
      query: { redirect: to.fullPath },
    }
  }

  // 若已登入但尚未取得個人資料，先讀取
  if (store.isAuthenticated && (!store.user.menus || store.user.menus.length === 0)) {
    store.fetchProfile()
  }

  const menus = store.user?.menus || []
  if (to.meta.menu && !menus.includes(to.meta.menu)) return "/dashboard"
  return true
})

export default router
