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
