-- Kingdom Rush Cheat Loader v3
-- 原版 main.lua 已改名为 main_orig.lua
-- 删除存档目录下的 kr_cheats.lua 即可完全关闭作弊功能

-- 用 io.open 写日志到绝对路径（不依赖 love.filesystem identity）
local appdata = os.getenv("APPDATA") or ""
local cheat_dir = appdata .. "\\kingdom_rush\\"
local cheat_file = cheat_dir .. "kr_cheats.lua"

local function loader_log(msg)
    local f = io.open(cheat_dir .. "kr_loader_log.txt", "a")
    if f then
        f:write(os.date("%H:%M:%S") .. " " .. tostring(msg) .. "\n")
        f:close()
    end
end

loader_log("=== Loader v3 启动 ===")
loader_log("appdata: " .. tostring(appdata))
loader_log("cheat_file: " .. tostring(cheat_file))
loader_log("identity: " .. tostring(love.filesystem.getIdentity()))

-- 1. 加载原版游戏
local ok, err = pcall(require, "main_orig")
if not ok then
    loader_log("加载 main_orig 失败: " .. tostring(err))
end
loader_log("main_orig 加载完成，identity: " .. tostring(love.filesystem.getIdentity()))

-- 2. 用 io.open 绝对路径加载作弊脚本（绕过 package.path 和 identity 问题）
local f = io.open(cheat_file, "r")
if f then
    local code = f:read("*a")
    f:close()
    loader_log("读取到 kr_cheats.lua，大小: " .. #code .. " bytes")
    local chunk, compile_err = loadstring(code, "kr_cheats.lua")
    if chunk then
        local ok2, run_err = pcall(chunk)
        if not ok2 then
            loader_log("作弊脚本执行出错: " .. tostring(run_err))
        else
            loader_log("作弊脚本执行成功")
        end
    else
        loader_log("作弊脚本编译失败: " .. tostring(compile_err))
    end
else
    loader_log("未找到 kr_cheats.lua")
end

loader_log("=== Loader v3 结束 ===")
