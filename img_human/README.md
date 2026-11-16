# 添加人物立绘

把透明底 PNG 放在这个文件夹，文件名与下表一致。缺图或加载失败时显示中性人物轮廓；有图片后自动换成正式立绘。

| 人物 | 文件名 |
| --- | --- |
| 班长 | banzhang.png |
| 团支书 | tuanzhishu.png |
| 生活委员 | shenghuo.png |
| 组宣 | zuxuan.png |
| 学习委员 | xuewei.png |
| 文体委员 | wenti.png |
| 学长 | xuezhang.png |
| 心理委员 | xinli.png |

建议使用半身或全身立绘，底部对齐，人物四周尽量少留空白。游戏会等比缩放，人物说话时从对话框左侧淡入。

本地放好图片后刷新页面即可。发布时将图片提交到 GitHub，推送 main 后自动构建、上线。

角色映射在 `story.js` 的 `characters` 中；淡入和缺图处理在 `portraits.js`。主角保持第一人称，不显示自己的立绘。
