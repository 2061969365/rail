# 1. 使用极其轻量的 Node.js Alpine 官方镜像（底层极小，不到 50MB）
FROM node:20-alpine

# 2. 安装解压工具
# （因为我们的 Node.js 代码里用到 execSync('tar -xzf ...') 来解压内核）
RUN apk add --no-cache tar ca-certificates

# 3. 设置容器内的工作目录
WORKDIR /app

# 4. 把本地的代码直接拷进容器
# （因为是零依赖，完美跳过了耗时的 npm install 环节！）
COPY package.json main.js ./

# 5. 定义默认环境变量（可随时在运行容器时从外部覆盖）
ENV PORT=8080

# 6. 声明暴露端口（跟环境变量保持一致）
EXPOSE 8080

# 7. 容器启动时直接拉起主程序
CMD ["node", "main.js"]
