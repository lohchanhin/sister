import { PERMISSIONS } from './permissions.js'

/**
 * 系統角色常數定義
 */
export const ROLES = Object.freeze({
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  OUTSOURCE: 'outsource'
})

/**
 * 角色預設權限
 */
export const ROLE_DEFAULT_PERMISSIONS = Object.freeze({
  [ROLES.EMPLOYEE]: [PERMISSIONS.WORK_DIARY_READ_OWN],
  [ROLES.MANAGER]: [
    PERMISSIONS.WORK_DIARY_READ_ALL,
    PERMISSIONS.WORK_DIARY_READ_OWN,
    PERMISSIONS.WORK_DIARY_REVIEW,
    PERMISSIONS.WORK_DIARY_COMMENT
  ],
  [ROLES.OUTSOURCE]: []
})
