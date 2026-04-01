<template>
  <div class="novel-editor" :class="{ 'focus-mode': focusMode, 'dark-mode': darkMode }">
    <header class="page-header">
      <h1>小说编辑器</h1>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="showImportModal = true">
          📥 导入
        </button>
        <button class="btn btn-primary" @click="createChapter">
          <span>+</span> 新建章节
        </button>
      </div>
    </header>

    <div v-if="!novelStore.currentNovel" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>请先创建或选择小说</h3>
      <p>在左侧边栏创建一本小说后，才能开始写作</p>
    </div>

    <template v-else>
      <!-- 显示当前小说信息 -->
      <div class="novel-info-bar">
        <h2>{{ novelStore.currentNovel.name }}</h2>
        <span class="novel-stats">
          {{ chapters.length }} 章 | 
          {{ totalWordCount }} 字 | 
          {{ novelStore.instances.length }} 个副本
        </span>
      </div>
      <div class="editor-layout">
        <!-- 章节列表 - 桌面端 -->
        <aside v-if="!isMobile" class="chapter-sidebar">
          <div class="sidebar-header">
            <h3>章节列表</h3>
            <span class="chapter-count">{{ chapters.length }} 章</span>
          </div>
          
          <div class="chapter-list">
            <div 
              v-for="chapter in sortedChapters" 
              :key="chapter.id"
              class="chapter-item"
              :class="{ 
                active: currentChapter?.id === chapter.id,
                'has-content': chapter.content?.length > 100
              }"
              @click="selectChapter(chapter)"
            >
              <div class="chapter-number">第{{ chapter.number }}章</div>
              <div class="chapter-title">{{ chapter.title || '未命名' }}</div>
              <div class="chapter-meta">
                <span class="word-count">{{ formatWordCount(chapter.content) }}字</span>
                <span v-if="chapter.hasCheckup" class="checkup-badge">✓</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-footer">
            <button class="btn btn-block" @click="showCheckupModal = true">
              🔍 章节体检
            </button>
          </div>
        </aside>

        <!-- 移动端章节选择器 -->
        <div v-if="isMobile" class="mobile-chapter-selector">
          <select @change="onMobileChapterChange" :value="currentChapter?.id || ''">
            <option value="">选择章节...</option>
            <option v-for="chapter in sortedChapters" :key="chapter.id" :value="chapter.id">
              第{{ chapter.number }}章 {{ chapter.title || '未命名' }} ({{ formatWordCount(chapter.content) }}字)
            </option>
          </select>
          <button class="btn btn-sm" @click="createChapter">+</button>
        </div>

        <!-- 编辑器主体 -->
        <div class="editor-main">
          <div v-if="!currentChapter" class="empty-editor">
            <div class="empty-icon">✍️</div>
            <h3>开始写作</h3>
            <p>点击左侧章节或新建章节开始写作</p>
          </div>
          
          <template v-else>
            <div class="editor-header">
              <div class="chapter-info">
                <input 
                  v-model="currentChapter.number" 
                  type="number" 
                  class="chapter-number-input"
                  min="1"
                  @change="updateChapter"
                />
                <span class="chapter-label">章</span>
                <input 
                  v-model="currentChapter.title" 
                  type="text" 
                  class="chapter-title-input"
                  placeholder="章节标题"
                  @input="debounceUpdate"
                />
              </div>
              <div class="editor-actions">
                <span class="word-count">{{ formatWordCount(currentChapter.content) }} 字</span>
                <button class="btn btn-sm btn-secondary" @click="showMarkHelp = true">
                  ? 标记语法
                </button>
                <button class="btn btn-sm btn-primary" @click="saveChapter" :disabled="!hasChanges">
                  保存
                </button>
                <button class="btn btn-sm btn-danger" @click="deleteChapter">
                  删除
                </button>
              </div>
            </div>

            <!-- 写作工具栏 -->
            <div class="editor-toolbar">
              <div class="toolbar-group">
                <button class="toolbar-btn" @click="insertMark('role')" title="插入角色">
                  <span class="icon">👤</span>
                  <span class="label">角色</span>
                </button>
                <button class="toolbar-btn" @click="insertMark('item')" title="插入道具">
                  <span class="icon">📦</span>
                  <span class="label">道具</span>
                </button>
                <button class="toolbar-btn" @click="insertMark('foreshadow')" title="埋下伏笔">
                  <span class="icon">📍</span>
                  <span class="label">埋笔</span>
                </button>
                <button class="toolbar-btn" @click="insertMark('resolve')" title="回收伏笔">
                  <span class="icon">✓</span>
                  <span class="label">收笔</span>
                </button>
              </div>
              <div class="toolbar-divider"></div>
              <div class="toolbar-group">
                <button class="toolbar-btn" @click="toggleFocusMode" :class="{ active: focusMode }" title="专注模式">
                  <span class="icon">🎯</span>
                  <span class="label">专注</span>
                </button>
                <button class="toolbar-btn" @click="toggleDarkMode" :class="{ active: darkMode }" title="夜间模式">
                  <span class="icon">🌙</span>
                  <span class="label">夜间</span>
                </button>
              </div>
            </div>

            <textarea 
              ref="editor"
              v-model="currentChapter.content"
              class="editor-textarea"
              placeholder="开始写作...&#10;&#10;支持标记语法：&#10;{{角色:张三}} - 引用角色&#10;[[道具名]] - 引用道具&#10;<<伏笔名:埋>> - 埋下伏笔&#10;<<伏笔名:收>> - 回收伏笔"
              @input="debounceUpdate"
            />

            <!-- 实时标记预览 -->
            <div class="mark-preview" v-if="hasMarks">
              <h4>本章标记 detected：</h4>
              <div class="mark-list">
                <span v-for="(mark, idx) in detectedMarks" :key="idx" :class="'mark-tag ' + mark.type">
                  {{ mark.text }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- 标记语法帮助 -->
    <div v-if="showMarkHelp" class="modal-overlay" @click.self="showMarkHelp = false">
      <div class="modal-content help-modal">
        <header class="modal-header">
          <h2>标记语法说明</h2>
          <button class="close-btn" @click="showMarkHelp = false">×</button>
        </header>
        <div class="modal-body">
          <table class="help-table">
            <tr>
              <th>语法</th>
              <th>说明</th>
              <th>示例</th>
            </tr>
            <tr>
              <td><code v-pre>{{角色:张三}}</code></td>
              <td>引用角色</td>
              <td>检测角色是否存在</td>
            </tr>
            <tr>
              <td><code v-pre>{{道具:染血的校规}}</code></td>
              <td>引用道具</td>
              <td>检测道具状态</td>
            </tr>
            <tr>
              <td><code v-pre>[[道具名]]</code></td>
              <td>道具简写</td>
              <td>等效于 <span v-pre>{{道具:道具名}}</span></td>
            </tr>
            <tr>
              <td><code v-pre>&lt;&lt;伏笔名:埋&gt;&gt;</code></td>
              <td>埋下伏笔</td>
              <td>记录伏笔位置</td>
            </tr>
            <tr>
              <td><code v-pre>&lt;&lt;伏笔名:收&gt;&gt;</code></td>
              <td>回收伏笔</td>
              <td>检查是否有对应埋下</td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <!-- 章节体检模态框 -->
    <div v-if="showCheckupModal" class="modal-overlay" @click.self="showCheckupModal = false">
      <div class="modal-content checkup-modal">
        <header class="modal-header">
          <h2>章节体检</h2>
          <button class="close-btn" @click="showCheckupModal = false">×</button>
        </header>
        <div class="modal-body">
          <p class="checkup-desc">选择要体检的章节（可多选）：</p>
          
          <div class="checkup-actions">
            <button class="btn btn-sm" @click="selectAllChapters">
              {{ selectedChaptersForCheckup.length === chapters.length ? '取消全选' : '全选' }}
            </button>
            <button class="btn btn-sm" @click="selectChaptersWithContent">
              选择有内容的章节
            </button>
          </div>
          
          <div class="checkup-chapter-list">
            <label 
              v-for="chapter in sortedChapters" 
              :key="chapter.id"
              class="checkup-chapter-item"
              :class="{ 
                selected: selectedChaptersForCheckup.includes(chapter.id),
                'has-content': chapter.content?.length > 100
              }"
            >
              <input 
                type="checkbox" 
                :value="chapter.id"
                v-model="selectedChaptersForCheckup"
              />
              <span class="chapter-info">
                <span class="chapter-num">第{{ chapter.number }}章</span>
                <span class="chapter-title">{{ chapter.title || '未命名' }}</span>
                <span class="word-count">({{ formatWordCount(chapter.content) }}字)</span>
              </span>
            </label>
          </div>
          
          <div class="checkup-summary" v-if="selectedChaptersForCheckup.length > 0">
            已选择 {{ selectedChaptersForCheckup.length }} 个章节
          </div>
        </div>
        <footer class="modal-footer">
          <button class="btn btn-secondary" @click="showCheckupModal = false">取消</button>
          <button 
            class="btn btn-primary" 
            @click="runMultiCheckup"
            :disabled="selectedChaptersForCheckup.length === 0"
          >
            开始体检
          </button>
        </footer>
      </div>
    </div>

    <!-- 多章节体检结果 -->
    <div v-if="showCheckupResult" class="modal-overlay" @click.self="showCheckupResult = false">
      <div class="modal-content result-modal">
        <header class="modal-header">
          <h2>体检报告</h2>
          <button class="close-btn" @click="showCheckupResult = false">×</button>
        </header>
        <div class="modal-body">
          <div class="result-summary">
            <div class="summary-item error">
              <span class="count">{{ totalErrors }}</span>
              <span class="label">错误</span>
            </div>
            <div class="summary-item warning">
              <span class="count">{{ totalWarnings }}</span>
              <span class="label">警告</span>
            </div>
            <div class="summary-item">
              <span class="count">{{ checkupResults.length }}</span>
              <span class="label">已检章节</span>
            </div>
          </div>
          
          <div class="result-list">
            <div v-for="result in checkupResults" :key="result.chapterId" class="result-item">
              <div class="result-header" @click="result.expanded = !result.expanded">
                <span class="chapter-name">第{{ result.chapterNumber }}章 {{ result.chapterTitle }}</span>
                <span class="result-badge" :class="result.highestLevel">
                  {{ result.errors }}错 {{ result.warnings }}警
                </span>
                <span class="expand-icon">{{ result.expanded ? '▼' : '▶' }}</span>
              </div>
              
              <div v-if="result.expanded" class="result-details">
                <div v-for="(issue, idx) in result.issues" :key="idx" :class="'issue ' + issue.type">
                  <span class="issue-icon">{{ issue.type === 'error' ? '❌' : '⚠️' }}</span>
                  <span class="issue-text">{{ issue.message }}</span>
                </div>
                <div v-if="result.issues.length === 0" class="issue ok">
                  <span class="issue-icon">✓</span>
                  <span class="issue-text">本章无问题</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <footer class="modal-footer">
          <button class="btn btn-secondary" @click="exportCheckupReport">导出报告</button>
          <button class="btn btn-primary" @click="showCheckupResult = false">关闭</button>
        </footer>
      </div>
    </div>

    <!-- 导入模态框 -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal-content">
        <header class="modal-header">
          <h2>导入章节</h2>
          <button class="close-btn" @click="showImportModal = false">×</button>
        </header>
        <div class="modal-body">
          <div class="form-group">
            <label>粘贴章节内容</label>
            <textarea 
              v-model="importContent" 
              rows="10" 
              placeholder="支持格式：&#10;第一章 标题&#10;内容...&#10;&#10;第二章 标题&#10;内容..."
            />
          </div>
        </div>
        <footer class="modal-footer">
          <button class="btn btn-secondary" @click="showImportModal = false">取消</button>
          <button class="btn btn-primary" @click="parseImport" :disabled="!importContent.trim()">
            解析导入
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useNovelStore } from '../../stores/novelStore'
import { db, EntityType } from '../../db'

const novelStore = useNovelStore()

// 响应式检测
const isMobile = ref(window.innerWidth < 768)
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth < 768
})

// 章节数据
const chapters = ref([])
const currentChapter = ref(null)
const hasChanges = ref(false)
let saveTimeout = null

// UI 状态
const showMarkHelp = ref(false)
const showCheckupModal = ref(false)
const showCheckupResult = ref(false)
const showImportModal = ref(false)
const selectedChaptersForCheckup = ref([])
const checkupResults = ref([])
const importContent = ref('')
const focusMode = ref(false)
const darkMode = ref(false)

// 编辑器引用
const editor = ref(null)

// 加载章节
async function loadChapters() {
  if (!novelStore.currentNovel) return
  chapters.value = await db.chapters
    .where('novelId')
    .equals(novelStore.currentNovel.id)
    .toArray()
}

// 获取当前小说的所有实体（跨所有副本）
const currentNovelEntities = computed(() => {
  if (!novelStore.currentNovel) return []
  const instanceIds = novelStore.instances.map(i => i.id)
  return novelStore.entities.filter(e => instanceIds.includes(e.instanceId))
})

// 总字数
const totalWordCount = computed(() => {
  return chapters.value.reduce((sum, c) => sum + formatWordCount(c.content), 0)
})

// 监听小说变化
watch(() => novelStore.currentNovel, () => {
  loadChapters()
  currentChapter.value = null
}, { immediate: true })

const sortedChapters = computed(() => {
  return [...chapters.value].sort((a, b) => a.number - b.number)
})

const hasMarks = computed(() => {
  return detectedMarks.value.length > 0
})

const detectedMarks = computed(() => {
  if (!currentChapter.value?.content) return []
  
  const marks = []
  const content = currentChapter.value.content
  
  // 检测角色引用
  const roleRegex = /\{\{角色:([^}]+)\}\}/g
  let match
  while ((match = roleRegex.exec(content)) !== null) {
    marks.push({ type: 'role', text: match[1] })
  }
  
  // 检测道具引用
  const itemRegex = /\{\{道具:([^}]+)\}\}/g
  while ((match = itemRegex.exec(content)) !== null) {
    marks.push({ type: 'item', text: match[1] })
  }
  
  // 检测道具简写
  const itemShortRegex = /\[\[([^\]]+)\]\]/g
  while ((match = itemShortRegex.exec(content)) !== null) {
    marks.push({ type: 'item', text: match[1] })
  }
  
  // 检测伏笔
  const foreRegex = /<<([^:]+):(埋|收)>>/g
  while ((match = foreRegex.exec(content)) !== null) {
    marks.push({ type: match[2] === '埋' ? 'foreshadow' : 'resolve', text: match[1] })
  }
  
  return marks
})

const totalErrors = computed(() => {
  return checkupResults.value.reduce((sum, r) => sum + r.errors, 0)
})

const totalWarnings = computed(() => {
  return checkupResults.value.reduce((sum, r) => sum + r.warnings, 0)
})

function formatWordCount(content) {
  if (!content) return 0
  // 中文字符 + 英文单词
  const cnCount = (content.match(/[\u4e00-\u9fa5]/g) || []).length
  const enCount = (content.match(/[a-zA-Z]+/g) || []).length
  return cnCount + enCount
}

// 专注模式切换
function toggleFocusMode() {
  focusMode.value = !focusMode.value
}

// 夜间模式切换
function toggleDarkMode() {
  darkMode.value = !darkMode.value
}

async function createChapter() {
  const newNumber = chapters.value.length > 0 
    ? Math.max(...chapters.value.map(c => c.number)) + 1 
    : 1
  
  const chapter = {
    id: Date.now(),
    novelId: novelStore.currentNovel.id,
    number: newNumber,
    title: '',
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  
  await db.chapters.add(chapter)
  chapters.value.push(chapter)
  selectChapter(chapter)
}

function selectChapter(chapter) {
  currentChapter.value = { ...chapter }
  hasChanges.value = false
  nextTick(() => {
    editor.value?.focus()
  })
}

// 移动端章节选择
function onMobileChapterChange(event) {
  const chapterId = parseInt(event.target.value)
  const chapter = chapters.value.find(c => c.id === chapterId)
  if (chapter) {
    selectChapter(chapter)
  }
}

function debounceUpdate() {
  hasChanges.value = true
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    updateChapter()
  }, 2000)
}

async function updateChapter() {
  if (!currentChapter.value) return
  
  await db.chapters.update(currentChapter.value.id, {
    number: currentChapter.value.number,
    title: currentChapter.value.title,
    content: currentChapter.value.content,
    updatedAt: Date.now()
  })
  
  // 更新列表中的章节
  const index = chapters.value.findIndex(c => c.id === currentChapter.value.id)
  if (index !== -1) {
    chapters.value[index] = { ...currentChapter.value, updatedAt: Date.now() }
  }
  
  hasChanges.value = false
}

async function saveChapter() {
  await updateChapter()
  alert('保存成功！')
}

async function deleteChapter() {
  if (!confirm('确定删除此章节？')) return
  
  await db.chapters.delete(currentChapter.value.id)
  chapters.value = chapters.value.filter(c => c.id !== currentChapter.value.id)
  currentChapter.value = null
}

function insertMark(type) {
  if (!editor.value) return
  
  const textarea = editor.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const content = currentChapter.value.content || ''
  
  // 获取选中的文本
  const selectedText = content.substring(start, end)
  
  let insertText = ''
  let cursorOffset = 0
  
  switch (type) {
    case 'role':
      if (selectedText) {
        // 如果有选中内容，将其作为角色名
        insertText = `{{角色:${selectedText}}}`
        cursorOffset = 0 // 光标在末尾
      } else {
        insertText = '{{角色:}}'
        cursorOffset = -2 // 光标在冒号后
      }
      break
    case 'item':
      if (selectedText) {
        insertText = `[[${selectedText}]]`
        cursorOffset = 0
      } else {
        insertText = '[[]]'
        cursorOffset = -2
      }
      break
    case 'foreshadow':
      if (selectedText) {
        insertText = `<<${selectedText}:埋>>`
        cursorOffset = 0
      } else {
        insertText = '<<:埋>>'
        cursorOffset = -4
      }
      break
    case 'resolve':
      if (selectedText) {
        insertText = `<<${selectedText}:收>>`
        cursorOffset = 0
      } else {
        insertText = '<<:收>>'
        cursorOffset = -4
      }
      break
  }
  
  // 替换选中的内容（或插入到光标位置）
  const newContent = content.substring(0, start) + insertText + content.substring(end)
  currentChapter.value.content = newContent
  
  nextTick(() => {
    textarea.focus()
    // 设置光标位置
    const newCursor = start + insertText.length + cursorOffset
    textarea.setSelectionRange(newCursor, newCursor)
  })
  
  hasChanges.value = true
}

function formatText(style) {
  // 简单的格式插入
  const marks = { bold: '**', italic: '*' }
  insertMark(marks[style] || '')
}

// 章节体检相关
function selectAllChapters() {
  if (selectedChaptersForCheckup.value.length === chapters.value.length) {
    selectedChaptersForCheckup.value = []
  } else {
    selectedChaptersForCheckup.value = chapters.value.map(c => c.id)
  }
}

function selectChaptersWithContent() {
  selectedChaptersForCheckup.value = chapters.value
    .filter(c => c.content?.length > 100)
    .map(c => c.id)
}

async function runMultiCheckup() {
  const results = []
  const currentEntities = currentNovelEntities.value
  
  for (const chapterId of selectedChaptersForCheckup.value) {
    const chapter = chapters.value.find(c => c.id === chapterId)
    if (!chapter) continue
    
    const result = {
      chapterId: chapter.id,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title || '未命名',
      errors: 0,
      warnings: 0,
      issues: [],
      highestLevel: 'ok',
      expanded: false
    }
    
    const text = chapter.content || ''
    
    // 检查实体引用
    const entityRegex = /\{\{\s*(\w+)\s*:\s*([^}]+)\s*\}\}/g
    let match
    while ((match = entityRegex.exec(text)) !== null) {
      const type = match[1].trim()
      const name = match[2].trim()
      
      const entity = currentEntities.find(e => e.type === type && e.name === name)
      if (!entity) {
        result.issues.push({ type: 'error', message: `未定义实体: ${type}:${name}` })
        result.errors++
      } else if (entity.status === '死亡' || entity.status === '已使用') {
        result.issues.push({ type: 'warning', message: `${name} 状态异常: ${entity.status}` })
        result.warnings++
      }
    }
    
    // 检查道具简写
    const itemRegex = /\[\[\s*([^\]]+)\s*\]\]/g
    while ((match = itemRegex.exec(text)) !== null) {
      const name = match[1].trim()
      const entity = currentEntities.find(e => e.type === 'Item' && e.name === name)
      if (!entity) {
        result.issues.push({ type: 'error', message: `未定义道具: ${name}` })
        result.errors++
      }
    }
    
    // 检查伏笔
    const foreshadowings = await db.foreshadowings.toArray()
    const foreRegex = /<<\s*([^:]+)\s*:\s*(埋|收)\s*>>/g
    while ((match = foreRegex.exec(text)) !== null) {
      const name = match[1].trim()
      const action = match[2].trim()
      
      if (action === '收') {
        const fore = foreshadowings.find(f => f.name === name && f.status === 'Pending')
        if (!fore) {
          result.issues.push({ type: 'error', message: `伏笔"${name}"未埋下就回收` })
          result.errors++
        }
      }
    }
    
    if (result.errors > 0) result.highestLevel = 'error'
    else if (result.warnings > 0) result.highestLevel = 'warning'
    
    results.push(result)
    
    // 标记已体检
    await db.chapters.update(chapter.id, { hasCheckup: true })
  }
  
  checkupResults.value = results
  showCheckupModal.value = false
  showCheckupResult.value = true
  
  // 刷新章节列表
  await loadChapters()
}

function exportCheckupReport() {
  let report = `# 章节体检报告\n\n`
  report += `生成时间: ${new Date().toLocaleString()}\n\n`
  report += `## 统计\n\n`
  report += `- 错误: ${totalErrors.value}\n`
  report += `- 警告: ${totalWarnings.value}\n`
  report += `- 检查章节: ${checkupResults.value.length}\n\n`
  report += `## 详细结果\n\n`
  
  for (const result of checkupResults.value) {
    report += `### 第${result.chapterNumber}章 ${result.chapterTitle}\n\n`
    if (result.issues.length === 0) {
      report += `✓ 无问题\n\n`
    } else {
      for (const issue of result.issues) {
        report += `${issue.type === 'error' ? '❌' : '⚠️'} ${issue.message}\n`
      }
      report += `\n`
    }
  }
  
  const blob = new Blob([report], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `章节体检报告_${new Date().toISOString().slice(0, 10)}.md`
  a.click()
}

// 导入功能 - 解析章节并添加到列表
async function parseImport() {
  const content = importContent.value
  if (!content.trim() || !novelStore.currentNovel) {
    alert('请先输入内容并选择小说')
    return
  }
  
  // 匹配章节：支持 "第一章 标题" 或 "第1章 标题" 或 "第1章\n内容"
  const chapterRegex = /第[一二三四五六七八九十百千零\d]+章\s*(?:([^\n]*)\n?)?([\s\S]*?)(?=第[一二三四五六七八九十百千零\d]+章|$)/g
  
  const parsedChapters = []
  let match
  let chapterNum = 1
  
  while ((match = chapterRegex.exec(content)) !== null) {
    const title = match[1]?.trim() || ''
    const chapterContent = match[2]?.trim() || ''
    
    if (chapterContent) {
      parsedChapters.push({
        number: chapterNum,
        title: title,
        content: chapterContent
      })
      chapterNum++
    }
  }
  
  if (parsedChapters.length === 0) {
    // 如果没有匹配到章节格式，尝试按空行分割
    const blocks = content.split(/\n{2,}/).filter(b => b.trim().length > 50)
    
    if (blocks.length > 0) {
      const confirmed = confirm(`未检测到章节格式，是否将内容分割为 ${blocks.length} 个章节？`)
      if (confirmed) {
        let num = 1
        for (const block of blocks) {
          parsedChapters.push({
            number: num,
            title: '',
            content: block.trim()
          })
          num++
        }
      }
    } else {
      alert('未能识别到章节，请确保文本包含"第一章"等章节标识')
      return
    }
  }
  
  // 确认导入
  const confirmImport = confirm(`识别到 ${parsedChapters.length} 个章节，是否导入？\n\n前3个章节预览：\n${parsedChapters.slice(0, 3).map(c => `第${c.number}章 ${c.title || '未命名'} (${c.content.length}字)`).join('\n')}`)
  
  if (confirmImport) {
    // 获取当前最大章节号
    const maxNum = chapters.value.length > 0 
      ? Math.max(...chapters.value.map(c => c.number)) 
      : 0
    
    // 创建章节
    for (const pc of parsedChapters) {
      await novelStore.createChapter({
        novelId: novelStore.currentNovel.id,
        number: maxNum + pc.number,
        title: pc.title,
        content: pc.content,
        wordCount: pc.content.length
      })
    }
    
    alert(`成功导入 ${parsedChapters.length} 个章节！`)
    showImportModal.value = false
    importContent.value = ''
    await loadChapters()
  }
}
</script>

<style scoped>
.novel-editor {
  max-width: 1400px;
  margin: 0 auto;
  height: calc(100vh - 100px);
}

.novel-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-secondary);
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.novel-info-bar h2 {
  font-size: 18px;
  margin: 0;
}

.novel-stats {
  font-size: 14px;
  color: var(--text-secondary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 编辑器布局 */
.editor-layout {
  display: flex;
  gap: 20px;
  height: calc(100% - 60px);
}

/* 章节侧边栏 */
.chapter-sidebar {
  width: 280px;
  background: var(--bg-secondary);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.sidebar-header h3 {
  font-size: 16px;
}

.chapter-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.chapter-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.chapter-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 4px;
}

.chapter-item:hover {
  background: var(--bg-tertiary);
}

.chapter-item.active {
  background: var(--accent);
}

.chapter-item.has-content {
  border-left: 3px solid var(--success);
}

.chapter-number {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.chapter-item.active .chapter-number {
  color: rgba(255, 255, 255, 0.8);
}

.chapter-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.chapter-item.active .chapter-meta {
  color: rgba(255, 255, 255, 0.7);
}

.checkup-badge {
  color: var(--success);
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--border);
}

.btn-block {
  width: 100%;
  justify-content: center;
}

/* 编辑器主体 */
.editor-main {
  flex: 1;
  background: var(--bg-secondary);
  border-radius: 12px;
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

.empty-editor .empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  gap: 16px;
}

.chapter-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.chapter-number-input {
  width: 70px;
  text-align: center;
}

.chapter-label {
  color: var(--text-secondary);
}

.chapter-title-input {
  flex: 1;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.word-count {
  font-size: 14px;
  color: var(--text-secondary);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

/* 工具栏 */
.editor-toolbar {
  display: flex;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-tertiary);
  align-items: center;
}

.toolbar-group {
  display: flex;
  gap: 6px;
}

.toolbar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  border: none;
  background: var(--bg-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 48px;
}

.toolbar-btn:hover {
  background: var(--accent);
  color: white;
}

.toolbar-btn.active {
  background: var(--accent);
  color: white;
}

.toolbar-btn .icon {
  font-size: 16px;
}

.toolbar-btn .label {
  font-size: 10px;
}

.toolbar-divider {
  width: 1px;
  height: 32px;
  background: var(--border);
  margin: 0 4px;
}

/* 专注模式 */
.focus-mode .novel-info-bar,
.focus-mode .page-header,
.focus-mode .chapter-sidebar,
.focus-mode .mobile-chapter-selector {
  display: none !important;
}

.focus-mode .editor-layout {
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: var(--bg-primary);
}

.focus-mode .editor-main {
  max-width: 800px;
  margin: 0 auto;
}

/* 夜间模式 */
.dark-mode .editor-textarea {
  background: #0d0d0d;
  color: #e0e0e0;
}

/* 编辑区 */
.editor-textarea {
  flex: 1;
  padding: 20px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 16px;
  line-height: 1.8;
  resize: none;
  outline: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 标记预览 */
.mark-preview {
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg-tertiary);
}

.mark-preview h4 {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.mark-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mark-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.mark-tag.role {
  background: rgba(78, 204, 163, 0.2);
  color: #4ecca3;
}

.mark-tag.item {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.mark-tag.foreshadow {
  background: rgba(100, 181, 246, 0.2);
  color: #64b5f6;
}

.mark-tag.resolve {
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
}

/* 模态框通用样式 */
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
  max-width: 600px;
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

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}

/* 帮助模态框 */
.help-modal {
  max-width: 700px;
}

.help-table {
  width: 100%;
  border-collapse: collapse;
}

.help-table th,
.help-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.help-table th {
  color: var(--text-secondary);
  font-weight: 500;
}

.help-table code {
  background: var(--bg-tertiary);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
}

/* 体检模态框 */
.checkup-modal {
  max-width: 500px;
}

.checkup-desc {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.checkup-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.checkup-chapter-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
}

.checkup-chapter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.checkup-chapter-item:hover {
  background: var(--bg-tertiary);
}

.checkup-chapter-item.selected {
  background: rgba(233, 69, 96, 0.1);
}

.checkup-chapter-item input[type="checkbox"] {
  width: auto;
}

.chapter-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chapter-num {
  font-weight: 500;
}

.chapter-title {
  color: var(--text-secondary);
  flex: 1;
}

.checkup-summary {
  margin-top: 16px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  text-align: center;
}

/* 结果模态框 */
.result-modal {
  max-width: 700px;
}

.result-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.summary-item {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 12px;
}

.summary-item.error {
  background: rgba(233, 69, 96, 0.2);
}

.summary-item.warning {
  background: rgba(255, 193, 7, 0.2);
}

.summary-item .count {
  display: block;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 4px;
}

.summary-item.error .count {
  color: var(--danger);
}

.summary-item.warning .count {
  color: var(--warning);
}

.summary-item .label {
  font-size: 13px;
  color: var(--text-secondary);
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  cursor: pointer;
}

.result-header:hover {
  background: var(--bg-secondary);
}

.chapter-name {
  flex: 1;
  font-weight: 500;
}

.result-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.result-badge.ok {
  background: rgba(78, 204, 163, 0.2);
  color: var(--success);
}

.result-badge.warning {
  background: rgba(255, 193, 7, 0.2);
  color: var(--warning);
}

.result-badge.error {
  background: rgba(233, 69, 96, 0.2);
  color: var(--danger);
}

.expand-icon {
  color: var(--text-secondary);
}

.result-details {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}

.issue {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.issue.error {
  color: var(--danger);
}

.issue.warning {
  color: var(--warning);
}

.issue.ok {
  color: var(--success);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

/* 表单 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

/* 移动端章节选择器 */
.mobile-chapter-selector {
  display: none;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .novel-editor {
    padding: 8px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .page-header h1 {
    font-size: 20px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .novel-info-bar {
    flex-direction: column;
    gap: 8px;
    padding: 12px;
  }
  
  .novel-info-bar h2 {
    font-size: 18px;
  }
  
  .editor-layout {
    flex-direction: column;
  }
  
  .chapter-sidebar {
    display: none;
  }
  
  .mobile-chapter-selector {
    display: flex;
    gap: 8px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: 8px;
    margin-bottom: 12px;
  }
  
  .mobile-chapter-selector select {
    flex: 1;
    padding: 10px;
    font-size: 14px;
  }
  
  .mobile-chapter-selector .btn-sm {
    padding: 10px 16px;
    font-size: 18px;
  }
  
  .editor-main {
    padding: 12px;
  }
  
  .editor-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .chapter-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .chapter-number-input {
    width: 80px;
  }
  
  .chapter-title-input {
    width: 100%;
  }
  
  .editor-actions {
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .editor-toolbar {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .toolbar-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .editor-textarea {
    min-height: 400px;
    font-size: 16px; /* 防止 iOS 缩放 */
    padding: 12px;
  }
  
  .empty-editor {
    padding: 40px 20px;
  }
  
  .empty-editor h3 {
    font-size: 18px;
  }
}
</style>
