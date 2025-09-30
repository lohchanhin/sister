import mongoose from 'mongoose'

const scriptIdeaSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    scriptCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'revision'],
      default: 'pending'
    },
    videoPath: {
      type: String,
      default: ''
    },
    videoName: {
      type: String,
      default: ''
    },
    summaryScript: {
      type: String,
      default: ''
    },
    headline: {
      type: String,
      default: ''
    },
    firstParagraph: {
      type: String,
      default: ''
    },
    dialogue: {
      type: String,
      default: ''
    },
    keyLines: {
      type: String,
      default: ''
    },
    feedback: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
)

export default mongoose.model('ScriptIdea', scriptIdeaSchema)
