<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <!-- 步骤1: 选择创建方式 -->
      <div v-if="step === 1">
        <header class="modal-header">
          <h2>新建副本</h2>
          <button class="btn-close" @click="$emit('close')">×</button>
        </header>

        <div class="modal-body">
          <!-- 创建方式选择 -->
          <div class="create-options">
            <div 
              class="option-card" 
              :class="{ active: createMode === 'empty' }" 
              @click="createMode = 'empty'"
            >
              <div class="option-icon">📄</div>
              <div class="option-title">空白副本</div>
              <div class="option-desc">创建一个空白副本，自行添加实体</div>
            </div>
            <div 
              class="option-card" 
              :class="{ active: createMode === 'template' }" 
              @click="createMode = 'template'"
            >
              <div class="option-icon">📋</div>
              <div class="option-title">示例副本</div>
              <div class="option-desc">使用预设模板快速创建</div>
            </div>
            <div 
              class="option-card" 
              :class="{ active: createMode === 'ai' }" 
              @click="createMode = 'ai'"
            >
              <div class="option-icon">🤖</div>
              <div class="option-title">AI 生成</div>
              <div class="option-desc">输入想法，AI自动生成副本内容</div>
            </div>
          </div>

          <!-- AI输入区域 -->
          <div v-if="createMode === 'ai'" class="ai-section">
            <div class="form-group">
              <label>描述你想要的副本</label>
              <textarea 
                v-model="aiPrompt" 
                rows="4" 
                placeholder="例如：一个废弃的医院，充满诡异的规则，主角需要在午夜前找到出口..."
              />
            </div>
            <div class="ai-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="aiOptions.includeRoles" />
                <span>生成角色</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="aiOptions.includeItems" />
                <span>生成道具</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="aiOptions.includeRules" />
                <span>生成规则</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="aiOptions.includeAbilities" />
                <span>生成诡异能力</span>
              </label>
            </div>
          </div>

          <!-- 可选属性 -->
          <details class="optional-props">
            <summary>副本属性（可选）</summary>
            <div class="form-group">
              <label>副本名称</label>
              <input v-model="form.name" placeholder="留空使用默认名称" />
            </div>
            <div class="form-group">
              <label>危险等级</label>
              <select v-model="form.dangerLevel">
                <option value="S">S级 - 极高危险</option>
                <option value="A">A级 - 高危险</option>
                <option value="B" selected>B级 - 中等危险</option>
                <option value="C">C级 - 低危险</option>
              </select>
            </div>
            <div class="form-group">
              <label>存活条件</label>
              <input v-model="form.survivalCondition" placeholder="存活条件摘要" />
            </div>
            <div class="form-group">
              <label>描述</label>
              <textarea v-model="form.description" rows="3" placeholder="副本背景描述..." />
            </div>
          </details>
        </div>

        <footer class="modal-footer">
          <button class="btn" @click="$emit('close')">取消</button>
          <button 
            class="btn btn-primary" 
            :disabled="createMode === 'ai' && !aiPrompt.trim()"
            @click="onNextStep"
          >
            {{ createMode === 'ai' ? '下一步' : '创建' }}
          </button>
        </footer>
      </div>

      <!-- 步骤2: AI生成确认 -->
      <div v-if="step === 2">
        <header class="modal-header">
          <h2>AI生成预览</h2>
          <button class="btn-close" @click="step = 1">×</button>
        </header>

        <div class="modal-body">
          <div v-if="aiGenerating" class="ai-loading">
            <div class="spinner"></div>
            <p>AI正在生成副本内容...</p>
          </div>
          <div v-else-if="aiResult" class="ai-preview">
            <div class="preview-section">
              <h4>副本信息</h4>
              <p><strong>名称:</strong> {{ aiResult.name }}</p>
              <p><strong>危险等级:</strong> {{ aiResult.dangerLevel }}</p>
              <p><strong>描述:</strong> {{ aiResult.description }}</p>
            </div>
            <div v-if="aiResult.entities && aiResult.entities.length > 0" class="preview-section">
              <h4>生成实体 ({{ aiResult.entities.length }}个)</h4>
              <div class="preview-entities">
                <div v-for="(entity, idx) in aiResult.entities" :key="idx" class="preview-entity">
                  <span class="entity-type">{{ getTypeLabel(entity.type) }}</span>
                  <span class="entity-name">{{ entity.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <button class="btn" @click="step = 1">返回</button>
          <button 
            class="btn btn-primary" 
            :disabled="aiGenerating || !aiResult"
            @click="createWithAI"
          >
            确认创建
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useInstanceStore } from '../../stores/instanceStore'
import { useEntityStore } from '../../stores/entityStore'
import { useNovelStore } from '../../stores/novelStore'
import { DangerLevel, EntityType } from '../../db'
import { generateInstance } from '../../ai/kimi'

const emit = defineEmits(['close', 'created'])

const instanceStore = useInstanceStore()
const entityStore = useEntityStore()
const novelStore = useNovelStore()

const step = ref(1)
const createMode = ref('empty')
const aiPrompt = ref('')
const aiOptions = ref({
  includeRoles: true,
  includeItems: true,
  includeRules: true,
  includeAbilities: false
})
const aiGenerating = ref(false)
const aiResult = ref(null)

const form = ref({
  name: '',
  dangerLevel: DangerLevel.B,
  survivalCondition: '',
  description: ''
})

function getTypeLabel(type) {
  const map = {
    [EntityType.ROLE]: '角色',
    [EntityType.ITEM]: '道具',
    [EntityType.RULE]: '规则',
    [EntityType.ABILITY]: '能力'
  }
  return map[type] || type
}

async function onNextStep() {
  if (createMode.value === 'ai') {
    step.value = 2
    await generateWithAI()
  } else if (createMode.value === 'template') {
    // 使用模板创建
    await createWithTemplate()
  } else {
    // 空白创建
    await createEmpty()
  }
}

async function generateWithAI() {
  aiGenerating.value = true
  aiResult.value = null
  
  try {
    const apiKey = localStorage.getItem('kimi_api_key')
    if (!apiKey) {
      alert('请先设置 API Key')
      aiGenerating.value = false
      return
    }
    
    const result = await generateInstance({
      apiKey,
      prompt: aiPrompt.value,
      options: aiOptions.value
    })
    
    aiResult.value = result
  } catch (error) {
    console.error('AI生成失败:', error)
    alert('AI生成失败: ' + error.message)
  } finally {
    aiGenerating.value = false
  }
}

async function createEmpty() {
  if (!novelStore.currentNovel) {
    alert('请先选择小说')
    return
  }
  
  const name = form.value.name.trim() || '未命名副本'
  
  await instanceStore.createInstance({
    novelId: novelStore.currentNovel.id,
    name,
    dangerLevel: form.value.dangerLevel,
    survivalCondition: form.value.survivalCondition,
    description: form.value.description
  })
  
  emit('created')
}

async function createWithTemplate() {
  if (!novelStore.currentNovel) {
    alert('请先选择小说')
    return
  }
  
  // 示例模板数据
  const templateData = {
    novelId: novelStore.currentNovel.id,
    name: form.value.name.trim() || '示例副本',
    dangerLevel: form.value.dangerLevel,
    survivalCondition: form.value.survivalCondition || '找到出口并存活',
    description: form.value.description || '这是一个示例副本，包含基础的实体配置。'
  }
  
  const instanceId = await instanceStore.createInstance(templateData)
  
  // 创建示例实体并关联
  const exampleEntities = [
    { type: EntityType.ROLE, name: '调查员', status: '存活', description: '主角' },
    { type: EntityType.RULE, name: '不要回头', status: '生效', description: '听到呼唤时千万不要回头', dangerLevel: 'A' },
    { type: EntityType.ITEM, name: '手电筒', status: '完好', description: '照明工具' }
  ]
  
  for (const entityData of exampleEntities) {
    const entityId = await entityStore.createEntity({
      ...entityData,
      novelId: novelStore.currentNovel.id
    })
    await entityStore.addEntityToInstance(entityId, instanceId)
  }
  
  emit('created')
}

async function createWithAI() {
  if (!aiResult.value || !novelStore.currentNovel) return
  
  const instanceId = await instanceStore.createInstance({
    novelId: novelStore.currentNovel.id,
    name: aiResult.value.name || form.value.name || 'AI生成副本',
    dangerLevel: aiResult.value.dangerLevel || form.value.dangerLevel,
    survivalCondition: aiResult.value.survivalCondition || form.value.survivalCondition,
    description: aiResult.value.description || form.value.description
  })
  
  // 创建AI生成的实体
  if (aiResult.value.entities && aiResult.value.entities.length > 0) {
    for (const entityData of aiResult.value.entities) {
      const entityId = await entityStore.createEntity({
        ...entityData,
        novelId: novelStore.currentNovel.id
      })
      await entityStore.addEntityToInstance(entityId, instanceId)
    }
  }
  
  emit('created')
}
</script>

<style scoped>
.modal-content {
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  margin: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: 20px;
  color: var(--text-primary);
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
}

.modal-body {
  padding: 24px;
}

/* 创建选项 */
.create-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.option-card {
  padding: 24px 16px;
  border: 2px solid var(--border);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: var(--bg-tertiary);
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.option-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.option-card.active {
  border-color: var(--accent);
  background: rgba(78, 204, 163, 0.1);
}

.option-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.option-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.option-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* AI区域 */
.ai-section {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.ai-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

/* 可选属性 */
.optional-props {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  background: var(--bg-tertiary);
}

.optional-props summary {
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}

.optional-props[open] summary {
  margin-bottom: 16px;
}

/* 表单 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

/* AI生成预览 */
.ai-loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ai-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-section {
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 16px;
}

.preview-section h4 {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.preview-section p {
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.preview-entities {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-entity {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.preview-entity .entity-type {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  color: var(--text-secondary);
}

.preview-entity .entity-name {
  font-size: 13px;
  color: var(--text-primary);
}

/* 底部按钮 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .modal-content {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .create-options {
    grid-template-columns: 1fr;
  }
  
  .ai-options {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
