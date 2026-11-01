# PureRef 逆向笔记

## 结论摘要

| 项 | 结论 | 证据 |
|---|---|---|
| 渲染 | Qt6 + QGraphicsView 光栅，**无 OpenGL** | 导入表中无 `opengl32` / `Qt6OpenGL` / `glTexImage*` |
| 图像 | 每张图以 `[uint32 大端长度][PNG 或 JPEG 字节]` 内嵌 | `Work(1).pur` 内 84.7MB 的合法 JPEG（末尾 `FFD9`） |
| 容器 | 两种：**ZIP + contents.xml**（可精确解析）与 **QDataStream 原生**（坐标结构未解） | `test.pur` 为 ZIP；`Work(1).pur` 头为 `QString "1.10"` |
| 坐标精度 | `BigRational`（Qt 内部有理数），缩放不漂移 | 导入表与字符串线索 |

## Ghidra 环境（重要：踩过的坑）

装好的路径与配置：

- Ghidra `C:\t001s\ghidra_12.1.3_PUBLIC`
- JDK `C:\t001s\jdk-21.0.13+9`（`java_home.save` 已指向它）
- 工程 `C:\t001s\ghidra-proj\PureRefSample.gpr`，已完整分析（**29,618 个函数**）

### 坑 1：脚本首字节带 BOM

PowerShell 的 `Set-Content -Encoding UTF8` 会写 BOM，Ghidra 的 Java 脚本编译器报：

```
error: illegal character: '\ufeff'
```

表现为 `The class could not be found... Failed to get OSGi bundle containing script`。
**写脚本必须无 BOM**（`[System.IO.File]::WriteAllText(..., UTF8Encoding($false))`）。

### 坑 2：非平凡脚本仍然加载失败

即使无 BOM、`javac` 单独编译通过，只要脚本 import 了 `ghidra.program.model.symbol.*` 之类，
Ghidra 的 OSGi 脚本宿主仍然报同样的 "bundle" 错误；只有极简脚本（仅 import `GhidraScript`）能跑。

### 解决方案：绕开 OSGi，用 API 写独立 Java 程序

```java
Application.initializeApplication(
    new GhidraApplicationLayout(),
    new HeadlessGhidraApplicationConfiguration());
GhidraProject project = GhidraProject.openProject(projDir, projName, false);
Program program = project.openProgram("/", file.getPathname(), false);
DecompInterface decompiler = new DecompInterface();
decompiler.openProgram(program);
```

- 编译：`javac -cp "<Ghidra 全部 jar 用 ; 连接>" -d <out> PurDump.java`
- 运行：`java -cp "<jars>;<out>" PurDump <projDir> <projName> <程序名片段>`
- 脚本源码：`G:\Software\dsh-temp\pur-re\PurDump.java`、`PurDump2.java`

**这一步跑通了，函数级分析不再受阻。**

## 已定位的关键函数（PureRef.exe）

导入表中被引用的序列化符号：`QDataStream`(27)、`~QDataStream`(68)、`QByteArray`(29)、`~QByteArray`(392)、`QImage`(1)、`QImageReader/Writer` 若干。

按「引用序列化符号次数」排序的前几名：

| 地址 | 引用数 | 形态线索 |
|---|---|---|
| `FUN_14015e710` | 33 | 参数含 `QIODevice*`、`QString*`，函数内构造 `QDataStream`、末尾 `QByteArray::QByteArray(...)` → **疑似写出（save）** |
| `FUN_14024e4c0` | 31 | 待查 |
| `FUN_14024b0a0` | 24 | 待查 |
| `FUN_14014f4c0` | 21 | 待查 |

## 下一步

1. 在候选函数里找 `QDataStream::operator>>` 的调用点 → 定位**读取（load）**函数。
2. 读出各字段的读取顺序与类型（double 的 x/y/w/h、QString、QByteArray 图像块）。
3. 用真实 `.pur` 验证：解析出的图片数量与 `extractEmbeddedPictures` 一致，坐标能落在合理范围内。
4. 把结果接进 `src/vault/pur-import.ts` 的 `importNativePur`，替换当前的网格近似布局。

## 第二批事实（本轮）

### ZIP + XML 不是 PureRef 的格式

在 `PureRef.exe`（20.7MB）里搜字符串：

| 字符串 | 命中 |
|---|---|
| `contents.xml` | **0** |
| `purz` | 0 |
| `PureRef scene` | 24 |
| `.pur` | 82 |

结论：`test.pur`（ZIP + `contents.xml`）**不是 PureRef 写出来的**，而是第三方/转换工具产生的交换格式。所以"让 PureRef 存成我们读得懂的格式"这条路不存在；精确导入原生 `.pur` 只能靠逆向。

### 流操作符的导入情况

- 被引用的流操作符只有 2 类：`operator<<`(2 处)、`operator>>`(1 处)，且都属于 Qt6Widgets/Qt6Gui（`QBrush`/`QFont`/`QTransform` 等），**不是** `QDataStream` 的基本类型操作符。
- `QDataStream::operator<<(double)` 是成员函数，且**被内联**进了调用者 → 反编译里看不到成串的写调用，只能从汇编层的缓冲区写入推断字段。
- 另外确认两个函数是 **IPC/共享内存命令通道**（`FUN_1400eeae0` 读单 bool、`FUN_14003daa0` 读命令字符串），与场景无关。

### 场景写出函数

`FUN_14015e710(QString*, QString*, QIODevice*, ...)`：收 `QIODevice*`、栈上构造 `QDataStream`、结尾处理 `QByteArray` —— 是**存盘**入口。其读取对应函数尚未定位（字段读取被内联，需要在汇编层比对）。

### 结论与下一步

精确坐标恢复需要**汇编级**阅读写盘函数的缓冲区写入序列，属于多轮工作量。若要继续，需要：

1. 一份**已知布局**的极小原生 `.pur`（例如 2 张图，坐标 (0,0) 与 (500,300)，尺寸固定）作为 ground truth；
2. 在 `FUN_14015e710` 及其调用者里逐段比对写入偏移，反推 double 字段顺序；
3. 用该样本验证解析器后，再对 `Work(1).pur` 回归。

## 第三批事实（严格校验后的修正）

### JPEG 长度前缀不可信

用「声明长度必须正好落在 `FFD9`」严格校验后，前面那些"大图"全部落选：

| 文件 | 宽松匹配 | 严格匹配 | 严格匹配得到的尺寸 |
|---|---|---|---|
| `科学家人物概念设计.pur` | 5 张（含 1.3MB 的 25070×17287） | **1 张** | 9KB / **256×256** |
| `道具.pur` | 3 张 | **1 张** | 12KB / **256×256** |
| `Work(1).pur` | 1 张（82MB） | **0 张** | — |

结论：**25070×17287、82MB 这些是误报**（只是碰巧以 `FFD9` 结尾的跨度）。真正能稳定识别的只有 **256×256 的预览图**，即 PureRef 存在场景里的缩略图。

### 原图不是原始 RGBA

对 `道具.pur`、`科学家人物概念设计.pur` 扫描「int32 宽高 + w*h*4 字节 + alpha 多为 255」的原始 RGBA 候选：**0 个**。所以全分辨率图像不是无压缩 QImage，而是某种我们尚未解出的分块/压缩结构。

### 对导入功能的影响

- 原生 `.pur` 目前能可靠导入的是**场景内置预览图**（256px）。用于参考板够看轮廓，但不是原图。
- 精确的原始布局与全分辨率图像仍需继续逆向；ZIP+XML 变体可精确导入（但那不是 PureRef 自己写的格式）。

## 锚点样本（NewScene.pur, 1,563,638 字节）逐字节结论

用户提供的锚点样本结构已解析到"记录级"：

```
off 0   00 00 00 06         QString 字节长度 6
off 4   00 32 00 2e 00 31   "2.1"          ← 格式版本
off 10  00 00 00 00         QString 长度 0  （空串，可能是画布名）
off 18  00 00 00 17         （待定，23）
off 22  00 00 00 0a         QString 长度 10
off 26  00 32 00 2e 00 31 00 2e 00 31   "2.1.1"
off 36  00 00 00 40         QString 长度 64 字节 = 32 字符
off 38  "@47781e09d54e1b022f6e8bf77b8bdd1f"   ← 前导 '@' + 32 位十六进制（图像内容哈希）
off 102 00 00 3b 8a         uint32 BE = 15242
off 106 ff d8 ff e0 ...     JPEG 数据（15242 字节，EOI 实际落在 +15246 处）
```

**关键否定结果**（对定位坐标最重要）：

| 假设 | 结果 |
|---|---|
| 坐标是 8 字节 double（500.0 / 300.0 / 200.0 / 150.0） | 全文件 **0 处** |
| 坐标是 4 字节 float | **0 处** |
| 坐标是 int32 / int64（500、300、500000、1000） | **0 处** |
| 坐标是 UTF-16 文本（"500"、"300"） | 全文件仅 3 个 UTF-16 串（"2.1"、"2.1.1"、哈希），**无坐标** |
| 全分辨率图像是 Qt qCompress（`[u32][78 9c]`） | inflate 尝试 **0 命中** |
| 全分辨率图像是裸 RGBA | **0 候选** |

另外：该文件按「JPEG 魔数 → 找 EOI」只能得到 **1 张 15KB 图**，而用户放了 2 张；说明第二张（以及真正常见的"大图"）存放在另一种尚未解码的分块结构里。

## 下一步：差分锚点（决定性手段）

与其猜字段，不如**做差**：

1. 在 PureRef 里把同一张图从 (0,0) 拖到 (500,300)，**另存一份**（其余不动）；
2. 把两份 `.pur` 给我。

两个文件几乎只差坐标字段，逐字节 diff 就能**直接读出**坐标的编码（偏移、宽度、整数/定点/有理数），不需要任何格式知识。这一步能一次性解决"坐标怎么存"的问题。

## 差分尝试（第二次样本对比）

对比两份 `NewScene.pur`：

| 指标 | 值 |
|---|---|
| A（附件里那份） | 1,563,638 字节 |
| B（`G:\desktop\NewScene.pur`） | 1,545,714 字节 |
| 相同 4KB 块 | **370 / 377（约 1480KB 完全一致）** |
| 差异区域 | `0..20480`（20KB）与 `1536000..1544192`（8KB） |
| 头部差异 | 仅 **偏移 20 的 1 个字节**：A=`a0`，B=`80`（其余头部完全一致） |
| 偏移 38 的哈希串 | A=`@47781e09…`，B=`@e931706e…` → **不同** |

判定：这**不是**"同一批图片、只挪动一张"的差分样本。

- 起始 20KB 的差异正好覆盖第一张图的完整记录（15KB JPEG + 头部），说明**第一张图本身换掉了**；
- 结尾 8KB 的差异紧跟一个 JPEG 的 `FF D9` 之后，是另一条记录的变化；
- 若只是移动坐标，差异应该只有几十字节。

## 结论：差分样本的要求

需要的两份文件必须满足：

1. **同一个画布**（同一批图片，不要增删）；
2. 只**拖动一张图**（例如从 (0,0) 拖到 (500,300)）；
3. 两次都"另存为"**不同的文件名**（不要覆盖原文件，否则拿不到旧版）；
4. 其他都不动（不改缩放、不加标注）。

满足这四条时，两个文件应当只有几处字节不同，那一处就是坐标字段。

## 第三、四次差分尝试：仍不是同一批图片

| 对比 | 相同块 | 差异 | 结论 |
|---|---|---|---|
| 首次样本 vs `G:\desktop\NewScene.pur` | 370/377（1480KB 相同） | 20KB + 8KB | 图片被替换 |
| `NewScene.pur`(439908e1) vs `NewScene1.pur`(da54ef26) | 1488/1503 | 4 段共约 15KB | 图片仍不同 |

判定依据（第二次对比）：

- 每个文件头部第一条记录的哈希串不同（`e931706e…` vs `583766aa…`）；
- 紧跟的 JPEG 长度不同（5510 vs 3659 字节）；
- 差异落在 JPEG 数据的**单个字节**上（`@41`、`@43`、`@47`…），说明**像素数据本身不同**，不是同一个文件挪了位置。

**重要反证**：第一次对比里有 1480KB 完全一致，说明 PureRef 保存时**不会重新编码图片**。所以只要两次保存的是同一批图片，差分法一定有效——目前的障碍只是样本内容不同。

### 一个可立即使用的替代路径

PureRef 支持把选中图片**复制到剪贴板**。在 PureRef 里 `Ctrl+A` → `Ctrl+C`，再到画布上 `Ctrl+V`，图片会作为图片卡片逐个导入（位置不保留，但原图质量完整）。这条路**不依赖逆向**，现在就能用。

## 结论

原生 `.pur` 的**坐标与全分辨率图像**在现有证据下仍未解出：

- 坐标不是 double/float/int32/int64/文本；
- 全分辨率图像不是裸 RGBA、不是 zlib/qCompress、不是 PNG；
- 能稳定取出的是每张图 3–15KB 的 JPEG 预览。

继续需要的只是一份**合格差分样本**（同画布、同图片、只移动一张、两次另存为不同文件名）。