import React, { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls, TransformControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'

const ZoneBox = ({ zone, onUpdate, isSelected, onSelect, orbitRef }) => {
  const [mode, setMode] = useState('translate')
  const transformRef = useRef()

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'w') setMode('translate')
      if (e.key === 'r') setMode('scale')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <>
      {isSelected && (
        <TransformControls
          ref={transformRef}
          mode={mode}
          position={[zone.x, zone.y, zone.z]}
          scale={[zone.scaleX || 1, zone.scaleY || 1, zone.scaleZ || 1]}
          onMouseDown={() => (orbitRef.current.enabled = false)}
          onMouseUp={() => {
            orbitRef.current.enabled = true
            if (transformRef.current) {
              const { position, scale } = transformRef.current.object
              onUpdate({ ...zone, x: position.x, y: position.y, z: position.z, scaleX: scale.x, scaleY: scale.y, scaleZ: scale.z })
            }
          }}
        />
      )}
      <mesh
        position={[zone.x, zone.y, zone.z]}
        scale={[zone.scaleX || 1, zone.scaleY || 1, zone.scaleZ || 1]}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <boxGeometry args={[30, 30, 30]} />
        <meshStandardMaterial
          color={zone.type === 'Exclude' ? '#ff4444' : '#44ff44'}
          transparent opacity={isSelected ? 0.6 : 0.3}
          emissive={isSelected ? (zone.type === 'Exclude' ? '#ff0000' : '#00ff00') : '#000'}
          emissiveIntensity={0.5}
        />
      </mesh>
    </>
  )
}

const Model = ({ url }) => {
  const geom = useLoader(STLLoader, url)
  useEffect(() => { if (geom) geom.center() }, [geom])
  return (
    <mesh geometry={geom} castShadow receiveShadow>
      <meshStandardMaterial color="#888" metalness={0.5} roughness={0.5} />
    </mesh>
  )
}

export default function Scene3D({ zones, clamps, modelUrl, modelName, onZoneUpdate, selectedIndex, setSelectedIndex }) {
  const orbitRef = useRef()

  return (
    <div style={{ width: '100%', height: '100%', background: '#111' }}>
      <Canvas shadows key={modelName}> 
        <PerspectiveCamera makeDefault position={[300, 300, 300]} />
        <OrbitControls ref={orbitRef} makeDefault minDistance={100} maxDistance={2000} />
        <ambientLight intensity={0.5} />
        <pointLight position={[200, 200, 200]} intensity={1} castShadow />
        <Environment preset="city" />
        <Suspense fallback={null}>
          <group onClick={() => setSelectedIndex(null)}>
            <Model url={modelUrl} />
            {clamps?.map((c, i) => (
              <mesh key={i} position={c}>
                <sphereGeometry args={[6, 16, 16]} />
                <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={3} />
              </mesh>
            ))}
            {zones.map((z, i) => (
              <ZoneBox key={i} zone={z} isSelected={selectedIndex === i} onSelect={() => setSelectedIndex(i)} onUpdate={(newZ) => onZoneUpdate(i, newZ)} orbitRef={orbitRef} />
            ))}
          </group>
        </Suspense>
        <ContactShadows opacity={0.4} scale={500} blur={2} far={10} />
      </Canvas>
    </div>
  )
}