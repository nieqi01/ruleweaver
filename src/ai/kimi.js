// Kimi API 调用封装

const API_BASE = 'https://api.moonshot.cn/v1'

// 内置 API Key
const DEFAULT_API_KEY = 'sk-b6N57xg7ghoIsOjasujWQMTIyTuvgwZHwoTrEyyjrYaYPuE3'

export async function callKimiAPI(type, params) {
  // 使用传入的 key 或默认 key
  const apiKey = params.apiKey || DEFAULT_API_KEY
  
  if (!apiKey) {
    throw new Error('请先设置 API Key')
  }
  
  let prompt = ''
  
  switch (type) {
    case 'evaluateRules':
      prompt = buildEvaluatePrompt(params)
      break
    case 'generateCharacter':
      prompt = buildCharacterPrompt(params)
      break
    case 'generateRule':
      prompt = buildRulePrompt(params)
      break
    default:
      throw new Error('未知的 AI 调用类型')
  }
  
  const response = await fetch(`${API_BASE}/chat/completions`, {
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
          content: '你是一位资深的规则怪谈编辑，擅长分析规则合理性、设计恐怖氛围和构建复杂的人物关系。请用中文回答，输出格式为 JSON。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `API 请求失败: ${response.status}`)
  }
  
  const data = await response.json()
  const content = data.choices[0]?.message?.content
  
  if (!content) {
    throw new Error('API 返回内容为空')
  }
  
  try {
    return JSON.parse(content)
  } catch (e) {
    // 如果解析失败，尝试提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('无法解析 API 返回内容')
  }
}

function buildEvaluatePrompt({ rules, instanceName }) {
  const rulesText = rules.map((r, i) => `
规则${i + 1}：${r.name}
触发条件：${r.attributes?.triggerCondition || '无'}
违反惩罚：${r.attributes?.punishment || '无'}
描述：${r.description || '无'}
`).join('\n')

  return `你是一位规则怪谈资深编辑，评估以下怪谈规则的合理性。

所属副本：${instanceName}

待评估规则：
${rulesText}

请从以下维度评估（1-10分）：
1. 恐怖氛围：规则是否制造"细思极恐"感？（利用日常场景的异常）
2. 逻辑自洽：规则内部是否有矛盾？（如条件互斥是否明确）
3. 悖论潜力：能否与其他规则形成"遵守A则违反B"的死亡悖论？
4. 叙事清晰度：读者能否理解并记住规则？

指出具体风险：
- 是否存在"无解死局"（玩家必死，无逃生口）？
- 时间/空间条件是否模糊？

输出JSON格式：
{
  "scores": {
    "atmosphere": 数字,
    "logic": 数字,
    "paradox": 数字,
    "clarity": 数字
  },
  "suggestions": ["建议1", "建议2"],
  "risks": ["风险1", "风险2"]
}`
}

function buildCharacterPrompt({ instanceName, instanceDesc }) {
  return `基于规则怪谈副本"${instanceName}"的设定，生成一个表面身份与隐藏身份反差极大的配角。

副本背景：${instanceDesc || '中式恐怖风格的规则怪谈场景'}

要求：
1. 符合中式恐怖氛围（校园/医院/老旧小区等场景）
2. 提供3个可埋设的伏笔点（看似正常的细节实为恐怖线索）
3. 给出死亡Flag暗示（如何领盒饭）
4. MBTI性格+口头禅+秘密身份

输出JSON格式：
{
  "name": "角色名",
  "identity": "表面身份",
  "description": "角色简介",
  "secretIdentity": "隐藏身份",
  "mbti": "MBTI类型",
  "catchphrase": "口头禅",
  "foreshadowHints": ["伏笔点1", "伏笔点2", "伏笔点3"],
  "deathFlag": "死亡Flag描述"
}`
}

function buildRulePrompt({ instanceName, existingRules, theme }) {
  const themeHint = theme ? `，主题围绕"${theme}"` : ''
  const existingHint = existingRules.length > 0 
    ? `\n现有规则：${existingRules.join('、')}` 
    : ''

  return `基于规则怪谈副本"${instanceName}"${themeHint}，生成一条新的怪谈规则。
${existingHint}

要求：
1. 表面合理，细思极恐
2. 具有悖论潜力（可与其他规则形成冲突）
3. 有明确的触发条件和惩罚
4. 符合中式恐怖氛围

输出JSON格式：
{
  "name": "规则名称",
  "triggerCondition": "触发条件",
  "punishment": "违反惩罚",
  "analysis": "设计分析（为什么这条规则恐怖）"
}`
}

// 生成副本
export async function generateInstance({ apiKey: userApiKey, prompt, options }) {
  const apiKey = userApiKey || DEFAULT_API_KEY
  const entityTypes = []
  if (options.includeRoles) entityTypes.push('角色')
  if (options.includeItems) entityTypes.push('道具')
  if (options.includeRules) entityTypes.push('规则')
  if (options.includeAbilities) entityTypes.push('诡异能力')
  
  const systemPrompt = `你是一位资深的规则怪谈创作者，擅长设计恐怖副本场景。
请根据用户的描述，生成一个完整的规则怪谈副本。

需要生成的内容：
1. 副本基本信息（名称、危险等级、描述、存活条件）
2. 实体列表（${entityTypes.join('、')}）

危险等级说明：
- S级：极高危险，九死一生
- A级：高危险，需要谨慎应对
- B级：中等危险，有逃生可能
- C级：低危险，适合新手

实体类型：
- Role（角色）：NPC或敌人
- Item（道具）：可收集使用的物品
- Rule（规则）：副本中的诡异规则
- Ability（诡异能力）：特殊能力或诅咒

输出JSON格式：
{
  "name": "副本名称",
  "dangerLevel": "S/A/B/C",
  "description": "副本背景描述",
  "survivalCondition": "存活条件",
  "entities": [
    {
      "type": "Role/Item/Rule/Ability",
      "name": "实体名称",
      "status": "根据类型的默认状态",
      "description": "实体描述",
      // 角色特有
      "identity": "身份",
      "faction": "阵营",
      // 规则特有
      "dangerLevel": "S/A/B/C",
      "content": "规则内容",
      // 道具特有
      "itemType": "武器/防具/消耗品/线索/其他",
      // 能力特有
      "abilityType": "主动/被动/诅咒"
    }
  ]
}`

  const response = await fetch(`${API_BASE}/chat/completions`, {
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
          content: systemPrompt
        },
        {
          role: 'user',
          content: `请根据以下描述生成副本：\n\n${prompt}`
        }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    })
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `API 请求失败: ${response.status}`)
  }
  
  const data = await response.json()
  const content = data.choices[0]?.message?.content
  
  if (!content) {
    throw new Error('API 返回内容为空')
  }
  
  try {
    return JSON.parse(content)
  } catch (e) {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('无法解析 API 返回内容')
  }
}
