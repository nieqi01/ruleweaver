/**
 * 部署前完整检查
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== RuleWeaver 部署前检查 ===\n');

let allPassed = true;

// 检查 1: 核心文件存在
console.log('【检查 1】核心文件存在性');
const coreFiles = [
  'src/main.js',
  'src/App.vue',
  'src/router/index.js',
  'src/db/index.js',
  'src/stores/novelStore.js',
  'src/stores/entityStore.js',
  'src/views/Home/index.vue',
  'src/views/Write/index.vue',
  'src/views/Entities/index.vue',
  'index.html',
  'vite.config.js'
];

for (const file of coreFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} 缺失`);
    allPassed = false;
  }
}

// 检查 2: 弹窗样式完整性
console.log('\n【检查 2】弹窗样式完整性');
const filesWithModal = [
  'src/views/Home/index.vue',
  'src/views/Entities/index.vue'
];

const requiredModalClasses = [
  '.modal-overlay',
  '.modal-content',
  '.modal-header',
  '.modal-body',
  '.modal-footer',
  '.close-btn',
  '.form-group'
];

for (const file of filesWithModal) {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf-8');
  let fileOk = true;
  for (const cls of requiredModalClasses) {
    if (!content.includes(cls)) {
      console.log(`  ❌ ${file} 缺少 ${cls}`);
      fileOk = false;
      allPassed = false;
    }
  }
  if (fileOk) {
    console.log(`  ✅ ${file} 样式完整`);
  }
}

// 检查 3: 路由配置
console.log('\n【检查 3】路由配置');
const routerContent = fs.readFileSync(path.join(__dirname, 'src/router/index.js'), 'utf-8');
const requiredRoutes = ['Home', 'Write', 'Entities', 'Instances', 'AI'];
for (const route of requiredRoutes) {
  if (routerContent.includes(`name: '${route}'`) || routerContent.includes(`name: "${route}"`)) {
    console.log(`  ✅ 路由 ${route} 已配置`);
  } else {
    console.log(`  ❌ 路由 ${route} 缺失`);
    allPassed = false;
  }
}

// 检查 4: Store 导出
console.log('\n【检查 4】Store 导出检查');
const entityStoreContent = fs.readFileSync(path.join(__dirname, 'src/stores/entityStore.js'), 'utf-8');
if (entityStoreContent.includes('export { EntityType }')) {
  console.log('  ✅ EntityType 已导出');
} else {
  console.log('  ❌ EntityType 未导出');
  allPassed = false;
}

// 检查 5: 构建输出
console.log('\n【检查 5】构建输出检查');
const distPath = path.join(__dirname, 'dist');
const requiredDistFiles = ['index.html', 'assets'];
for (const file of requiredDistFiles) {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ dist/${file} 存在`);
  } else {
    console.log(`  ❌ dist/${file} 缺失`);
    allPassed = false;
  }
}

// 检查 6: 弹窗事件绑定
console.log('\n【检查 6】弹窗事件绑定');
const homeContent = fs.readFileSync(path.join(__dirname, 'src/views/Home/index.vue'), 'utf-8');
const requiredEvents = [
  { pattern: '@click="showCreateModal = true"', desc: '打开弹窗事件' },
  { pattern: '@click.self="showCreateModal = false"', desc: '点击遮罩关闭' },
  { pattern: '@click="createNovel"', desc: '创建小说事件' },
  { pattern: 'v-if="showCreateModal"', desc: '弹窗显示条件' }
];

for (const event of requiredEvents) {
  if (homeContent.includes(event.pattern)) {
    console.log(`  ✅ ${event.desc}`);
  } else {
    console.log(`  ❌ ${event.desc} 缺失`);
    allPassed = false;
  }
}

// 检查 7: 无小说状态处理
console.log('\n【检查 7】无小说状态处理');
const viewsToCheck = ['Write', 'Entities', 'Instances', 'AI'];
for (const view of viewsToCheck) {
  const viewPath = path.join(__dirname, `src/views/${view}/index.vue`);
  if (fs.existsSync(viewPath)) {
    const content = fs.readFileSync(viewPath, 'utf-8');
    if (content.includes('!novelStore.hasNovel') || content.includes('novelStore.hasNovel')) {
      console.log(`  ✅ ${view} 处理了无小说状态`);
    } else {
      console.log(`  ⚠️ ${view} 可能未处理无小说状态`);
    }
  }
}

// 最终结论
console.log('\n' + '='.repeat(40));
if (allPassed) {
  console.log('✅ 所有检查通过，可以部署！');
} else {
  console.log('❌ 存在未通过的检查，请修复后再部署');
  process.exit(1);
}
