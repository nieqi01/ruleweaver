<template>
  <div class="chapter-checkup">
    <header class="page-header">
      <h1>章节体检</h1>
    </header>

    <div v-if="!entityStore.currentInstance" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>请先选择副本</h3>
      <p>在实体库中创建并选择一个副本后，才能进行章节体检</p>
    </div>

    <template v-else>
      <!-- 输入区 -->
      <div class="input-section">
        <div class="input-row">
          <div class="form-group">
            <label>章节号</label>
            <input v-model.number="chapterNum" type="number" min="1" placeholder="如：50" />
          </div>
          <div class="form-group flex-1">
            <label>章节标题（可选）</label>
            <input v-model="chapterTitle" type="text" placeholder="章节标题" />
          </div>
        </div>
        
        <div class="form-group">
          <label>粘贴章节正文</label>
          <textarea 
            v-model="chapterText" 
            rows="12"
            placeholder="粘贴章节内容，支持标记语法：
{{角色:张三}} - 引用角色
[[染血的校规]] - 引用道具
<<照片里的手:埋>> - 埋下伏笔
<<照片里的手:收>> - 回收伏笔"
          />
        </div>
        
        <div class="syntax-help">
          <details>
            <summary>📖 标记语法说明</summary>
            <ul>
              <li><code v-pre>{{角色:张三}}</code> 或 <code v-pre>{{道具:染血的校规}}</code> - 引用实体</li>
              <li><code v-pre>[[道具名]]</code> - 道具简写，等效于 <span v-pre>{{道具:道具名}}</span></li>
              <li><code>&lt;&lt;伏笔名:埋&gt;&gt;</code> - 埋下伏笔</li>
              <li><code>&lt;&lt;伏笔名:收&gt;&gt;</code> - 回收伏笔</li>
            </ul>
          </details>
        </div>
        
        <button class="btn btn-primary btn-block" @click="runCheckup" :disabled="!canCheck">
          🔍 开始体检
        </button>
      </div>

      <!-- 体检报告 -->
      <div v-if="report" class="report-section">
        <h2>体检报告 - 第{{ chapterNum }}章</h2>
        
        <!-- 统计概览 -->
        <div class="report-stats">
          <div class="stat-card" :class="{ error: report.errors > 0 }">
            <div class="stat-number">{{ report.errors }}</div>
            <div class="stat-label">错误</div>
          </div>
          <div class="stat-card" :class="{ warning: report.warnings > 0 }">
            <div class="stat-number">{{ report.warnings }}</div>
            <div class="stat-label">警告</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ report.entities.length }}</div>
            <div class="stat-label">引用实体</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ report.foreshadowings.length }}</div>
            <div class="stat-label">伏笔操作</div>
          </div>
        </div>
        
        <!-- 实体引用清单 -->
        <div class="report-block">
          <h3>📚 实体引用清单</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>标记</th>
                <th>实体</th>
                <th>当前状态</th>
                <th>检查结果</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in report.entities" :key="idx" :class="item.status">
                <td><code>{{ item.marker }}</code></td>
                <td>{{ item.entityName || '未定义' }}</td>
                <td>{{ item.currentStatus || '-' }}</td>
                <td>
                  <span class="badge" :class="item.status">{{ item.message }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 伏笔追踪 -->
        <div class="report-block">
          <h3>🔮 伏笔追踪</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>伏笔名</th>
                <th>操作</th>
                <th>状态</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in report.foreshadowings" :key="idx" :class="item.status">
                <td>{{ item.name }}</td>
                <td>{{ item.action === 'bury' ? '埋下' : '回收' }}</td>
                <td>
                  <span class="badge" :class="item.status">{{ item.statusText }}</span>
                </td>
                <td>{{ item.message }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 导出按钮 -->
        <button class="btn btn-secondary" @click="exportReport">
          📥 导出报告 (Markdown)
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useEntityStore } from '../../stores/entityStore'
import { db, ForeshadowStatus } from '../../db'

const entityStore = useEntityStore()

const chapterNum = ref(1)
const chapterTitle = ref('')
const chapterText = ref('')
const report = ref(null)

const canCheck = computed(() => 
  chapterNum.value > 0 && 
  chapterText.value.trim().length > 0 &&
  entityStore.currentInstance
)

async function runCheckup() {
  const text = chapterText.value
  const entities = []
  const foreshadowings = []
  let errors = 0
  let warnings = 0
  
  // 解析实体引用 {{类型:名称}} 或 [[道具名]]
  const entityRegex = /\{\{\s*(\w+)\s*:\s*([^}]+)\s*\}\}/g
  const itemShortRegex = /\[\[\s*([^\]]+)\s*\]\]/g
  
  let match
  
  // 匹配完整语法
  while ((match = entityRegex.exec(text)) !== null) {
    const type = match[1].trim()
    const name = match[2].trim()
    const marker = match[0]
    
    // 查找实体
    const entity = entityStore.currentInstanceEntities.find(
      e => e.type === type && e.name === name
    )
    
    if (!entity) {
      entities.push({
        marker,
        type,
        entityName: name,
        currentStatus: null,
        status: 'error',
        message: '实体未定义'
      })
      errors++
    } else {
      // 检查状态矛盾
      let statusMsg = '正常'
      let status = 'ok'
      
      if (entity.type === 'Role' && entity.status === '死亡') {
        statusMsg = '⚠️ 死亡角色出场'
        status = 'warning'
        warnings++
      } else if (entity.type === 'Item' && entity.status === '已使用') {
        statusMsg = '⚠️ 已使用道具再次出现'
        status = 'warning'
        warnings++
      }
      
      entities.push({
        marker,
        type,
        entityName: entity.name,
        currentStatus: entity.status,
        status,
        message: statusMsg
      })
    }
  }
  
  // 匹配道具简写 [[道具名]]
  while ((match = itemShortRegex.exec(text)) !== null) {
    const name = match[1].trim()
    const marker = match[0]
    
    const entity = entityStore.currentInstanceEntities.find(
      e => e.type === 'Item' && e.name === name
    )
    
    if (!entity) {
      entities.push({
        marker,
        type: 'Item',
        entityName: name,
        currentStatus: null,
        status: 'error',
        message: '道具未定义'
      })
      errors++
    } else {
      let statusMsg = '正常'
      let status = 'ok'
      
      if (entity.status === '已使用') {
        statusMsg = '⚠️ 已使用道具再次出现'
        status = 'warning'
        warnings++
      }
      
      entities.push({
        marker,
        type: 'Item',
        entityName: entity.name,
        currentStatus: entity.status,
        status,
        message: statusMsg
      })
    }
  }
  
  // 解析伏笔 <<伏笔名:埋/收>>
  const foreRegex = /<<\s*([^:]+)\s*:\s*(埋|收)\s*>>/g
  
  while ((match = foreRegex.exec(text)) !== null) {
    const name = match[1].trim()
    const action = match[2].trim()
    
    if (action === '埋') {
      // 检查是否已存在未回收的同名伏笔
      const existing = await db.foreshadowings
        .where('name').equals(name)
        .and(f => f.status === ForeshadowStatus.PENDING)
        .first()
      
      if (existing) {
        foreshadowings.push({
          name,
          action: 'bury',
          status: 'warning',
          statusText: '重复埋下',
          message: `第${existing.buryChapter}章已埋下此伏笔`
        })
        warnings++
      } else {
        // 保存伏笔
        await db.foreshadowings.add({
          name,
          buryChapter: chapterNum.value,
          resolveChapter: null,
          status: ForeshadowStatus.PENDING,
          expectedResolveChapter: chapterNum.value + 3
        })
        
        foreshadowings.push({
          name,
          action: 'bury',
          status: 'ok',
          statusText: '成功埋下',
          message: `预计第${chapterNum.value + 3}章回收`
        })
      }
    } else if (action === '收') {
      // 查找对应的伏笔
      const fore = await db.foreshadowings
        .where('name').equals(name)
        .and(f => f.status === ForeshadowStatus.PENDING)
        .first()
      
      if (!fore) {
        foreshadowings.push({
          name,
          action: 'resolve',
          status: 'error',
          statusText: '无头伏笔',
          message: '没有找到对应的埋下记录'
        })
        errors++
      } else {
        // 更新伏笔状态
        await db.foreshadowings.update(fore.id, {
          resolveChapter: chapterNum.value,
          status: ForeshadowStatus.RESOLVED
        })
        
        const gap = chapterNum.value - fore.buryChapter
        foreshadowings.push({
          name,
          action: 'resolve',
          status: 'ok',
          statusText: '成功回收',
          message: `间隔${gap}章`
        })
      }
    }
  }
  
  // 检查超期未回收的伏笔
  const expiredFores = await db.foreshadowings
    .where('status').equals(ForeshadowStatus.PENDING)
    .and(f => f.expectedResolveChapter < chapterNum.value)
    .toArray()
  
  for (const fore of expiredFores) {
    const gap = chapterNum.value - fore.buryChapter
    if (gap > 3) {
      foreshadowings.push({
        name: fore.name,
        action: 'pending',
        status: 'warning',
        statusText: '超期未收',
        message: `已埋下${gap}章，建议尽快回收`
      })
      warnings++
    }
  }
  
  report.value = {
    chapterNum: chapterNum.value,
    chapterTitle: chapterTitle.value,
    errors,
    warnings,
    entities,
    foreshadowings
  }
  
  // 保存章节记录
  await db.chapters.put({
    number: chapterNum.value,
    title: chapterTitle.value,
    wordCount: text.length,
    createdAt: Date.now()
  })
}

function exportReport() {
  if (!report.value) return
  
  let md = `# 章节体检报告 - 第${report.value.chapterNum}章\n\n`
  if (report.value.chapterTitle) {
    md += `**标题：** ${report.value.chapterTitle}\n\n`
  }
  md += `**检查时间：** ${new Date().toLocaleString()}\n\n`
  md += `## 统计\n\n`
  md += `- 错误：${report.value.errors}\n`
  md += `- 警告：${report.value.warnings}\n`
  md += `- 引用实体：${report.value.entities.length}\n`
  md += `- 伏笔操作：${report.value.foreshadowings.length}\n\n`
  
  md += `## 实体引用清单\n\n`
  md += `| 标记 | 实体 | 当前状态 | 结果 |\n`
  md += `|------|------|----------|------|\n`
  for (const item of report.value.entities) {
    md += `| \`${item.marker}\` | ${item.entityName} | ${item.currentStatus || '-'} | ${item.message} |\n`
  }
  
  md += `\n## 伏笔追踪\n\n`
  md += `| 伏笔名 | 操作 | 状态 | 说明 |\n`
  md += `|--------|------|------|------|\n`
  for (const item of report.value.foreshadowings) {
    md += `| ${item.name} | ${item.action === 'bury' ? '埋下' : item.action === 'resolve' ? '回收' : '待回收'} | ${item.statusText} | ${item.message} |\n`
  }
  
  // 下载文件
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `章节体检_第${report.value.chapterNum}章.md`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.chapter-checkup {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
}

.input-section {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.input-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.flex-1 {
  flex: 1;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.syntax-help {
  margin-bottom: 16px;
}

.syntax-help details {
  background: var(--bg-tertiary);
  padding: 12px;
  border-radius: 8px;
}

.syntax-help summary {
  cursor: pointer;
  color: var(--text-secondary);
}

.syntax-help ul {
  margin-top: 12px;
  padding-left: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}

.syntax-help code {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.btn-block {
  width: 100%;
  justify-content: center;
}

.report-section {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
}

.report-section h2 {
  font-size: 18px;
  margin-bottom: 20px;
}

.report-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-tertiary);
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-card.error {
  background: rgba(233, 69, 96, 0.2);
}

.stat-card.warning {
  background: rgba(255, 193, 7, 0.2);
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-card.error .stat-number {
  color: var(--danger);
}

.stat-card.warning .stat-number {
  color: var(--warning);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.report-block {
  margin-bottom: 24px;
}

.report-block h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.report-table th,
.report-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.report-table th {
  color: var(--text-secondary);
  font-weight: 500;
}

.report-table tr.error {
  background: rgba(233, 69, 96, 0.1);
}

.report-table tr.warning {
  background: rgba(255, 193, 7, 0.1);
}

.report-table code {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.badge.ok {
  background: rgba(78, 204, 163, 0.2);
  color: var(--success);
}

.badge.error {
  background: rgba(233, 69, 96, 0.2);
  color: var(--danger);
}

.badge.warning {
  background: rgba(255, 193, 7, 0.2);
  color: var(--warning);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
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
  .input-row {
    flex-direction: column;
  }
  
  .report-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .report-table {
    font-size: 12px;
  }
  
  .report-table th,
  .report-table td {
    padding: 8px;
  }
}
</style>
