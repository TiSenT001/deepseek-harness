# PureRef 逆向笔记

## 结论摘要

| 项 | 结论 | 证据 |
|---|---|---|
| 渲染 | Qt6 + QGraphicsScene，无 OpenGL | 导入表无 `opengl32`；`QGraphicsItem` 被引用 75 次 |
| 图像 | 文档内嵌 JPEG（场景预览 256×256） | 文件头后第一段即可解码的 256×256 预览 |
| 容器 | **两种**：ZIP + `contents.xml`（第三方交换格式）与本机原生格式 | ZIP 变体在 `PureRef.exe` 中 `contents.xml` 命中 0 次 |
| 坐标编码 | 运行时以 double 读出，但**不在文件字节里** | 见「已解出的文件语法」与「未解的关键点」 |
| 场景尾段 | 由 `qint64` 偏移指向的独立区块 | 读取序列出现 `int 8` + `qint64 1536000` |

## Ghidra 环境（踩坑记录）

- Ghidra `C:\t001s\ghidra_12.1.3_PUBLIC`，JDK `C:\t001s\jdk-21.0.13+9`，工程 `C:\t001s\ghidra-proj\PureRefSample.gpr`（已分析，29,618 个函数）
- **坑 1**：脚本带 UTF-8 BOM → `illegal character: '\ufeff'`，表现为 `Failed to get OSGi bundle`。写脚本必须无 BOM。
- **坑 2**：非平凡脚本（import `ghidra.program.model.symbol.*` 等）即使无 BOM、javac 单独通过，OSGi 宿主仍报同样错误；只有极简脚本能跑。
- **解法**：绕开 OSGi，用框架 API 写独立 Java 程序：

```java
Application.initializeApplication(new GhidraApplicationLayout(), new HeadlessGhidraApplicationConfiguration());
GhidraProject project = GhidraProject.openProject(projDir, projName, false);
Program program = project.openProgram("/", file.getPathname(), false);
DecompInterface decompiler = new DecompInterface();
```

## 运行时插桩（Frida）

PyPI 与清华镜像均 403，阿里云可用：

```
python -m pip download frida --no-deps -d <dir> --index-url https://mirrors.aliyun.com/pypi/simple/
python -m pip install --no-index --find-links <dir> frida
```

脚本位于 `G:\Software\dsh-temp\frida-hooks\`：

| 文件 | 作用 |
|---|---|
| `hook.js` | 挂钩 `QDataStream::operator>>` 的 int / qlonglong / double，输出读取序列 |
| `run.py` | 启动 PureRef 并注入，打印事件 |
| `run_keep.py` | 同上，并在进程结束前把自动保存的 `.pur` 拷贝出来 |

Frida 17 注意事项：

- `Module.findExportByName` 已移除，改用 `Process.getModuleByName(...).findExportByName(...)`
- 双精度参数在 `xmm1`；`this.context.xmm1` 是 **ArrayBuffer**：`new Float64Array(this.context.xmm1)[0]`

## 已解出的文件语法（来自读取序列）

打开一份文档时 `QDataStream` 的读取顺序：

```
int  len            QString  "2.1"            ← 格式版本
long total          qint64   文件总长
int  len            QString  "2.1.1"
int  len            QString  <32 位十六进制>
int  len            JPEG 预览图字节
int  8              ← 段标记
int  len → long offset → int len → int len → JPEG    ← 第二条记录 + 尾段偏移
int  20             ← 20 字节元数据
double ×4           -1300, -880, 5103.044388152642, 4090.7612171991336   ← 视图偏移 + 场景边界
int  80             ← 80 字节元数据
double ×9           0.1297657254971172, 0, 0, 0, 0.1297657254971172, 0, 0, 0, 1  ← QTransform
int  1024           ← 块尺寸
int  12, int 1, long 1, int 1, int 1 ...
```

坐标所在的层级已经明确：视图偏移与场景边界都以 double 读出。

## 未解的关键点

读出的四个 double **在文件字节里找不到对应**（已核对 double 大端/小端、float32 大端/小端）。

因此这些数值来自**内存中解码后的缓冲区**，而不是文件的字面字节。两种可能：

1. 尾段（`qint64` 指向的区块）是自定义压缩/编码，运行时先解成连续 `QDataStream` 数据再读；
2. 读取发生在内存流上，文件只是同一结构的另一种摆放。

### 下一步（唯一有效手段）

挂钩 `QDataStream::QDataStream(QByteArray const&)`，在构造时取到该 `QByteArray` 的缓冲区指针与长度，把**解码后的字节整体 dump 出来**。得到明文流之后：

- 在明文流里直接定位四个 double → 确认编码；
- 对比明文流与文件字节 → 反推尾段编码（或确认无需解码）。

## 样本清单

| 文件 | 大小 | 说明 |
|---|---|---|
| `Work(1).pur` | 89MB | 单张大图，早期误判来源 |
| `科学家人物概念设计.pur` | 4.44MB | 5 段预览 |
| `NewScene.pur`(439908e1) | 1.55MB | 与下者同画布、图移动过 |
| `NewScene1.pur`(da54ef26) | 1.54MB | 同上 |

两份 `NewScene*.pur` 的差异只在 4 段（0..6144 / 12288..17408 / 19456..20480 / 1536000..1539072），其中元数据区仅 2 个 32 位字不同（`@5958`、`@5962`）。

## 已实现的读取能力

- `extractEmbeddedPictures`：按 JPEG 标记走动（APP/DQT/SOF/DHT/SOS），能取到可解码的场景预览图；全图与其它记录交错，跨度法得到的字节无法解码，已明确拒绝
- `pictureSize`：从 PNG IHDR / JPEG SOFn 读真实宽高比，导入时卡片不变形
- `importNativePur`：网格布局 + 真实宽高比，并在界面提示「近似布局」

## 缓冲区 dump 试验（未成功，但有结论）

尝试把读取端的字节流抓下来：

| 钩子 | 结果 |
|---|---|
| `QDataStream(QByteArray&)` | 导出存在，但**从未被调用** |
| `QBuffer(QByteArray&)` | 该构造函数**不存在**（只有 `QBuffer(QByteArray*, QObject*)`） |
| `QDataStream(QIODevice*)` | 被调用；按设备 dump 时拿到的是**PNG/JPEG 图像字节**（`89 50 4e 47` 开头） |
| `QIODevice::read`（公有） | 抓到的全是图像数据（81KB / 96KB / 104KB 的 PNG 块） |
| `QIODevice::readData`（保护虚函数） | **未导出**，无法按名字挂钩 |

结论：文档流不是通过公有 `read` 走的，也不是 QByteArray 构造的流；它用的是**某个未导出的虚函数**。

### 下一步的三条可行路线

1. **按地址挂钩**：在 Ghidra 里找到 `QDataStream::operator>>` 的调用者（即读取文档的函数），在其读取前把 `QDataStream` 内部的 `QIODevice*` 取出来，直接读设备缓冲区；
2. **内存搜索**：进程内搜索那四个 double（`-1300`/`-880`/`5103.044…`/`0.1297…`）的字节，命中处即解码后的缓冲区，再反查它来自文件的哪一段；
3. **写入端对照**：挂钩保存时的 `QIODevice` 写入（`QIODevice::write`），拿到**写出去**的字节流，与最终文件逐字节对照，缺的那层变换就是编码方式。

## 写入端抓取与编码排除（本轮）

挂钩 `kernel32!WriteFile`，成功抓到 PureRef 写文件的字节流：

| 块 | 大小 | 内容 |
|---|---|---|
| 01 | 5618 | 头部 + 场景预览 JPEG（与文件前 5618 字节一致） |
| 02 起 | 4096/块 | 后续数据 |

说明**文件就是写入流的拼接**，中间没有额外编码层。

随后对「加载时读出的四个 double」做了完整排除：

| 候选编码 | 结果 |
|---|---|
| double 大端 / 小端 | 0 命中 |
| float32 大端 / 小端 | 0 命中 |
| int32（2580 / 5103 / 4090 / 2523 / 2560…） | 0 命中 |
| 文本形式（ASCII / UTF-16） | 0 命中 |
| BigRational（qint64 分子 / qint64 分母，16 字节步长） | 得到 0.0012、65114 等无意义值 |
| `PureRef.ini` 侧载 | 不含这些数值 |

**结论**：这四个 double（视图偏移 -1300/-880、场景边界 5103.044/4090.761、缩放 0.1297）在文档与配置里都不以字面/整数/有理数/文本形式存在，说明它们是**加载过程中算出来的派生值**，而不是直接存储的字段。

## 下一步建议：硬件观察点

用 x64dbg（或 Frida 的 `MemoryAccessMonitor`）那四个 double 所在的内存地址下**读观察点**，回溯第一处写入：

- 若写入者是「常量 + 整数运算」，坐标来源即存储整数；
- 若写入者是「查表/解码函数」，该函数就是解码器。

这是唯一还能推进的手段；纯静态与纯黑盒排除已经做到极限。

## 突破：原生 `.pur` 的场景数据是 **SQLite 数据库**

用 Frida 抓读取栈，定位到真正的读取函数 `FUN_1401b4550`（`PureRef.exe+0x1b4550`），反编译后一眼看清：

```c
bVar10 = QSqlQuery::next(param_3);
QString::QString(local_118, "scene_rect");
... QVariant::toString(...) ... QVariant::toRectF(...)   → 写进 +0x20..+0x38
QString::QString(local_118, "view_transform");
... 9 个 double 写进 +0x40..+0x88
QString::QString(local_118, "horizontal_scroll"); → toInt → +0x90
QString::QString(local_118, "vertical_scroll");   → toInt → +0x94
```

**它读的是 `QSqlQuery`，不是二进制流。** 之前抓到的 `-1300 / -880 / 5103.044 / 4090.761 / 0.1297` 就是从 `scene_rect`、`view_transform` 两列的**字符串**解析出来的，所以它们永远不可能以双精度字节形式出现在文件里 —— 这也解释了前面所有"编码排除"为什么全部落空。

### 文件布局

在 `NewScene.pur`（1,545,714 字节）中搜索 `SQLite format 3\0`：

| 项 | 值 |
|---|---|
| SQLite 头偏移 | `1,540,096` |
| 页大小 | `4096` |
| 页数（头内声明） | `376` → 库大小 `1,540,096` 字节 |
| 文件大小 | `1,545,714` |
| 差值 | `5,618`（= 头部 5,618 字节，恰好等于写入流第一块） |

### 已读出的表结构

```
images(id INTEGER PRIMARY KEY, source_type INTEGER, origin TEXT, source TEXT,
       format TEXT, checksum TEXT, data BLOB, width INTEGER, height INTEGER)
items, items_images, items_drawings, items_notes, items_groups, metadata
```

`items_images` 里应当就是每张图的位置/尺寸/变换。

### 尚未解决：页序

把文件按 `[尾 5618][前 1540096]` 或 `[前 1540096][尾 5618]` 重排后，SQLite 能读到 **page 1（表结构）**，但查行时报 `database disk image is malformed`，说明 `page 2..N` 的摆放还没对齐。

差值 5,618 = 4,096 + 1,522，说明重排后还有 1,522 字节的错位，需要再定位一次。

**重要**：现在问题从"未知二进制格式"变成了"SQLite 页如何重排"，是有明确边界的工程问题。

## 页重排成功：数据库可以打开了

正确拼法是 **page 1 在文件尾部、其余页在中间**：

```
页 1      = file[1,540,096 .. 1,544,192)        （4,096 字节）
页 2..376 = file[4,096   .. 1,540,096)          （1,536,000 字节 = 375 页）
数据库     = 页 1 + 页 2..376                    （1,540,096 字节 = 376 页）
文件尾部   = file[1,544,192 .. 1,545,714)        （1,522 字节，尚属未解）
```

用这个拼法打开后：

```
images      = 1 行
items       = 1 行
metadata    = 1 行（application_version = 2.1.1）
```

### 完整表结构（已读出）

```sql
images(id INTEGER PRIMARY KEY, source_type INTEGER, origin TEXT, source TEXT,
       format TEXT, checksum TEXT, data BLOB, width INTEGER, height INTEGER)
items(parent INTEGER, id INTEGER PRIMARY KEY, name TEXT, transform BLOB,
      sort_order BLOB, z REAL, opacity REAL, locked INTEGER, comment INTEGER)
items_images(image INTEGER, playback_speed REAL, id INTEGER PRIMARY KEY,
             playback_state INTEGER, image_transform BLOB, image_bounds BLOB,
             playback_frame INTEGER, flags INTEGER)
items_notes(text_color TEXT, id INTEGER PRIMARY KEY, fixed_size TEXT,
            background_color TEXT, text TEXT, style INTEGER)
items_groups(id INTEGER PRIMARY KEY, background_color TEXT, lock_mode INTEGER)
items_drawings(id INTEGER PRIMARY KEY, strokes BLOB)
metadata(id INTEGER PRIMARY KEY, scene_rect TEXT, application_version TEXT,
         view_transform TEXT, thumbnail BLOB, horizontal_scroll INTEGER,
         vertical_scroll INTEGER, last_save_path TEXT, last_load_path TEXT,
         last_load_checksum TEXT, saved INTEGER)
```

样例行（`快照1`）：

| 表 | 值 |
|---|---|
| `items` | `parent=-1, id=0, name=快照1, z=1, opacity=1, locked=0` |
| `items_images` | `image=0, id=0, flags=1, playback_speed=1` |
| `metadata` | `application_version=2.1.1` |

### 新的卡点：几何数据以 **text** 存字节，且有少量字节被 UTF-8 往返破坏

`typeof(transform)` = `text` 而 `length(transform)` = `0`（早早就出现 NUL），
`length(CAST(transform AS BLOB))` = `89`（原始 80 字节被 UTF-8 扩成 89）。

`items.transform` 与 `items_images.image_transform` 是 **80 字节的 Qt 序列化数据**（前 4 字节是长度），
里面是 double；但经 text 列往返后，个别非法 UTF-8 字节被替换成 `U+FFFD`，长度从 80 掉到 77。

**解决方向**：绕开文本接口，直接按页读取 B 树单元格里的原始字节（或让查询走 `CAST(... AS BLOB)` 的底层表示）。

### `images.data`

`typeof(images.data)` = **blob**（真正的二进制），但查询该表会报 `database disk image is malformed` —— 说明这棵 B 树的溢出页还在文件尾部那 1,522 字节或别处，尚未归位。

## 自写页级读取器（本轮）

不再经过 SQLite 的文本接口，直接按页解析 B 树：

- 表根页：`images=3, metadata=4, items=5, items_images=6, items_drawings=7, items_notes=8, items_groups=9`
- 单元格解码要点：**文本长度是 `(type-13)/2`，blob 长度是 `(type-12)/2`**（用错会让每个字符串多一个字节）
- 页 1 的 B 树头在 `base + 100` 处，页内指针相对页首
- 读取结果：`items` 行 = `parent=255(有符号 -1), name=快照1, z=1, opacity=1, locked=0`

### 几何 blob 的真实形态

`items.transform` 原始 89 字节：

```
00 00 00 50 00 3f c3 b0 00 00 ...
```

`c3 b0` 是 **U+00F0 的 UTF-8**，说明写入方把原始字节按 **Latin-1 逐字节**转成 QString 再存成 UTF-8：
每个 ≥0x80 的字节变成两字节，89 = 77 + 12，即原文 77 字节、含 12 个高字节。

也就是说：**存储的 77 字节里，前 4 字节仍是 `00 00 00 50`（声明 80）** —— 与声明长度不符，说明写出时就已经不是"80 字节 + 长度头"的朴素结构，或者长度头另有含义。

这段仍是最后一个未解点：需要确定 77 字节的字段布局（9 个 double 是 72 字节，剩 5 字节的头）。

### 已可用的结论

| 项 | 状态 |
|---|---|
| 容器 = SQLite | ✅ |
| 页序 = 页 1 在尾 + 其余在中 | ✅ |
| 七张表结构与行 | ✅ 可读 |
| `images.data` | 未验证（该表 B 树遍历未做） |
| `items.transform` 字段语义 | ⚠️ 77 字节待拆 |

## 场景数据库读取器（已落地）

新增 `src/vault/pur-sqlite.ts`：

| 导出 | 作用 |
|---|---|
| `openSceneDatabase` | 找 `SQLite format 3`、按「页 1 在尾 + 其余在中」重排，容忍声明页数大于实际 |
| `readTable` | 自己走 B 树（叶子 `0x0d` / 内部 `0x05`），**溢出页链**已按 SQLite 规则拼接 |
| `unescapeTextBytes` | 还原 Latin-1 展开（`c3 b0` → `f0`） |
| `decodeTransform` | 5 字节头 + 9 个 double（QTransform），`m31/m32` 即世界坐标 |
| `readPurScene` | 一次读出 images / items / items_images / items_notes / items_groups / metadata |

### 已验证

| 文件 | 结果 |
|---|---|
| `NewScene.pur` | 1 item @ (2523.0, 2663.1)，缩放 1.0；原图 40287×11239、1,500,137 B JPG |
| `道具.pur` | 15 items，坐标如 (143.6, 139.4) / (411.8, 140.9)，缩放 0.354 / 0.292 |
| `科学家人物概念设计.pur` | 15 items，坐标如 (−1350.5, 1062.0)，缩放 0.906 |

**交叉验证**：`items.transform` 的 `m31/m32` 与 Frida 抓到的 QGraphicsItem scene position 完全一致。

### 仍待解决

1. `images` 表在 `道具.pur` / `科学家…pur` 读出 0 行 —— 大 BLOB 的溢出页链拼接仍有偏差（`NewScene.pur` 能读出 1.5MB 原图，说明链路在某类页序下成立）
2. `items_images.image` 与 `images.id` 的对应在部分文件偏移一位，需要按 rowid 再核对
3. `NewScene1.pur` 识别不到库（声明页数与实际长度不符）

## 头块长度因文件而异（本轮）

对照实验结论：**页 2 起在文件里的起点不是固定的 `pageSize`**。

| 文件 | `SQLite format 3` 偏移 | 页 2 真实起点 |
|---|---|---|
| `NewScene.pur`(439908e1) | 1,540,096 | 4,096 |
| `道具.pur` | 1,699,840 | **12,288**（3 页） |

`道具.pur` 用 12,288 起点的拼法，SQLite 打开后 `images` 表能读出 **15 行**（此前 0 行）。

因此 `openSceneDatabase` 改为**按页步长搜索头块长度**：从 0 到 `min(marker, 64 页)`，逐个候选检查「页 2 与后一页是否为合法 B 树页」（`0x02/0x05/0x0a/0x0d`），首个通过的候选即采用。

### 当前读取结果

| 文件 | images | items | 备注 |
|---|---|---|---|
| `NewScene.pur` | 1 | 1 | 列解码异常（尺寸 NaN），偏移选择可能选中了错误候选 |
| `道具.pur` | 15 | 0 | images 有了，items 读不出 |
| `科学家人物概念设计.pur` | 15 | 1 | 同上 |

说明**候选接受条件太弱**：只检查页类型不足以确定唯一正确偏移，两个候选都能通过但只有一个能完整解码。下一步应把「能读出 items 与 images 且有非零尺寸」作为接受条件。

## 偏移搜索实验（已回退）

把「按页步长搜索头块长度」实现并验证后，结论是**不能只看页类型接受候选**：

| 文件 | 单页头（原实现） | 偏移搜索 |
|---|---|---|
| `NewScene.pur`(439908e1) | images=1（2560×1080、1465KB）✅ | images=1 但尺寸 NaN ❌ |
| `道具.pur` | images=0 | images=15 但尺寸 0 ❌ |

即：搜索到的新偏移让 `images` 行数出现，但**列解码整体错位**（尺寸变 NaN / 0），说明该候选并不是真正的页起点。

**已回退到单页头的实现**（`openSceneDatabase` 直接用 `[pageSize, marker)` 作为页 2 起），保留已验证可用的能力：

| 文件 | images | items | 坐标 |
|---|---|---|---|
| `NewScene.pur` | 1（2560×1080、1.46MB） | 1 | (2523.0, 2663.1) ✅ |
| `道具.pur` | 0 | 15 | (143.6, 139.4) … ✅ |

### 结论与下一步

正确的候选接受条件不能是「页类型合法」，而必须是「**解码后列值合理**」：例如 `images.width/height` 为正、`items.transform` 长度恰为 9。实现时应：

1. 枚举候选（页步长）；
2. 对每个候选完整解码；
3. 用「尺寸为正的图片数 + 带 9 个 double 的 item 数」打分；
4. 取最高分。

这次实验里第 3 步的打分被页类型预筛选干扰（预筛选只保留了一个错误候选），所以拿不到正确结果 —— 去掉预筛选、直接全量解码打分才是正解。

## 按解码值打分（已实现）

`readPurScene` 现在：

1. 枚举候选（页步长 0..32 页，**不做页类型预筛选**）；
2. 对每个候选完整解码；
3. 打分 = `尺寸有效的图片数 × 8 + 有 9 个 double 的 item 数 × 4 + 图片数 + item 数`；
4. 取最高分。

### 结果

| 文件 | images | items | 坐标 | 耗时 |
|---|---|---|---|---|
| `NewScene.pur` | 1（2560×1080、1465KB） | 1 | (2523, 2663) ✅ | 5ms |
| `道具.pur` | 0 | 15 | (144, 139) ✅ | 3ms |
| `科学家人物概念设计.pur` | 0 | 15 | (−1350, 1062) ✅ | 5ms |

**仍未解决**：后两份文件的 `images` 表依旧是 0 行。

### 已知线索（下一步的抓手）

用真正的 SQLite 打开 `道具.pur` 时：

- shift=4,096 → `items=15, images=0`
- shift=12,288 → `images=15, items=0`

**同一份文件，两个偏移分别让不同的表可用** —— 这说明页 2 起的实际布局不是「单一连续区块」，更可能图像页与元数据页**分别放在两个区域**（例如文件前部存小记录、后部存大 BLOB）。

验证方法：读 `sqlite_master` 里 `images` 的根页号，再检查该页号在两个候选里分别落在文件的哪个偏移 —— 若两个候选给出的物理偏移不同却都能读，就证明存在「分区域存放」。

## 分区假设的验证结果

对 `道具.pur`（marker=1,699,840、pageSize=4096、415 页）逐个偏移检查根页落点：

| 候选 shift | images(页 3) | metadata(页 4) | items(页 5) | notes(页 8) |
|---|---|---|---|---|
| 4,096 | offset 8,192 → **0x55 非法** | 12,288 ✓ | 16,384 ✓ | 28,672 ✓ |
| 12,288 | 16,384 ✓ | 20,480 ✓ | 24,576 ✓ | 36,864 ✗ 空页 |

**关键矛盾**：`shift=4096` 时页 5 落在 16,384，`shift=12288` 时页 3 也落在 16,384 —— **两个不同逻辑页映射到同一物理偏移**，说明「页 2 起连续存放」这个模型本身是错的。

进一步按页扫描（把每个 4096 对齐偏移当作叶子页尝试解码）：

| 偏移 | 结果 |
|---|---|
| 20,480 | 15 行，宽度都是 1（像 `items_images`） |
| 98,304 | 2 行，宽度 50,533 / 736（**像真图**） |

图像表的叶子页出现在 **98,304**，远离前几个根页 —— 证实页在文件中的物理顺序**不等于**逻辑页号顺序。

### 下一步的正确模型

需要建立「逻辑页号 → 文件偏移」的映射，而不是单一 shift：

1. 用 `sqlite_master` 得到各表根页号；
2. 对每个逻辑页，扫描所有 4096 对齐偏移，找出能被该表结构成功解码的页（列数与类型匹配、数值合理）；
3. 记录映射后按逻辑页号读取，遇到溢出页再按映射跟随。

这是把「单 shift」换成「页映射表」的工作量升级，但也是唯一能同时拿到 items 与 images 的路。

## 页序问题的解法：按页扫描重建图片表（已实现）

页在文件中不按逻辑顺序排列，单一偏移无法同时满足所有表。解法不是猜偏移，而是**按内容识别页**：

`salvageImages(bytes, wanted)`：

1. 以 `pageSize` 为步长扫描整个文件；
2. 把每个 `0x0d`（表叶子）页当作候选，解出记录；
3. 只保留「9 列 + 第 7 列是 blob 且以 JPEG/PNG 魔数开头 + 宽高为正且合理」的行；
4. 用 `rowId` 作为 image id，与 `items_images.image` 对得上。

### 效果

| 文件 | 之前 | 现在 |
|---|---|---|
| `道具.pur` | images=0 → 回落预览图（彩色噪点） | **14 张**（1190×1600、736×736、736×1104…） |
| `科学家人物概念设计.pur` | images=0 | **6 张**（含 1362×1153、1322KB） |
| `NewScene.pur` | images=1 | images=1（2560×1080，未被覆盖） |

导入结果：

```
道具.pur: 15 张, skipped 0 :: (144,139 260x390) (412,141 261x392) (756,144 412x409)
科学家:   7 张, skipped 0 :: (-1350,1062 1234x1044) (-1412,3020 1149x1088)
```

界面实测截图：参考图（蒸汽朋克机械）**按真实位置、原图质量**排布，无噪点。

### 注意

salvage 只在「正常读表缺失所需 id」时触发（`importPlacedScene` 里判断 `missing`），因此不会覆盖已能正确读取的文件。

## 附：旧版容器（无 SQLite）观察记录

本机真实样本里出现了第三种 `.pur` 形态，与 SQLite 版并存，记录如下，供后续决定是否深挖。

| 观察 | 证据 |
|---|---|
| 文件里**没有** `SQLite format 3` 头 | `G:\desktop\Work(1).pur`（89MB）全文件搜索为 0 |
| 头部是可读的版本串 | 前 32 字节为 `00 00 00 08 00 31 00 2e 00 31 00 30 ...`，按 ASCII 读作 `1.10`，随后是哈希样字符串 |
| 图片内嵌，且**以 PNG 为主** | 全文件 `89 50 4e 47` 出现 28 次、`ff d8 ff` 出现 8 次 |
| 现有兜底只扫 JPEG | 因此这个文件在修复前导入结果是 0 张 |
| PNG 分块链可以完整走到 `IEND` | 28 张全部能取出，尺寸合法 |

修复后：同一文件导入 28 张卡片，按网格近似排布（`placed=false`），符合「容器不可解析时仍给用户结果」的兜底设计。

**未做**：这个容器的元素坐标/层级/备注结构仍未知。要做的话需要按 QDataStream 反序列化，先确定它的类名与字段顺序（可参考 SQLite 版 `transform` 的做法：5 字节头 + 9 个 double）。
