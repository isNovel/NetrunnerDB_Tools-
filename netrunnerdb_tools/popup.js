// 標籤對照表
const LABEL_MAP = {
    indeck: '數量 (Qty)',
    title: '名稱 (Title)',
    cost: '費用 (Cost)',
    memory_cost: '記憶體 (MU)',
    trash_cost: '垃圾費 (Trash)',
    strength: '強度 (Str)',
    faction_cost: '影響力 (Inf)',
    type_code: '類型 (Type)',
    faction_code: '勢力 (Faction)'
};

// 預設資料結構 (物件陣列)
const DEFAULT_ORDER = {
    runner: [
        { id: 'indeck', visible: true },
        { id: 'title', visible: true },
        { id: 'cost', visible: true },
        { id: 'memory_cost', visible: true },
        { id: 'strength', visible: true },
        { id: 'faction_cost', visible: true },
        { id: 'type_code', visible: true },
        { id: 'faction_code', visible: true }
    ],
    corp: [
        { id: 'indeck', visible: true },
        { id: 'title', visible: true },
        { id: 'cost', visible: true },
        { id: 'trash_cost', visible: true },
        { id: 'faction_cost', visible: true },
        { id: 'type_code', visible: true },
        { id: 'faction_code', visible: true }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. 讀取設定
    chrome.storage.sync.get(['columnOrder'], (result) => {
        let order = result.columnOrder || DEFAULT_ORDER;

        // 相容性處理：確保格式為物件陣列而非單純字串
        const formatChecker = (list) => list.map(item =>
            (typeof item === 'string') ? { id: item, visible: true } : item
        );

        const runnerData = formatChecker(order.runner);
        const corpData = formatChecker(order.corp);

        renderList('runner-list', runnerData);
        renderList('corp-list', corpData);
    });

    // 2. 儲存事件
    document.getElementById('save-btn').onclick = () => {
        const getOrderFromUI = (listId) => Array.from(document.querySelectorAll(`#${listId} li`)).map(li => ({
            id: li.dataset.id,
            visible: li.querySelector('.visibility-toggle').checked
        }));

        const finalSettings = {
            runner: getOrderFromUI('runner-list'),
            corp: getOrderFromUI('corp-list')
        };

        chrome.storage.sync.set({ columnOrder: finalSettings }, () => {
            // 提示並嘗試重新整理分頁
            const btn = document.getElementById('save-btn');
            btn.innerText = "已儲存！";
            btn.className = "btn btn-success btn-block";

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].url.includes('netrunnerdb.com')) {
                    chrome.tabs.reload(tabs[0].id);
                }
                setTimeout(() => window.close(), 800);
            });
        });
    };
});

// 渲染 UI 列表
function renderList(elementId, items) {
    const list = document.getElementById(elementId);
    list.innerHTML = '';

    items.forEach(item => {
        const li = document.createElement('li');
        li.dataset.id = item.id;
        li.dataset.visible = item.visible;
        li.draggable = true; // 1. 開啟原生拖拽屬性

        if (!item.visible) li.classList.add('hidden-item');

        li.innerHTML = `
            <span class="handle">☰</span>
            <input type="checkbox" class="visibility-toggle" ${item.visible ? 'checked' : ''}>
            <span class="item-label">${LABEL_MAP[item.id] || item.id}</span>
            <div class="btn-group btn-group-xs">
                <button class="btn btn-default up">↑</button>
                <button class="btn btn-default down">↓</button>
            </div>
        `;

        // --- 拖拽邏輯開始 ---
        li.addEventListener('dragstart', (e) => {
            li.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        li.addEventListener('dragend', () => {
            li.classList.remove('dragging');
        });

        list.addEventListener('dragover', (e) => {
            e.preventDefault(); // 必須 preventDefault 才能觸發 drop
            const draggingItem = document.querySelector('.dragging');
            const siblings = [...list.querySelectorAll('li:not(.dragging)')];

            // 尋找要插入在哪個元素之前
            let nextSibling = siblings.find(sibling => {
                return e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2;
            });

            list.insertBefore(draggingItem, nextSibling);
        });
        // --- 拖拽邏輯結束 ---

        // 原本的按鈕與勾選邏輯...
        const checkbox = li.querySelector('.visibility-toggle');
        checkbox.onchange = () => {
            li.dataset.visible = checkbox.checked;
            li.classList.toggle('hidden-item', !checkbox.checked);
        };
        li.querySelector('.up').onclick = () => move(li, -1);
        li.querySelector('.down').onclick = () => move(li, 1);

        list.appendChild(li);
    });
}

function move(el, direction) {
    if (direction === -1 && el.previousElementSibling) {
        el.parentNode.insertBefore(el, el.previousElementSibling);
    } else if (direction === 1 && el.nextElementSibling) {
        el.parentNode.insertBefore(el.nextElementSibling, el);
    }
}