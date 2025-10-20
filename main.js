// ==UserScript==
// @name         CrazyGames 游戏连线工具
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  在CrazyGames游戏页面上添加画线测量工具，支持高分屏适配
// @author       YourName
// @match        *://www.crazygames.com/*
// @match        *://crazygames.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    if (window.__lineToolInjected) {
        console.log('连线工具已存在！');
        return;
    }
    window.__lineToolInjected = true;

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let firstPoint = null;

    // 创建全屏透明捕获层
    let captureLayer = document.createElement('div');
    captureLayer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2147483647;
        cursor: crosshair;
        background: rgba(0,0,0,0.01);
    `;
    captureLayer.style.display = 'none';

    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2147483646;
    `;

    document.body.appendChild(canvas);
    document.body.appendChild(captureLayer);

    // ==================== 修复部分开始 ====================

    // 封装一个函数用于设置和重置Canvas尺寸，以应对高DPI和窗口缩放
    function setupCanvas() {
        // 获取设备像素比，用于高分屏适配
        const dpr = window.devicePixelRatio || 1;

        // 设置canvas的真实宽高，乘以dpr以保证清晰度
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        
        // CSS尺寸仍然是100%，让浏览器自动拉伸，但因为我们提升了分辨率，所以不会模糊
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';

        // 【重要】因为我们没有缩放context (ctx.scale)，所以在绘图时需要手动将坐标乘以dpr
        // 这样做的好处是线宽(lineWidth)等属性不会被缩放，表现更一致
        console.log(`Canvas已根据DPR(${dpr})重置尺寸: ${canvas.width}x${canvas.height}`);
    }

    // 监听窗口大小变化，重新设置canvas
    window.addEventListener('resize', () => {
        console.log('窗口大小改变，重置画布...');
        setupCanvas();
        // 窗口变化后，之前的绘图会丢失，也清空逻辑上的第一个点
        firstPoint = null; 
        console.log('画布已重置，请重新开始画线。');
    });

    // ==================== 修复部分结束 ====================

    // 捕获层的点击处理
    captureLayer.addEventListener('mousedown', function(e) {
        if (e.button === 2) { // 右键
            e.preventDefault();

            // ==================== 修复部分：坐标转换 ====================
            const dpr = window.devicePixelRatio || 1;
            const correctedX = e.clientX * dpr;
            const correctedY = e.clientY * dpr;
            // =========================================================

            if (!firstPoint) {
                // 使用修正后的坐标
                firstPoint = { x: correctedX, y: correctedY };
                
                ctx.beginPath();
                ctx.arc(firstPoint.x, firstPoint.y, 5 * dpr, 0, 2 * Math.PI); // 点的大小也乘以dpr以保持视觉大小一致
                ctx.fillStyle = 'red';
                ctx.fill();
                console.log('第一个点:', { x: e.clientX, y: e.clientY });
            } else {
                ctx.beginPath();
                ctx.moveTo(firstPoint.x, firstPoint.y);
                // 使用修正后的坐标
                ctx.lineTo(correctedX, correctedY);
                ctx.strokeStyle = 'green';
                ctx.lineWidth = 2 * dpr; // 线宽也乘以dpr以保持视觉粗细一致
                ctx.stroke();

                ctx.beginPath();
                // 使用修正后的坐标
                ctx.arc(correctedX, correctedY, 5 * dpr, 0, 2 * Math.PI); // 点的大小也乘以dpr
                ctx.fillStyle = 'red';
                ctx.fill();

                console.log('第二个点:', { x: e.clientX, y: e.clientY });
                firstPoint = null;
            }
        }
    });

    captureLayer.addEventListener('contextmenu', e => e.preventDefault());

    // 快捷键
    document.addEventListener('keydown', function(e) {
        // Alt+D 激活/关闭画线模式
        if (e.altKey && e.key === 'b') {
            if (captureLayer.style.display === 'none') {
                captureLayer.style.display = 'block';
                console.log('🟢 画线模式已开启 - 现在可以右键画线');
            } else {
                captureLayer.style.display = 'none';
                console.log('🔴 画线模式已关闭 - 恢复游戏控制');
            }
        }
        // C 清除
        else if (e.key === 'c' || e.key === 'C') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            firstPoint = null;
            console.log('画布已清除');
        }
    }, true);
    
    // 初始化Canvas尺寸
    setupCanvas();

    console.log('✅ Unity游戏连线工具已加载！(已修复高分屏位置问题)');
    console.log('⚠️ 重要操作：');
    console.log('   1. 按 Alt+B 开启/关闭画线模式');
    console.log('   2. 开启后，右键点击两次画线');
    console.log('   3. 按 C 清除所有线');
    console.log('   4. 再按 Alt+B 关闭画线模式，恢复游戏');
    console.log('💡 提示：画线模式开启时，游戏操作会被屏蔽');

})();