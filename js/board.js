/**
 * 榜单切换（新书榜 / 阅读榜）。
 *
 * 两个榜单的数据完全独立：data/<board>/ 与 api/<board>/。
 * 当前选中的榜单来自 URL 的 ?board=，其次是 localStorage，默认新书榜。
 * 页面间跳转靠 withBoard() 带上参数，刷新后靠 localStorage 记住。
 */
(function () {
    'use strict';

    var BOARDS = {
        new: { key: 'new', label: '新书榜' },
        read: { key: 'read', label: '阅读榜' }
    };
    var DEFAULT_BOARD = 'new';
    var STORAGE_KEY = 'fanqie-board';

    function storage(action, value) {
        // 隐私模式下 localStorage 会抛异常，静默降级即可。
        try {
            if (action === 'get') return window.localStorage.getItem(STORAGE_KEY);
            window.localStorage.setItem(STORAGE_KEY, value);
        } catch (e) {
            return null;
        }
        return null;
    }

    function resolve() {
        var fromUrl = new URLSearchParams(window.location.search).get('board');
        if (fromUrl && BOARDS[fromUrl]) {
            storage('set', fromUrl);
            return fromUrl;
        }
        var saved = storage('get');
        if (saved && BOARDS[saved]) return saved;
        return DEFAULT_BOARD;
    }

    var current = resolve();

    var Board = {
        current: current,
        label: BOARDS[current].label,
        all: BOARDS,

        /** data/<board>/<file> */
        dataPath: function (file) {
            return 'data/' + current + '/' + file;
        },

        /** api/<board>/<file> */
        apiPath: function (file) {
            return 'api/' + current + '/' + file;
        },

        /** 某天的原始快照路径 */
        snapshotPath: function (date) {
            return 'data/' + current + '/fanqie_male_' + current + '_ranks_' +
                String(date).replace(/-/g, '') + '.json';
        },

        /** 给站内链接带上当前榜单，默认榜单则保持链接干净 */
        withBoard: function (url) {
            if (current === DEFAULT_BOARD) return url;
            return url + (url.indexOf('?') === -1 ? '?' : '&') + 'board=' + current;
        },

        /** 切换榜单：写入 URL 并重新加载，让各页面走统一的初始化流程 */
        switchTo: function (key) {
            if (!BOARDS[key] || key === current) return;
            storage('set', key);
            var params = new URLSearchParams(window.location.search);
            params.set('board', key);
            window.location.search = params.toString();
        },

        /**
         * 在指定容器里渲染切换按钮。
         * 复用 .board-switch / .board-btn，与日期预设、趋势周期是同一套样式。
         */
        mount: function (container) {
            var el = typeof container === 'string'
                ? document.getElementById(container)
                : container;
            if (!el) return;
            el.classList.add('board-switch');
            el.innerHTML = '';
            Object.keys(BOARDS).forEach(function (key) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'board-btn' + (key === current ? ' active' : '');
                btn.textContent = BOARDS[key].label;
                btn.setAttribute('data-board', key);
                btn.addEventListener('click', function () { Board.switchTo(key); });
                el.appendChild(btn);
            });
        }
    };

    window.RankBoard = Board;

    document.addEventListener('DOMContentLoaded', function () {
        Board.mount('board-switch');

        // 页面上写死的榜单名（如侧边栏副标题）跟着当前榜单走
        var labelEl = document.getElementById('board-label');
        if (labelEl) labelEl.textContent = Board.label;
        document.title = document.title.replace('新书榜', Board.label);

        // 站内静态链接带上当前榜单，切换后跳页不会掉回默认榜
        if (current === DEFAULT_BOARD) return;
        var links = document.querySelectorAll(
            'a[href^="index.html"], a[href^="trend.html"], a[href^="book.html"]'
        );
        Array.prototype.forEach.call(links, function (a) {
            a.setAttribute('href', Board.withBoard(a.getAttribute('href')));
        });
    });
})();
