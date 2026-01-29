# Use Python 3.12 slim
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && \
    apt-get install -y gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files
COPY . .

# Expose Flask port
EXPOSE 5000

# Set environment variables inside container
ENV FLASK_APP=wsgi.py
ENV FLASK_ENV=development

# Command to run Flask
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
