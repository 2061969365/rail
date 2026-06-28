// -*- coding: utf-8 -*-
// Created by Obfuscator Engine v25.9 [Railway WS Optimization]
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// 🌟 核心改进 1：紧跟 Railway 官方端口与资产特征解离
const P = process.env.PORT || "8080"; // Railway 动态注入的监听端口
const C2 = "YTI5NzM4ZTUtYmVlMS1jMGZjLWI0ODQtYWU3YzQ5Y2JjODI4"; // 你的UUID密文
const U = Buffer.from(C2, 'base64').toString();

// 获取 Railway 自动分配的外部公网域名
const domain = process.env.RAILWAY_STATIC_URL || "你的项目名.up.railway.app";

const wd = path.join(__dirname, 'sys_modules');
if (!fs.existsSync(wd)) fs.mkdirSync(wd, { recursive: true });

// 依旧使用内存盘或临时盘流转
const md = (fs.existsSync('/dev/shm') && fs.statSync('/dev/shm').isDirectory()) ? '/dev/shm' : '/tmp';
const tmpCfg = path.join(md, `.sb_mem_${P}.json`);

// ======================= 完美高仿 Uvicorn 控制台保活 =======================
console.log(`INFO:     Started server process [${Math.floor(Math.random() * 90) + 10}]`);
console.log(`INFO:     Waiting for application startup.`);
console.log(`INFO:     Application startup complete.`);
console.log(`INFO:     Uvicorn running on http://0.0.0.0:${P} (Press CTRL+C to quit)`);

setInterval(() => {
    const fakeIp = `127.0.0.1:${Math.floor(Math.random() * 16383) + 49152}`;
    console.log(`INFO:     ${fakeIp} - "GET /metrics HTTP/1.1" 200 OK`);
}, (Math.floor(Math.random() * 180) + 240) * 1000); // 4-7分钟随机高仿心跳，防止空闲回收
// ==============================================================================

// 伪装进程名字
const bp = path.join(wd, 'uvicorn');
const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';

if (!fs.existsSync(bp)) {
    try {
        const url = `https://github.com/SagerNet/sing-box/releases/download/v1.9.3/sing-box-1.9.3-linux-${arch}.tar.gz`;
        const cmd = `(curl -sL -o sb.tar.gz ${url} || wget -qO sb.tar.gz ${url}) && tar -xzf sb.tar.gz && mv sing-box-*/sing-box uvicorn && rm -rf sb.tar.gz sing-box-* && chmod +x uvicorn`;
        execSync(cmd, { cwd: wd });
    } catch (e) { process.exit(1); }
}

// 🌟 核心改进 2：构建极其纯净的 VLESS + WebSocket 协议，将 TLS 释权交给 Railway 网关
const ib = [{
    "type": "vless",
    "tag": "vless-ws-in",
    "listen": "0.0.0.0",
    "listen_port": parseInt(P),
    "users": [{ "uuid": U }],
    "transport": {
        "type": "ws",
        "path": "/vless-ws" // 👈 混淆路径，可随意更改
    }
}];

fs.writeFileSync(tmpCfg, JSON.stringify({ "log": { "level": "error" }, "inbounds": ib }));

// 拉起核心核心
const child = spawn(bp, ['run', '-c', tmpCfg], { cwd: wd });

// 🌟 内存阅后即焚：1.5秒后在内存盘无缝蒸发配置文件
setTimeout(() => {
    try { fs.unlinkSync(tmpCfg); } catch(e){}
}, 1500);

// 绝杀：打印自动生成的全通配 VLESS-WS 一键导入节点链接
const nodeUrl = `vless://${U}@${domain}:443?encryption=none&security=tls&type=ws&path=%2Fvless-ws#Railway-VLESS`;
console.log(`\n=================== 🛰️ Railway 部署就绪 ===================\n`);
console.log(`[你的专属通用订阅节点]:\n${nodeUrl}\n`);
console.log(`=========================================================\n`);

child.stderr.on('data', (data) => {
    const cl = data.toString().trim();
    if (/ERROR|FATAL|PANIC/i.test(cl)) console.log(`🚨 [内核错误] ${cl}`);
});

child.on('close', (code) => process.exit(code || 0));