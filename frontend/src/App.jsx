import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import Scene3D from './components/Scene3D'

function App() {
  const [zones, setZones] = useState([])
  const [clamps, setClamps] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [showManual, setShowManual] = useState(false)
  
  // Model & Klemp Ayarları
  const [modelConfig, setModelConfig] = useState({ name: 'arac_kapisi.stl', url: '/models/arac_kapisi.stl' })
  const [clampCount, setClampCount] = useState(3)
  const fileInputRef = useRef()
  const lastKeyTime = useRef(0)

  // --- DOUBLE TAP 'i' TESPİTİ ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'i') {
        const currentTime = new Date().getTime()
        const timeDiff = currentTime - lastKeyTime.current
        
        if (timeDiff < 300) { // 300ms içinde ikinci basış
          setShowManual(prev => !prev)
        }
        lastKeyTime.current = currentTime
      }
      
      // Seçili bölgeyi 'Delete' ile silme (Ekstra kolaylık)
      if (e.key === 'Delete' && selectedIndex !== null) {
        deleteZone()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, zones])

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData(); formData.append('file', file)
    try {
      const res = await axios.post('http://127.0.0.1:8000/upload', formData)
      if (res.data.status === 'success') {
        setModelConfig({ name: file.name, url: URL.createObjectURL(file) })
        setClamps([]); setZones([])
      }
    } catch (err) { alert("Yükleme hatası!") }
  }

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const res = await axios.post('http://127.0.0.1:8000/analyze', {
        clamp_count: parseInt(clampCount), zones: zones, model_name: modelConfig.name
      })
      if (res.data.status === "success") setClamps(res.data.clamps)
    } catch (e) { alert("Analiz hatası!") }
    setLoading(false)
  }

  const deleteZone = () => {
    setZones(zones.filter((_, i) => i !== selectedIndex))
    setSelectedIndex(null)
  }

  return (
    <div style={{ background: '#000', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      
      {/* SOL ÜST BİLGİ KUTUSU */}
      <div style={infoBoxStyle}>
        INFO: Double tap <b>'i'</b> for manual
      </div>

      {/* KULLANICI REHBERİ (MODAL) */}
      {showManual && (
        <div style={modalOverlayStyle} onClick={() => setShowManual(false)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{color: '#22c55e', marginBottom: '15px'}}>KLEMP AI - Kullanım Kılavuzu</h2>
            <ul style={listStyle}>
              <li><b>W :</b> Taşıma Modu (Translate)</li>
              <li><b>R :</b> Ölçeklendirme Modu (Scale)</li>
              <li><b>Delete :</b> Seçili Bölgeyi Sil</li>
              <li><b>Double 'i' :</b> Kılavuzu Aç/Kapat</li>
              <li><b>Sol Tık :</b> Bölge Seç / Kamera Döndür</li>
              <li><b>Sağ Tık / Pan :</b> Kamerayı Kaydır</li>
            </ul>
            <button onClick={() => setShowManual(false)} style={closeBtnStyle}>Anladım</button>
          </div>
        </div>
      )}

      {/* ÜST NAVİGASYON */}
      <nav style={navStyle}>
        <h2 style={{ margin: 0, color: '#22c55e', fontSize: '1.1rem' }}>KLEMP AI <small style={{color:'#888'}}>V3</small></h2>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".stl" />
        <button onClick={() => fileInputRef.current.click()} style={btn('#3b82f6')}>📂 Model Seç</button>
        <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
          <label style={{fontSize:'0.7rem'}}>Klemp:</label>
          <input type="number" value={clampCount} onChange={(e)=>setClampCount(e.target.value)} style={inputS} min="1"/>
        </div>
        <button onClick={() => setZones([...zones, { x: 0, y: 50, z: 0, type: 'Exclude', scaleX: 1, scaleY: 1, scaleZ: 1 }])} style={btn('#ff4444')}>+ Yasak</button>
        <button onClick={() => setZones([...zones, { x: 0, y: 50, z: 0, type: 'Focus', scaleX: 1, scaleY: 1, scaleZ: 1 }])} style={btn('#44ff44')}>+ Kaynak</button>
        <button onClick={handleAnalyze} disabled={loading} style={{ ...btn('', '#22c55e'), marginLeft: 'auto', fontWeight:'bold' }}>
          {loading ? 'AI ANALİZ EDİYOR...' : 'ANALİZİ BAŞLAT'}
        </button>
      </nav>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <Scene3D 
          zones={zones} clamps={clamps} modelUrl={modelConfig.url} modelName={modelConfig.name}
          onZoneUpdate={(i, d) => { const n=[...zones]; n[i]=d; setZones(n); }}
          selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex}
        />
      </div>
    </div>
  )
}

// --- STİLLER ---
const infoBoxStyle = {
  position: 'absolute', top: '80px', left: '20px', zIndex: 1000,
  padding: '8px 12px', background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(5px)', borderRadius: '5px', color: '#ccc',
  fontSize: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.1)',
  pointerEvents: 'none', letterSpacing: '0.5px'
}

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
}

const modalContentStyle = {
  background: '#1a1a1a', padding: '30px', borderRadius: '12px',
  border: '1px solid #333', minWidth: '350px', textAlign: 'center'
}

const listStyle = { textAlign: 'left', listStyle: 'none', padding: 0, margin: '20px 0', lineHeight: '2' }
const closeBtnStyle = { padding: '10px 20px', background: '#22c55e', border: 'none', color: 'white', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
const navStyle = { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, padding: '15px 20px', background: 'rgba(25, 25, 25, 0.95)', display: 'flex', alignItems:'center', gap: '15px', borderBottom: '1px solid #333' }
const btn = (border, bg = '#333') => ({ padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', border: border ? `1px solid ${border}` : 'none', background: bg, color: 'white', fontSize: '0.8rem' })
const inputS = { background: '#111', border: '1px solid #555', color: 'white', padding: '5px', width:'40px', borderRadius: '4px' }

export default App