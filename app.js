const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = 3000;
const baseUrl = `http://localhost:${port}`;

// 存储下载链接和它们的有效期
const downloadLinks = new Map();

// 生成随机字符串
function generateRandomString(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

// 生成有效期的下载链接
function createDownloadUrl(filename) {
  const randomString = generateRandomString();
  const downloadUrl = `${baseUrl}/download/${randomString}`;
  
  // 设置有效期为5分钟（300000毫秒）
  const expiryTime = Date.now() + 300000; 
  
  // 将下载链接和对应的文件存储
  downloadLinks.set(randomString, { filename, expiryTime });
  
  return downloadUrl;
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// 记录IP地址到iplogs.json
function logIpAddress(ipAddress, filename) {
  const logFilePath = path.join(__dirname, 'iplogs.json');
  const logEntry = {
    ipAddress: ipAddress,
    filename: filename,
    timestamp: new Date().toISOString()
  };

  // 读取现有日志文件
  let logs = [];
  if (fs.existsSync(logFilePath)) {
    const logsData = fs.readFileSync(logFilePath, 'utf8');
    logs = JSON.parse(logsData);
  }

  // 添加新日志
  logs.push(logEntry);

  // 写入日志文件
  fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), 'utf8');
}

// 请求文件并生成下载链接
app.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'files', filename);

  if (!fileExists(filePath)) {
    return res.status(404).send('File not found.');
  }

  const downloadUrl = createDownloadUrl(filename);
  res.send(`Download link (valid for 5 minutes): <a href="${downloadUrl}">${downloadUrl}</a>`);
});

// 下载文件
app.get('/download/:randomString', (req, res) => {
  const randomString = req.params.randomString;
  const downloadData = downloadLinks.get(randomString);

  if (!downloadData) {
    return res.status(404).send('Invalid or expired download link.');
  }

  const { filename, expiryTime } = downloadData;
  const filePath = path.join(__dirname, 'files', filename);

  if (Date.now() > expiryTime) {
    // 链接过期
    downloadLinks.delete(randomString);
    return res.status(410).send('Download link has expired.');
  }

  if (!fileExists(filePath)) {
    return res.status(404).send('File not found.');
  }

  // 获取客户端 IP 地址
  const ipAddress = req.ip;

  // 记录 IP 地址和下载信息
  logIpAddress(ipAddress, filename);

  // 设置为附件下载
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error downloading the file.');
    } else {
      // 下载完成后删除链接
      downloadLinks.delete(randomString);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
