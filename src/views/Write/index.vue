<template>
  <div class="write-page">
    <!-- 无小说状态 -->
    <div v-if="!novelStore.hasNovel" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3 class="empty-title">请先创建小说</h3>
      <p class="empty-desc">创建小说后才能开始写作</p>
      <router-link to="/" class="btn btn-primary">去创建小说</router-link>
    </div>
    
    <!-- 有小说状态 -->
    <template v-else>
      <!-- 章节选择栏 -->
      <div class="chapter-bar">
        <div class="chapter-select">
          <select :value="chapterStore.currentChapter?.id || ''" @change="onChapterChange">
            <option value="">选择章节...</option>
            <option v-for="ch in chapterStore.sortedChapters" :key="ch.id" :value="ch.id">
              第{{ ch.number }}章 {{ ch.title || '未命名' }}
            </option>
          </select>
        </div>
        <button class="btn btn-primary btn-sm" @click="createNewChapter">
          <span>+</span> 新建章节
        </button>
      </div>
      
      <!-- 编辑器 -->
      <div class="editor-container">
        <!-- 无选中章节 -->
        <div v-if="!chapterStore.currentChapter" class="empty-editor">
          <div class="empty-icon">✍️</div>
          <h3>开始写作</h3>
          <p>选择章节或创建新章节</p>
        </div>
        
        <!-- 编辑器 -->
        <template v-else>
          <div class="editor-header">
            <div class="chapter-inputs">
              <input 
                type="number" 
                v-model.number="editForm.number"
                class="chapter-number"
                min="1"
              />
              <span class="chapter-label">章</span>
              <input 
                type="text" 
                v-model="editForm.title"
                class="chapter-title"
                placeholder="章节标题"
              />
            </div>
            <div class="editor-tools">
              <span class="word-count">{{ wordCount }} 字</span>
              <button class="btn btn-ghost btn-sm" @click="showAiPanel = !showAiPanel">
                🤖 AI
              </button>
              <button class="btn btn-primary btn-sm" @click="saveChapter" :disabled="!hasChanges">
                保存
              </button>
            </div>
          </div>
          
          <div class="editor-body">
            <textarea 
              v-model="editForm.content"
              class="editor-textarea"
              placeholder="开始写作..."
              @input="onContentChange"
            />
          </div>
          
          <!-- AI 辅助面板 -->
          <div v-if="showAiPanel" class="ai-panel">
            <div class="ai-tabs">
              <button 
                v-for="tab in aiTabs" 
                :key="tab.key"
                class="ai-tab"
                :class="{ active: activeAiTab === tab.key }"
                @click="activeAiTab = tab.key"
              >
                {{ tab.name }}
              </button>
            </div>
            
            <div class="ai-content">
              <!-- 实体识别 -->
              <div v-if="activeAiTab === 'detect'" class="ai-section">
                <p class="ai-desc">AI 自动识别章节中的实体</p>
                <button class="btn btn-primary btn-sm" @click="detectEntities" :disabled="detecting">
                  {{ detecting ? '识别中...' : '开始识别' }}
                </button>
                <div v-if="detectedEntities.length > 0" class="detected-list">
                  <div v-for="entity in detectedEntities" :key="entity.name" class="detected-item">
                    <span class="entity-name">{{ entity.name }}</span>
                    <span class="entity-type">{{ entity.type }}</span>
                    <button class="btn btn-sm" @click="addDetectedEntity(entity)">添加</button>
                  </div>
                </div>
              </div>
              
              <!-- 润色 -->
              <div v-if="activeAiTab === 'polish'" class="ai-section">
                <p class="ai-desc">选择润色风格</p>
                <div class="polish-styles">
                  <button 
                    v-for="style in polishStyles" 
                    :key="style.key"
                    class="style-btn"
                    :class="{ active: selectedStyle === style.key }"
                    @click="selectedStyle = style.key"
                  >
                    {{ style.name }}
                  </button>
                </div>
                <button class="btn btn-primary btn-sm" @click="polishText" :disabled="polishing">
                  {{ polishing ? '润色中...' : '开始润色' }}
                </button>
                <div v-if="polishedText" class="polish-result">
                  <h4>润色结果</h4>
                  <p>{{ polishedText }}</p>
                  <button class="btn btn-sm" @click="applyPolishedText">应用</button>
                </div>
              </div>
              
              <!-- 续写 -->
              <div v-if="activeAiTab === 'continue'" class="ai-section">
                <p class="ai-desc">AI 根据上下文续写</p>
                <button class="btn btn-primary btn-sm" @click="continueStory" :disabled="continuing">
                  {{ continuing ? '续写中...' : '生成续写' }}
                </button>
                <div v-if="continuedText" class="continue-result">
                  <p>{{ continuedText }}</p>
                  <button class="btn btn-sm" @click="applyContinuedText">插入</button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useNovelStore } from '../../stores/novelStore'
import { useChapterStore } from '../../stores/chapterStore'
import { useEntityStore } from '../../stores/entityStore'
import { detectEntities as detectEntitiesAI, polishText, continueStory } from '../../services/aiService'

const novelStore = useNovelStore()
const chapterStore = useChapterStore()
const entityStore = useEntityStore()

// 编辑表单
const editForm = ref({
  number: 1,
  title: '',
  content: ''
})

const hasChanges = ref(false)
const showAiPanel = ref(false)
const activeAiTab = ref('detect')

// AI 状态
const detecting = ref(false)
const detectedEntities = ref([])
const polishing = ref(false)
const selectedStyle = ref('smooth')
const polishedText = ref('')
const continuing = ref(false)
const continuedText = ref('')

const aiTabs = [
  { key: 'detect', name: '实体识别' },
  { key: 'polish', name: '润色' },
  { key: 'continue', name: '续写' }
]

const polishStyles = [
  { key: 'smooth', name: '流畅' },
  { key: 'vivid', name: '生动' },
  { key: 'tense', name: '紧张' }
]

// 字数统计
const wordCount = computed(() => {
  const content = editForm.value.content || ''
  return (content.match(/[\u4e00-\u9fa5]/g) || []).length + 
         (content.match(/[a-zA-Z]+/g) || []).length
})

// 监听章节变化
watch(() => chapterStore.currentChapter, (chapter) => {
  if (chapter) {
    editForm.value = {
      number: chapter.number,
      title: chapter.title || '',
      content: chapter.content || ''
    }
    hasChanges.value = false
  }
}, { immediate: true })

function onChapterChange(e) {
  const chapterId = parseInt(e.target.value)
  const chapter = chapterStore.sortedChapters.find(c => c.id === chapterId)
  chapterStore.setCurrentChapter(chapter || null)
}

async function createNewChapter() {
  const maxNum = chapterStore.sortedChapters.length > 0
    ? Math.max(...chapterStore.sortedChapters.map(c => c.number))
    : 0
  
  const id = await chapterStore.createChapter({
    number: maxNum + 1,
    title: '',
    content: ''
  })
  
  const chapter = chapterStore.chapters.find(c => c.id === id)
  chapterStore.setCurrentChapter(chapter)
}

function onContentChange() {
  hasChanges.value = true
}

async function saveChapter() {
  if (!chapterStore.currentChapter) return
  
  await chapterStore.updateChapter(chapterStore.currentChapter.id, {
    number: editForm.value.number,
    title: editForm.value.title,
    content: editForm.value.content
  })
  
  hasChanges.value = false
}

// AI 功能
async function detectEntities() {
  detecting.value = true
  try {
    const result = await detectEntitiesAI(editForm.value.content, entityStore.entities)
    detectedEntities.value = result.detectedEntities || []
  } catch (e) {
    alert('识别失败: ' + e.message)
  }
  detecting.value = false
}

async function polishTextContent() {
  if (!editForm.value.content) return
  
  polishing.value = true
  try {
    const result = await polishText(editForm.value.content, selectedStyle.value)
    polishedText.value = result.text || result
  } catch (e) {
    alert('润色失败: ' + e.message)
  }
  polishing.value = false
}

async function continueStoryContent() {
  if (!editForm.value.content) return
  
  continuing.value = true
  try {
    const result = await continueStory(editForm.value.content)
    continuedText.value = result.text || result
  } catch (e) {
    alert('续写失败: ' + e.message)
  }
  continuing.value = false
}

function applyPolishedText() {
  editForm.value.content = polishedText.value
  hasChanges.value = true
  polishedText.value = ''
}

function applyContinuedText() {
  editForm.value.content += '\n\n' + continuedText.value
  hasChanges.value = true
  continuedText.value = ''
}

onMounted(() => {
  if (novelStore.hasNovel) {
    chapterStore.loadChapters()
  }
})
</script>

<style scoped>
.write-page {
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
}

.chapter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.chapter-select {
  flex: 1;
  max-width: 300px;
}

.chapter-select select {
  padding: 10px 14px;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.empty-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  gap: 16px;
}

.chapter-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.chapter-number {
  width: 80px;
  text-align: center;
}

.chapter-title {
  flex: 1;
  max-width: 400px;
}

.editor-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.word-count {
  color: var(--text-secondary);
  font-size: 14px;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-textarea {
  flex: 1;
  border: none;
  background: var(--bg-primary);
  padding: 24px;
  font-size: 16px;
  line-height: 1.8;
  resize: none;
  outline: none;
}

/* AI 面板 */
.ai-panel {
  width: 320px;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.ai-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
}

.ai-tab {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
}

.ai-tab.active {
  color: var(--accent);
  border-bottom: 2px solid var(--accent);
}

.ai-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.ai-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.polish-styles {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.style-btn {
  flex: 1;
  padding: 8px;
  background: var(--bg-tertiary);
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
}

.style-btn.active {
  background: var(--accent);
  color: white;
}

.detected-list {
  margin-top: 12px;
}

.detected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  margin-bottom: 8px;
}

.entity-name {
  flex: 1;
}

.entity-type {
  font-size: 12px;
  color: var(--text-secondary);
}

.polish-result,
.continue-result {
  margin-top: 12px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
}

.polish-result h4 {
  margin-bottom: 8px;
  font-size: 14px;
}

.polish-result p,
.continue-result p {
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .chapter-bar {
    padding: 12px 16px;
  }
  
  .editor-header {
    flex-direction: column;
    align-items: stretch;
    padding: 12px 16px;
  }
  
  .chapter-inputs {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chapter-number,
  .chapter-title {
    width: 100%;
    max-width: none;
  }
  
  .ai-panel {
    position: fixed;
    right: 0;
    top: 64px;
    bottom: 64px;
    width: 100%;
    z-index: 50;
  }
}
</style>
