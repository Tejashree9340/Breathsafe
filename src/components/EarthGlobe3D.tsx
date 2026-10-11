import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MonitoringStation } from '../types/environmental';
import { RotateCw, Pause, Play, ZoomIn, ZoomOut, Compass } from 'lucide-react';

const SATELLITE_EARTH_MAP = '/satellite_earth_map.jpg';
const EARTH_CLOUDS_MAP = '/earth_clouds_map.jpg';

interface EarthGlobe3DProps {
  stations: MonitoringStation[];
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
  className?: string;
  interactive?: boolean;
}

export const EarthGlobe3D: React.FC<EarthGlobe3DProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  className = '',
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [hoveredStation, setHoveredStation] = useState<MonitoringStation | null>(null);
  const [isRotating, setIsRotating] = useState(true);

  // References to keep between renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const markerMeshesRef = useRef<{ mesh: THREE.Mesh; station: MonitoringStation }[]>([]);
  const ripplesRef = useRef<{ mesh: THREE.Mesh; scale: number; maxScale: number }[]>([]);
  const reqAnimRef = useRef<number | null>(null);
  
  // Dragging and damping states
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect WebGL capability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.z = 5.2;
    cameraRef.current = camera;

    // WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch {
      setWebGlSupported(false);
      return;
    }

    // Root Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;
    const globeRadius = 1.75;

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();

    // 1. Photorealistic Satellite Earth Mesh
    const earthGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    
    // Fallback base procedural canvas in case texture loads async
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 1024;
    fallbackCanvas.height = 512;
    const fCtx = fallbackCanvas.getContext('2d');
    if (fCtx) {
      fCtx.fillStyle = '#0E1626';
      fCtx.fillRect(0, 0, 1024, 512);
      fCtx.fillStyle = '#1B263B';
      fCtx.fillRect(150, 100, 300, 200);
      fCtx.fillRect(600, 150, 320, 180);
    }
    const fallbackTexture = new THREE.CanvasTexture(fallbackCanvas);

    const earthMat = new THREE.MeshStandardMaterial({
      map: fallbackTexture,
      roughness: 0.65,
      metalness: 0.15,
      emissive: new THREE.Color(0x050c18),
      emissiveIntensity: 0.35
    });

    // Load satellite texture map
    textureLoader.load(
      SATELLITE_EARTH_MAP,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        earthMat.map = tex;
        earthMat.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn('Satellite texture load fallback active', err);
      }
    );

    const globeMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(globeMesh);

    // 2. Realistic Cloud Layer Sphere
    const cloudsGeo = new THREE.SphereGeometry(globeRadius * 1.012, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    textureLoader.load(
      EARTH_CLOUDS_MAP,
      (cloudTex) => {
        cloudTex.colorSpace = THREE.SRGBColorSpace;
        cloudsMat.map = cloudTex;
        cloudsMat.needsUpdate = true;
      }
    );

    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    globeGroup.add(cloudsMesh);
    cloudsMeshRef.current = cloudsMesh;

    // 3. Rayleigh Atmospheric Scattering Glow Halo
    const atmosGeo = new THREE.SphereGeometry(globeRadius * 1.15, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float fresnel = 1.0 - max(0.0, dot(viewDir, vNormal));
          float intensity = pow(fresnel, 2.6) * 1.15;
          // Electric cyan atmospheric scattering
          gl_FragColor = vec4(0.22, 0.85, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 4. Subtle Orbital Ring
    const ringGeo = new THREE.RingGeometry(globeRadius * 1.36, globeRadius * 1.364, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38D9FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.7;
    ringMesh.rotation.y = Math.PI / 7;
    globeGroup.add(ringMesh);

    // 5. Geographically Accurate Station Markers (No Purple - Cyan & Orange System)
    const markers: { mesh: THREE.Mesh; station: MonitoringStation }[] = [];
    const markerGroup = new THREE.Group();
    globeGroup.add(markerGroup);
    const ripples: { mesh: THREE.Mesh; scale: number; maxScale: number }[] = [];

    stations.forEach(station => {
      const lat = station.coordinates.latitude;
      const lon = station.coordinates.longitude;
      
      // Standard geographic spherical coordinate transformation
      const latRad = lat * (Math.PI / 180);
      const lonRad = -lon * (Math.PI / 180);
      const r = globeRadius;
      
      const x = r * Math.cos(latRad) * Math.sin(lonRad);
      const y = r * Math.sin(latRad);
      const z = r * Math.cos(latRad) * Math.cos(lonRad);

      // Color coding using strict Cyan and Warm Orange palette (no purple)
      let beaconColor = 0x38D9FF; // Good: Electric Cyan
      if (station.aqi > 200) beaconColor = 0xFF6B35; // Very Unhealthy: Deep Alert Orange
      else if (station.aqi > 150) beaconColor = 0xFF7A29; // Unhealthy: High Orange
      else if (station.aqi > 100) beaconColor = 0xFF9B54; // Sensitive: Warm Orange
      else if (station.aqi > 50) beaconColor = 0x55E6C1; // Moderate: Cyan-Mint

      // Surface Anchor Disc
      const discGeo = new THREE.CircleGeometry(0.045, 16);
      const discMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
        side: THREE.DoubleSide
      });
      const discMesh = new THREE.Mesh(discGeo, discMat);
      discMesh.position.set(x, y, z);
      discMesh.lookAt(new THREE.Vector3(x * 2, y * 2, z * 2));
      markerGroup.add(discMesh);

      // Core Marker Sphere
      const markerGeo = new THREE.SphereGeometry(0.042, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: beaconColor });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.set(x, y, z);
      markerMesh.userData = { stationId: station.id };
      markerGroup.add(markerMesh);

      // Vertical Laser Sounding Beam
      const norm = new THREE.Vector3(x, y, z).normalize();
      const outerPoint = norm.clone().multiplyScalar(r + 0.32);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y, z),
        outerPoint
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: beaconColor,
        transparent: true,
        opacity: 0.85
      });
      const lineMesh = new THREE.Line(lineGeo, lineMat);
      markerGroup.add(lineMesh);

      // Pulsing Tip Sphere
      const tipGeo = new THREE.SphereGeometry(0.024, 8, 8);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const tipMesh = new THREE.Mesh(tipGeo, tipMat);
      tipMesh.position.copy(outerPoint);
      markerGroup.add(tipMesh);

      // Radar Ripple Ring on the surface
      const rippleGeo = new THREE.RingGeometry(0.045, 0.055, 24);
      const rippleMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      const rippleMesh = new THREE.Mesh(rippleGeo, rippleMat);
      rippleMesh.position.set(x * 1.002, y * 1.002, z * 1.002);
      rippleMesh.lookAt(new THREE.Vector3(x * 2, y * 2, z * 2));
      markerGroup.add(rippleMesh);
      ripples.push({ mesh: rippleMesh, scale: 1, maxScale: 2.8 });

      markers.push({ mesh: markerMesh, station });
    });
    markerMeshesRef.current = markers;
    ripplesRef.current = ripples;

    // Atmospheric Particle Dust Field
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = globeRadius * 1.25 + Math.random() * 1.5;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const sinPhi = Math.sin(phi);
      particlePos[i] = radius * sinPhi * Math.cos(theta);
      particlePos[i + 1] = radius * Math.cos(phi);
      particlePos[i + 2] = radius * sinPhi * Math.sin(theta);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38D9FF,
      size: 0.025,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Studio 3-Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const cyanRimLight = new THREE.DirectionalLight(0x38D9FF, 1.2);
    cyanRimLight.position.set(-5, -2, -3);
    scene.add(cyanRimLight);

    // Initial orientation tilt
    globeGroup.rotation.x = 0.22;

    // Animation Loop
    let time = 0;
    const animate = () => {
      time += 0.01;
      reqAnimRef.current = requestAnimationFrame(animate);

      // Smooth camera interpolation towards selected station if target set
      if (targetRotationRef.current && globeGroupRef.current) {
        globeGroupRef.current.rotation.y += (targetRotationRef.current.y - globeGroupRef.current.rotation.y) * 0.06;
        globeGroupRef.current.rotation.x += (targetRotationRef.current.x - globeGroupRef.current.rotation.x) * 0.06;
      } else if (globeGroupRef.current && isRotating && !isDraggingRef.current) {
        globeGroupRef.current.rotation.y += 0.0028;
      }

      // Independent Clouds Rotation
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += 0.0012;
      }

      // Subtle particle float
      particles.rotation.y += 0.0006;

      // Pulse Radar Ripples
      ripplesRef.current.forEach(r => {
        r.scale += 0.022;
        if (r.scale > r.maxScale) {
          r.scale = 1;
        }
        r.mesh.scale.set(r.scale, r.scale, 1);
        (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - (r.scale - 1) / (r.maxScale - 1));
      });

      renderer.render(scene, camera);
    };
    animate();

    // Mouse Drag & Damping
    const handleMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDraggingRef.current = true;
      targetRotationRef.current = null;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycasting for stations
      if (cameraRef.current && globeGroupRef.current) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
        const meshes = markerMeshesRef.current.map(m => m.mesh);
        const intersects = raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
          const hitMesh = intersects[0].object as THREE.Mesh;
          const hit = markerMeshesRef.current.find(m => m.mesh === hitMesh);
          if (hit) {
            setHoveredStation(hit.station);
            container.style.cursor = 'pointer';
          }
        } else {
          setHoveredStation(null);
          container.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
        }
      }

      if (!isDraggingRef.current || !globeGroupRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      globeGroupRef.current.rotation.y += deltaX * 0.006;
      globeGroupRef.current.rotation.x += deltaY * 0.006;

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      container.style.cursor = 'grab';
    };

    // Zoom on wheel
    const handleWheel = (e: WheelEvent) => {
      if (!interactive || !cameraRef.current) return;
      e.preventDefault();
      const newZ = cameraRef.current.position.z + e.deltaY * 0.003;
      cameraRef.current.position.z = THREE.MathUtils.clamp(newZ, 3.4, 7.8);
    };

    const handleClick = (e: MouseEvent) => {
      if (!interactive || !cameraRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
      const meshes = markerMeshesRef.current.map(m => m.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const hit = markerMeshesRef.current.find(m => m.mesh === hitMesh);
        if (hit && onSelectStation) {
          onSelectStation(hit.station.id);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('click', handleClick);

    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      resizeObserver.disconnect();
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('click', handleClick);
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
      renderer.dispose();
    };
  }, [stations, interactive, onSelectStation]);

  // Focus on selected station if changed
  useEffect(() => {
    if (!selectedStationId || !globeGroupRef.current) return;
    const target = stations.find(s => s.id === selectedStationId);
    if (!target) return;

    const lat = target.coordinates.latitude;
    const lon = target.coordinates.longitude;
    const targetRotY = (lon * (Math.PI / 180));
    const targetRotX = (lat * (Math.PI / 180)) * 0.4;

    targetRotationRef.current = { x: targetRotX, y: targetRotY };
  }, [selectedStationId, stations]);

  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    const newZ = cameraRef.current.position.z + delta;
    cameraRef.current.position.z = THREE.MathUtils.clamp(newZ, 3.4, 7.8);
  };

  const handleResetOrientation = () => {
    if (globeGroupRef.current) {
      targetRotationRef.current = { x: 0.22, y: 0 };
    }
    if (cameraRef.current) {
      cameraRef.current.position.z = 5.2;
    }
  };

  if (!webGlSupported) {
    return (
      <div className={`relative flex flex-col items-center justify-center bg-[#1B1F27] border border-[#282F3B] rounded-xl p-8 text-center ${className}`}>
        <div className="w-16 h-16 rounded-full bg-[#38D9FF]/10 text-[#38D9FF] flex items-center justify-center mb-4">
          <Compass className="w-8 h-8" />
        </div>
        <h4 className="text-base font-semibold text-[#F2F5F8]">3D Planetary Model (2D Accelerated Mode)</h4>
        <p className="text-xs text-[#9CA7B5] mt-1 max-w-sm">
          WebGL rendering is disabled or unavailable on this device. Atmospheric data points remain fully accessible in the interactive map and dashboard below.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[360px] select-none ${className}`}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Hover Indicator / Tooltip */}
      {hoveredStation && (
        <div className="absolute top-4 left-4 pointer-events-none z-20 bg-[#1B1F27]/95 backdrop-blur-md border border-[#38D9FF]/40 rounded-lg p-3 shadow-xl max-w-xs transition-opacity text-left">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-[#F2F5F8]">{hoveredStation.city}</span>
            <span className="font-mono text-[#38D9FF] font-medium">AQI {hoveredStation.aqi}</span>
          </div>
          <p className="text-[11px] text-[#9CA7B5] mt-0.5 truncate">{hoveredStation.name}</p>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#282F3B] text-[10px] text-[#9CA7B5]">
            <span>PM2.5: <strong className="text-[#F2F5F8] font-mono">{hoveredStation.measurements.pm25?.value ?? 'N/A'} µg/m³</strong></span>
            <span>·</span>
            <span>{hoveredStation.category}</span>
          </div>
        </div>
      )}

      {/* Interactive Controls Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className="p-1.5 bg-[#1B1F27]/90 hover:bg-[#282F3B] border border-[#282F3B] rounded-lg text-xs text-[#F2F5F8] transition-colors flex items-center gap-1"
            title={isRotating ? "Pause planetary spin" : "Resume spin"}
          >
            {isRotating ? <Pause className="w-3.5 h-3.5 text-[#38D9FF]" /> : <Play className="w-3.5 h-3.5 text-[#38D9FF]" />}
            <span className="text-[11px] pr-1">{isRotating ? "Pause" : "Rotate"}</span>
          </button>

          <button
            onClick={() => handleZoom(-0.6)}
            className="p-1.5 bg-[#1B1F27]/90 hover:bg-[#282F3B] border border-[#282F3B] rounded-lg text-[#9CA7B5] hover:text-[#F2F5F8] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleZoom(0.6)}
            className="p-1.5 bg-[#1B1F27]/90 hover:bg-[#282F3B] border border-[#282F3B] rounded-lg text-[#9CA7B5] hover:text-[#F2F5F8] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetOrientation}
            className="p-1.5 bg-[#1B1F27]/90 hover:bg-[#282F3B] border border-[#282F3B] rounded-lg text-[#9CA7B5] hover:text-[#F2F5F8] transition-colors"
            title="Reset Orientation"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="hidden sm:inline-block text-[11px] text-[#9CA7B5] bg-[#111318]/80 backdrop-blur-sm px-2.5 py-1 rounded border border-[#282F3B]">
          Drag to rotate · Scroll to zoom · Click beacon to select station
        </span>
      </div>
    </div>
  );
};
