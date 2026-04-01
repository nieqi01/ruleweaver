<template>
  <div class="ai-center">
    <header class="page-header">
      <h1>AI 灵感中心</h1>
      <p class="subtitle">内置 Kimi AI，无需配置即可使用</p>
    </header>

    <template>
      <!-- 功能标签页 -->
      <div class="ai-tabs">
        <button 
          v-for="tab in aiTabs" 
          :key="tab.id"
          class="ai-tab"
          :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id"
        >
          <span>{{ tab.icon }}</span>
          {{ tab.name }}
        </button>
      </div>

      <!-- 规则评估 -->
      <div v-if="currentTab === 'evaluate'" class="ai-panel">
        <div class="panel-header">
          <h3>📝 规则评估</h3>
          <p>选择最多5条规则，AI将从恐怖氛围、逻辑自洽、悖论潜力等维度进行评估</p>
        </div>
        
        <div v-if="rules.length === 0" class="empty-hint">
          <p>暂无规则实体</p>
          <p class="hint">请先在实体库中创建规则</p>
        </div>
        
        <template v-else>
          <div class="rule-selector">
            <label v-for="rule in rules" :key="rule.id" class="rule-checkbox">
              <input 
                type="checkbox" 
                :value="rule.id"
                v-model="selectedRules"
                :disabled="selectedRules.length >= 5 && !selectedRules.includes(rule.id)"
              />
              <span class="rule-name">{{ rule.name }}</span>
              <span class="rule-desc">{{ rule.content || rule.description || '' }}</span>
            </label>
          </div>
          
          <button 
            class="btn btn-primary" 
            @click="evaluateRules"
            :disabled="selectedRules.length === 0 || evaluating"
          >
            <span v-if="evaluating" class="spinner"></span>
            {{ evaluating ? '评估中...' : '开始评估' }}
          </button>
        </template>
        
        <!-- 评估结果 -->
        <div v-if="evaluationResult" class="evaluation-result">
          <h4>评估结果</h4>
          <div class="scores">
            <div class="score-item">
              <span class="score-label">恐怖氛围</span>
              <div class="score-bar">
                <div class="score-fill" :style="{ width: evaluationResult.scores.atmosphere * 10 + '%' }"></div>
              </div>
              <span class="score-value">{{ evaluationResult.scores.atmosphere }}/10</span>
            </div>
            <div class="score-item">
              <span class="score-label">逻辑自洽</span>
              <div class="score-bar">
                <div class="score-fill" :style="{ width: evaluationResult.scores.logic * 10 + '%' }"></div>
              </div>
              <span class="score-value">{{ evaluationResult.scores.logic }}/10</span>
            </div>
            <div class="score-item">
              <span class="score-label">悖论潜力</span>
              <div class="score-bar">
                <div class="score-fill" :style="{ width: evaluationResult.scores.paradox * 10 + '%' }"></div>
              </div>
              <span class="score-value">{{ evaluationResult.scores.paradox }}/10</span>
            </div>
            <div class="score-item">
              <span class="score-label">叙事清晰</span>
              <div class="score-bar">
                <div class="score-fill" :style="{ width: evaluationResult.scores.clarity * 10 + '%' }"></div>
              </div>
              <span class="score-value">{{ evaluationResult.scores.clarity }}/10</span>
            </div>
          </div>
          
          <div v-if="evaluationResult.suggestions?.length > 0" class="suggestions">
            <h5>💡 改进建议</h5>
            <ul>
              <li v-for="(suggestion, idx) in evaluationResult.suggestions" :key="idx">
                {{ suggestion }}
              </li>
            </ul>
          </div>
          
          <div v-if="evaluationResult.risks?.length > 0" class="risks">
            <h5>⚠️ 风险提示</h5>
            <ul>
              <li v-for="(risk, idx) in evaluationResult.risks" :key="idx">
                {{ risk }}
              </li>
            </ul>
          </div>
          
          <div class="result-actions">
            <button class="btn btn-secondary" @click="saveToInspiration">
              💾 保存到灵感库
            </button>
          </div>
        </div>
      </div>

      <!-- 角色生成 -->
      <div v-if="currentTab === 'character'" class="ai-panel">
        <div class="panel-header">
          <h3>👤 角色生成</h3>
          <p>基于规则怪谈氛围，生成具有隐藏身份和伏笔潜力的角色</p>
        </div>
        
        <div class="form-group">
          <label>副本/场景名称（可选）</label>
          <input v-model="contextName" type="text" placeholder="如：废弃医院、午夜地铁..." />
        </div>
        
        <div class="form-group">
          <label>场景描述（可选）</label>
          <textarea v-model="contextDesc" rows="2" placeholder="描述场景氛围、背景设定..." />
        </div>
        
        <button 
          class="btn btn-primary" 
          @click="generateCharacter"
          :disabled="generating"
        >
          <span v-if="generating" class="spinner"></span>
          {{ generating ? '生成中...' : '生成角色' }}
        </button>
        
        <div v-if="generatedCharacter" class="generated-content">
          <div class="character-card">
            <h4>{{ generatedCharacter.name }}</h4>
            <div class="character-meta">
              <span class="tag">{{ generatedCharacter.identity }}</span>
              <span class="tag">{{ generatedCharacter.mbti }}</span>
            </div>
            <p class="character-desc">{{ generatedCharacter.description }}</p>
            
            <div class="character-section">
              <h5>隐藏身份</h5>
              <p>{{ generatedCharacter.secretIdentity }}</p>
            </div>
            
            <div class="character-section">
              <h5>口头禅</h5>
              <p class="quote">"{{ generatedCharacter.catchphrase }}"</p>
            </div>
            
            <div class="character-section">
              <h5>可埋伏笔点</h5>
              <ul>
                <li v-for="(hint, idx) in generatedCharacter.foreshadowHints" :key="idx">
                  {{ hint }}
                </li>
              </ul>
            </div>
            
            <div class="character-section">
              <h5>死亡 Flag</h5>
              <p>{{ generatedCharacter.deathFlag }}</p>
            </div>
          </div>
          
          <div class="result-actions">
            <button class="btn btn-primary" @click="useCharacter">
              ✅ 使用此角色
            </button>
            <button class="btn btn-secondary" @click="saveToInspiration">
              💾 保存到灵感库
            </button>
          </div>
        </div>
      </div>

      <!-- 规则生成 -->
      <div v-if="currentTab === 'rule'" class="ai-panel">
        <div class="panel-header">
          <h3>📜 规则生成</h3>
          <p>生成具有细思极恐感和悖论潜力的怪谈规则</p>
        </div>
        
        <div class="form-group">
          <label>副本/场景名称（可选）</label>
          <input v-model="contextName" type="text" placeholder="如：废弃医院、午夜地铁..." />
        </div>
        
        <div class="form-group">
          <label>规则主题（可选）</label>
          <input v-model="ruleTheme" type="text" placeholder="如：镜子、时间、食物..." />
        </div>
        
        <div class="form-group">
          <label>现有规则参考（可选）</label>
          <textarea v-model="existingRulesText" rows="2" placeholder="输入已有规则，用逗号分隔..." />
        </div>
        
        <button 
          class="btn btn-primary" 
          @click="generateRule"
          :disabled="generating"
        >
          <span v-if="generating" class="spinner"></span>
          {{ generating ? '生成中...' : '生成规则' }}
        </button>
        
        <div v-if="generatedRule" class="generated-content">
          <div class="rule-card">
            <h4>{{ generatedRule.name }}</h4>
            <div class="rule-section">
              <label>触发条件</label>
              <p>{{ generatedRule.triggerCondition }}</p>
            </div>
            <div class="rule-section">
              <label>违反惩罚</label>
              <p>{{ generatedRule.punishment }}</p>
            </div>
            <div class="rule-analysis">
              <h5>设计分析</h5>
              <p>{{ generatedRule.analysis }}</p>
            </div>
          </div>
          
          <div class="result-actions">
            <button class="btn btn-primary" @click="useRule">
              ✅ 使用此规则
            </button>
            <button class="btn btn-secondary" @click="saveToInspiration">
              💾 保存到灵感库
            </button>
          </div>
        </div>
      </div>

      <!-- 灵感库 -->
      <div v-if="currentTab === 'inspiration'" class="ai-panel">
        <div class="panel-header">
          <h3>💡 灵感库</h3>
          <p>查看历史 AI 生成内容</p>
        </div>
        
        <div class="inspiration-list">
          <div v-for="item in inspirationList" :key="item.id" class="inspiration-item">
            <div class="inspiration-header">
              <span class="inspiration-type">{{ getInspirationTypeLabel(item.evalType) }}</span>
              <span class="inspiration-date">{{ formatDate(item.createdAt) }}</span>
            </div>
            <div class="inspiration-content">
              <pre>{{ JSON.stringify(item.generatedContent || item.suggestions, null, 2) }}</pre>
            </div>
            <div class="inspiration-actions">
              <button class="btn btn-sm" @click="copyInspiration(item)">复制</button>
              <button class="btn btn-sm btn-danger" @click="deleteInspiration(item.id)">删除</button>
            </div>
          </div>
        </div>
        
        <div v-if="inspirationList.length === 0" class="empty-state small">
          <p>暂无灵感记录</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEntityStore } from '../../stores/entityStore'
import { useNovelStore } from '../../stores/novelStore'
import { db, EntityType, EntityStatus } from '../../db'
import { callKimiAPI } from '../../ai/kimi'

const entityStore = useEntityStore()
const novelStore = useNovelStore()

const currentTab = ref('evaluate')
const evaluating = ref(false)
const generating = ref(false)
const selectedRules = ref([])
const evaluationResult = ref(null)
const generatedCharacter = ref(null)
const generatedRule = ref(null)
const ruleTheme = ref('')
const contextName = ref('')
const contextDesc = ref('')
const existingRulesText = ref('')
const inspirationList = ref([])

const aiTabs = [
  { id: 'evaluate', name: '规则评估', icon: '📝' },
  { id: 'character', name: '角色生成', icon: '👤' },
  { id: 'rule', name: '规则生成', icon: '📜' },
  { id: 'inspiration', name: '灵感库', icon: '💡' }
]

const rules = computed(() => entityStore.rules)

onMounted(() => {
  loadInspiration()
  entityStore.loadEntities()
})

async function loadInspiration() {
  inspirationList.value = await db.aiEvaluations
    .orderBy('createdAt')
    .reverse()
    .toArray()
}

async function evaluateRules() {
  if (selectedRules.value.length === 0) return
  
  evaluating.value = true
  const selectedRuleData = rules.value.filter(r => selectedRules.value.includes(r.id))
  
  try {
    const result = await callKimiAPI('evaluateRules', {
      rules: selectedRuleData,
      instanceName: contextName.value || '规则怪谈场景'
    })
    
    evaluationResult.value = result
    
    // 保存到数据库
    await db.aiEvaluations.add({
      entityId: selectedRules.value[0],
      evalType: 'rule_assessment',
      scores: result.scores,
      suggestions: result.suggestions,
      risks: result.risks,
      createdAt: Date.now(),
      isUsed: false
    })
    
    loadInspiration()
  } catch (err) {
    alert('评估失败：' + err.message)
  } finally {
    evaluating.value = false
  }
}

async function generateCharacter() {
  generating.value = true
  
  try {
    const result = await callKimiAPI('generateCharacter', {
      instanceName: contextName.value || '规则怪谈场景',
      instanceDesc: contextDesc.value || '中式恐怖风格的规则怪谈场景'
    })
    
    generatedCharacter.value = result
  } catch (err) {
    alert('生成失败：' + err.message)
  } finally {
    generating.value = false
  }
}

async function generateRule() {
  generating.value = true
  
  try {
    const existingRules = existingRulesText.value 
      ? existingRulesText.value.split(/[,，]/).map(s => s.trim()).filter(Boolean)
      : []
    
    const result = await callKimiAPI('generateRule', {
      instanceName: contextName.value || '规则怪谈场景',
      existingRules,
      theme: ruleTheme.value
    })
    
    generatedRule.value = result
  } catch (err) {
    alert('生成失败：' + err.message)
  } finally {
    generating.value = false
  }
}

async function useCharacter() {
  if (!generatedCharacter.value) return
  
  if (!novelStore.currentNovel) {
    alert('请先选择或创建小说')
    return
  }
  
  await entityStore.createEntity({
    type: EntityType.ROLE,
    name: generatedCharacter.value.name,
    description: generatedCharacter.value.description,
    status: EntityStatus.ALIVE,
    novelId: novelStore.currentNovel.id,
    identity: generatedCharacter.value.identity,
    secretIdentity: generatedCharacter.value.secretIdentity,
    mbti: generatedCharacter.value.mbti,
    catchphrase: generatedCharacter.value.catchphrase,
    deathFlag: generatedCharacter.value.deathFlag,
    foreshadowHints: generatedCharacter.value.foreshadowHints
  })
  
  alert('角色已添加到实体库！')
  generatedCharacter.value = null
}

async function useRule() {
  if (!generatedRule.value) return
  
  if (!novelStore.currentNovel) {
    alert('请先选择或创建小说')
    return
  }
  
  await entityStore.createEntity({
    type: EntityType.RULE,
    name: generatedRule.value.name,
    description: generatedRule.value.analysis,
    status: EntityStatus.ACTIVE,
    novelId: novelStore.currentNovel.id,
    content: generatedRule.value.triggerCondition,
    violationConsequence: generatedRule.value.punishment,
    dangerLevel: 'B'
  })
  
  alert('规则已添加到实体库！')
  generatedRule.value = null
}

async function saveToInspiration() {
  // 已经自动保存了
  alert('已保存到灵感库！')
}

function getInspirationTypeLabel(type) {
  const map = {
    'rule_assessment': '规则评估',
    'character_gen': '角色生成',
    'rule_gen': '规则生成'
  }
  return map[type] || type
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString()
}

async function copyInspiration(item) {
  const content = JSON.stringify(item.generatedContent || item.suggestions, null, 2)
  await navigator.clipboard.writeText(content)
  alert('已复制到剪贴板！')
}

async function deleteInspiration(id) {
  if (!confirm('确定删除此灵感？')) return
  await db.aiEvaluations.delete(id)
  loadInspiration()
}
</script>

<style scoped>
.ai-center {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
}

.api-key-section {
  max-width: 480px;
  margin: 0 auto;
}

.api-key-section .card {
  padding: 24px;
}

.api-key-section h3 {
  margin-bottom: 12px;
}

.api-key-section p {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.api-key-section input {
  margin-bottom: 8px;
}

.hint {
  margin-bottom: 16px;
}

.hint small {
  color: var(--text-secondary);
}

.ai-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.ai-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s;
}

.ai-tab:hover {
  border-color: var(--accent);
}

.ai-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.ai-panel {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
}

.panel-header {
  margin-bottom: 20px;
}

.panel-header h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.panel-header p {
  color: var(--text-secondary);
  font-size: 14px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.empty-hint {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty-hint .hint {
  font-size: 13px;
  margin-top: 8px;
  opacity: 0.7;
}

.rule-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.rule-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  cursor: pointer;
}

.rule-checkbox input {
  width: auto;
}

.rule-name {
  font-weight: 500;
}

.rule-desc {
  color: var(--text-secondary);
  font-size: 13px;
  margin-left: auto;
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.evaluation-result {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.evaluation-result h4 {
  margin-bottom: 16px;
}

.scores {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-label {
  width: 80px;
  font-size: 14px;
}

.score-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.score-value {
  width: 50px;
  text-align: right;
  font-size: 14px;
}

.suggestions,
.risks {
  background: var(--bg-tertiary);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.suggestions h5,
.risks h5 {
  margin-bottom: 12px;
}

.suggestions ul,
.risks ul {
  padding-left: 20px;
}

.suggestions li,
.risks li {
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.result-actions {
  display: flex;
  gap: 12px;
}

.generated-content {
  margin-top: 20px;
}

.character-card,
.rule-card {
  background: var(--bg-tertiary);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.character-card h4,
.rule-card h4 {
  font-size: 18px;
  margin-bottom: 12px;
}

.character-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tag {
  padding: 4px 10px;
  background: var(--bg-secondary);
  border-radius: 12px;
  font-size: 12px;
}

.character-desc {
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.6;
}

.character-section,
.rule-section {
  margin-bottom: 16px;
}

.character-section h5,
.rule-section label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  display: block;
}

.quote {
  font-style: italic;
  color: var(--accent);
}

.character-section ul {
  padding-left: 20px;
}

.character-section li {
  margin-bottom: 6px;
  color: var(--text-secondary);
}

.inspiration-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inspiration-item {
  background: var(--bg-tertiary);
  padding: 16px;
  border-radius: 8px;
}

.inspiration-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.inspiration-type {
  padding: 4px 10px;
  background: var(--accent);
  border-radius: 12px;
  font-size: 12px;
}

.inspiration-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.inspiration-content {
  margin-bottom: 12px;
}

.inspiration-content pre {
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
}

.inspiration-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-state.small {
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: var(--text-primary);
  margin-bottom: 8px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .ai-tabs {
    padding-bottom: 8px;
  }
  
  .score-item {
    flex-wrap: wrap;
  }
  
  .score-label {
    width: 100%;
  }
  
  .rule-desc {
    display: none;
  }
}
</style>
