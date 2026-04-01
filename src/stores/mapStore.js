import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '../db'

export const useMapStore = defineStore('map', () => {
  // State
  const maps = ref([])
  const loading = ref(false)
  
  // Actions
  async function loadMaps(novelId = null) {
    loading.value = true
    if (novelId) {
      // 获取该小说下所有副本的地图
      const instances = await db.instances.where('novelId').equals(novelId).toArray()
      const instanceIds = instances.map(i => i.id)
      
      if (instanceIds.length > 0) {
        // 使用 filter 来查询多个 instanceId
        const allMaps = await db.maps.toArray()
        maps.value = allMaps.filter(m => instanceIds.includes(m.instanceId))
      } else {
        maps.value = []
      }
    } else {
      maps.value = await db.maps.toArray()
    }
    loading.value = false
  }
  
  async function createMap(data) {
    const id = await db.maps.add({
      ...data,
      createdAt: Date.now()
    })
    await loadMaps()
    return id
  }
  
  async function updateMap(id, data) {
    await db.maps.update(id, {
      ...data,
      updatedAt: Date.now()
    })
    await loadMaps()
  }
  
  async function deleteMap(id) {
    await db.transaction('rw',
      [db.maps, db.mapMarkers],
      async () => {
        await db.maps.delete(id)
        await db.mapMarkers.where('mapId').equals(id).delete()
      }
    )
    await loadMaps()
  }
  
  async function getMapsByInstance(instanceId) {
    return await db.maps.where('instanceId').equals(instanceId).toArray()
  }
  
  // 初始化
  async function init() {
    await loadMaps()
  }
  
  return {
    maps,
    loading,
    loadMaps,
    createMap,
    updateMap,
    deleteMap,
    getMapsByInstance,
    init
  }
})
