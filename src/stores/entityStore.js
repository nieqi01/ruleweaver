import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, EntityType } from '../db'
import { useNovelStore } from './novelStore'

// 导出 EntityType 供其他组件使用
export { EntityType }

// 实体 Store
export const useEntityStore = defineStore('entity', () => {
  const novelStore = useNovelStore()
  
  // State
  const entities = ref([])
  const currentEntity = ref(null)
  
  // Getters
  const roles = computed(() => entities.value.filter(e => e.type === EntityType.ROLE))
  const items = computed(() => entities.value.filter(e => e.type === EntityType.ITEM))
  const rules = computed(() => entities.value.filter(e => e.type === EntityType.RULE))
  const abilities = computed(() => entities.value.filter(e => e.type === EntityType.ABILITY))
  
  // 获取角色的道具和能力
  const getRoleItems = (roleId) => {
    return entities.value.filter(e => {
      // 这里需要根据 entityRelations 表查询
      // 简化实现：items 的 ownerId 指向 role
      return e.type === EntityType.ITEM && e.ownerId === roleId
    })
  }
  
  const getRoleAbilities = (roleId) => {
    return entities.value.filter(e => {
      return e.type === EntityType.ABILITY && e.ownerId === roleId
    })
  }
  
  // Actions
  async function loadEntities() {
    if (!novelStore.currentNovel) {
      entities.value = []
      return
    }
    entities.value = await db.entities
      .where('novelId')
      .equals(novelStore.currentNovel.id)
      .toArray()
  }
  
  async function createEntity(data) {
    const novelId = novelStore.currentNovel?.id
    if (!novelId) return
    
    const id = await db.entities.add({
      ...data,
      novelId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    await loadEntities()
    return id
  }
  
  async function updateEntity(id, data) {
    await db.entities.update(id, {
      ...data,
      updatedAt: Date.now()
    })
    await loadEntities()
  }
  
  async function deleteEntity(id) {
    await db.entities.delete(id)
    // 删除关联关系
    await db.entityRelations.where('ownerId').equals(id).delete()
    await db.entityRelations.where('ownedId').equals(id).delete()
    if (currentEntity.value?.id === id) {
      currentEntity.value = null
    }
    await loadEntities()
  }
  
  // 建立实体关系（角色拥有道具/能力）
  async function setEntityOwner(entityId, ownerId) {
    await db.entities.update(entityId, { ownerId })
    await loadEntities()
  }
  
  function setCurrentEntity(entity) {
    currentEntity.value = entity
  }
  
  return {
    entities,
    currentEntity,
    roles,
    items,
    rules,
    abilities,
    getRoleItems,
    getRoleAbilities,
    loadEntities,
    createEntity,
    updateEntity,
    deleteEntity,
    setEntityOwner,
    setCurrentEntity
  }
})
