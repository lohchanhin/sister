export const languages = {
  zhCN: {
    ACCOUNT_OR_PASSWORD_ERROR: '账号或密码错误',
    USER_ALREADY_EXISTS: '用户已存在',
    EMAIL_ALREADY_EXISTS: 'Email 已存在',
    USER_NOT_FOUND: '找不到用户',
    TOKEN_INVALID: 'Token 无效',
    NOT_LOGGED_IN: '未登录或 Token 错误',
    PERMISSION_DENIED: '权限不足',
    ROLE_NOT_FOUND: '角色不存在',
    ROLE_DELETED: '角色已删除',
    CLIENT_NOT_FOUND: '客户不存在',
    CLIENT_DELETED: '客户已删除',
    PLATFORM_NOT_FOUND: '平台不存在',
    PLATFORM_NAME_DUPLICATE: '平台名称重复',
    PLATFORM_DELETED: '平台已删除',
    FOLDER_NOT_FOUND: '资料夹不存在',
    FOLDER_DELETED: '资料夹已删除',
    PARENT_FOLDER_NOT_FOUND: '父层资料夹不存在',
    TARGET_FOLDER_NOT_FOUND: '目标资料夹不存在',
    ASSET_NOT_FOUND: '找不到素材',
    ASSET_DELETED: '素材已删除',
    FILE_NOT_UPLOADED: '未上传档案',
    STATUS_ERROR: '状态错误',
    PARAMS_ERROR: '参数错误',
    RECORD_NOT_FOUND: '记录不存在',
    RECORD_DELETED: '记录已删除',
    INVALID_FORMULA: '公式無效',
    SLUG_INVALID: 'slug 格式错误',
    SLUG_DUPLICATE: 'slug 重复',
    TAG_NOT_FOUND: '标签不存在',
    TAG_DELETED: '标签已删除',
    DATA_FORMAT_ERROR: '资料格式错误',
    REVIEW_STAGE_NOT_FOUND: '阶段不存在',
    REVIEW_STAGE_NOT_ALLOWED: '无权审核此阶段',
    PRE_REVIEW_UNFINISHED: '前置审核未完成',
    NOTE_NOT_FOUND: '备注不存在',
    PATH_MISSING: '缺少 path 参数',
    MISSING_FILENAME: '缺少档名',
    MISSING_FILENAME_OR_PATH: '缺少档名或路径',
    MISSING_CLIENT_ID: '缺少 clientId',
    DIARY_NOT_FOUND: '找不到工作日誌',
    DIARY_DUPLICATE: '當日工作日誌已存在',
    DIARY_EDIT_FORBIDDEN: '無權編輯此工作日誌',
    DIARY_REVIEW_FORBIDDEN: '無權審核此工作日誌',
    DIARY_IMAGE_NOT_FOUND: '找不到指定圖片',
    UPDATED: '已更新',
    MOVED: '已移动',
    DELETED: '已删除'
  },
  en: {
    // TODO: add English translations
  }
}

export const DEFAULT_LANG = 'zhCN'

export function t(key, lang = DEFAULT_LANG) {
  return languages[lang]?.[key] || key
}
