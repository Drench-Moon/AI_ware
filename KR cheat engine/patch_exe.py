#!/usr/bin/env python3
"""Kingdom Rush 注入器

把 loader_main.lua 写入游戏 exe 内嵌的 ZIP（重命名为 main.lua），
同时把原版 main.lua 备份为 main_orig.lua，由 loader 负责加载。

用法：
    python patch_exe.py --game-dir "D:\\SteamLibrary\\steamapps\\common\\Kingdom Rush"
    python patch_exe.py            # 不带参数时使用下面的默认路径
"""

import argparse
import os
import shutil
import zipfile

# ZIP 数据在 exe 中的起始偏移（Kingdom Rush 6.4.46）
ZIP_START = 99328

DEFAULT_GAME_DIR = r"D:\SteamLibrary\steamapps\common\Kingdom Rush"
DEFAULT_LOADER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "loader_main.lua")


def main():
    ap = argparse.ArgumentParser(description="Kingdom Rush 注入器")
    ap.add_argument("--game-dir", default=DEFAULT_GAME_DIR,
                    help="游戏安装目录（含 Kingdom Rush.exe）")
    ap.add_argument("--loader", default=DEFAULT_LOADER,
                    help="新的 main.lua 内容（默认使用同目录下的 loader_main.lua）")
    args = ap.parse_args()

    exe = os.path.join(args.game_dir, "Kingdom Rush.exe")
    backup = exe + ".bak"
    out_zip = os.path.join(os.path.dirname(os.path.abspath(args.loader)), "repack.love")

    if not os.path.isfile(exe):
        raise SystemExit(f"找不到游戏 exe: {exe}")

    # 首次运行时把原版备份下来；之后一律从备份重新打包，避免二次注入
    if not os.path.isfile(backup):
        print(f"创建备份: {backup}")
        shutil.copy2(exe, backup)
    else:
        print(f"使用已有备份: {backup}")

    with open(args.loader, "rb") as f:
        new_main_data = f.read()
    print(f"新 main.lua 大小: {len(new_main_data)} bytes")

    orig_main_data = None
    with zipfile.ZipFile(backup, "r") as z_in, zipfile.ZipFile(out_zip, "w") as z_out:
        for info in z_in.infolist():
            data = z_in.read(info.filename)
            if info.filename == "main.lua":
                # 原版 main.lua 留存为 main_orig.lua
                orig_main_data = data
                new_info = zipfile.ZipInfo("main.lua", date_time=info.date_time)
                new_info.compress_type = zipfile.ZIP_DEFLATED
                new_info.external_attr = info.external_attr
                z_out.writestr(new_info, new_main_data)
                print(f"  替换 main.lua（原版 {info.file_size} bytes -> 新版 {len(new_main_data)} bytes）")
            else:
                z_out.writestr(info, data)

        if orig_main_data is not None:
            orig_info = zipfile.ZipInfo("main_orig.lua")
            orig_info.compress_type = zipfile.ZIP_DEFLATED
            z_out.writestr(orig_info, orig_main_data)
            print(f"  添加 main_orig.lua（{len(orig_main_data)} bytes）")
        else:
            print("警告: 备份中未找到 main.lua，注入后可能无法启动（可用 .bak 覆盖恢复）")

    # exe 前缀（非 ZIP 部分） + 新 ZIP
    with open(backup, "rb") as f:
        prefix = f.read(ZIP_START)
    with open(out_zip, "rb") as f:
        zip_data = f.read()

    with open(exe, "wb") as f:
        f.write(prefix + zip_data)

    print(f"\n完成，新 exe 大小: {os.path.getsize(exe)} bytes")

    # 校验结果确实是一个可读的 ZIP
    with zipfile.ZipFile(exe, "r") as z_test:
        names = z_test.namelist()
        assert "main.lua" in names, "main.lua 不在新 ZIP 中"
        assert "main_orig.lua" in names, "main_orig.lua 不在新 ZIP 中"
        print(f"校验通过: main.lua 与 main_orig.lua 均存在，共 {len(names)} 个条目")

    print("\n把 kr_cheats.lua 放到存档目录后启动游戏即可：")
    print(f"  {os.path.join(os.environ.get('APPDATA', '%APPDATA%'), 'kingdom_rush')}")


if __name__ == "__main__":
    main()
