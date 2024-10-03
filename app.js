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
