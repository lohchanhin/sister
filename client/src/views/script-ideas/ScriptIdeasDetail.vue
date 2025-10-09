<template>
  <div class="script-ideas-detail">
    <template v-if="permissionError">
      <section class="permission-error">
        <i class="pi pi-lock"></i>
        <h2>無法檢視腳本詳情</h2>
        <p>{{ errorMessage }}</p>
        <Button label="返回列表" icon="pi pi-arrow-left" severity="secondary" @click="goBack" />
      </section>
    </template>
    <template v-else>
      <header class="detail-header">
        <div>
          <h2>{{ idea?.headline || '腳本詳情' }}</h2>
          <p class="subtitle">依照腳本情境快速配置故事板與口播重點</p>
        </div>
        <div class="actions">
          <Button label="返回列表" icon="pi pi-arrow-left" severity="secondary" @click="goBack" />
          <Button label="儲存變更" icon="pi pi-save" :loading="saving" @click="save" />
        </div>
      </header>

      <div v-if="loading" class="loading">載入腳本詳情中…</div>

      <div v-else class="detail-grid">
        <Card class="detail-card overview-card">
          <template #title>腳本概覽</template>
          <template #content>
            <div class="form-grid">
              <span class="field">
                <label for="title">標題</label>
                <InputText id="title" v-model="form.headline" placeholder="例如：20年老字號品牌故事" />
              </span>
              <span class="field">
                <label for="targetAudience">主要溝通對象</label>
                <InputText id="targetAudience" v-model="form.targetAudience" placeholder="例如：35-45歲媽媽、需要舒適內衣的客人" />
              </span>
              <span class="field field--wide">
                <label for="summary">整體腳本方向</label>
                <Textarea id="summary" v-model="form.summaryScript" rows="4" autoResize
                  placeholder="請描述影片主軸與要傳遞的品牌故事" />
              </span>
              <span class="field">
                <label for="corePromise">核心承諾</label>
                <InputText id="corePromise" v-model="form.corePromise" placeholder="例如：提供大胸也能舒適的支撐" />
              </span>
              <span class="field">
                <label for="visualTone">視覺氛圍/剪輯節奏</label>
                <InputText id="visualTone" v-model="form.visualTone" placeholder="例如：溫暖紀錄感、穿插快剪對比" />
              </span>
            </div>
          </template>
        </Card>

        <Card class="detail-card storyboard-card">
          <template #title>腳本模板與故事板</template>
          <template #content>
            <div class="template-selector">
              <span class="field">
                <label for="template">情境模板</label>
                <Dropdown id="template" v-model="selectedTemplateId" :options="scenarioTemplates" optionLabel="label"
                  optionValue="id" placeholder="選擇腳本情境" showClear />
              </span>
              <Button label="套用模板" icon="pi pi-sparkles" severity="help" @click="applyTemplate" />
            </div>
            <div v-if="currentTemplate" class="template-preview">
              <h3>{{ currentTemplate.label }}</h3>
              <p class="template-description">{{ currentTemplate.description }}</p>
              <ul class="template-highlights">
                <li v-for="(highlight, index) in currentTemplate.highlights" :key="index">{{ highlight }}</li>
              </ul>
            </div>

            <div class="storyboard">
              <header class="storyboard__header">
                <h3>故事板段落</h3>
                <Button label="新增段落" icon="pi pi-plus" text @click="addScene" />
              </header>
              <p class="storyboard__hint">為每個段落設定講稿、畫面與素材建議，方便剪輯與現場拍攝。</p>

              <div v-if="form.storyboard.length === 0" class="storyboard__empty">目前沒有任何段落，請新增。</div>
              <div v-else class="storyboard__list">
                <div v-for="(scene, index) in form.storyboard" :key="index" class="scene-item">
                  <div class="scene-item__header">
                    <h4>段落 {{ index + 1 }}</h4>
                    <div class="scene-item__actions">
                      <Button icon="pi pi-arrow-up" text rounded :disabled="index === 0"
                        @click="moveScene(index, index - 1)" />
                      <Button icon="pi pi-arrow-down" text rounded :disabled="index === form.storyboard.length - 1"
                        @click="moveScene(index, index + 1)" />
                      <Button icon="pi pi-trash" text rounded severity="danger" @click="removeScene(index)" />
                    </div>
                  </div>
                  <div class="scene-item__grid">
                    <span class="field">
                      <label :for="`scene-stage-${index}`">段落主題</label>
                      <InputText :id="`scene-stage-${index}`" v-model="scene.stage" placeholder="例如：品牌歷程/產品亮點" />
                    </span>
                    <span class="field field--wide">
                      <label :for="`scene-narration-${index}`">口播/主講內容</label>
                      <Textarea :id="`scene-narration-${index}`" v-model="scene.narration" rows="3" autoResize
                        placeholder="逐字稿或重點台詞" />
                    </span>
                    <span class="field field--wide">
                      <label :for="`scene-visuals-${index}`">畫面操作</label>
                      <Textarea :id="`scene-visuals-${index}`" v-model="scene.visuals" rows="3" autoResize
                        placeholder="拍攝角度、轉場、對比畫面" />
                    </span>
                    <span class="field field--wide">
                      <label :for="`scene-assets-${index}`">素材/輔助畫面</label>
                      <Textarea :id="`scene-assets-${index}`" v-model="scene.assets" rows="2" autoResize
                        placeholder="需要插入的36宮格、Before/After、產品特寫等" />
                    </span>
                    <span class="field">
                      <label :for="`scene-cta-${index}`">CTA</label>
                      <InputText :id="`scene-cta-${index}`" v-model="scene.cta" placeholder="例如：提醒私訊、門市體驗" />
                    </span>
                    <span class="field field--wide">
                      <label :for="`scene-notes-${index}`">備註</label>
                      <Textarea :id="`scene-notes-${index}`" v-model="scene.notes" rows="2" autoResize
                        placeholder="例如：一次性講完、保留主持人聲音等提醒" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <Card class="detail-card content-card">
          <template #title>口播重點與補充</template>
          <template #content>
            <div class="form-grid">
              <span class="field field--wide">
                <label for="dialogue">完整台詞/旁白</label>
                <Textarea id="dialogue" v-model="form.dialogue" rows="4" autoResize placeholder="可整理要保留的台詞或腳本全文" />
              </span>
              <span class="field field--wide">
                <label for="keyLines">一定要講的金句</label>
                <Textarea id="keyLines" v-model="form.keyLines" rows="3" autoResize placeholder="列出不可漏講的重點台詞" />
              </span>
              <span class="field field--wide">
                <label for="feedback">備註/修改建議</label>
                <Textarea id="feedback" v-model="form.feedback" rows="3" autoResize placeholder="團隊協作用的提醒或下一版調整方向" />
              </span>
            </div>
          </template>
        </Card>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import {
  getScriptIdea,
  updateScriptIdea
} from '@/services/scriptIdeas'

const scenarioTemplates = [
  {
    id: 'legacy-20yr',
    label: '20年芙蓉老字號品牌故事',
    description: '強調品牌歷程、世代服務與專注女性健康的承諾，適合周年或品牌形象影片。',
    highlights: [
      '以時間軸串接市場擺攤到擁有門市的轉變',
      '穿插倉庫、36宮格親子照與產品環繞畫面',
      '口播強調「舒適與支撐」而非性感，呼應品牌理念'
    ],
    defaults: {
      headline: '20年芙蓉內衣品牌故事',
      summaryScript: '回顧品牌從市集到門市的歷程，展現專注女性健康內衣的堅持。',
      targetAudience: '關注舒適內衣的家庭客群與老客戶',
      corePromise: '20年如一地提供健康、舒適且有支撐力的內衣',
      visualTone: '溫暖紀錄感，穿插老照片與動態實拍'
    },
    storyboard: [
      {
        stage: '開場：品牌歷程',
        narration:
          '20年時間從芙蓉Pasar到門市，我們見證了一代又一代女性的需求。',
        visuals: '主持人直拍 zoom in/out，搭配舊市場影像與門市外觀。',
        assets: '歷史照片、攤位素材、門市環境',
        cta: '',
        notes: '一次性講完整段歷程並插入素材畫面'
      },
      {
        stage: '自有品牌誕生',
        narration: '從幫客人代拿貨到打造自己的品牌，只為了給妳最放心的選擇。',
        visuals: '插入倉庫實拍、員工備貨畫面。',
        assets: '倉庫日常、團隊作業',
        cta: '',
        notes: ''
      },
      {
        stage: '服務升級：媽媽到女兒',
        narration: '從服務媽媽到服務顧客的孩子，Besis陪伴每一個成長階段。',
        visuals: '36宮格親子照，主持人出現在右下角互動。',
        assets: '客戶合照、親子互動',
        cta: '',
        notes: '提醒剪輯保留主持人畫面在右下角'
      },
      {
        stage: '產品理念',
        narration: '我們始終關注女性健康與舒適的內衣，讓每次穿著都安心。',
        visuals: '店內環景、產品特寫，緩慢移動鏡頭。',
        assets: '店鋪陳列、產品近拍',
        cta: '',
        notes: ''
      },
      {
        stage: '系列介紹',
        narration: 'Besis 內衣褲不追求性感，只專注於舒服、支撐與健康。',
        visuals: '主持人現場實拍，展示兩大系列。',
        assets: '六宮格系列圖、主持人右下角 crop',
        cta: '邀請私訊或門市體驗',
        notes: '保留主播聲音介紹調整型與無鋼圈系列'
      }
    ]
  },
  {
    id: 'product-828',
    label: '調整型 828 Before/After 對比',
    description: '聚焦大胸體態困擾，透過對比畫面證明調整型內衣的效果。',
    highlights: [
      '先拋出「虎背熊腰」痛點再給解方',
      '全程保留主持人口播搭配產品細節',
      '以模特兒實際穿著前後對比作結'
    ],
    defaults: {
      headline: '828 調整型內衣 Before / After',
      summaryScript: '透過真實案例展示 828 調整型內衣改善體態、集中副乳的效果。',
      targetAudience: '大胸困擾、追求集中顯瘦的女性',
      corePromise: '828 系列讓大胸不再虎背熊腰，穿起來無痕不勒肉',
      visualTone: '節奏明快，重點拉近特寫與對比畫面'
    },
    storyboard: [
      {
        stage: '痛點揭露',
        narration: '大胸的女生穿一般內衣，真的很容易虎背熊腰嗎？',
        visuals: '模特兒穿普通內衣轉身，特寫背部線條。',
        assets: '普通內衣 before 畫面',
        cta: '',
        notes: ''
      },
      {
        stage: '解答：調整型內衣',
        narration: '這不是妳身材的問題，是因為沒有穿調整型內衣。',
        visuals: '主持人入鏡，手持 828 產品講解。',
        assets: '產品細節、內衣結構特寫',
        cta: '',
        notes: '口播保留主持人聲音'
      },
      {
        stage: '賣點拆解',
        narration:
          '我們的 828 調整系列，加厚包裹副乳，果凍條與 15cm 高背片都能鎖住脂肪。',
        visuals: '產品拍攝搭配圖卡說明重點。',
        assets: '賣點文字、內裡結構放大圖',
        cta: '',
        notes: ''
      },
      {
        stage: 'Before / After 實證',
        narration: '小姐姐 38B 穿普通內衣與調整型的效果差異一目了然。',
        visuals: '同框對比畫面，左右或上下分割。',
        assets: '前後對比圖、模特兒講解',
        cta: '',
        notes: '主持人對著模特兒說明 1-3 個重點'
      },
      {
        stage: '購買 CTA',
        narration: '有興趣可以直接 Inbox 或到門市，我們會幫妳找到最合適的尺寸。',
        visuals: '主持人對鏡頭收尾，帶出 CTA。',
        assets: '價格資訊、顏色展示',
        cta: '提醒私訊或門市體驗',
        notes: ''
      }
    ]
  },
  {
    id: 'home-goddess',
    label: '女神內衣睡眠舒適腳本',
    description: '解決居家睡覺胸型外擴與不舒適的問題，凸顯無鋼圈卻能穩定包覆。',
    highlights: [
      '用地心引力造成的困擾作開場',
      '展示躺下仍不外擴的對比畫面',
      '強調乳膠面料、隱形支撐帶等材質優勢'
    ],
    defaults: {
      headline: '女神內衣 居家睡眠首選',
      summaryScript: '教育觀眾睡覺也需要穿對內衣，女神內衣兼顧舒適與包覆。',
      targetAudience: '需要居家、睡眠內衣的大胸女性',
      corePromise: '95% 乳膠面料搭配隱形支撐帶，睡覺也能穩穩包覆不跑杯',
      visualTone: '溫柔親暱，穿插卡通示意與實穿對比'
    },
    storyboard: [
      {
        stage: '問題鋪陳',
        narration:
          '其實居家或睡覺也應該穿內衣，因為地心引力會讓胸型下垂、外擴。',
        visuals: '口播搭配外擴、下垂卡通示意圖，字幕提示。',
        assets: '卡通動畫、字幕特效',
        cta: '',
        notes: ''
      },
      {
        stage: '錯誤選擇的不適',
        narration: '可是居家穿內衣真的很不舒服對吧？',
        visuals: '俯視鏡頭，主持人小聲講祕密感。',
        assets: '居家情境畫面',
        cta: '',
        notes: ''
      },
      {
        stage: '產品登場',
        narration: '那是因為妳沒有選對內衣，這款【女神內衣】專為居家與睡眠設計。',
        visuals: '主持人展示產品，近拍杯位與肩帶。',
        assets: '產品細節特寫',
        cta: '',
        notes: ''
      },
      {
        stage: '功能對比',
        narration:
          '沒有鋼圈但聚攏效果超好，平躺也不會外擴，副乳還能收乾淨。',
        visuals: '模特兒前後對比、平躺實測。',
        assets: 'Before/After、舉手轉身畫面',
        cta: '',
        notes: '字幕提示隱形支撐帶與後背不勒肉'
      },
      {
        stage: '材質賣點與 CTA',
        narration: '95% 乳膠面料、彈力佳又不變形，五色任選只要 RM89 包郵。',
        visuals: '材質特寫、五色排開、價格資訊。',
        assets: '顏色陳列、價格圖卡',
        cta: '邀請 Inbox 或門市試穿',
        notes: ''
      }
    ]
  },
  {
    id: 'strapless-1766',
    label: '可拆肩帶 Half Cup 1766',
    description: '針對大胸穿吊帶或禮服易移位的痛點，展示 1766 半杯內衣的穩定度。',
    highlights: [
      '以 80G 模特兒示範抬手、跳動仍穩定',
      '拆解防滑與半杯聚攏設計原理',
      '強調適合吊帶、禮服等穿搭'
    ],
    defaults: {
      headline: '1766 Half Cup 無肩帶穩定術',
      summaryScript: '示範大胸穿著 1766 吊帶內衣的穩定與防滑，推薦禮服必備。',
      targetAudience: '需要吊帶或禮服穿搭的大胸女性',
      corePromise: '可拆肩帶半杯設計，動作再大也不移位',
      visualTone: '自信俐落，強調穩定度實測'
    },
    storyboard: [
      {
        stage: '問題開場',
        narration: '80G 的大胸，吊帶裡到底要穿什麼內衣？',
        visuals: '主持人配音，模特兒展示困擾。',
        assets: '日常吊帶穿搭畫面',
        cta: '',
        notes: ''
      },
      {
        stage: '穩定實測',
        narration: '穿上我們的 1766，抬手大動作完全不移位。',
        visuals: '模特兒抬手、轉身，鏡頭追隨。',
        assets: '動態實測畫面',
        cta: '',
        notes: ''
      },
      {
        stage: '防滑原理',
        narration: '防滑矽膠與加寬側翼設計，跳動也不怕滑落。',
        visuals: '模特兒跳動，搭配結構示意。',
        assets: '產品內裏、防滑條特寫',
        cta: '',
        notes: ''
      },
      {
        stage: '聚攏挺拔',
        narration: '半杯聚攏設計，胸型特別挺，不壓不勒。',
        visuals: '普通內衣 vs 1766 差異對比。',
        assets: '側身與正面對比圖',
        cta: '',
        notes: ''
      },
      {
        stage: '穿搭 CTA',
        narration: '四個顏色任選，吊帶、禮服必備。要試穿直接來門市或線上私訊。',
        visuals: '四色平鋪、主持人對鏡頭收尾。',
        assets: '顏色展示、CTA 字幕',
        cta: '邀請門市或私訊預約',
        notes: ''
      }
    ]
  },
  {
    id: 'minimize-6889',
    label: '大胸顯小 6889',
    description: '協助大胸女孩顯瘦有型，強調減壓網紗與穩定支撐。',
    highlights: [
      '前後對比展現顯瘦效果',
      '講解透氣壓力網紗與雙壓邊優勢',
      '提醒內建支撐與防露點設計'
    ],
    defaults: {
      headline: '6889 大胸顯小內衣',
      summaryScript: '示範選對內衣後的顯瘦效果，強調透氣與穩定支撐。',
      targetAudience: '想顯瘦又怕悶熱的大胸女性',
      corePromise: '透氣壓力網紗讓大胸顯小、無痕又不悶熱',
      visualTone: '活潑有自信，對比清楚'
    },
    storyboard: [
      {
        stage: '自我介紹',
        narration: '平時的我，只要選對內衣就能維持可可愛愛的比例。',
        visuals: '主持人/模特兒穿著 6889 自信展示。',
        assets: '日常穿搭畫面',
        cta: '',
        notes: ''
      },
      {
        stage: '錯誤示範',
        narration: '但一旦選錯內衣，就會虎背熊腰、臃腫顯胖。',
        visuals: '普通內衣對比，突出臃腫感。',
        assets: 'Before 畫面',
        cta: '',
        notes: ''
      },
      {
        stage: '產品亮點',
        narration: '6889 顯小內衣，胸前兩坨直接鋪平，後背脂肪也被收順。',
        visuals: '模特兒對著鏡頭講解、產品細節特寫。',
        assets: '透氣網紗、無痕雙壓邊畫面',
        cta: '',
        notes: ''
      },
      {
        stage: '舒適支撐',
        narration: '內建支撐，抬手也不位移，還附 Nipple 墊不用怕露點。',
        visuals: '模特兒抬手、旋轉，內部結構特寫。',
        assets: '支撐架構、Nipple 墊',
        cta: '',
        notes: ''
      },
      {
        stage: '收尾 CTA',
        narration: '一共多色選擇，價格資訊提醒，有興趣的直接私訊我們。',
        visuals: '顏色排開、主持人收尾。',
        assets: '顏色/價格圖卡',
        cta: '邀請後台私訊或門市試穿',
        notes: ''
      }
    ]
  },
  {
    id: 'vest-bra',
    label: '收副乳內衣背心',
    description: '為不愛穿內衣但需要支撐的族群設計，展示背心剪裁與搭配方式。',
    highlights: [
      '強調加寬設計與副乳收緊效果',
      '示範可機洗且不走樣的便利性',
      '給出多種穿搭靈感與優惠組合'
    ],
    defaults: {
      headline: '收副乳內衣背心',
      summaryScript: '主打不喜歡傳統內衣的大胸族群，背心版型也能有支撐與美型。',
      targetAudience: '想收副乳又不想穿內衣的女性',
      corePromise: '一件背心搞定副乳、支撐與穿搭，還能直接機洗',
      visualTone: '生活感分享，搭配多套穿搭示範'
    },
    storyboard: [
      {
        stage: '需求點出',
        narration: '如果妳大胸、有副乳又不喜歡穿內衣，這件背心一定要帶回家。',
        visuals: '主持人拿著產品對鏡頭說話。',
        assets: '產品展示',
        cta: '',
        notes: ''
      },
      {
        stage: '剪裁重點',
        narration: '側邊加寬設計，副乳穿上就被收得服服貼貼。',
        visuals: '鏡頭帶到側邊剪裁，主持人比劃。',
        assets: '模特兒穿著特寫',
        cta: '',
        notes: ''
      },
      {
        stage: '便利性',
        narration: '整件背心可以直接丟洗衣機，不會走樣。',
        visuals: '主持人卷起背心放入洗衣籃。',
        assets: '生活化插畫或動態',
        cta: '',
        notes: ''
      },
      {
        stage: '穩定實測',
        narration: '支撐力很好，抬手、大動作都不移位。',
        visuals: '模特兒舉手、扭動，小跳示範。',
        assets: '下圍特寫',
        cta: '',
        notes: ''
      },
      {
        stage: '穿搭靈感與 CTA',
        narration: '三個顏色任選，三件只要 RM159 包郵，單穿配長褲或搭外套都好看。',
        visuals: '模特兒不同穿搭展示，最後排開三色。',
        assets: '穿搭照、價格圖卡',
        cta: '提醒限時優惠與包郵資訊',
        notes: ''
      }
    ]
  }
]

const props = defineProps({
  clientId: {
    type: String,
    required: true
  },
  recordId: {
    type: String,
    required: true
  }
})

const router = useRouter()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const idea = ref(null)
const permissionError = ref(false)
const errorMessage = ref('')

const form = reactive({
  summaryScript: '',
  headline: '',
  dialogue: '',
  keyLines: '',
  feedback: '',
  targetAudience: '',
  corePromise: '',
  visualTone: '',
  templateId: '',
  storyboard: [],
  firstParagraph: ''
})

const selectedTemplateId = ref('')

const currentTemplate = computed(() =>
  scenarioTemplates.find((template) => template.id === selectedTemplateId.value) || null
)

const normalizeScene = (scene = {}) => ({
  stage: scene.stage || '',
  narration: scene.narration || '',
  visuals: scene.visuals || '',
  assets: scene.assets || '',
  cta: scene.cta || '',
  notes: scene.notes || ''
})

const createEmptyScene = () => ({
  stage: '',
  narration: '',
  visuals: '',
  assets: '',
  cta: '',
  notes: ''
})

const hasStoryboardContent = (storyboard = []) =>
  storyboard.some((scene) =>
    [scene.stage, scene.narration, scene.visuals, scene.assets, scene.cta, scene.notes]
      .join('')
      .trim()
  )

const legacyScenesFromIdea = (data = {}) => {
  const scenes = []
  if (data.firstParagraph) {
    scenes.push({
      stage: '開場',
      narration: data.firstParagraph,
      visuals: '',
      assets: '',
      cta: '',
      notes: ''
    })
  }
  if (data.dialogue) {
    scenes.push({
      stage: '主要講稿',
      narration: data.dialogue,
      visuals: '',
      assets: '',
      cta: '',
      notes: '此段為舊資料轉換，請依新格式調整'
    })
  }
  if (!scenes.length) {
    scenes.push(createEmptyScene())
  }
  return scenes
}

const assignForm = (data) => {
  form.summaryScript = data.summaryScript || ''
  form.headline = data.headline || ''
  form.dialogue = data.dialogue || ''
  form.keyLines = data.keyLines || ''
  form.feedback = data.feedback || ''
  form.targetAudience = data.targetAudience || ''
  form.corePromise = data.corePromise || ''
  form.visualTone = data.visualTone || ''
  form.templateId = data.templateId || ''
  form.firstParagraph = data.firstParagraph || ''
  if (Array.isArray(data.storyboard) && data.storyboard.length) {
    form.storyboard = data.storyboard.map((scene) => normalizeScene(scene))
  } else {
    form.storyboard = legacyScenesFromIdea(data)
  }
  selectedTemplateId.value = form.templateId || ''
}

const loadDetail = async () => {
  loading.value = true
  permissionError.value = false
  errorMessage.value = ''
  try {
    const data = await getScriptIdea(props.clientId, props.recordId)
    idea.value = data
    assignForm(data)
    console.info('[ScriptIdeasDetail] 已載入腳本詳情', {
      clientId: props.clientId,
      ideaId: props.recordId
    })
  } catch (error) {
    if (error?.response?.status === 403) {
      permissionError.value = true
      errorMessage.value = '請聯絡管理者開啟腳本創意檢視權限。'
      idea.value = null
      console.warn('[ScriptIdeasDetail] 檢視腳本詳情權限不足', error)
    } else {
      toast.add({ severity: 'error', summary: '載入失敗', detail: '無法取得腳本詳情', life: 3000 })
      console.error('[ScriptIdeasDetail] 載入腳本詳情失敗', error)
    }
  } finally {
    loading.value = false
  }
}

const storyboardPayload = () =>
  form.storyboard
    .map((scene) => normalizeScene(scene))
    .filter((scene) => hasStoryboardContent([scene]))

const buildPayload = () => {
  const normalizedScenes = storyboardPayload()
  const firstNarration =
    normalizedScenes.find((scene) => scene.narration.trim())?.narration.split('\n')[0] || ''
  const payload = {
    summaryScript: form.summaryScript,
    headline: form.headline,
    dialogue: form.dialogue,
    keyLines: form.keyLines,
    feedback: form.feedback,
    targetAudience: form.targetAudience,
    corePromise: form.corePromise,
    visualTone: form.visualTone,
    templateId: form.templateId,
    storyboard: JSON.stringify(normalizedScenes),
    firstParagraph: firstNarration
  }
  return payload
}

const save = async () => {
  saving.value = true
  try {
    await updateScriptIdea(props.clientId, props.recordId, buildPayload())
    toast.add({ severity: 'success', summary: '已儲存', detail: '腳本詳情更新成功', life: 2500 })
    await loadDetail()
    console.info('[ScriptIdeasDetail] 已儲存腳本詳情', {
      clientId: props.clientId,
      ideaId: props.recordId,
      sceneCount: form.storyboard.length
    })
  } catch (error) {
    if (error?.response?.status === 403) {
      permissionError.value = true
      errorMessage.value = '請聯絡管理者開啟腳本創意檢視權限。'
      toast.add({ severity: 'warn', summary: '無權限', detail: '您沒有腳本創意的編輯權限', life: 3000 })
      console.warn('[ScriptIdeasDetail] 儲存腳本詳情權限不足', error)
    } else {
      toast.add({ severity: 'error', summary: '儲存失敗', detail: '請稍後再試', life: 3000 })
      console.error('[ScriptIdeasDetail] 儲存腳本詳情失敗', error)
    }
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push({ name: 'ScriptIdeasRecords', params: { clientId: props.clientId } })
}

const addScene = () => {
  form.storyboard.push(createEmptyScene())
}

const removeScene = (index) => {
  if (index < 0 || index >= form.storyboard.length) return
  form.storyboard.splice(index, 1)
}

const moveScene = (from, to) => {
  if (to < 0 || to >= form.storyboard.length) return
  const [scene] = form.storyboard.splice(from, 1)
  form.storyboard.splice(to, 0, scene)
}

const applyTemplate = () => {
  if (!currentTemplate.value) {
    toast.add({ severity: 'info', summary: '未選擇模板', detail: '請先選擇想要套用的情境模板', life: 2500 })
    return
  }
  if (hasStoryboardContent(form.storyboard)) {
    const confirmed = window.confirm('套用模板會覆蓋目前故事板段落，是否繼續？')
    if (!confirmed) return
  }
  const template = currentTemplate.value
  form.templateId = template.id
  form.storyboard = template.storyboard.map((scene) => ({ ...scene }))
  if (!form.headline.trim()) {
    form.headline = template.defaults.headline
  }
  if (!form.summaryScript.trim()) {
    form.summaryScript = template.defaults.summaryScript
  }
  if (!form.targetAudience.trim()) {
    form.targetAudience = template.defaults.targetAudience
  }
  if (!form.corePromise.trim()) {
    form.corePromise = template.defaults.corePromise
  }
  if (!form.visualTone.trim()) {
    form.visualTone = template.defaults.visualTone
  }
  form.firstParagraph = template.storyboard.find((scene) => scene.narration)?.narration || ''
  toast.add({ severity: 'success', summary: '模板已套用', detail: `已套用「${template.label}」`, life: 2500 })
}

watch(
  () => [props.clientId, props.recordId],
  () => {
    loadDetail()
  }
)

watch(
  () => form.storyboard.map((scene) => scene.narration),
  (narrations) => {
    const first = narrations.find((text) => (text || '').trim())
    if (first) {
      form.firstParagraph = first.split('\n')[0]
      return
    }
    form.firstParagraph = ''
  }
)

watch(
  () => form.templateId,
  (newValue) => {
    if (!newValue) {
      selectedTemplateId.value = ''
      return
    }
    const exists = scenarioTemplates.some((template) => template.id === newValue)
    selectedTemplateId.value = exists ? newValue : ''
  }
)

onMounted(loadDetail)
</script>

<style scoped>
.script-ideas-detail {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.loading {
  text-align: center;
  color: #6b7280;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-card {
  height: 100%;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 600;
  color: #374151;
}

.field--wide {
  grid-column: 1 / -1;
}

.template-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 1rem;
}

.template-preview {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.template-preview h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.template-description {
  margin: 0 0 0.75rem;
  color: #4b5563;
}

.template-highlights {
  margin: 0;
  padding-left: 1.25rem;
  color: #374151;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.storyboard {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.storyboard__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.storyboard__hint {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.storyboard__empty {
  color: #6b7280;
  font-style: italic;
}

.storyboard__list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.scene-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scene-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.scene-item__header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.scene-item__actions {
  display: inline-flex;
  gap: 0.25rem;
}

.scene-item__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.permission-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  text-align: center;
  color: #6b7280;
}

.permission-error i {
  font-size: 2rem;
  color: #ef4444;
}

.permission-error h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}

.permission-error p {
  margin: 0;
  max-width: 420px;
}

@media (max-width: 768px) {
  .script-ideas-detail {
    padding: 1.5rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
