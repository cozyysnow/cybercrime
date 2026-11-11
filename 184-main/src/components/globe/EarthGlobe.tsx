'use client';

import React, { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { useInView } from 'react-intersection-observer';
import GlobeFallback from './GlobeFallback';

// Start and End Camera Vectors from spur.us reverse-engineering
const CAM_START = new THREE.Vector3(-0.9402467715968077, 44.74909609020689, -32.22785030246248);
const CAM_END = new THREE.Vector3(-0.3476000206045236, 16.543302453007325, -11.914320546031316);

// Preload assets in client browser
if (typeof window !== 'undefined') {
  useGLTF.preload('/3d/earth.glb', '/3d/draco/');
}

// Convert lat/long to 3D Cartesian coordinates on sphere
function latLongToVector3(lat: number, lon: number, radius = 1.015): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Key Indian Cybercrime Hotspots (National Cyber Grid)
const INDIA_HOTSPOTS = [
  { name: 'Delhi NCR', lat: 28.6139, lon: 77.2090, critical: true },
  { name: 'Mewat / Bharatpur', lat: 27.5000, lon: 76.9000, critical: true },
  { name: 'Jamtara', lat: 23.9629, lon: 86.8016, critical: true },
  { name: 'Mumbai ATM Cluster', lat: 19.0760, lon: 72.8777, critical: false },
  { name: 'Bengaluru FinTech Hub', lat: 12.9716, lon: 77.5946, critical: false },
  { name: 'Kolkata Node', lat: 22.5726, lon: 88.3639, critical: false },
  { name: 'Hyderabad Cluster', lat: 17.3850, lon: 78.4867, critical: false },
];

// Predictive cash withdrawal route pairs (victim -> ATM withdrawal hotspot)
const WITHDRAWAL_ROUTES = [
  { from: { lat: 19.0760, lon: 72.8777 }, to: { lat: 27.5000, lon: 76.9000 } },
  { from: { lat: 12.9716, lon: 77.5946 }, to: { lat: 28.6139, lon: 77.2090 } },
  { from: { lat: 22.5726, lon: 88.3639 }, to: { lat: 23.9629, lon: 86.8016 } },
  { from: { lat: 17.3850, lon: 78.4867 }, to: { lat: 28.6139, lon: 77.2090 } },
];

function CameraZoom({ zoom = 0 }: { zoom: number }) {
  const { camera } = useThree();
  useFrame(() => {
    const clampedZoom = Math.max(0, Math.min(1, zoom));
    const x = THREE.MathUtils.lerp(CAM_START.x, CAM_END.x, clampedZoom);
    const y = THREE.MathUtils.lerp(CAM_START.y, CAM_END.y, clampedZoom);
    const z = THREE.MathUtils.lerp(CAM_START.z, CAM_END.z, clampedZoom);
    camera.position.set(x, y, z);
    camera.updateProjectionMatrix();
  });
  return null;
}

// Atmospheric Fresnel Rim Glow Shader
const AtmosphereFresnelShader = {
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
      float fresnel = dot(viewDir, vNormal);
      fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
      float glow = pow(fresnel, 3.5);
      vec3 glowColor = mix(vec3(0.808, 1.0, 0.0), vec3(0.3, 0.7, 1.0), 0.4);
      gl_FragColor = vec4(glowColor, glow * 0.45);
    }
  `
};

function AtmosphereGlow() {
  const shaderMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: AtmosphereFresnelShader.vertexShader,
      fragmentShader: AtmosphereFresnelShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh material={shaderMat} scale={[1.045, 1.045, 1.045]}>
      <sphereGeometry args={[1, 64, 64]} />
    </mesh>
  );
}

// Hotspot Beacons on Indian Locations
function HotspotBeacons() {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRingsRef = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    pulseRingsRef.current.forEach((mesh, idx) => {
      if (mesh) {
        const cycle = (time * 1.5 + idx * 0.4) % 1;
        mesh.scale.setScalar(1 + cycle * 1.8);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = Math.max(0, (1 - cycle) * 0.75);
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {INDIA_HOTSPOTS.map((spot, idx) => {
        const pos = latLongToVector3(spot.lat, spot.lon, 1.018);
        const normal = pos.clone().normalize();
        const orientation = new THREE.Quaternion();
        orientation.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

        const color = spot.critical ? '#ff3b30' : '#ceff00';

        return (
          <group key={idx} position={pos} quaternion={orientation}>
            <mesh position={[0, 0.002, 0]}>
              <sphereGeometry args={[0.009, 16, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>
            <mesh
              ref={(el) => {
                if (el) pulseRingsRef.current[idx] = el;
              }}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.001, 0]}
            >
              <ringGeometry args={[0.012, 0.02, 32]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.7}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// 3D Cybercrime Cash Withdrawal Bezier Arcs
function CybercrimeArcs() {
  const lineObjects = useMemo(() => {
    const material = new THREE.LineBasicMaterial({
      color: '#ceff00',
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    return WITHDRAWAL_ROUTES.map((route) => {
      const p1 = latLongToVector3(route.from.lat, route.from.lon, 1.018);
      const p2 = latLongToVector3(route.to.lat, route.to.lon, 1.018);
      
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const distance = p1.distanceTo(p2);
      mid.normalize().multiplyScalar(1.018 + distance * 0.35);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(40);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      return new THREE.Line(geometry, material);
    });
  }, []);

  return (
    <group>
      {lineObjects.map((lineObj, idx) => (
        <primitive key={idx} object={lineObj} />
      ))}
    </group>
  );
}

interface EarthModelProps {
  rotationVelocity: React.MutableRefObject<{ x: number; y: number }>;
  isDragging: React.MutableRefObject<boolean>;
}

function EarthModel({ rotationVelocity, isDragging }: EarthModelProps) {
  const { scene, nodes, materials } = useGLTF('/3d/earth.glb', '/3d/draco/') as any;
  const dotsRef = useRef<THREE.InstancedMesh>(null);
  const earthRef = useRef<THREE.Mesh>(null);
  const graticulesRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (materials) {
      if (materials.Earth) {
        materials.Earth.roughness = 0.75;
        materials.Earth.metalness = 0.1;
        if (materials.Earth.map) {
          materials.Earth.map.colorSpace = THREE.SRGBColorSpace;
          materials.Earth.map.needsUpdate = true;
        }
      }
      if (materials['Graticules.001']) {
        materials['Graticules.001'].transparent = true;
        materials['Graticules.001'].opacity = 0.4;
      }
      if (materials.DotReference) {
        materials.DotReference.transparent = true;
        materials.DotReference.opacity = 0.9;
      }
    }

    if (dotsRef.current && nodes.SkyDots?.instanceMatrix) {
      dotsRef.current.instanceMatrix = nodes.SkyDots.instanceMatrix;
      dotsRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [materials, nodes]);

  useFrame((_, delta) => {
    if (dotsRef.current) dotsRef.current.rotation.y += 0.002;
    if (earthRef.current) earthRef.current.rotation.y += 0.003;
    if (graticulesRef.current) graticulesRef.current.rotation.y += 0.005;

    if (groupRef.current) {
      if (!isDragging.current) {
        rotationVelocity.current.y = THREE.MathUtils.lerp(rotationVelocity.current.y, 0.0018, 0.04);
        rotationVelocity.current.x = THREE.MathUtils.lerp(rotationVelocity.current.x, 0, 0.05);
      }
      groupRef.current.rotation.y += rotationVelocity.current.y;
      groupRef.current.rotation.x += rotationVelocity.current.x;
      groupRef.current.rotation.x = Math.max(-0.4, Math.min(0.4, groupRef.current.rotation.x));
    }
  });

  if (nodes && (nodes.Earth || nodes.Graticules || nodes.SkyDots)) {
    return (
      <group ref={groupRef} dispose={null}>
        {nodes.DotReference && (
          <mesh
            geometry={nodes.DotReference.geometry}
            material={materials.DotReference}
            position={[-0.191, -0.243, -0.03]}
            scale={[0.053, 0.05, 0.05]}
          />
        )}

        {nodes.Graticules && (
          <mesh
            ref={graticulesRef}
            geometry={nodes.Graticules.geometry}
            material={materials['Graticules.001']}
            scale={[1.017, 1.016, 1.017]}
          />
        )}

        {nodes.Earth && (
          <mesh
            ref={earthRef}
            geometry={nodes.Earth.geometry}
            material={materials.Earth}
          >
            <HotspotBeacons />
            <CybercrimeArcs />
          </mesh>
        )}

        {nodes.SkyDots && (
          <instancedMesh
            ref={dotsRef}
            args={[nodes.SkyDots.geometry, materials.DotReference, 20000]}
            instanceMatrix={nodes.SkyDots.instanceMatrix}
            scale={[1.026, 1.016, 1.026]}
          />
        )}

        <AtmosphereGlow />
      </group>
    );
  }

  return <primitive ref={groupRef} object={scene} scale={1} />;
}

export interface EarthGlobeProps {
  zoom?: number;
  isMobile?: boolean;
  className?: string;
  enableInteraction?: boolean;
}

export default function EarthGlobe({
  zoom = 0,
  isMobile = false,
  className = '',
  enableInteraction = true,
}: EarthGlobeProps) {
  const [dpr, setDpr] = useState(1.5);
  const [contextLost, setContextLost] = useState(false);
  const [windowSize, setWindowSize] = useState({ w: 1440, h: 900 });

  const isDragging = useRef(false);
  const previousPointerPosition = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0.002 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const d = 1.2 * windowSize.h;
  const p = 1.2 * windowSize.w;
  const distance = 25000;
  const fov = 2 * Math.atan(Math.sqrt(d * d + p * p) / (2 * distance)) * (180 / Math.PI);

  const { ref: inViewRef, inView } = useInView({
    initialInView: true,
    rootMargin: '100px 0px',
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!enableInteraction) return;
    isDragging.current = true;
    previousPointerPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !enableInteraction) return;
    const deltaX = e.clientX - previousPointerPosition.current.x;
    const deltaY = e.clientY - previousPointerPosition.current.y;
    rotationVelocity.current.y = deltaX * 0.006;
    rotationVelocity.current.x = deltaY * 0.004;
    previousPointerPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  if (contextLost) {
    return (
      <div className={`relative h-full w-full ${className}`}>
        <GlobeFallback zoom={zoom} />
      </div>
    );
  }

  return (
    <div
      className={`relative h-full w-full select-none cursor-grab active:cursor-grabbing ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div ref={inViewRef} className="pointer-events-none absolute inset-0 select-none" />
      <Canvas
        fallback={<GlobeFallback zoom={zoom} />}
        frameloop={inView ? 'always' : 'never'}
        dpr={isMobile ? 1 : dpr}
        camera={{
          position: CAM_START,
          fov: fov,
          near: 0.1,
          far: 50000,
        }}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          toneMappingExposure: 1.15,
          alpha: true,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setContextLost(true);
          });
        }}
      >
        <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} />
        
        <ambientLight intensity={6.5} color={0xdddddd} position={[0, 20, 0]} />
        <directionalLight intensity={4.5} color={0xffffff} position={[14.179, -15.793, 10]} />
        <directionalLight intensity={2.0} color={0xceff00} position={[-15, 10, -10]} />

        <Suspense fallback={null}>
          <CameraZoom zoom={zoom} />
          <EarthModel
            rotationVelocity={rotationVelocity}
            isDragging={isDragging}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
