# 五域两天 · 资源导入包 V8.1

内容：
- guworms.json：130只蛊虫
- materials.json：195种蛊材
- recipes.json：130份蛊方
- import_resource_pack.html：一键导入页面

使用：
1. 解压本包。
2. 把 `import_resource_pack.html`、`guworms.json`、`materials.json`、`recipes.json` 上传到 GitHub 仓库根目录，和 `index.html`、`app.js` 同一层。
3. Commit changes。
4. 等 GitHub Pages 部署完成。
5. 打开：`你的网址/import_resource_pack.html`
6. 点“一键导入全部”。
7. 回主站刷新。

说明：
- 重复导入会覆盖同 ID 数据，不会重复生成同名资料。
- 所有蛊虫均为一至五转。
- 所有蛊虫符合：吸收真元 = 使用真元 × 5。
- 属性范围遵守：一转1-5、二转3-10、三转8-20、四转15-30、五转20-50。
