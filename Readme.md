# Files Share From Node.js

这是一个文件分享应用，通过前端请求，返回随机的url下载地址，保护了文件资源。

### 部署
假设你已经有 docker compose 环境。

```
docker compose up -d
```

### 使用
filename = /files/目录下的文件资源名称（含后缀）

http://localhost:3000/filename

向以上url 请求后即跳转到生成的下载链接。

新增 `iplogs.json` 以保存下载记录（ip、下载文件名、下载时间）