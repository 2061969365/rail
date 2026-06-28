// -*- coding: utf-8 -*-
// Created by Obfuscator Engine v25.10 [Railway Native-Stream Edition]
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const https = require('https');

const P = process.env.PORT || "8080"; 
const C2 = "YTI5NzM4ZTUtYmVlMS1jMGZjLWI0ODQtYWU3YzQ5Y2JjODI4"; 
const U = Buffer.from(C2, 'base64').toString();
const domain = process.env.RAILWAY_STATIC_URL || "your-app.up.railway.app";

const wd = path.join(__dirname, 'sys_modules');
if (!fs.existsSync(wd)) fs.mkdirSync(wd, { recursive: true });

const md = (fs.existsSync('/dev/shm') && fs.statSync('/dev/shm').isDirectory()) ? '/dev/shm' : '/tmp';
const tmpCfg = path.join(md, `.sb_mem_${P}.json`);

// ======================= 高仿 Uvicorn 控制台保活 =======================
console.log(`INFO:     Started server process [${Math.floor(Math.random() * 90) + 10}]`);
console.log(`INFO:     Waiting for application startup.`);
console.log(`INFO:     Application startup complete.`);
console.log(`INFO:     Uvicorn running on http://0.0.0.0:${P} (Press CTRL+C to quit)`);

setInterval(() => {
    const fakeIp = `127.0.0.1:${Math.floor(Math.random() * 16383) + 49152}`;
    console.log(`INFO:     ${fakeIp} - "GET /metrics HTTP/1.1" 200 OK`);
}, (Math.floor(Math.random() * 180) + 240) * 1000);
// ==============================================================================

const bp = path.join(wd, 'uvicorn');
const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';
const coreUrl = `https://github.com/SagerNet/sing-box/releases/download/v1.9.3/sing-box-1.9.3-linux-${arch}.tar.gz`;

// 🌟 核心改进：纯 Node.js 递归重定向流下载器，彻底砸碎对 curl/wget 的依赖
function downloadCore(url, targetPath) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            // 自动处理 GitHub Release 的 301/302 重定向到 AWS S3
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadCore(res.headers.location, targetPath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Download failed with status: ${res.statusCode}`));
            }
            const fileStream = fs.createWriteStream(targetPath);
            res.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close(() => resolve());
            });
        }).on('error', reject);
    });
}

async function main() {
    if (!fs.existsSync(bp)) {
        const tarPath = path.join(wd, 'sb.tar.gz');
        try {
            // 使用原生 Node 流下载
            await downloadCore(coreUrl, tarPath);
            // 解压（Linux 环境下自带 tar 命令）
            execSync(`tar -xzf sb.tar.gz && mv sing-box-*/sing-box uvicorn && rm -rf sb.tar.gz sing-box-* && chmod +x uvicorn`, { cwd: wd });
        } catch (e) {
            process.exit(1);
        }
    }

    const ib = [{
        "type": "vless",
        "tag": "vless-ws-in",
        "listen": "0.0.0.0",
        "listen_port": parseInt(P),
        "users": [{ "uuid": U }],
        "transport": {
            "type": "ws",
            "path": "/vless-ws"
        }
    }];

    fs.writeFileSync(tmpCfg, JSON.stringify({ "log": { "level": "error" }, "inbounds": ib }));

    const child = spawn(bp, ['run', '-c', tmpCfg], { cwd: wd });

    setTimeout(() => {
        try { fs.unlinkSync(tmpCfg); } catch(e){}
    }, 1500);

    const nodeUrl = `vless://${U}@${domain}:443?encryption=none&security=tls&type=ws&path=%2Fvless-ws#Railway-VLESS`;
    console.log(`\n=================== 🛰️ Railway 部署就绪 ===================\n`);
    console.log(`[你的专属通用订阅节点]:\n${nodeUrl}\n`);
    console.log(`=========================================================\n`);

    child.stderr.on('data', (data) => {
        const cl = data.toString().trim();
        if (/ERROR|FATAL|PANIC/i.test(cl)) console.log(`🚨 [内核错误] ${cl}`);
    });

    child.on('close', (code) => process.exit(code || 0));
}

main();