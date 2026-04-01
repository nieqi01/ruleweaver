import { createRouter, createWebHashHistory } from 'vue-router'

// 懒加载组件
const Home = () => import('../views/Home/index.vue')
const Write = () => import('../views/Write/index.vue')
const Entities = () => import('../views/Entities/index.vue')
const EntityDetail = () => import('../views/Entities/Detail.vue')
const Instances = () => import('../views/Instances/index.vue')
const InstanceDetail = () => import('../views/Instances/Detail.vue')
const Relations = () => import('../views/Relations/index.vue')
const AI = () => import('../views/AI/index.vue')

const routes = [
  { 
    path: '/', 
    name: 'Home', 
    component: Home,
    meta: { title: '首页' }
  },
  { 
    path: '/write', 
    name: 'Write', 
    component: Write,
    meta: { title: '写作' }
  },
  { 
    path: '/entities', 
    name: 'Entities', 
    component: Entities,
    meta: { title: '实体库' }
  },
  { 
    path: '/entities/:id', 
    name: 'EntityDetail', 
    component: EntityDetail,
    meta: { title: '实体详情' }
  },
  { 
    path: '/instances', 
    name: 'Instances', 
    component: Instances,
    meta: { title: '副本' }
  },
  { 
    path: '/instances/:id', 
    name: 'InstanceDetail', 
    component: InstanceDetail,
    meta: { title: '副本详情' }
  },
  { 
    path: '/relations', 
    name: 'Relations', 
    component: Relations,
    meta: { title: '关系图谱' }
  },
  { 
    path: '/ai', 
    name: 'AI', 
    component: AI,
    meta: { title: 'AI助手' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
