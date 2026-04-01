// 模板实体生成和 AI 生成模块

import { callKimiAPI } from './kimi'

// 生成实例内容的模板提示词
export async function generateInstanceContent(instanceData, apiKey) {
  const prompt = `请为规则怪谈副本"${instanceData.name}"生成初始设定。

副本信息：
- 危险等级：${instanceData.dangerLevel}
- 背景：${instanceData.description || '中式恐怖风格的校园/医院/建筑场景'}

请生成以下内容（JSON格式）：
1. 2-3个角色（包含主角和配角，有隐藏身份）
2. 2-3个道具（有污染值和功能）
3. 3-4条规则（有触发条件和惩罚，包含表里层）
4. 2-3个地图区域（有不同危险等级）

输出格式：
{
  "roles": [
    {
      "name": "角色名",
      "identity": "表面身份",
      "description": "角色简介",
      "san": 100,
      "secret": "隐藏身份"
    }
  ],
  "items": [
    {
      "name": "道具名",
      "description": "道具描述",
      "pollution": 30,
      "function": "道具功能"
    }
  ],
  "rules": [
    {
      "name": "规则名",
      "triggerCondition": "触发条件",
      "punishment": "违反惩罚",
      "hiddenLevel": "表/里",
      "description": "规则描述"
    }
  ],
  "maps": [
    {
      "name": "地图名",
      "description": "地图描述",
      "dangerZone": "Safe/Risk/Deadly"
    }
  ]
}`

  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: '你是一位资深的规则怪谈创作者，擅长设计细思极恐的设定。请用中文回答，输出格式为 JSON。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      throw new Error('API 请求失败')
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('返回内容为空')
    }

    return JSON.parse(content)
  } catch (err) {
    console.error('AI 生成失败:', err)
    // 返回默认模板
    return getDefaultTemplate(instanceData)
  }
}

// 默认模板（当 AI 失败时使用）
function getDefaultTemplate(instanceData) {
  const name = instanceData.name
  
  return {
    roles: [
      {
        name: '主角',
        identity: '新转来的学生',
        description: '刚转入这所学校，对这里的一切感到好奇和不安',
        san: 100,
        secret: '其实能看到常人看不到的东西'
      },
      {
        name: '班长',
        identity: '班级负责人',
        description: '总是面带微笑，但眼神空洞',
        san: 60,
        secret: '已经不是原来的班长了'
      },
      {
        name: '校医',
        identity: '医务室医生',
        description: '戴着口罩，从不摘下来',
        san: 80,
        secret: '知道所有规则的破解方法'
      }
    ],
    items: [
      {
        name: '染血的校规',
        description: '一本泛黄的校规手册，某些规则被血迹遮盖',
        pollution: 30,
        function: '显示隐藏规则，但会缓慢降低持有者SAN值'
      },
      {
        name: '旧照片',
        description: `拍摄于十年前的${name}毕业照，上面的人都在微笑`,
        pollution: 20,
        function: '可以看到过去发生的事件'
      },
      {
        name: '护身符',
        description: '从校医那里得到的护身符，散发着淡淡的药味',
        pollution: 0,
        function: '可以抵挡一次规则的惩罚'
      }
    ],
    rules: [
      {
        name: '规则1：不要在镜子前停留超过10秒',
        triggerCondition: '在镜子前停留超过10秒',
        punishment: '被镜中人替换',
        hiddenLevel: '表',
        description: '如果看到镜中的自己没有跟着你动，立即闭眼数到10'
      },
      {
        name: '规则2：听到钟声必须闭眼',
        triggerCondition: '听到午夜钟声时睁眼',
        punishment: '看到不该看的东西，SAN值大幅下降',
        hiddenLevel: '表',
        description: '午夜的钟声不是给活人听的'
      },
      {
        name: '规则3：如果看到穿红衣服的人，不要对视',
        triggerCondition: '与红衣人对视超过3秒',
        punishment: '被红衣人跟随，直到死亡',
        hiddenLevel: '里',
        description: '红衣人是之前违反规则的学生'
      },
      {
        name: '规则4：教室最后一排不能坐人',
        triggerCondition: '坐在教室最后一排',
        punishment: '永远留在那个座位上',
        hiddenLevel: '表',
        description: '那里已经有人了'
      }
    ],
    maps: [
      {
        name: '主教学楼',
        description: `${name}的主建筑，共5层`,
        dangerZone: 'Risk'
      },
      {
        name: '3楼女厕所',
        description: '最危险的区域，镜子最多',
        dangerZone: 'Deadly'
      },
      {
        name: '医务室',
        description: '相对安全的地方，校医可以提供帮助',
        dangerZone: 'Safe'
      }
    ]
  }
}

// 预定义的模板场景
export const SCENE_TEMPLATES = {
  school: {
    name: '青山中学',
    description: '一所废弃多年后又重新开学的中学，有着不为人知的过去',
    dangerLevel: 'A',
    entities: {
      roles: ['转学生', '班长', '校医', '保安'],
      items: ['染血的校规', '旧照片', '护身符', '断掉的教鞭'],
      rules: ['镜子规则', '钟声规则', '红衣人规则', '座位规则'],
      maps: ['教学楼', '女厕所', '医务室', '图书馆']
    }
  },
  hospital: {
    name: '仁和医院',
    description: '深夜仍在营业的医院，这里的病人似乎永远治不好',
    dangerLevel: 'S',
    entities: {
      roles: ['实习医生', '护士长', '病人', '太平间管理员'],
      items: ['病历本', '手术刀', '镇静剂', '听诊器'],
      rules: ['不要数楼层', '不要看床底', '午夜查房', '电梯规则'],
      maps: ['住院部', '手术室', '太平间', '电梯']
    }
  },
  apartment: {
    name: '幸福小区',
    description: '看似普通的老旧小区，但邻居们都很奇怪',
    dangerLevel: 'B',
    entities: {
      roles: ['新搬来的租户', '房东', '邻居阿姨', '保安'],
      items: ['钥匙', '猫眼', '对讲机', '报纸'],
      rules: ['不要给陌生人开门', '垃圾投放时间', '电梯人数', '深夜脚步声'],
      maps: ['楼梯间', '电梯', '天台', '地下室']
    }
  }
}
