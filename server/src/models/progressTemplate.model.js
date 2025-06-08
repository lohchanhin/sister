// models/progressTemplate.model.js
import mongoose from 'mongoose';
import { ROLES } from '../config/roles.js';

const fieldSchema = new mongoose.Schema(
  {
    fieldName : { type: String, required: true },

    /** 支援  string / number / date / select / bool */
    fieldType : {
      type   : String,
      enum   : ['string', 'number', 'date', 'select', 'bool'],
      default: 'string'
    },

    /** ▼ 只是前端「下拉權限對應」的備註欄，允許留空，所以 **拿掉 enum 驗證** */
    optionsRole: { type: String }   // 'employee' | 'manager' | 'outsource' | undefined
  },
  { _id: false }
);

const templateSchema = new mongoose.Schema(
  {
    name     : { type: String, required: true },
    fields   : { type: [fieldSchema], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.model('ProgressTemplate', templateSchema);
