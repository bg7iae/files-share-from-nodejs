from flask import Flask, send_file, request, jsonify, redirect, url_for
import os
import json
import time
import random
import string

app = Flask(__name__)

# 全局缓存设置禁用（Flask 中无需专门禁用）
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# 存储下载链接和它们的有效期
download_links = {}

# 生成随机字符串
def generate_random_string(length=16):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

# 动态生成有效期的下载链接
def create_download_url(filename):
    random_string = generate_random_string()
    download_url = f"/download/{random_string}?filename={filename}"
    expiry_time = time.time() + 300  # 有效期5分钟
    download_links[random_string] = {"filename": filename, "expiry_time": expiry_time}
    return download_url

# 检查文件是否存在
def file_exists(file_path):
    return os.path.exists(file_path)

# 记录IP地址到iplogs.json（只记录下载请求）
def log_ip_address(ip_address, filename):
    log_file_path = 'iplogs.json'

    # 确保只记录下载请求
    if request.path.startswith('/download'):
        log_entry = {
            "ipAddress": ip_address,
            "filename": filename,
            "timestamp": time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())
        }

        # 读取现有日志文件
        logs = []
        if os.path.exists(log_file_path):
            with open(log_file_path, 'r') as log_file:
                try:
                    logs = json.load(log_file)
                except json.JSONDecodeError:
                    logs = []

        # 添加新日志
        logs.append(log_entry)

        # 写入日志文件
        with open(log_file_path, 'w') as log_file:
            json.dump(logs, log_file, indent=2)

@app.route('/favicon.ico')
def favicon():
    return '', 204

# 请求文件并生成下载链接
@app.route('/<filename>', methods=['GET'])
def get_file(filename):
    file_path = os.path.join('files', filename)

    if not file_exists(file_path):
        return "File not found.", 404

    # 生成下载链接并重定向
    download_url = create_download_url(filename)
    return redirect(download_url)

# 获取客户端的真实 IP 地址，取 X-Forwarded-For 头部的第一个 IP
def get_client_ip():
    forwarded = request.headers.get('X-Forwarded-For', None)
    if forwarded:
        return forwarded.split(',')[0]  # 取第一个 IP
    return request.remote_addr

# 下载文件
@app.route('/download/<random_string>', methods=['GET'])
def download_file(random_string):
    download_data = download_links.get(random_string)

    if not download_data:
        return "Invalid or expired download link.", 404

    filename = download_data['filename']
    expiry_time = download_data['expiry_time']

    if time.time() > expiry_time:
        del download_links[random_string]
        return "Download link has expired.", 410

    file_path = os.path.join('files', filename)

    if not file_exists(file_path):
        return "File not found.", 404

    # 获取客户端 IP 地址
    ip_address = get_client_ip()

    # 记录 IP 地址和下载信息
    log_ip_address(ip_address, filename)

    # 设置为附件下载
    return send_file(file_path, as_attachment=True, download_name=filename)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)