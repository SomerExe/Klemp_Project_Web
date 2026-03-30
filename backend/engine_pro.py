import os
import numpy as np
import trimesh
import multiprocessing as mp

def is_in_zone(point, zone):
    return (zone['min_x'] <= point[0] <= zone['max_x'] and 
            zone['min_y'] <= point[1] <= zone['max_y'] and 
            zone['min_z'] <= point[2] <= zone['max_z'])

def evaluate_batch(params):
    samples, k, iterations, zones = params
    best_fitness = -float('inf')
    best_points = None

    for _ in range(iterations):
        idx = np.random.choice(len(samples), k, replace=False)
        pts = samples[idx]
        
        # 1. Kırmızı Bölge (Exclude) Kontrolü
        in_exclude = False
        for p in pts:
            for z in zones:
                if z.get('type') == 'Exclude' and is_in_zone(p, z):
                    in_exclude = True; break
            if in_exclude: break
        if in_exclude: continue

        # 2. Yeşil Bölge (Focus) Bonusu (Kaynak yapılacak yerler)
        # Eğer bir klemp yeşil bölgenin içindeyse, fitness değerini katlayarak artırıyoruz
        focus_bonus = 1.0
        for p in pts:
            for z in zones:
                if z.get('type') == 'Focus' and is_in_zone(p, z):
                    focus_bonus += 50.0  # Kaynak bölgesine klemp koymayı çok cazip yapıyoruz

        # 3. Geometrik Dağılım Hesabı
        diffs = pts[:, np.newaxis, :] - pts[np.newaxis, :, :]
        spread = np.sum(np.sqrt(np.sum(diffs**2, axis=-1)))
        
        # Toplam skor: Dağılım mesafesi * Focus Bonusu
        fitness = spread * focus_bonus
        
        if fitness > best_fitness:
            best_fitness, best_points = fitness, pts
            
    return best_fitness, best_points

def run_analysis(file_path, clamp_count, force_n, zones):
    mesh = trimesh.load(file_path, force='mesh')
    if isinstance(mesh, trimesh.Scene): mesh = mesh.dump(concatenate=True)
    mesh.apply_translation(-mesh.bounds.mean(axis=0))
    
    samples, _ = trimesh.sample.sample_surface_even(mesh, 1500)
    cpu_count = mp.cpu_count()
    
    formatted_zones = []
    base_radius = 15.0 
    for z in zones:
        sx, sy, sz = z.get('scaleX', 1.0), z.get('scaleY', 1.0), z.get('scaleZ', 1.0)
        formatted_zones.append({
            'type': z.get('type', 'Exclude'),
            'min_x': z['x'] - (sx * base_radius), 'max_x': z['x'] + (sx * base_radius),
            'min_y': z['y'] - (sy * base_radius), 'max_y': z['y'] + (sy * base_radius),
            'min_z': z['z'] - (sz * base_radius), 'max_z': z['z'] + (sz * base_radius)
        })

    tasks = [(samples, clamp_count, 4000 // cpu_count, formatted_zones) for _ in range(cpu_count)]
    with mp.Pool(processes=cpu_count) as pool:
        results = pool.map(evaluate_batch, tasks)
    
    valid_results = [r for r in results if r[1] is not None]
    if not valid_results: return samples[:clamp_count].tolist()
    return max(valid_results, key=lambda x: x[0])[1].tolist()