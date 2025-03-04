// ==UserScript==
// @name         Bili.URL.Cleaner
// @namespace    Bili-URL-Cleaner
// @version      1.2
// @description  删除哔哩哔哩的URL追踪参数
// @author       Luke Zhang
// @icon         https://www.bilibili.com/favicon.ico
// @match        *://www.bilibili.com/*
// @match        *://m.bilibili.com/*
// @match        *://*.bilibili.com/*
// @grant        none
// @run-at       document-start
// @license      GPL-3.0-or-later
// @homepage     https://github.com/win-lukezhang/Bili-URL-Cleaner
// @updateURL    https://github.com/win-lukezhang/Bili-URL-Cleaner/raw/refs/heads/main/src/Bili-URL-Cleaner.user.js
// @downloadURL  https://github.com/win-lukezhang/Bili-URL-Cleaner/raw/refs/heads/main/src/Bili-URL-Cleaner.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 参数过滤数据库
    const SECURITY_PROFILE = {
        TRACKING_PARAMS: [
            'buvid', 'mid', 'vd_source', 'spm_id_from', 'is_story_h5',
            'p', 'plat_id', 'share_from', 'share_medium', 'share_plat',
            'share_source', 'share_tag', 'timestamp', 'unique_k', 'up_id',
            'share_session_id', 'from_spmid', '-Arouter', 'spmid', 'ts', 'live_from', 'vt'
        ],
        ALLOWED_PARAMS: ['t', 'page', 'aid', 'bvid', 'cid', 'ep_id']
    };

    class BiliURLCleaner {
        constructor() {
            this.init();
        }

        init() {
            this.cleanOnLoad();
            this.handleSPA();
            this.injectProtection();
        }

        cleanOnLoad() {
            if (!this.isCleanURL()) {
                this.redirect(this.cleanURL(window.location.href));
            }
        }

        handleSPA() {
            const observer = new MutationObserver(mutations => {
                if (!this.isCleanURL()) {
                    this.redirect(this.cleanURL(window.location.href));
                }
            });

            observer.observe(document, {
                subtree: true,
                childList: true,
                attributes: false
            });
        }

        injectProtection() {
            window.addEventListener('beforeunload', e => {
                if (!this.isCleanURL()) {
                    window.location.replace(this.cleanURL(window.location.href));
                }
            });
        }

        cleanURL(url) {
            try {
                const urlObj = new URL(url);
                const params = new URLSearchParams(urlObj.search);

                SECURITY_PROFILE.TRACKING_PARAMS.forEach(p => params.delete(p));
                
                // 重建安全URL
                return `${urlObj.origin}${urlObj.pathname}${
                    params.toString() ? `?${this.sanitizeParams(params)}` : ''
                }${urlObj.hash}`;
            } catch(e) {
                console.error('[Bili.URL.Cleaner] Error:', e);
                return url;
            }
        }

        sanitizeParams(params) {
            return [...params].filter(([k]) => 
                !SECURITY_PROFILE.TRACKING_PARAMS.includes(k)
            ).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
        }

        isCleanURL() {
            const currentParams = new URLSearchParams(window.location.search);
            return !SECURITY_PROFILE.TRACKING_PARAMS.some(p => 
                currentParams.has(p)
            );
        }

        redirect(url) {
            history.replaceState(null, '', url);
            window.dispatchEvent(new Event('locationchange'));
        }
    }

    // 启动
    new BiliURLCleaner();
})();
