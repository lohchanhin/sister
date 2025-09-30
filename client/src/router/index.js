import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUploadStore } from '../stores/upload'
import { useProgressStore } from '../stores/progress'

import Login from '../views/Login.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Dashboard from '../views/Dashboard.vue'
import Account from '../views/Account.vue'
import AssetLibrary from '../views/AssetLibrary.vue'
import ProductLibrary from '../views/ProductLibrary.vue'
import EmployeeManager from '../views/EmployeeManager.vue'
import RoleSettings from '../views/RoleSettings.vue'
import TagManager from '../views/TagManager.vue'
import ReviewSettings from '../views/ReviewSettings.vue'
import AdClients from '../views/AdClients.vue'
import AdPlatforms from '../views/AdPlatforms.vue'
import AdData from '../views/AdData.vue'
import UserClientAccess from '../views/UserClientAccess.vue'
import PopularDataClients from '../views/popular-data/PopularData.vue'
import PopularDataPlatforms from '../views/popular-data/PopularDataPlatforms.vue'
import PopularDataXhs from '../views/popular-data/PopularDataXhs.vue'
import ScriptIdeas from '../views/script-ideas/ScriptIdeas.vue'
import ScriptIdeasRecords from '../views/script-ideas/ScriptIdeasRecords.vue'
import ScriptIdeasDetail from '../views/script-ideas/ScriptIdeasDetail.vue'
import WorkDiary from '../views/WorkDiary.vue'
import Unauthorized from '../views/Unauthorized.vue'


const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/',
    component: DashboardLayout,
    children: [
      { path: 'dashboard', name: 'Dashboard', component: Dashboard, meta: { menu: 'dashboard' } },
      { path: 'account', name: 'Account', component: Account, meta: { menu: 'account' } },
      { path: 'assets/asset/:assetId', name: 'AssetDetailRoot', component: AssetLibrary, meta: { menu: 'assets' } },
      { path: 'assets/:folderId/asset/:assetId', name: 'AssetDetail', component: AssetLibrary, meta: { menu: 'assets' } },
      { path: 'assets/:folderId?', name: 'Assets', component: AssetLibrary, meta: { menu: 'assets' } },
      { path: 'products/asset/:assetId', name: 'ProductAssetDetailRoot', component: ProductLibrary, meta: { menu: 'products' } },
      { path: 'products/:folderId/asset/:assetId', name: 'ProductAssetDetail', component: ProductLibrary, meta: { menu: 'products' } },
      { path: 'products/:folderId?', name: 'Products', component: ProductLibrary, meta: { menu: 'products' } },

      {
        path: 'popular-data',
        name: 'PopularDataClients',
        component: PopularDataClients,
        meta: { menu: 'popular-data' }
      },
      {
        path: 'popular-data/:clientId',
        name: 'PopularDataPlatforms',
        component: PopularDataPlatforms,
        props: true,
        meta: { menu: 'popular-data' }
      },
      {
        path: 'popular-data/:clientId/xhs',
        name: 'PopularDataXhs',
        component: PopularDataXhs,
        props: true,
        meta: { menu: 'popular-data' }
      },

      {
        path: 'script-ideas',
        component: { template: '<router-view />' },
        meta: { menu: 'script-ideas', requiresPermission: 'script-idea:read' },
        children: [
          {
            path: '',
            name: 'ScriptIdeasClients',
            component: ScriptIdeas,
            meta: { menu: 'script-ideas' }
          },
          {
            path: ':clientId',
            component: { template: '<router-view />' },
            props: true,
            meta: { menu: 'script-ideas' },
            children: [
              {
                path: '',
                name: 'ScriptIdeasRecords',
                component: ScriptIdeasRecords,
                props: true,
                meta: { menu: 'script-ideas' }
              },
              {
                path: 'records/:recordId',
                name: 'ScriptIdeasDetail',
                component: ScriptIdeasDetail,
                props: true,
                meta: { menu: 'script-ideas' }
              }
            ]
          }
        ]
      },

      { path: 'employees', name: 'EmployeeManager', component: EmployeeManager, meta: { menu: 'employees' } },
      { path: 'employees/:userId/clients', name: 'UserClientAccess', component: UserClientAccess, meta: { menu: 'employees' } },
      { path: 'roles', name: 'RoleSettings', component: RoleSettings, meta: { menu: 'roles' } },
      { path: 'tags', name: 'TagManager', component: TagManager, meta: { menu: 'tags' } },
      { path: 'review-settings', name: 'ReviewSettings', component: ReviewSettings, meta: { menu: 'review-stages' } },
      {
        path: 'work-diaries/:date?/:userId?',
        name: 'WorkDiaries',
        component: WorkDiary,
        meta: { menu: 'work-diaries' }
      },
      { path: 'ad-clients', name: 'AdClients', component: AdClients, meta: { menu: 'ad-data' } },
      { path: 'clients/:clientId/platforms', name: 'AdPlatforms', component: AdPlatforms, meta: { menu: 'ad-data' } },
      { path: 'clients/:clientId/platforms/:platformId/data', name: 'AdData', component: AdData }
    ]
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: Unauthorized,
    meta: { public: true }
  },
  // 404
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/* -------- 路由守衛：驗證 JWT & 權限 -------- */
router.beforeEach(async (to) => {
  const uploadStore = useUploadStore()
  if (uploadStore.hasPending) {
    const leave = window.confirm('仍有上傳任務進行中，確定要離開嗎？')
    if (!leave) return false
    uploadStore.cancelAll()
  }
  const progressStore = useProgressStore()
  if (progressStore.hasActiveDownloads) {
    const leave = window.confirm('仍有下載任務進行中，離開會停止下載，確定要離開嗎？')
    if (!leave) return false
    progressStore.clearActiveDownloads()
  }
  const store = useAuthStore()
  if (to.meta.public) return true // 公開頁面

  // 若尚未登入，導向 login 並帶上 redirect
  if (!store.isAuthenticated) {
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  }

  // 若已登入但尚未取得個人資料，先讀取
  if (store.isAuthenticated && store.user.menus.length === 0) {
    await store.fetchProfile()
  }

  const menus = store.user?.menus || []
  if (to.meta.menu && !menus.includes(to.meta.menu)) {
    return {
      path: '/unauthorized',
      query: { redirect: to.fullPath }
    }
  }
  const requiredPermission = to.meta.requiresPermission
  if (requiredPermission && !store.hasPermission(requiredPermission)) {
    return {
      path: '/unauthorized',
      query: { redirect: to.fullPath }
    }
  }
  return true
})

export default router
