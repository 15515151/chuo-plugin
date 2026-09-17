import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'yaml'
import lodash from 'lodash'

export function supportGuoba() {
  // 配置文件路径（按本文件所在目录推导，插件目录改名也不影响）
  const pluginDir = path.dirname(fileURLToPath(import.meta.url))
  const configDir = path.join(pluginDir, 'config')
  const configPath = path.join(configDir, 'config.yaml')
  const defaultConfigPath = path.join(configDir, 'default_config/config.yaml')

  // 读取配置的通用方法
  const getConfig = () => {
    try {
      let config = {}

      // 读取默认配置
      if (fs.existsSync(defaultConfigPath)) {
        const defaultData = fs.readFileSync(defaultConfigPath, 'utf8')
        config = yaml.parse(defaultData) || {}
      }

      // 合并用户配置
      if (fs.existsSync(configPath)) {
        const userData = fs.readFileSync(configPath, 'utf8')
        config = lodash.merge({}, config, yaml.parse(userData) || {})
      }

      return config
    } catch (e) {
      console.error('[iloli-plugin] 读取配置失败:', e)
      return {}
    }
  }

  return {
    pluginInfo: {
      name: 'chuo-plugin',
      title: '戳一戳插件',
      description: '戳一戳互动，随机回复文字/图片/语音/视频',
      author: '@Jiaozi',
      authorLink: 'https://github.com/T060925ZX',
      link: 'https://github.com/15515151/chuo-plugin',
      isV3: true,
      isV2: false,
      showInMenu: true,
      icon: 'mdi:alpha-i-box-outline',
      iconColor: '#ff9ff3',
    },
    configInfo: {
      schemas: [
        {
          component: 'Divider',
          label: '系统设置',
          componentProps: {
            orientation: 'left',
            plain: true
          }
        },
        {
          field: 'summary',
          label: '图片外显',
          component: 'Input'
        },

        {
          component: 'Divider',
          label: '戳一戳设置',
          componentProps: {
            orientation: 'left',
            plain: true
          }
        },
        {
          field: 'chuo',
          label: '戳一戳功能',
          helpMessage: '是否启用戳一戳互动功能',
          component: 'Switch',
          componentProps: {
            activeText: '启用',
            inactiveText: '禁用'
          }
        },
        {
          field: 'probabilities_text',
          label: '文本回复概率',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 1,
            step: 0.01
          }
        },
        {
          field: 'probabilities_img',
          label: '图片回复概率',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 1,
            step: 0.01
          }
        },
        {
          field: 'probabilities_voice',
          label: '语音回复概率',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 1,
            step: 0.01
          }
        },
        {
          field: 'probabilities_mute',
          label: '禁言概率',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 1,
            step: 0.01
          }
        },
        {
          field: 'probabilities_video',
          label: '视频回复概率',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 1,
            step: 0.01
          }
        },
        {
          field: 'settings_master',
          label: '主人称呼',
          component: 'Input'
        },
        {
          field: 'settings_mutetime',
          label: '禁言时长(分钟)',
          component: 'InputNumber'
        },
        {
          field: 'settings_speakerapi',
          label: '语音合成API',
          component: 'Input'
        },
        {
          field: 'settings_emoji_api',
          label: '表情API地址',
          component: 'Input'
        },
        {
          field: 'settings_video_api',
          label: '视频API地址',
          component: 'Input'
        },
        {
          field: 'settings_tts_api',
          label: '语音合成API地址',
          component: 'Input'
        },
        {
          field: 'settings_redis_prefix',
          label: 'Redis前缀',
          component: 'Input'
        },
        {
          field: 'protectMaster',
          label: '主人保护',
          helpMessage: '开启后他人戳主人会被反击并禁言',
          component: 'Switch',
          componentProps: {
            activeText: '启用',
            inactiveText: '禁用'
          }
        }
      ],
      getConfigData() {
        return getConfig()
      },
      async setConfigData(data, { Result }) {
        try {
          const currentConfig = getConfig()
          const newConfig = lodash.merge({}, currentConfig, data)

          // 确保目录存在
          if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true })
          }

          fs.writeFileSync(configPath, yaml.stringify(newConfig, {
            indent: 2,
            aliasDuplicateObjects: false
          }), 'utf8')

          return Result.ok({}, '配置保存成功')
        } catch (e) {
          console.error('[iloli-plugin] 保存配置失败:', e)
          return Result.fail(`保存配置失败: ${e.message}`)
        }
      }
    }
  }
}
