import mongoose from 'mongoose'

const storyboardSceneSchema = new mongoose.Schema(
  {
    stage: { type: String, trim: true, default: '' },
    narration: { type: String, trim: true, default: '' },
    visuals: { type: String, trim: true, default: '' },
    assets: { type: String, trim: true, default: '' },
    cta: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' }
  },
  { _id: false }
)

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
    },
    templateId: {
      type: String,
      trim: true,
      default: ''
    },
    targetAudience: {
      type: String,
      trim: true,
      default: ''
    },
    corePromise: {
      type: String,
      trim: true,
      default: ''
    },
    visualTone: {
      type: String,
      trim: true,
      default: ''
    },
    storyboard: {
      type: [storyboardSceneSchema],
      default: []
    }
  },
  { timestamps: true }
)

export default mongoose.model('ScriptIdea', scriptIdeaSchema)
