const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = 3000;

// 全局禁止缓存的中间件
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// 生成随机字符串
function generateRandomString(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

// 动态生成有效期的下载链接，基于请求中的 host 和协议
function createDownloadUrl(req, filename) {
  const randomString = generateRandomString();
  const protocol = req.headers['x-forwarded-proto'] || req.protocol; // 通过代理时获取实际协议
  const host = req.headers.host; // 从请求头中获取 host
  return `${protocol}://${host}/download/${randomString}?filename=${filename}`;
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// 从 Nginx 获取真实 IP，并记录 IP 地址到 iplogs.json
function logIpAddress(req, filename) {
  const logFilePath = path.join(__dirname, 'iplogs.json');
  const logEntry = {
    ipAddress: req.headers['x-forwarded-for'] || req.ip, // 获取 X-Forwarded-For 或 req.ip
    filename: filename,
    timestamp: new Date().toISOString(),
  };

  // 读取现有日志文件
  let logs = [];

  // 检查文件是否存在且内容是否有效
  if (fs.existsSync(logFilePath)) {
    const logsData = fs.readFileSync(logFilePath, 'utf8');

    try {
      logs = JSON.parse(logsData) || [];  // 解析现有日志内容，如果为空，则初始化为空数组
    } catch (err) {
      console.error('Error parsing logs, initializing as empty array:', err);
      logs = [];  // 如果 JSON 解析失败，则初始化为一个空数组
    }
  }

  // 添加新日志
  logs.push(logEntry);

  // 写入日志文件
  fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), 'utf8');
}

// 请求文件并生成下载链接并重定向
app.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'files', filename);

  if (!fileExists(filePath)) {
    return res.status(404).send('File not found.');
  }

  // 每次请求都生成新的随机码
  const downloadUrl = createDownloadUrl(req, filename);
  
  // 重定向到生成的下载链接
  res.redirect(downloadUrl);
});

// 下载文件
app.get('/download/:randomString', (req, res) => {
  const filename = req.query.filename;
  const filePath = path.join(__dirname, 'files', filename);

  if (!fileExists(filePath)) {
    return res.status(404).send('File not found.');
  }

  // 记录 IP 地址和下载信息
  logIpAddress(req, filename);

  // 设置为附件下载
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error downloading the file.');
    }
  });
});

// 打印端口
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

