# 素材授权与来源清单 (Assets & Licenses)

除 Mixamo 角色外，所有资产均为 **CC0 1.0（公共领域）**；Mixamo 资产为 Adobe 免费商用授权（royalty-free，可商用、可修改）。
下载日期：2026-11-10。全部来源均已本地验证可用，无外链运行依赖。

## 次世代升级包（v2：写实森林）

| 本地文件 | 来源 | 作者 | 协议 | 规格 |
|---|---|---|---|---|
| `assets/hdri/autumn_forest_04_2k.hdr` | [Poly Haven · autumn_forest_04](https://polyhaven.com/a/autumn_forest_04) | Greg Zaal / Jarod Guest | CC0 | 2048×1024 Radiance HDR，7.4 MB，黄昏逆光 |
| `assets/models/hero/hero-soldier.glb` | [three.js examples · Soldier](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf)（Mixamo 角色） | Mixamo / Adobe | Mixamo 免费商用 | 11.3k 三角面，1024² PBR（baseColor + normal），原生 Idle/Walk/Run |
| `assets/models/hero/hero-michelle.glb` | 同上 · Michelle | Mixamo / Adobe | Mixamo 免费商用 | 28.1k 三角面，512² PBR（baseColor + normal + metallicRoughness + specular） |
| `assets/models/hero/anim-donor-xbot.glb` | 同上 · Xbot | Mixamo / Adobe | Mixamo 免费商用 | 动画捐赠者：idle / walk / run / sneak / agree / sad_pose，Mixamo 骨架命名 |
| `assets/textures/forest_floor/brown_mud_leaves_01_*_1k.jpg` | [Poly Haven · brown_mud_leaves_01](https://polyhaven.com/a/brown_mud_leaves_01) | Poly Haven | CC0 | albedo + normal(GL) + roughness + AO，1024² |
| `assets/models/environment/fir_tree_01/` | [Poly Haven · fir_tree_01](https://polyhaven.com/a/fir_tree_01) | Poly Haven | CC0 | 实景扫描冷杉，gltf + 1k PBR 贴图 |
| `assets/models/environment/fern_02/` | [Poly Haven · fern_02](https://polyhaven.com/a/fern_02) | Poly Haven | CC0 | 实景扫描蕨类，含 alpha 叶片 |

> Mixamo 官方站需 Adobe 登录才能下载；上表三个角色取自 three.js 官方仓库中同源镜像的 Mixamo 资产（作者同为 Adobe Mixamo），骨架命名 `mixamorig:*` 完全一致，可直接做动画重定向。

## 3D 模型 — Kenney.nl（CC0 1.0）

| 本地文件 | 来源包 | 作者 | 协议 |
|---|---|---|---|
| `assets/models/characters/character-a.glb`（另有 c / f / p） | [Blocky Characters 2.0](https://kenney.nl/assets/blocky-characters) | Kenney | CC0 |
| `assets/models/dungeon/*.glb`（wall / wall-half / wall-opening / column / floor / coin / key / potion / chest / gate / barrel / rocks / stones） | [Mini Dungeon](https://kenney.nl/assets/mini-dungeon) | Kenney | CC0 |
| `assets/models/nature/*.glb`（ground_grass / tree_default / tree_fat / tree_pineTallA / tree_pineRoundA / rock_largeA / rock_smallA / grass / grass_large / flower_redA / flower_yellowA / mushroom_red / log / bridge_wood） | [Nature Kit](https://kenney.nl/assets/nature-kit) | Kenney | CC0 |

原始授权文本保留在 `assets/licenses/`。

## 音频

| 本地文件 | 来源 | 作者 | 协议 |
|---|---|---|---|
| `assets/audio/ambient-forest.mp3` | [Peaceful forest — OpenGameArt](https://opengameart.org/content/peaceful-forest) | 见页面作者栏 | CC0 |
| `assets/audio/sfx-coin.ogg` / `sfx-coin-2.ogg` / `sfx-step-1.ogg` / `sfx-step-2.ogg` | [RPG Audio](https://kenney.nl/assets/rpg-audio) | Kenney | CC0 |

## 技术栈

- **Three.js r168**（MIT，CDN: jsDelivr `three@0.168.0`）
- 加载器：`GLTFLoader`、`RoomEnvironment`（均随 Three.js examples 提供，MIT）
- 无构建步骤，纯静态资源，`index.html` + ES Module importmap 直接运行。

## 模型规格备注（供引擎侧使用）

- Blocky Characters：高 8 单位、27 条动画（idle / walk / sprint / jump / pick-up 等），引擎内统一缩放到约 1.6 单位身高。
- Mini Dungeon：模块化 1×1 网格，墙高 1.1，硬币直径 0.42 —— 与迷宫网格 1 单位对齐，无需补偿偏移。
- Nature Kit：材质使用 `baseColorFactor` 且 `metallicFactor = 1`，运行时需要把金属度归零 + 加环境贴图，否则会发黑（已在游戏内处理）。
