# Dockerfile 简化版
FROM python:3.12-alpine

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 安装 Flask 依赖
RUN pip install --no-cache-dir Flask

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["python", "app.py"]