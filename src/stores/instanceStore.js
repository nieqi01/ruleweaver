import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '../db'
import { useNovelStore } from './novelStore'

// 副本 Store
export const useInstanceStore = defineStore('instance', () => {
  const novelStore = useNovelStore()
  
  // State
  const instances = ref([])
  const currentInstance = ref(null)
  
  // Getters
  const instanceList = computed(() => instances.value)
  
  // 获取副本中的实体
  const getInstanceEntities = async (instanceId) => {
    const links = await db.instanceEntities
      .where('instanceId')
      .equals(instanceId)
      .toArray()
    
    const entityIds = links.map(l => l.entityId)
    return await db.entities.where('id').anyOf(entityIds).toArray()
  }
  
  // Actions
  async function loadInstances() {
    if (!novelStore.currentNovel) {
      instances.value = []
      return
    }
    instances.value = await db.instances
      .where('novelId')
      .equals(novelStore.currentNovel.id)
      .toArray()
  }
  
  async function createInstance(data) {
    const novelId = novelStore.currentNovel?.id
    if (!novelId) return
    
    const id = await db.instances.add({
      ...data,
      novelId,
      dangerLevel: data.dangerLevel || 'B',
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    await loadInstances()
    return id
  }
  
  async function updateInstance(id, data) {
    await db.instances.update(id, {
      ...data,
      updatedAt: Date.now()
    })
    await loadInstances()
  }
  
  async function deleteInstance(id) {
    await db.instances.delete(id)
    await db.instanceEntities.where('instanceId').equals(id).delete()
    await db.relations.where('instanceId').equals(id).delete()
    if (currentInstance.value?.id === id) {
      currentInstance.value = null
    }
    await loadInstances()
  }
  
  // 添加实体到副本
  async function addEntityToInstance(instanceId, entityId, role = '') {
    const existing = await db.instanceEntities
      .where({ instanceId, entityId })
      .first()
    if (existing) return
    
    await db.instanceEntities.add({
      instanceId,
      entityId,
      role
    })
  }
  
  // 从副本移除实体
  async function removeEntityFromInstance(instanceId, entityId) {
    const link = await db.instanceEntities
      .where({ instanceId, entityId })
      .first()
    if (link) {
      await db.instanceEntities.delete(link.id)
    }
  }
  
  function setCurrentInstance(instance) {
    currentInstance.value = instance
  }
  
  return {
    instances,
    currentInstance,
    instanceList,
    getInstanceEntities,
    loadInstances,
    createInstance,
    updateInstance,
    deleteInstance,
    addEntityToInstance,
    removeEntityFromInstance,
    setCurrentInstance
  }
})
