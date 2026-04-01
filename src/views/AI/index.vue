<template>
  <div class="ai-page">
    <div v-if="!novelStore.hasNovel" class="empty-state">
      <div class="empty-icon">🤖</div>
      <h3 class="empty-title">请先创建小说</h3>
      <router-link to="/" class="btn btn-primary">去创建小说</router-link>
    </div>
    <div v-else class="page-container">
      <h1 class="page-title">AI助手</h1>
      <p class="page-subtitle">AI生成灵感、润色文章</p>
      
      <div class="ai-grid">
        <div class="ai-card" @click="activeFeature = 'inspiration'">
          <div class="ai-icon">💡</div>
          <h3>灵感生成</h3>
          <p>生成剧情、角色、规则灵感</p>
        </div>
        <div class="ai-card" @click="activeFeature = 'polish'">
          <div class="ai-icon">✨</div>
          <h3>文章润色</h3>
          <p>优化文字表达</p>
        </div>
      </div>
      
      <div v-if="activeFeature" class="ai-panel">
        <div v-if="activeFeature === 'inspiration'">
          <h3>生成灵感</h3>
          <select v-model="inspirationType">
            <option value="plot">剧情</option>
            <option value="character">角色</option>
            <option value="rule">规则</option>
          </select>
          <textarea v-model="inspirationContext" rows="3" placeholder="描述你的想法..." />
          <button class="btn btn-primary" @click="generateInspiration" :disabled="generating">
            {{ generating ? '生成中...' : '生成' }}
          </button>
          <div v-if="inspirationResult" class="result">
            <pre>{{ JSON.stringify(inspirationResult, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNovelStore } from '../../stores/novelStore'
import { generateInspiration as generateInspirationAI } from '../../services/aiService'

const novelStore = useNovelStore()

const activeFeature = ref('')
const inspirationType = ref('plot')
const inspirationContext = ref('')
const generating = ref(false)
const inspirationResult = ref(null)

async function generateInspiration() {
  generating.value = true
  try {
    inspirationResult.value = await generateInspirationAI(inspirationType.value, inspirationContext.value)
  } catch (e) {
    alert('生成失败: ' + e.message)
  }
  generating.value = false
}
</script>

<style scoped>
.ai-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.ai-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  border: 1px solid var(--border);
  transition: all 0.3s;
}

.ai-card:hover {
  border-color: var(--accent);
}

.ai-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.ai-panel {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 24px;
}

.result {
  margin-top: 16px;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  overflow-x: auto;
}

pre {
  font-size: 13px;
  line-height: 1.5;
}
</style>
