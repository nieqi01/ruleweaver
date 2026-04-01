<template>
  <div class="settings">
    <header class="page-header">
      <h1>设置</h1>
    </header>

    <div class="settings-sections">
      <!-- 数据管理 -->
      <section class="settings-section">
        <h2>💾 数据管理</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <h3>导出世界设定包</h3>
            <p>将所有实体、关系、地图、规则导出为加密文件，用于备份或分享给协作者</p>
          </div>
          <button class="btn btn-secondary" @click="exportData">
            导出
          </button>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <h3>导入世界设定包</h3>
            <p>导入朋友分享的设定包，支持差异对比和合并</p>
          </div>
          <button class="btn btn-secondary" @click="showImportModal = true">
            导入
          </button>
        </div>
        
        <div class="setting-item danger">
          <div class="setting-info">
            <h3>清空所有数据</h3>
            <p>⚠️ 危险操作！将删除所有副本、实体、关系等数据，不可恢复</p>
          </div>
          <button class="btn btn-danger" @click="confirmClearData">
            清空
          </button>
        </div>
      </section>

      <!-- AI 设置 -->
      <section class="settings-section">
        <h2>🤖 AI 设置</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <h3>Kimi API Key</h3>
            <p>用于调用 AI 评估和生成功能，仅存储在本地</p>
          </div>
          <div class="setting-action">
            <input 
              v-model="apiKey" 
              type="password" 
              placeholder="sk-xxxxxxxxxxxxxxxx"
              class="api-key-input"
            />
            <button class="btn btn-primary" @click="saveApiKey">
              保存
            </button>
          </div>
        </div>
      </section>

      <!-- 关于 -->
      <section class="settings-section">
        <h2>ℹ️ 关于</h2>
        
        <div class="about-info">
          <div class="logo-large">🕸️</div>
          <h3>RuleWeaver</h3>
          <p>规则怪谈创作辅助工具</p>
          <p class="version">版本：v0.1.0-alpha</p>
          <p class="description">
            离线优先的 Web 应用，帮助规则怪谈作者管理复杂的世界观设定，
            防止设定崩坏，追踪伏笔回收。
          </p>
        </div>
      </section>
    </div>

    <!-- 导入模态框 -->
    <ImportModal
      v-if="showImportModal"
      @close="showImportModal = false"
      @import="onImport"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../../db'
import { useEntityStore } from '../../stores/entityStore'
import ImportModal from './ImportModal.vue'
import CryptoJS from 'crypto-js'

const entityStore = useEntityStore()
const apiKey = ref('')
const showImportModal = ref(false)

onMounted(() => {
  apiKey.value = localStorage.getItem('kimi_api_key') || ''
})

function saveApiKey() {
  localStorage.setItem('kimi_api_key', apiKey.value.trim())
  alert('API Key 已保存')
}

async function exportData() {
  const password = prompt('请设置导出文件的密码（可选，留空则不加密）：')
  
  // 收集所有数据
  const data = {
    version: '2.0',
    exportedAt: Date.now(),
    novels: await db.novels.toArray(),
    instances: await db.instances.toArray(),
    maps: await db.maps.toArray(),
    entities: await db.entities.toArray(),
    mapMarkers: await db.mapMarkers.toArray(),
    relations: await db.relations.toArray(),
    chapters: await db.chapters.toArray(),
    foreshadowings: await db.foreshadowings.toArray(),
    aiEvaluations: await db.aiEvaluations.toArray()
  }
  
  let content = JSON.stringify(data, null, 2)
  let filename = `世界设定包_${new Date().toISOString().slice(0, 10)}`
  
  // 加密
  if (password) {
    content = CryptoJS.AES.encrypt(content, password).toString()
    filename += '.enc'
  } else {
    filename += '.json'
  }
  
  // 下载
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function onImport({ data, strategy }) {
  try {
    if (strategy === 'replace') {
      // 清空现有数据
      await db.delete()
      await db.open()
    }
    
    // 导入数据
    await db.transaction('rw', 
      [db.novels, db.instances, db.maps, db.entities, db.mapMarkers, db.relations, 
       db.chapters, db.foreshadowings, db.aiEvaluations],
      async () => {
        if (data.novels) await db.novels.bulkAdd(data.novels)
        if (data.instances) await db.instances.bulkAdd(data.instances)
        if (data.maps) await db.maps.bulkAdd(data.maps)
        if (data.entities) await db.entities.bulkAdd(data.entities)
        if (data.mapMarkers) await db.mapMarkers.bulkAdd(data.mapMarkers)
        if (data.relations) await db.relations.bulkAdd(data.relations)
        if (data.chapters) await db.chapters.bulkAdd(data.chapters)
        if (data.foreshadowings) await db.foreshadowings.bulkAdd(data.foreshadowings)
        if (data.aiEvaluations) await db.aiEvaluations.bulkAdd(data.aiEvaluations)
      }
    )
    
    // 刷新数据
    await entityStore.init()
    showImportModal.value = false
    alert('导入成功！')
  } catch (err) {
    alert('导入失败：' + err.message)
  }
}

function confirmClearData() {
  const confirmed = confirm(
    '⚠️ 警告！\n\n' +
    '此操作将永久删除所有数据，包括：\n' +
    '- 所有小说\n' +
    '- 所有副本\n' +
    '- 所有实体（角色、道具、规则、地图、能力）\n' +
    '- 所有关系和标记\n' +
    '- 所有章节和伏笔记录\n\n' +
    '此操作不可恢复！\n\n' +
    '确定要继续吗？'
  )
  
  if (confirmed) {
    const doubleConfirm = prompt('请输入 "开新书了" 以确认删除所有数据：')
    if (doubleConfirm === '开新书了') {
      clearAllData()
    } else {
      alert('取消删除')
    }
  }
}

async function clearAllData() {
  try {
    // 清空所有表
    await db.transaction('rw',
      [db.novels, db.instances, db.maps, db.entities, db.mapMarkers, 
       db.relations, db.chapters, db.foreshadowings, db.aiEvaluations],
      async () => {
        await db.novels.clear()
        await db.instances.clear()
        await db.maps.clear()
        await db.entities.clear()
        await db.mapMarkers.clear()
        await db.relations.clear()
        await db.chapters.clear()
        await db.foreshadowings.clear()
        await db.aiEvaluations.clear()
      }
    )
    
    // 刷新状态
    await entityStore.init()
    
    // 强制刷新页面以确保状态重置
    window.location.reload()
  } catch (err) {
    console.error('清空失败:', err)
    alert('清空失败：' + err.message)
  }
}
</script>

<style scoped>
.settings {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
}

.settings-section h2 {
  font-size: 16px;
  margin-bottom: 20px;
  color: var(--text-secondary);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item.danger {
  background: rgba(233, 69, 96, 0.05);
  margin: 0 -16px;
  padding: 16px;
  border-radius: 8px;
}

.setting-info h3 {
  font-size: 15px;
  margin-bottom: 4px;
}

.setting-info p {
  font-size: 13px;
  color: var(--text-secondary);
}

.setting-action {
  display: flex;
  gap: 8px;
}

.api-key-input {
  width: 240px;
}

.about-info {
  text-align: center;
  padding: 20px;
}

.logo-large {
  font-size: 64px;
  margin-bottom: 16px;
}

.about-info h3 {
  font-size: 20px;
  margin-bottom: 4px;
}

.about-info p {
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.about-info .version {
  font-size: 13px;
  opacity: 0.7;
}

.about-info .description {
  max-width: 400px;
  margin: 16px auto 0;
  line-height: 1.6;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .setting-action {
    width: 100%;
  }
  
  .api-key-input {
    flex: 1;
    width: auto;
  }
}
</style>
