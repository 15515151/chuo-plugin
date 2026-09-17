# chuo-plugin

- 一个适用于 [Yunzai 系列机器人框架](https://github.com/yhArcadia/Yunzai-Bot-plugins-index) 的戳一戳插件

- 被戳一戳后随机回复文字 / 图片 / 语音 / 视频，还可以禁言、反击，支持主人保护

## 安装插件

#### 1. 克隆仓库

    git clone https://github.com/15515151/chuo-plugin.git ./plugins/chuo-plugin

> [!NOTE]
> 插件按自身所在目录读取配置，目录名可自定义

#### 2. 安装依赖 二选一

```bash
pnpm install --filter=chuo-plugin
```
```bash
cd plugins/chuo-plugin && pnpm i
```

## 功能列表

- [x] 适配锅巴
- [x] 戳一戳（被戳后随机文字/图片/语音/视频回复、禁言、反击，支持主人保护）

## 配置说明

- 戳一戳的回复文案在 `config/chuo.yaml` 中修改
- 各项概率、禁言时长、各类 API 地址在 `config/config.yaml` 中修改，也可在锅巴面板中配置
- `config/` 目录不纳入版本管理，首次启动时会自动从 `config/default_config/` 生成

