// ==UserScript==
// @name         YOUTUBE dDeva Скриншот+Превью
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Thumbnail download + screenshot (modal). Analytics removed.
// @match        https://www.youtube.com/*
// @match        https://youtu.be/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // -----------------------
    // Получение ID видео
    // -----------------------
    function getVideoId() {
        try {
            const url = new URL(location.href);
            let v = url.searchParams.get("v");
            if (v) return v;
        } catch (e) { /* ignore */ }

        let m = location.href.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
        if (m) return m[1];

        m = location.href.match(/shorts\/([A-Za-z0-9_-]{11})/);
        if (m) return m[1];

        const meta = document.querySelector('meta[property="og:video:url"], meta[property="og:url"]');
        if (meta) {
            try {
                const u = new URL(meta.content);
                return u.searchParams.get('v');
            } catch (e) {}
        }
        return null;
    }

    // -----------------------
    // Ожидание элемента
    // -----------------------
    function wait(selector, cb) {
        const el = document.querySelector(selector);
        if (el) return cb(el);

        const obs = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                obs.disconnect();
                cb(el);
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
    }

    // -----------------------
    // Создание кнопки
    // -----------------------
    function createButton(text, onClick) {
        const btn = document.createElement("button");
        btn.textContent = text;
        btn.style.padding = "6px 10px";
        btn.style.marginLeft = "10px";
        btn.style.border = "1px solid #555";
        btn.style.background = "#202020";
        btn.style.color = "white";
        btn.style.borderRadius = "4px";
        btn.style.cursor = "pointer";
        btn.style.fontSize = "13px";
        btn.onclick = onClick;
        return btn;
    }

    // -----------------------
    // Скачать превью
    // -----------------------
    function downloadThumbnail(id) {
        const urls = [
            `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
            `https://img.youtube.com/vi/${id}/sddefault.jpg`,
            `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
            `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
            `https://img.youtube.com/vi/${id}/default.jpg`
        ];
        for (const u of urls) window.open(u, "_blank");
    }

    // -----------------------
    // Скриншот через модальное окно
    // -----------------------
    function screenshotFrame() {
        const v = document.querySelector("video");
        if (!v) return alert("Видео не найдено");

        const w = v.videoWidth || v.clientWidth;
        const h = v.videoHeight || v.clientHeight;
        if (!w || !h) {
            alert("Поставь видео на паузу на нужном кадре и попробуй снова.");
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");

        try {
            ctx.drawImage(v, 0, 0, w, h);
            const url = canvas.toDataURL("image/jpeg", 0.95);

            // Модальное окно
            const wrap = document.createElement("div");
            wrap.style.position = "fixed";
            wrap.style.left = 0;
            wrap.style.top = 0;
            wrap.style.width = "100%";
            wrap.style.height = "100%";
            wrap.style.background = "rgba(0,0,0,0.8)";
            wrap.style.zIndex = "999999";
            wrap.style.display = "flex";
            wrap.style.alignItems = "center";
            wrap.style.justifyContent = "center";
            wrap.style.flexDirection = "column";

            const img = document.createElement("img");
            img.src = url;
            img.style.maxWidth = "90%";
            img.style.maxHeight = "80%";
            img.style.border = "2px solid #fff";

            const dl = document.createElement("a");
            dl.href = url;
            dl.download = "screenshot.jpg";
            dl.textContent = "Скачать";
            dl.style.marginTop = "20px";
            dl.style.fontSize = "20px";
            dl.style.color = "#fff";
            dl.style.textDecoration = "underline";

            const close = document.createElement("div");
            close.textContent = "✕";
            close.style.position = "absolute";
            close.style.top = "20px";
            close.style.right = "30px";
            close.style.fontSize = "40px";
            close.style.color = "#fff";
            close.style.cursor = "pointer";
            close.onclick = () => wrap.remove();

            wrap.appendChild(img);
            wrap.appendChild(dl);
            wrap.appendChild(close);
            document.body.appendChild(wrap);
        } catch (e) {
            console.error(e);
            alert("Ошибка при создании скриншота. Попробуй обновить страницу и поставить видео на паузу.");
        }
    }

    // -----------------------
    // Добавляем кнопки под названием видео
    // -----------------------
    function addButtons() {
        wait("#above-the-fold #title", (title) => {
            if (document.getElementById("supertool-buttons")) return;
            const marker = document.createElement("div");
            marker.id = "supertool-buttons";
            marker.style.display = "none";
            title.appendChild(marker);

            title.appendChild(createButton("📥 Превью", () => downloadThumbnail(getVideoId())));
            title.appendChild(createButton("📸 Скриншот", screenshotFrame));
        });
    }

    // -----------------------
    // Следим за сменой видео
    // -----------------------
    let lastUrl = location.href;
    setInterval(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(addButtons, 1000);
        }
    }, 500);

    // Первичная загрузка
    setTimeout(addButtons, 1000);

})();
