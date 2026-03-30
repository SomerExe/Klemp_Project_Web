FROM python:3.9-slim
WORKDIR /app

# Eğer backend klasöründe bir requirements.txt varsa önce onu kopyalayıp kütüphaneleri kuruyoruz
# Yoksa kodun hata verir, mutlaka bir requirements.txt oluşturmalısın.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tüm python dosyalarını kopyala
COPY . .

# main.py dosyasını çalıştır
CMD ["python", "main.py"]