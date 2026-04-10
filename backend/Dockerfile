FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (layer cache optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8080

CMD ["sh", "-c", "python migrate.py && gunicorn run:app --bind 0.0.0.0:8080 --workers 2 --timeout 120"]
