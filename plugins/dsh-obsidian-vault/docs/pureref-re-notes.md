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