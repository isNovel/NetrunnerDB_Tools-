// popup.js - 處理popup中的用戶設置（支持 Runner/Corp 分別設置）

// 定義所有可配置的欄位
const defaultSettings = {
    // Runner 欄位
    runner_cost: true,
    runner_memory_cost: true,
    runner_strength: true,
    runner_influence: true,
    runner_type: true,
    runner_faction: true,
    // Corp 欄位
    corp_cost: true,
    corp_trash_cost: true,
    corp_agenda_point: true,
    corp_influence: true,
    corp_type: true,
    corp_faction: true
};

document.addEventListener('DOMContentLoaded', function () {
    // 讀取保存的設置並初始化所有復選框
    chrome.storage.sync.get(Object.keys(defaultSettings), function (result) {
        Object.keys(defaultSettings).forEach(function (key) {
            const checkbox = document.getElementById(key);
            if (checkbox) {
                // 默認值為 true（顯示）
                checkbox.checked = result[key] !== false;
            }
        });
    });

    // 為每個復選框添加監聽器
    Object.keys(defaultSettings).forEach(function (key) {
        const checkbox = document.getElementById(key);
        if (checkbox) {
            checkbox.addEventListener('change', function () {
                // 保存設置
                const settings = {};
                settings[key] = checkbox.checked;
                chrome.storage.sync.set(settings, function () {
                    console.log('設置已保存:', key, checkbox.checked);
                });
            });
        }
    });
});
