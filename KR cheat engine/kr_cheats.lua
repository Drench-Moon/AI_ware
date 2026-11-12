--[[
    Kingdom Rush 作弊模块 v30
    热键（进关卡后生效）：
      4   = （空，留给游戏选英雄）
      5   = 金币 +1000
      6   = 命数 +1
      7   = 全屏秒杀所有敌人
      8   = 跳过当前波次
      9   = 开关无限技能（流星/援兵无冷却）
      F9  = 调试
      P   = 暂停/继续游戏

    删除本文件即可完全移除作弊。
]]

local cheat_dir = os.getenv("APPDATA") .. "\\kingdom_rush\\"
local function write_log(msg)
    pcall(function()
        local f = io.open(cheat_dir .. "kr_cheat_log.txt", "a")
        if f then
            f:write(os.date("%H:%M:%S") .. " " .. tostring(msg) .. "\n")
            f:close()
        end
    end)
end

write_log("=== v30 加载 ===")

-- ====== 屏幕提示（无方框，仅文字+阴影） ======
local toast_text = ""
local toast_timer = 0

local paused = false
local infinite_skills = false

-- 提前召唤下一波的队列（按几次就依次召唤几波）
local wave_skip = { pending = 0, last_ts = nil, timer = 0 }

-- 等待游戏自己处理死亡的敌人：只把血扣到 0，让游戏跑自己的死亡动画/尸体淡出
local pending_kills = {}
-- 死亡观察：记录死亡后游戏对尸体做了什么（用于诊断）
local death_watch = {}

local function show_toast(msg)
    toast_text = msg
    toast_timer = 2.0
    write_log(msg)
end

-- ====== 工具 ======
local function get_store()
    local g = _G.game
    if g and g.store then return g.store end
    return nil
end

local function iter_entities(store)
    if not store or not store.entities then return function() end end
    return pairs(store.entities)
end

-- ====== 作弊功能 ======
local function add_gold(amount)
    local s = get_store()
    if not s then show_toast("未进入关卡"); return end
    if s.player_gold ~= nil then
        s.player_gold = s.player_gold + amount
        show_toast("+" .. amount .. " 金")
    else
        show_toast("无 player_gold")
    end
end

local function add_life(n)
    local s = get_store()
    if not s then show_toast("未进入关卡"); return end
    if s.lives ~= nil then
        s.lives = s.lives + n
        show_toast("+" .. n .. " 命")
    else
        show_toast("无 lives")
    end
end

-- 把敌人血量扣到 0，交给游戏自己的死亡流程（动画+尸体淡出+清理）
local api_logged = false
local function log_entity_api(e)
    if api_logged then return end
    api_logged = true
    -- 实体自身字段
    local parts = {}
    for k, v in pairs(e) do
        if type(v) == "function" then parts[#parts + 1] = tostring(k) end
    end
    write_log("敌人函数字段: " .. table.concat(parts, ","))
    -- 元表方法（游戏通常把方法放在元表里）
    local mt_names = {}
    if type(debug) == "table" and type(debug.getmetatable) == "function" then
        local ok, mt = pcall(debug.getmetatable, e)
        if ok and type(mt) == "table" then
            for k, v in pairs(mt) do
                if type(v) == "function" then
                    mt_names[#mt_names + 1] = tostring(k)
                end
            end
        end
    end
    write_log("敌人元表方法: " .. table.concat(mt_names, ","))
    write_log(string.format("animation_start=%s unit.hide_after_death=%s fade=%s",
        tostring(type(e.animation_start)),
        tostring(type(e.unit) == "table" and e.unit.hide_after_death or nil),
        tostring(type(e.unit) == "table" and e.unit.fade_time_after_death or nil)))
end

local function request_kill(e)
    local h = e and e.health
    if type(h) ~= "table" or type(h.hp) ~= "number" then return false end
    local before = h.hp
    h.hp = 0
    if type(e.health_bar) == "table" then
        e.health_bar.hidden = true
    end
    log_entity_api(e)
    -- 不要隐藏尸体：让精灵保留下来走淡出，而不是瞬间消失
    if type(e.unit) == "table" then
        e.unit.hide_after_death = false
        if type(e.unit.fade_time_after_death) ~= "number" then
            e.unit.fade_time_after_death = 2
        end
    end
    -- 尝试让游戏播放死亡动画
    if type(e.animation_start) == "function" then
        pcall(e.animation_start, e, "death")
    elseif type(e.animation) == "table" and type(e.animation.start) == "function" then
        pcall(e.animation.start, e.animation, "death")
    end
    if h.dead ~= true then
        pending_kills[#pending_kills + 1] = { e = e, t = 0.35 }
    end
    -- 记录死亡瞬间的数据，稍后对比游戏改了什么
    if #death_watch < 12 then
        death_watch[#death_watch + 1] = {
            e = e,
            name = tostring(e.template_name or "?"),
            t = 0,
            stage = 0,
            hp_before = before,
            dead0 = h.dead,
            death_ts0 = h.death_ts,
            delete0 = h.delete_after,
            lifetime = h.dead_lifetime,
        }
    end
    return true
end

-- 观察死亡后 0.2s / 1s / 3s 的状态
local function update_death_watch(dt)
    if #death_watch == 0 then return end
    local s = get_store()
    local now = (s and (s.ts or s.tick_ts)) or 0
    for i = #death_watch, 1, -1 do
        local w = death_watch[i]
        w.t = w.t + dt
        local h = w.e and w.e.health
        local mark = (w.stage == 0 and w.t >= 0.2 and "0.2s")
            or (w.stage == 1 and w.t >= 1.0 and "1s")
            or (w.stage == 2 and w.t >= 3.0 and "3s")
        if mark then
            if type(h) == "table" then
                write_log(string.format(
                    "死亡观察 %s @%s dead=%s death_ts=%s delete_after=%s now=%.1f lifetime=%s",
                    w.name, mark, tostring(h.dead), tostring(h.death_ts),
                    tostring(h.delete_after), now, tostring(h.dead_lifetime)))
            else
                write_log(string.format("死亡观察 %s @%s 实体已移除 health=%s",
                    w.name, mark, tostring(h)))
            end
            w.stage = w.stage + 1
            if w.stage >= 3 then table.remove(death_watch, i) end
        end
    end
end

-- 如果游戏没有自己处理，兜底帮它标记死亡（仍保留尸体淡出时间）
local function process_pending_kills(dt)
    if #pending_kills == 0 then return end
    local s = get_store()
    local now = (s and (s.ts or s.tick_ts)) or 0
    for i = #pending_kills, 1, -1 do
        local p = pending_kills[i]
        local h = p.e and p.e.health
        if type(h) ~= "table" or h.dead == true then
            -- 游戏已经自己处理了死亡
            table.remove(pending_kills, i)
        else
            p.t = p.t - dt
            if p.t <= 0 then
                h.dead = true
                h.death_ts = now
                h.delete_after = now + math.max(h.dead_lifetime or 2, 2.5)
                table.remove(pending_kills, i)
                write_log("兜底死亡: " .. tostring(p.e.template_name or "?"))
            end
        end
    end
end

-- 秒杀：把血扣到 0，让游戏按它原本的方式死亡和消失
local function kill_all_enemies()
    local s = get_store()
    if not s then show_toast("未进入关卡"); return end
    local count = 0
    for _, e in iter_entities(s) do
        if e and e.enemy then
            if type(e.health) == "table" and type(e.health.hp) == "number" then
                if e.health.dead ~= true and e.health.hp > 0 then
                    request_kill(e)
                    count = count + 1
                end
            elseif type(e.hp) == "table" and type(e.hp.value) == "number" then
                if e.dead ~= true and e.hp.value > 0 then
                    e.hp.value = 0
                    if type(e.health_bar) == "table" then
                        e.health_bar.hidden = true
                    end
                    pending_kills[#pending_kills + 1] = { e = e, t = 0.35 }
                    count = count + 1
                end
            end
        end
    end
    show_toast("秒杀 " .. count .. " 敌")
end

-- 波次状态转成字符串（便于日志诊断）
local function wave_state_string(s)
    return string.format("组=%s/%s active=%s finished=%s count=%s last_ts=%s",
        tostring(s.wave_group_number), tostring(s.wave_group_total),
        tostring(s.waves_active), tostring(s.waves_finished),
        tostring(s.waves_count), tostring(s.last_wave_ts))
end

-- waves_active 是一张表（正在出怪的波次列表），不是布尔值
local function force_next_wave()
    local s = get_store()
    if not s then show_toast("未进入关卡"); return end
    if s.waves_finished == true then
        show_toast("已是最后一波"); return
    end
    wave_skip.pending = math.min(wave_skip.pending + 1, 30)
    wave_skip.timer = 0
    -- 立刻强制推进到下一波（游戏自带开关，会清掉当前波次剩余敌人）
    s.force_next_wave = true
    wave_skip.last_ts = s.last_wave_ts
    write_log("下一波: " .. wave_state_string(s)
        .. string.format(" 待召唤=%d", wave_skip.pending))
    show_toast("下一波")
end

-- 排队处理：场上清空后自动推进已排队的波次
local function update_wave_skip(dt)
    if wave_skip.pending <= 0 then return end
    local s = get_store()
    if not s or s.waves_finished == true then
        wave_skip.pending = 0
        return
    end
    if wave_skip.last_ts == nil then
        wave_skip.last_ts = s.last_wave_ts
        return
    end
    if s.last_wave_ts ~= wave_skip.last_ts then
        wave_skip.pending = wave_skip.pending - 1
        wave_skip.last_ts = s.last_wave_ts
        wave_skip.timer = 0
        write_log(string.format("下一波已发出: %s 剩余=%d",
            wave_state_string(s), wave_skip.pending))
        return
    end
    wave_skip.timer = (wave_skip.timer or 0) + (dt or 0)
    if wave_skip.timer >= 0.5 then
        wave_skip.timer = 0
        s.force_next_wave = true
        wave_skip.last_ts = s.last_wave_ts
    end
end

-- ====== 无限技能（只清“剩余冷却时间”，不动冷却配置，关掉后能正常恢复） ======
-- 运行时冷却字段名（不含 cooldown 配置本身，避免永久破坏技能）
local function is_runtime_cd_key(key)
    local k = tostring(key):lower()
    return k:find("cooldown_time", 1, true) ~= nil
        or k:find("cooldown_ts", 1, true) ~= nil
        or k:find("cooldown_left", 1, true) ~= nil
        or k:find("cooldown_remain", 1, true) ~= nil
        or k:find("ready_ts", 1, true) ~= nil
        or k == "cd_time" or k == "cd_ts" or k == "recharge_time" or k == "recharge"
end

-- 记录被清零过的原始冷却值，关闭无CD时还原回去
local saved_cd = {}
local saved_cd_keys = {}

local function remember_cd(t, k, v)
    local keys = saved_cd_keys[t]
    if not keys then
        keys = {}
        saved_cd_keys[t] = keys
    end
    if keys[k] then return end
    keys[k] = true
    saved_cd[#saved_cd + 1] = { t = t, k = k, v = v }
end

local function restore_cd()
    for i = #saved_cd, 1, -1 do
        local s = saved_cd[i]
        pcall(function() s.t[s.k] = s.v end)
    end
    saved_cd = {}
    saved_cd_keys = {}
end

local function reset_runtime_cd(tbl, visited, depth)
    depth = depth or 0
    if depth > 10 then return end
    visited = visited or {}
    if visited[tbl] then return end
    visited[tbl] = true
    for k, v in pairs(tbl) do
        if type(v) == "table" then
            reset_runtime_cd(v, visited, depth + 1)
        elseif type(v) == "number" and v > 0 and is_runtime_cd_key(k) then
            remember_cd(tbl, k, v)
            tbl[k] = 0
        end
    end
end

local function apply_infinite_skills()
    local g = _G.game
    if not g then return end
    -- 游戏自带的 1、2 技能按钮：清零剩余冷却
    local gui = g.game_gui
    if type(gui) == "table" then
        local names = { "power_1", "power_2", "power_3" }
        for i = 1, #names do
            local p = gui[names[i]]
            if type(p) == "table" and type(p.cooldown_time) == "number"
               and p.cooldown_time > 0 then
                remember_cd(p, "cooldown_time", p.cooldown_time)
                p.cooldown_time = 0
            end
        end
    end
    pcall(reset_runtime_cd, g)
end

local function toggle_infinite_skills()
    infinite_skills = not infinite_skills
    if infinite_skills then
        show_toast("无CD: 开")
    else
        restore_cd()
        show_toast("无CD: 关")
    end
end

-- ====== 调试：扫描 game 表找玩家技能 ======
local function dump_debug()
    local g = _G.game
    if not g then show_toast("未进入关卡"); return end

    -- 输出伤害队列 / 波次信号 / 缩放等关键结构，便于后续接入游戏原生机制
    do
        local s = get_store()
        if s then
            write_log("===== store 关键字段 =====")
            write_log(string.format("  screen_scale=%s visible_coords=%s",
                tostring(s.screen_scale), tostring(s.visible_coords)))
            write_log(string.format("  damage_queue=%s wave_signals=%s wave_spawn_thread=%s",
                tostring(s.damage_queue), tostring(s.wave_signals),
                tostring(s.wave_spawn_thread)))
            local dq = s.damage_queue
            if type(dq) == "table" then
                local parts = {}
                for k, v in pairs(dq) do
                    parts[#parts + 1] = tostring(k) .. ":" .. type(v)
                    if #parts >= 12 then break end
                end
                write_log("  damage_queue 字段: " .. table.concat(parts, ", "))
                local first = dq[1]
                if type(first) == "table" then
                    local p2 = {}
                    for k, v in pairs(first) do
                        p2[#p2 + 1] = tostring(k) .. ":" .. type(v)
                        if #p2 >= 15 then break end
                    end
                    write_log("  damage_queue[1]: " .. table.concat(p2, ", "))
                end
            end
            local ws = s.wave_signals
            if type(ws) == "table" then
                local parts = {}
                for k, v in pairs(ws) do
                    parts[#parts + 1] = tostring(k) .. ":" .. type(v)
                    if #parts >= 12 then break end
                end
                write_log("  wave_signals 字段: " .. table.concat(parts, ", "))
            end
        end
    end
    local function is_power_key(k)
        return tostring(k):lower():find("power") ~= nil
    end
    local function dump_table(tbl, path, visited, depth)
        depth = depth or 0
        if depth > 5 then return end
        visited = visited or {}
        if visited[tbl] then return end
        visited[tbl] = true
        for k, v in pairs(tbl) do
            local p = path .. "." .. tostring(k)
            if is_power_key(k) then
                if type(v) == "table" then
                    local sub = ""
                    for k2, v2 in pairs(v) do
                        if type(v2) ~= "table" then
                            sub = sub .. k2 .. "=" .. tostring(v2) .. " "
                        else
                            sub = sub .. k2 .. "={...} "
                        end
                    end
                    write_log("  " .. p .. " = { " .. sub .. "}")
                    -- 递归打印子 table
                    for k2, v2 in pairs(v) do
                        if type(v2) == "table" then
                            dump_table(v2, p .. "." .. tostring(k2), visited, depth + 1)
                        end
                    end
                else
                    write_log("  " .. p .. " = " .. tostring(v))
                end
            elseif type(v) == "table" then
                dump_table(v, p, visited, depth + 1)
            end
        end
    end
    dump_table(g, "game")
    show_toast("调试信息已写入日志")
end

-- ====== Hook ======
local orig_keypressed = love.keypressed
local orig_update = love.update
local orig_draw = love.draw
local orig_load = love.load

local in_update = false

local function my_keypressed(key, scancode, isrepeat)
    -- 3、4 不拦截，留给游戏
    if key == "5" then
        pcall(add_gold, 1000)
    elseif key == "6" then
        pcall(add_life, 1)
    elseif key == "7" then
        pcall(kill_all_enemies)
    elseif key == "8" then
        pcall(force_next_wave)
    elseif key == "9" then
        pcall(toggle_infinite_skills)
    elseif key == "f9" then
        pcall(dump_debug)
    elseif key == "p" then
        paused = not paused
        show_toast(paused and "已暂停" or "继续")
    end
    if orig_keypressed then
        pcall(orig_keypressed, key, scancode, isrepeat)
    end
end

local function my_update(dt)
    if in_update then return end
    in_update = true
    if not paused and orig_update then
        pcall(orig_update, dt)
    end
    in_update = false

    if not paused then
        if toast_timer > 0 then toast_timer = toast_timer - dt end
        -- 处理等待游戏自己死亡的敌人
        pcall(process_pending_kills, dt)
        pcall(update_death_watch, dt)
        -- 依次处理排队中的“下一波”
        pcall(update_wave_skip, dt)
    end

    if infinite_skills and not paused then
        pcall(apply_infinite_skills)
    end

    -- 自动恢复 hook
    if love.keypressed ~= my_keypressed then
        orig_keypressed = love.keypressed; love.keypressed = my_keypressed
    end
    if love.update ~= my_update then
        orig_update = love.update; love.update = my_update
    end
    if love.draw ~= my_draw then
        orig_draw = love.draw; love.draw = my_draw
    end
end

function my_draw()
    if orig_draw then pcall(orig_draw) end

    local in_level = get_store() ~= nil

    if paused then
        local w, h = love.graphics.getWidth(), love.graphics.getHeight()
        love.graphics.setColor(0, 0, 0, 150)
        love.graphics.rectangle("fill", 0, 0, w, h)
        love.graphics.setColor(255, 255, 255, 255)
        love.graphics.printf("已暂停  (按 P 继续)", 0, h / 2 - 12, w, "center")
    end

    if toast_timer > 0 and toast_text ~= "" then
        local alpha = 255
        if toast_timer < 0.5 then alpha = 255 * (toast_timer / 0.5) end
        love.graphics.setColor(0, 0, 0, alpha)
        love.graphics.print(toast_text, 12, 12)
        love.graphics.setColor(255, 230, 0, alpha)
        love.graphics.print(toast_text, 10, 10)
        love.graphics.setColor(255, 255, 255, 255)
    end

    if infinite_skills and in_level then
        love.graphics.setColor(0, 255, 0, 200)
        love.graphics.print("无CD", 10, 30)
        love.graphics.setColor(255, 255, 255, 255)
    end
end

local function my_load(...)
    if orig_load then pcall(orig_load, ...) end
    if love.keypressed ~= my_keypressed then
        orig_keypressed = love.keypressed; love.keypressed = my_keypressed
    end
    if love.update ~= my_update then
        orig_update = love.update; love.update = my_update
    end
    if love.draw ~= my_draw then
        orig_draw = love.draw; love.draw = my_draw
    end
    show_toast("就绪 5金 6命 7杀 8波 9无CD P暂停")
end

love.keypressed = my_keypressed
love.update = my_update
love.draw = my_draw
love.load = my_load

write_log("=== v30 完成 ===")
