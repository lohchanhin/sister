/**
 * \u6a94\u6848\u4e0a\u50b3\u8a2d\u5b9a\uff08multer\uff09
 */
import multer from 'multer'

// 改為記憶體儲存，檔案將存在 req.file.buffer 中
const storage = multer.memoryStorage()

export const upload = multer({ storage })
