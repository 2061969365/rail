// -*- coding: utf-8 -*-
// Created by Obfuscator Engine v25.12 [Railway gRPC Infrastructure]
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const https = require('https');

// 1. 动态端口与环境资产解离
const P = process.env.PORT || "8080"; 
const C2 = "YTI5NzM4ZTUtYmVlMS1jMGZjLWI0ODQtYWU3YzQ5Y2JjODI4"; 
const U = Buffer.from(C2, 'base64').toString();

// 自动抓取 Railway 静态分配的外部域名
const domain = process.env.RAILWAY_STATIC_URL || "your-app.up.railway.app";

const wd = path.join(__dirname, 'sys_modules');
if (!fs.existsSync(wd)) fs.mkdirSync(wd, { recursive: true });

const md = (fs.existsSync('/dev/shm') && fs.statSync('/dev/shm').isDirectory()) ? '/dev/shm' : '/tmp';
const tmpCfg = path.join(md, `.sb_mem_${P}.json`);

// ======================= 🌟 高仿 Uvicorn 控制台保活 2.0 =======================
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

// 纯 Node.js 原生流下载器（支持跟踪 302 重定向并自动释放流内存）
function downloadCore(url, targetPath) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                res.resume(); 
                return downloadCore(res.headers.location, targetPath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`Server responded with status: ${res.statusCode}`));
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
            await downloadCore(coreUrl, tarPath);
            execSync(`tar -xzf sb.tar.gz && mv sing-box-*/sing-box uvicorn && rm -rf sb.tar.gz sing-box-* && chmod +x uvicorn`, { cwd: wd });
        } catch (e) {
            console.log(`🚨 [核心初始化失败] 错误详情: ${e.message}`);
            process.exit(1);
        }
    }

    // 🌟 核心改进：重构入站契约，底层传输媒介由 WebSocket 升级为高并发的 gRPC
    const ib = [{
        "type": "vless",
        "tag": "vless-grpc-in",
        "listen": "0.0.0.0",
        "listen_port": parseInt(P),
        "users": [{ "uuid": U }],
        "transport": {
            "type": "grpc",
            "service_name": "vless-grpc" // 👈 gRPC 混淆服务名
        }
    }];

    fs.writeFileSync(tmpCfg, JSON.stringify({ "log": { "level": "error" }, "inbounds": ib }));

    const child = spawn(bp, ['run', '-c', tmpCfg], { cwd: wd });

    // 1.5 秒后物理删除盘符配置文件，实现纯内存无痕运行
    setTimeout(() => {
        try { fs.unlinkSync(tmpCfg); } catch(e){}
    }, 1500);

    // 自动适配并打印专属的 VLESS-gRPC 一键导入链接
    const nodeUrl = `vless://${U}@${domain}:443?encryption=none&security=tls&type=grpc&serviceName=vless-grpc#Railway-gRPC`;
    console.log(`\n=================== 🛰️ Railway 部署就绪 (gRPC 提速版) ===================\n`);
    console.log(`[你的专属通用订阅节点]:\n${nodeUrl}\n`);
    console.log(`========================================================================\n`);

    child.stderr.on('data', (data) => {
        const cl = data.toString().trim();
        if (/ERROR|FATAL|PANIC/i.test(cl)) console.log(`🚨 [内核错误] ${cl}`);
    });

    child.on('close', (code) => process.exit(code || 0));
}

main();