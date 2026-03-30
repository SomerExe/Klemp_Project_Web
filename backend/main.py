from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import shutil
import uvicorn
from engine_pro import run_analysis

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Analiz için gerekli veri modeli
class ZoneModel(BaseModel):
    x: float; y: float; z: float; type: str
    scaleX: Optional[float] = 1.0; scaleY: Optional[float] = 1.0; scaleZ: Optional[float] = 1.0

class AnalysisRequest(BaseModel):
    clamp_count: int
    zones: List[ZoneModel]
    model_name: str

# DATA Klasörünü oluştur
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

@app.get("/")
async def root(): return {"status": "online"}

# --- YENİ: DOSYA YÜKLEME KAPISI ---
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(DATA_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print(f"✅ Yeni model kaydedildi: {file.filename}")
        return {"status": "success", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze(req: AnalysisRequest):
    target_path = os.path.join(DATA_DIR, req.model_name)
    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="Dosya sunucuda bulunamadi. Lütfen önce yükleyin.")
    
    try:
        zones_data = [z.dict() for z in req.zones]
        results = run_analysis(target_path, req.clamp_count, 500, zones_data)
        return {"status": "success", "clamps": results}
    except Exception as e:
        print(f"💥 HATA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)