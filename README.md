# 新生 · NEU生活模拟器

以普通同学“我”为第一人称的校园视觉小说，约 15–20 分钟。保留入学、军训双分支、课程与待办压力、六位班委、五个求助瞬间、现场分享和班会结尾。

## 运行

需要 Node.js 20 或以上，无需安装依赖。

~~~sh
npm run dev
~~~

打开 http://127.0.0.1:4173 。请通过本地服务器运行，直接双击 HTML 可能受浏览器模块安全限制。

~~~sh
npm test
npm run build
~~~

构建生成 dist/，可部署到任意静态托管服务。游戏不使用 CDN、网络字体或第三方服务。

## 游玩

点击对话、空格、回车或右方向键推进；文字播放中点击立即显示。← 返回上一句；A 自动；H 纯享；Esc 关闭弹窗或退出纯享。自动播放遇到选择和分享时暂停。

开始时可选择“自己读完”或“班会现场”，设置中也可以切换。单人模式提供参考回应；现场模式隐藏参考回应，保留主持人提示，等待主持人点击继续。分享笔记可以留空。

每句自动保存，另有三个手动存档。进度、称呼、分支、笔记和设置均保存在当前浏览器，不上传。限制本地存储的浏览器仍可游玩，但刷新后无法保留进度。

## 图片与音乐

已接入「图片」文件夹中的校园照片。photo-map.json 记录各场景选用的照片编号；需要更换时修改编号并运行：

~~~sh
node scripts/prepare-assets.mjs
npm run build
~~~

原照片保持原样，使用的照片复制到 assets/photos/。没有匹配实景的食堂、宿舍场景采用风格化插画；角色采用原创 SVG 示意立绘，可直接替换。插画不代表校园实景，参考回应不代表班委真实发言。

也可以将素材放入剧本约定路径，开发服务器和构建脚本会优先识别：

- 背景：img_bg/chechuang.png、xiaomen.png、wenguan.png、tushuguan.png、xiaonanhu.png、ercantang.png、sushe.png、junxun.png、jiaoshi.png、zoulang.png、wenguanmenkou.png、yelu.png。
- 角色：img_human/zhujue.png、banzhang.png、tuanzhishu.png、shenghuo.png、zuxuan.png、xuewei.png、wenti.png、xuezhang.png、xinli.png。建议透明背景。
- 音乐：audio/bgm_open.mp3、bgm_ke.mp3、bgm_banwei.mp3、bgm_xingfu.mp3、bgm_qiuzhu.mp3、bgm_shouwei.mp3。

缺失音乐用浏览器本地合成的原创轻音乐，点击右上角音符开启。主角预留 center 立绘映射，默认保持第一人称；班委在 left，学长和心理委员在 right。

## 文件

- story.js：完整剧情、人物、章节、分支和场景。
- app.js：推进、手机、存读档、现场互动和键盘操作。
- style.css：桌面与手机布局、打字动画、减少动态设置。
- audio.js：本地合成配乐与 MP3 播放。
- assets/：照片副本、可编辑 SVG 场景与角色。
- scripts/：无依赖开发服务器、素材导入、静态构建。
- tests/：剧情可达性、分支收束与存档校验。
