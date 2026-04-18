// NetrunnerDB 簡化收藏擴展 - Content Script
console.log('[NetrunnerDB Extension] 加载中...');

// 全局變量來存儲用戶設置（支持 Runner/Corp 分別設置）
let columnSettings = {
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



// 修正後的 modifycollection 函式，會等待元素出現
function insertEmptyFilterRow() {

    // --- 1. 定義 HTML 結構 ---
    // 這裡使用模板字串來定義新的 HTML 結構
    const newSearchButtonsHTML = `
        <div class="row search-buttons">
        <div class="col-sm-6" style="margin-bottom:10px">
            <div id="faction_code" class="filter btn-group btn-group-justified" data-toggle="buttons"></div>
        </div>
        <div class="col-sm-6" style="margin-bottom:10px">
            <div id="type_code" class="filter btn-group btn-group-justified" data-toggle="buttons"></div>
        </div>
        <div class="col-sm-6" style="margin-bottom:10px">
            <div id="my_code" class="newfilter btn-group btn-group-justified" data-toggle="buttons"></div>
        </div>
    </div>
    `;
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = newSearchButtonsHTML;
    const newRowElement = tempContainer.firstElementChild;
    // --- 2. 查找目標元素 (取代 $('.row.search-buttons')) ---
    const existingSearchButtonsRow = document.querySelector('.row.search-buttons');

    // --- 3. 檢查元素並插入新的結構 ---
    if (existingSearchButtonsRow) {
        existingSearchButtonsRow.replaceWith(newRowElement);
        console.log('✅ 新的篩選器結構已使用原生 JS 成功插入。');
    } else {
        console.error("無法從臨時容器中提取有效的 Element。請檢查 HTML 結構。");
    }

}

// 根據設置動態生成表頭
function generateTableHeader(identityType) {
    let headers = `
        <th style="min-width:85px"><a href="#" data-sort="indeck">Quantity</a></th>
        <th><a href="#" data-sort="title">Name</a><span class="caret"></span></th>
    `;

    if (identityType === 'runner') {
        // Runner 專屬欄位
        if (columnSettings.runner_cost) {
            headers += '<th><a href="#" data-sort="cost">Cost</a></th>';
        }
        if (columnSettings.runner_memory_cost) {
            headers += '<th><a href="#" data-sort="memory_cost" title="Memory Cost">M_Cost</a></th>';
        }
        if (columnSettings.runner_strength) {
            headers += '<th><a href="#" data-sort="strength"  title="Strength">S.</a></th>';
        }
        if (columnSettings.runner_influence) {
            headers += '<th><a href="#" data-sort="faction_cost" title="Influence">I.</a></th>';
        }
        if (columnSettings.runner_type) {
            headers += '<th class="type"><a href="#" data-sort="type_code" title="Type">T.</a></th>';
        }
        if (columnSettings.runner_faction) {
            headers += '<th class="faction"><a href="#" data-sort="faction_code" title="Faction">F.</a></th>';
        }
    } else {
        // Corp 專屬欄位
        if (columnSettings.corp_cost) {
            headers += '<th><a href="#" data-sort="cost">Cost</a></th>';
        }
        if (columnSettings.corp_trash_cost) {
            headers += '<th><a href="#" data-sort="trash_cost" title="Trash Cost">T_Cost</a></th>';
        }
        if (columnSettings.corp_agenda_point) {
            headers += '<th><a href="#" data-sort="agenda_point" titls="Agenda Point"{}></a></th>';
        }
        if (columnSettings.corp_influence) {
            headers += '<th><a href="#" data-sort="faction_cost" title="Influence">I.</a></th>';
        }
        if (columnSettings.corp_type) {
            headers += '<th class="type"><a href="#" data-sort="type_code" title="Type">T.</a></th>';
        }
        if (columnSettings.corp_faction) {
            headers += '<th class="faction"><a href="#" data-sort="faction_code" title="Faction">F.</a></th>';
        }
    }

    return `
        <tr>
            ${headers}
        </tr>
    `;
}

function modifycollection(identityType) {
    const collectionElement = document.getElementById('collection');

    if (collectionElement) {
        const tableHead = collectionElement.querySelector('thead');
        if (tableHead) {
            const newHeaderContent = generateTableHeader(identityType);
            tableHead.innerHTML = newHeaderContent;

            console.log('🎉 <thead> 內容已成功替換為您的客製化版本。', identityType);

        } else {
            console.error("找不到表格的 <thead> 元素。");
        }

    } else {
        // 元素尚未出現，延遲 100 毫秒後再次檢查
        console.log("找不到 ID 為 'collection' 的元素，稍後重試...");
        setTimeout(modifycollection, 100);
    }
}


// 注入脚本到页面上下文
function injectScript() {
    const script = document.createElement('script');
    const settingsStr = encodeURIComponent(JSON.stringify(columnSettings));
    script.src = chrome.runtime.getURL('inject.js') + '?config=' + settingsStr;

    (document.head || document.documentElement).appendChild(script);

    script.onload = function () {
        console.log('[NetrunnerDB Extension] inject.js 注入成功');
        script.remove();
    };

    script.onerror = function () {
        console.error('[NetrunnerDB Extension] inject.js 注入失败');
    };

}

// 等待页面加载完成后初始化
function initExtension() {
    console.log('[NetrunnerDB Extension] 初始化中...');

    // 首先加載用戶設置


    const currentPath = window.location.pathname;
    console.log('[NetrunnerDB Extension] 当前路径:', currentPath);

    if (currentPath.includes('/deck/edit/') || currentPath.includes('/deck/build/')) {
        console.log('[NetrunnerDB Extension] 检测到牌库编辑页面');

        insertEmptyFilterRow();


        // 無論頁面狀態如何，都先確保 DOM 載入後再注入和嘗試修改
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.get(Object.keys(columnSettings), function (result) {
                // 更新所有設置，使用默認值
                Object.keys(columnSettings).forEach(function (key) {
                    if (result[key] !== undefined) {
                        columnSettings[key] = result[key];
                    }
                });
                console.log('[NetrunnerDB Extension] 欄位設置已載入:', columnSettings);

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', injectScript);
                    // 在 DOM 載入後，開始檢查 collection 元素是否出現
                } else {
                    injectScript();
                    // 如果已經載入完成，直接開始檢查
                    const deckElement = document.getElementById('deck');

                    if (deckElement) {
                        deckElement.classList.remove('col-md-6');
                        deckElement.classList.add('col-md-5');
                        const neighborElement = deckElement.nextElementSibling;
                        if (neighborElement) {
                            neighborElement.classList.remove('col-md-6');
                            neighborElement.classList.add('col-md-7');

                        } else {
                            console.warn("找不到相鄰的目標元素。");
                        }


                    }
                }
                // 如果collection元素已存在，重新應用設置
                const collectionElement = document.getElementById('collection');
                if (collectionElement) {
                    const identityType = window.sessionIdentityType ||
                        (window.location.pathname.includes('/deck/build/') ? 'runner' : 'corp');
                    modifycollection(identityType);
                }
            });
        }
    }
}
// content.js
// 執行
// 初始化
initExtension();


window.addEventListener("message", function listener(event) {

    // 檢查是否是來自 inject.js 的準備訊號
    if (event.source === window && event.data.type === "INJECT_READY_SIGNAL") {

        console.log("ContentJS: 收到 InjectJS 準備好的訊號，現在發送數據。");

        // 收到訊號後，安全地發送您的數據 payload
        identityType = event.data.id;
        window.sessionIdentityType = identityType; // 保存session級別的identity類型
        console.log('[Content.js] 成功從 inject.js 接收到數據:', identityType);

        // 3. 呼叫您的 modifycollection 函式，並傳入數據
        modifycollection(identityType);
        if (identityType === 'runner') {
            window.postMessage({
                type: "NRDB_CUSTOM_FILTER_READY",
                name: "Decoder",
                value: "s:Decoder"
            }, "*"); window.postMessage({
                type: "NRDB_CUSTOM_FILTER_READY",
                name: "Killer",
                value: "s:Killer"
            }, "*"); window.postMessage({
                type: "NRDB_CUSTOM_FILTER_READY",
                name: "Fracter",
                value: "s:Fracter"
            }, "*");
            window.postMessage({
                type: "NRDB_CUSTOM_FILTER_READY",
                name: "AI",
                value: "s:AI"
            }, "*");
        } else {

        }

        // 滿足「一次性」要求，移除這個監聽器
        window.removeEventListener("message", listener, false);
    }
}, false);
