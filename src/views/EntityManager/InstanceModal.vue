<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <header class="modal-header">
        <h2>新建副本</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </header>
      
      <div class="modal-body">
        <!-- 快速创建选项 -->
        <div class="quick-create-section">
          <label class="section-label">选择创建方式</label>
          
          <div class="quick-options">
            <button 
              type="button"
              class="quick-option-btn"
              :class="{ active: createMode === 'empty' }"
              @click="createMode = 'empty'"
            >
              <span class="option-icon">📄</span>
              <div class="option-content">
                <span class="option-title">空白副本</span>
                <span class="option-desc">创建一个空白副本，稍后手动添加实体</span>
              </div>
            </button>
            
            <button 
              type="button"
              class="quick-option-btn"
              :class="{ active: createMode === 'template' }"
              @click="createMode = 'template'"
            >
              <span class="option-icon">📋</span>
              <div class="option-content">
                <span class="option-title">示例副本</span>
                <span class="option-desc">使用预设模板创建示例角色、道具、规则</span>
              </div>
            </button>
            
            <button 
              type="button"
              class="quick-option-btn"
              :class="{ active: createMode === 'ai', disabled: !hasApiKey }"
              @click="hasApiKey && (createMode = 'ai')"
              :disabled="!hasApiKey"
            >
              <span class="option-icon">🤖</span>
              <div class="option-content">
                <span class="option-title">AI 生成</span>
                <span class="option-desc">
                  {{ hasApiKey ? '输入想法，AI自动生成完整副本' : '需要先在AI中心设置API Key' }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- AI 生成输入框 -->
        <div v-if="createMode === 'ai'" class="ai-input-section">
          <div class="form-group">
            <label>描述你想要的副本 <span class="required">*</span></label>
            <textarea 
              v-model="aiPrompt" 
              rows="4"
              placeholder="例如：一所废弃的中学，有着诡异的校规。主角是一个转学生，发现学校里有很多奇怪的现象。有一个神秘的校医知道很多秘密..."
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
            <label class="checkbox-label">
              <input type="checkbox" v-model="aiOptions.includeMaps" />
              <span>生成地图</span>
            </label>
          </div>
        </div>

        <!-- 副本属性（可选项） -->
        <div class="instance-attributes">
          <div class="section-header" @click="showAttributes = !showAttributes">
            <span>副本属性（可选）</span>
            <span class="expand-icon">{{ showAttributes ? '▼' : '▶' }}</span>
          </div>
          
          <div v-if="showAttributes" class="attributes-content">
            <div class="form-group">
              <label>副本名称</label>
              <input 
                v-model="form.name" 
                type="text" 
                placeholder="留空则使用AI生成的名称或默认名称"
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>危险等级</label>
                <select v-model="form.dangerLevel">
                  <option value="S">S - 绝境</option>
                  <option value="A">A - 高危</option>
                  <option value="B">B - 危险</option>
                  <option value="C">C - 警戒</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>存活条件摘要</label>
              <input 
                v-model="form.survivalCondition" 
                type="text" 
                placeholder="如：找到出口并存活7天"
              />
            </div>
            
            <div class="form-group">
              <label>副本背景</label>
              <textarea 
                v-model="form.description" 
                rows="3"
                placeholder="描述副本的背景故事、氛围、核心恐怖元素..."
              />
            </div>
          </div>
        </div>
      </div>
      
      <footer class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="$emit('close')">取消</button>
        
        <!-- 空白副本和示例副本直接创建 -->
        <button 
          v-if="createMode !== 'ai'"
          type="button"
          class="btn btn-primary" 
          @click="onSubmit"
        >
          创建
        </button>
        
        <!-- AI模式需要输入提示词 -->
        <button 
          v-else
          type="button"
          class="btn btn-ai" 
          @click="generateWithAI"
          :disabled="!aiPrompt.trim() || generating"
        >
          <span v-if="generating" class="spinner"></span>
          {{ generating ? '生成中...' : '✨ AI生成并创建' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['close', 'save', 'generate'])

const hasApiKey = computed(() => !!localStorage.getItem('kimi_api_key'))

const createMode = ref('empty') // 'empty', 'template', 'ai'
const showAttributes = ref(false)

const form = ref({
  name: '',
  dangerLevel: 'B',
  survivalCondition: '',
  description: ''
})

const aiPrompt = ref('')
const generating = ref(false)
const aiOptions = ref({
  includeRoles: true,
  includeItems: true,
  includeRules: true,
  includeAbilities: true,
  includeMaps: true
})

function onSubmit() {
  // 空白副本和示例副本直接创建
  emit('save', {
    name: form.value.name || (createMode.value === 'template' ? '示例副本' : '未命名副本'),
    dangerLevel: form.value.dangerLevel,
    survivalCondition: form.value.survivalCondition,
    description: form.value.description,
    useTemplate: createMode.value === 'template'
  })
}

async function generateWithAI() {
  if (!aiPrompt.value.trim() || !hasApiKey.value) return
  
  generating.value = true
  
  emit('generate', {
    name: form.value.name,
    dangerLevel: form.value.dangerLevel,
    survivalCondition: form.value.survivalCondition,
    description: form.value.description,
    aiPrompt: aiPrompt.value,
    aiOptions: aiOptions.value
  })
  
  generating.value = false
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.close-btn:hover {
  background: var(--bg-tertiary);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

/* 快速创建选项 */
.quick-create-section {
  margin-bottom: 20px;
}

.section-label {
  display: block;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.quick-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-option-btn {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--bg-tertiary);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
  width: 100%;
}

.quick-option-btn:hover {
  border-color: var(--border);
}

.quick-option-btn.active {
  border-color: var(--accent);
  background: rgba(233, 69, 96, 0.1);
}

.quick-option-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.option-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-title {
  font-weight: 600;
  font-size: 15px;
}

.option-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* AI 输入区域 */
.ai-input-section {
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.05), rgba(100, 181, 246, 0.05));
  border: 1px solid rgba(233, 69, 96, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.ai-input-section .form-group {
  margin-bottom: 12px;
}

.ai-input-section .form-group:last-child {
  margin-bottom: 0;
}

.required {
  color: var(--danger);
}

.ai-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

/* 副本属性 */
.instance-attributes {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--bg-tertiary);
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
}

.section-header:hover {
  background: var(--bg-secondary);
}

.expand-icon {
  font-size: 12px;
}

.attributes-content {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* 按钮 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}

.btn-ai {
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  color: white;
}

.btn-ai:hover:not(:disabled) {
  opacity: 0.9;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 6px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }
  
  .modal-content {
    border-radius: 16px 16px 0 0;
    max-height: 85vh;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
