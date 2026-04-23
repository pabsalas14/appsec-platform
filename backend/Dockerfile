FROM python:3.12-slim

WORKDIR /app

ENV PYTHONPATH=/app

# System deps (includes WeasyPrint requirements + Tesseract OCR for CMDB image import)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf-2.0-0 \
    libcairo2 libffi-dev shared-mime-info fonts-dejavu-core \
    tesseract-ocr tesseract-ocr-eng tesseract-ocr-spa && \
    rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads/reports /app/uploads/evidencias

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
