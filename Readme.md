# Files Share From Node.js

这是一个文件分享应用，通过前端请求，返回随机的url下载地址，保护了文件资源。

### 部署
假设你已经有 docker compose 环境。

```
docker compose up -d
```

### 使用
filename = /fiels/目录下的文件资源名称（含后缀）

http://localhost:3000/filename