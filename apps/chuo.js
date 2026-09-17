import { segment } from 'oicq';
import cfg from '../../../lib/config/config.js';
import common from '../../../lib/common/common.js';
import moment from "moment";
import _ from 'lodash';
import Cfg from '../model/Cfg.js';

export class chuo extends plugin {
    constructor() {
        super({
            name: '戳一戳',
            dsc: '戳一戳机器人触发效果',
            event: 'notice.group.poke',
            priority: -9999,
            rule: [{ fnc: 'chuoyichuo' }]
        });

        // 加载配置
        this.config = Cfg.getConfig('config');
        this.protectMasterEnabled = this.config.protectMaster !== false;
        this.chuoCfg = Cfg.getConfig('chuo');

        // 初始化配置
        this.initConfig();
    }

    initConfig() {
        // 主开关
        this.enabled = this.config.chuo !== false;

        // 概率配置
        this.prob = {
            text: this.config.probabilities_text || 0.6,
            img: this.config.probabilities_img || 0.1,
            voice: this.config.probabilities_voice || 0,
            mute: this.config.probabilities_mute || 0.05,
            video: this.config.probabilities_video || 0.15
        };

        // 设置配置
        this.settings = {
            master: this.config.settings_master || "主人",
            mutetime: Number(this.config.settings_mutetime) || 1,
            speakerapi: this.config.settings_speakerapi || "纳西妲",
            emoji_api: this.config.settings_emoji_api || "https://api.lolimi.cn/API/chaiq/c.php",
            video_api: this.config.settings_video_api || "https://api.yujn.cn/api/nvda.php?type=video",
            tts_api: this.config.settings_tts_api || "http://1.14.51.4:19191/tts",
            redis_prefix: this.config.settings_redis_prefix || "Yz:pokecount:"
        };

        // 回复内容
        this.replies = {
            text: this.chuoCfg.replies?.text || ["被戳晕了……轻一点啦！", "救命啊，有变态>_<！！！", "芝士，与你分享"],
            voice: this.chuoCfg.replies?.voice || [],
            counter: this.chuoCfg.replies?.counter || []
        };
    }

    async chuoyichuo(e) {
        if (!this.enabled) return;

        const replyActions = {
            text: () => {
                logger.info('[回复随机文字生效]');
                e.reply(_.sample(this.replies.text));
            },
            image: () => {
                logger.info('[回复随机图片生效]');
                e.reply(segment.image(this.settings.emoji_api));
            },
            voice: () => {
    logger.info('[回复随机语音生效]');
    // 直接调用随机语音API，不需要文本转语音
    fetch(this.settings.tts_api)
        .then(response => response.json())
        .then(data => {
            if (data && data.url) {
                // 直接发送语音文件URL
                e.reply(segment.record(data.url));
            } else {
                logger.error('语音API返回数据格式错误');
                // 如果API调用失败，回退到文字回复
                replyActions.text();
            }
        })
        .catch(error => {
            logger.error(`调用语音API失败: ${error.message}`);
            // 失败时回退到文字回复
            replyActions.text();
        });
},
            video: () => {
                logger.info('[回复随机视频生效]');
                e.reply('戳累了，看会视频吧！');
                e.reply(segment.video(this.settings.video_api));
            },
            mute: async (usercount) => {
                logger.info('[禁言生效]');
                const duration = this.settings.mutetime === 0 ? 
                    60 * (usercount + 1) : 
                    60 * this.settings.mutetime;
                await e.group.muteMember(e.operator_id, Math.min(duration, 21600));
            },
            counterAttack: async () => {
                // 直接使用 voice 配置中的文本进行反击回复
                const counterText = _.sample(this.replies.voice);
                if (counterText) {
                    e.reply(counterText);
                } else {
                    // 如果 voice 配置为空，使用默认文本
                    e.reply(_.sample(['吃我一拳喵！', '你刚刚是不是戳我了，你是坏蛋！', '是不是要本萝莉揍你一顿才开心啊！！！']));
                }
                await common.sleep(1000);
                // 修复：使用正确的API调用方式
                await this.sendPoke(e.bot, e.group_id, e.operator_id);
            }
        };

        // 主人保护逻辑
        if (this.protectMasterEnabled && cfg.masterQQ.includes(e.target_id)) {
            await this.handleMasterPoke(e);
            return true;
        }

        if (e.target_id === e.self_id) {
            const count = await this.getCount(this.settings.redis_prefix, e.group_id);
            const usercount = this.settings.mutetime === 0 ? 
                await this.getCount(`${this.settings.redis_prefix}${e.operator_id}:`) : 
                0;

            // 防刷提示
            if (_.random(1, 100) <= 20 && count >= 10) {
                const msg = _.sample(this.replies.counter)
                    .replace("_num_", count);
                e.reply(msg);
                return;
            }

            // 概率决策
            const rand = _.random(0, 1, true);
            const thresholds = [
                this.prob.text,
                this.prob.text + this.prob.img,
                this.prob.text + this.prob.img + this.prob.voice,
                this.prob.text + this.prob.img + this.prob.voice + this.prob.mute,
                this.prob.text + this.prob.img + this.prob.voice + this.prob.mute + this.prob.video
            ];

            if (rand <= thresholds[0]) replyActions.text();
            else if (rand <= thresholds[1]) replyActions.image();
            else if (rand <= thresholds[2]) replyActions.voice();
            else if (rand <= thresholds[3]) await replyActions.mute(usercount);
            else if (rand <= thresholds[4]) replyActions.video();
            else await replyActions.counterAttack();
        }
    }

    async handleMasterPoke(e) {
        if (cfg.masterQQ.includes(e.operator_id)) return;
        
        e.reply([
            segment.at(e.operator_id),
            `\n你几把谁啊, 竟敢戳我亲爱滴${this.settings.master}, 胆子好大啊你`,
            segment.image(this.settings.emoji_api)
        ], true);
        
        await common.sleep(1000);
        // 修复：使用正确的API调用方式
        await this.sendPoke(e.bot, e.group_id, e.operator_id);
        await e.group.muteMember(e.operator_id, 60);
    }

    // 新增：发送戳一戳的通用方法
    async sendPoke(bot, group_id, user_id) {
        try {
            // 方法1：使用 group_poke API（推荐）
            await bot.sendApi('group_poke', {
                group_id: Number(group_id),
                user_id: Number(user_id)
            });
        } catch (error) {
            logger.error(`发送戳一戳失败: ${error.message}`);
            // 方法2：备用方案，使用 send_like API
            try {
                await bot.sendApi('send_like', {
                    user_id: Number(user_id),
                    times: 1
                });
            } catch (error2) {
                logger.error(`发送点赞也失败: ${error2.message}`);
            }
        }
    }

    async getCount(key, group_id) {
        const count = (await redis.get(key + (group_id || ''))) || 0;
        await redis.set(key + (group_id || ''), +count + 1, { 
            EX: this.getExpireTime() 
        });
        return +count + 1;
    }

    getExpireTime() {
        return moment().endOf('day').unix() - moment().unix();
    }
}