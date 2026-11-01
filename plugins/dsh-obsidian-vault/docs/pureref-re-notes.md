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