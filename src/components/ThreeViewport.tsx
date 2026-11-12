import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Activity, Waves, ChevronDown, ChevronUp, Zap, Sparkles } from 'lucide-react';

import { NonaryClockState, AppTheme } from '../types/dragon';
import { Live3DSnapshotRefs } from '../utils/export3DModel';

export type SceneMode = 'sovereign-core' | 'cathie-grid' | 'nonary-clock' | 'lissajous-wave';

interface ThreeViewportProps {
  sceneMode: SceneMode;
  isAudioPlaying: boolean;
  frequency: number;
  polarityAlpha: number;
  polarityBeta: number;
  cameraPreset?: string;
  wireframeOnly?: boolean;
  rotationSpeed?: number;
  pulseSync?: boolean;
  timeState?: NonaryClockState;
  onToggleGuide?: () => void;
  theme?: AppTheme;
  onRegisterLiveRefs?: (getter: () => Live3DSnapshotRefs) => void;
}

// Module-scope reusable math scratch objects for zero GC in render loop
const _vec3 = new THREE.Vector3();
const _colorAlpha = new THREE.Color('#38bdf8');
const _colorBeta = new THREE.Color('#e879f9');
const _colorGold = new THREE.Color('#facc15');

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  sceneMode,
  isAudioPlaying,
  frequency,
  polarityAlpha,
  polarityBeta,
  cameraPreset = 'perspective',
  wireframeOnly = false,
  rotationSpeed = 1.0,
  pulseSync = false,
  timeState,
  onToggleGuide,
  theme = 'sovereign-dark',
  onRegisterLiveRefs,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number>(0);
  const timeoutIdRef = useRef<number>(0);
  
  // Dynamic mesh references
  const coreGroupRef = useRef<THREE.Group | null>(null);
  const cathieGridGroupRef = useRef<THREE.Group | null>(null);
  const nonaryClockGroupRef = useRef<THREE.Group | null>(null);
  const waveMeshRef = useRef<THREE.Line | null>(null);
  const cymaticMeshRef = useRef<THREE.Mesh | null>(null);
  const alphaPinRef = useRef<THREE.Group | null>(null);
  const betaPinRef = useRef<THREE.Group | null>(null);

  // Harmonic Resonance Analyzer state
  const [analyzerMode, setAnalyzerMode] = useState<'combined' | 'cymatic' | 'core' | 'off'>('combined');
  const [isHUDExpanded, setIsHUDExpanded] = useState<boolean>(true);

  // References to keep render loop in sync without restarting WebGL
  const stateRef = useRef({
    sceneMode,
    isAudioPlaying,
    frequency,
    polarityAlpha,
    polarityBeta,
    wireframeOnly,
    rotationSpeed,
    pulseSync,
    analyzerMode,
  });

  useEffect(() => {
    stateRef.current = {
      sceneMode,
      isAudioPlaying,
      frequency,
      polarityAlpha,
      polarityBeta,
      wireframeOnly,
      rotationSpeed,
      pulseSync,
      analyzerMode,
    };
  }, [sceneMode, isAudioPlaying, frequency, polarityAlpha, polarityBeta, wireframeOnly, rotationSpeed, pulseSync, analyzerMode]);

  // Handle Camera Presets
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (cameraPreset) {
      case 'perspective':
        camera.position.set(0, 4.2, 7.5);
        controls.target.set(0, 0.8, 0);
        break;
      case 'top-grid':
        camera.position.set(0, 9.5, 0.1);
        controls.target.set(0, 0, 0);
        break;
      case 'core-focus':
        camera.position.set(0, 1.2, 3.8);
        controls.target.set(0, 1.0, 0);
        break;
      case 'polar-axis':
        camera.position.set(6.5, 3.0, 5.0);
        controls.target.set(0, 0.8, 0);
        break;
    }
    controls.update();
  }, [cameraPreset]);

  // Sync WebGL Scene Background & Fog with active theme
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const bgHex = theme === 'high-contrast-cyber' ? 0x000000 : theme === 'minimalist-lab' ? 0x0f172a : 0x030712;
    scene.background = new THREE.Color(bgHex);
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.setHex(bgHex);
    }
  }, [theme]);

  // Expose live mesh snapshot getter to parent for 3D model export
  useEffect(() => {
    if (!onRegisterLiveRefs) return;
    onRegisterLiveRefs(() => ({
      coreGroup: coreGroupRef.current,
      cathieGroup: cathieGridGroupRef.current,
      waveMesh: waveMeshRef.current,
      cymaticMesh: cymaticMeshRef.current,
    }));
  }, [onRegisterLiveRefs]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL Guard
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Setup Renderer
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.045);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 7.5);
    cameraRef.current = camera;

    // 4. Studio Environment Reflection (Mandatory PMREMGenerator + RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig (Warm Key + Cool Hemisphere Fill)
    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.4);
    keyLight.position.set(5, 10, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x030712, 0.85);
    scene.add(hemiLight);

    // 6. Contact Grounding Shadow Plane
    const groundGeo = new THREE.PlaneGeometry(16, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x070d19,
      roughness: 0.85,
      metalness: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.01;
    groundMesh.receiveShadow = !isSoftwareGl;
    scene.add(groundMesh);

    // Soft Radial Contact Shadow under the core
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.01;
    scene.add(shadowPlane);

    // Ground Grid Helper for cyber aesthetic
    const gridHelper = new THREE.GridHelper(16, 32, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // 7. BUILD PROCEDURAL COMPOSITE 3-12 PART MODELS
    // Main Container
    const masterContainer = new THREE.Group();
    scene.add(masterContainer);

    // ==========================================
    // PART A: Dragon 9 Sovereign Mesh Core
    // ==========================================
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 1.2, 0);
    masterContainer.add(coreGroup);
    coreGroupRef.current = coreGroup;

    // Custom shader uniforms for real-time Harmonic Interference GLSL compilation
    const interferenceUniforms = {
      uTime: { value: 0 },
      uFrequency: { value: 432 },
      uAudioActive: { value: 0 },
    };

    // Subpart 1: Central Toroidal Nonary Nucleus
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.92,
      wireframe: false,
    });

    nucleusMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = interferenceUniforms.uTime;
      shader.uniforms.uFrequency = interferenceUniforms.uFrequency;
      shader.uniforms.uAudioActive = interferenceUniforms.uAudioActive;

      shader.vertexShader = `
        uniform float uTime;
        uniform float uFrequency;
        uniform float uAudioActive;
        varying vec3 vWorldPos;
        varying float vDisplacement;
        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vec3 wPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vWorldPos = wPos;
        
        float k = (uFrequency / 432.0) * 4.5;
        float wave1 = sin(wPos.x * k + uTime * 3.5);
        float wave2 = cos(wPos.y * k * 0.85 - uTime * 2.5);
        float wave3 = sin(wPos.z * k * 1.15 + uTime * 3.0);
        float interference = wave1 * wave2 * wave3;
        
        float amp = uAudioActive > 0.5 ? 0.15 : 0.04;
        transformed += normal * interference * amp;
        vDisplacement = interference;
        `
      );

      shader.fragmentShader = `
        uniform float uTime;
        uniform float uFrequency;
        uniform float uAudioActive;
        varying vec3 vWorldPos;
        varying float vDisplacement;
        ${shader.fragmentShader}
      `;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>
        if (uAudioActive > 0.5) {
          float fringe = smoothstep(-0.4, 0.4, vDisplacement);
          vec3 nodeColor = vec3(0.01, 0.06, 0.18); // Dark Nodal Line
          vec3 antinodeCyan = vec3(0.22, 0.74, 0.97); // Cyan Antinode
          vec3 antinodeMagenta = vec3(0.91, 0.47, 0.98); // Magenta Phase
          vec3 peakGold = vec3(0.98, 0.80, 0.08); // Constructive Peak
          
          vec3 fringeColor = mix(nodeColor, mix(antinodeCyan, antinodeMagenta, sin(vDisplacement * 3.14 + uTime) * 0.5 + 0.5), fringe);
          if (abs(vDisplacement) > 0.6) {
            fringeColor = mix(fringeColor, peakGold, (abs(vDisplacement) - 0.6) * 2.5);
          }
          diffuseColor.rgb = mix(diffuseColor.rgb, fringeColor, 0.8);
        }
        `
      );
    };

    const nucleusGeo = new THREE.TorusKnotGeometry(0.85, 0.22, 128, 32, 3, 4);
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    nucleusMesh.castShadow = !isSoftwareGl;
    coreGroup.add(nucleusMesh);

    // Subpart 2: Inner Resonant Dodecahedron Heart
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.8,
      wireframe: false,
    });

    heartMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = interferenceUniforms.uTime;
      shader.uniforms.uFrequency = interferenceUniforms.uFrequency;
      shader.uniforms.uAudioActive = interferenceUniforms.uAudioActive;

      shader.vertexShader = `
        uniform float uTime;
        uniform float uFrequency;
        uniform float uAudioActive;
        varying float vDisplacement;
        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float k = (uFrequency / 432.0) * 5.5;
        float interference = sin(position.x * k + uTime * 4.0) * cos(position.y * k + uTime * 3.0) * sin(position.z * k + uTime * 2.5);
        float amp = uAudioActive > 0.5 ? 0.12 : 0.03;
        transformed += normal * interference * amp;
        vDisplacement = interference;
        `
      );
    };

    const heartGeo = new THREE.DodecahedronGeometry(0.55, 0);
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    coreGroup.add(heartMesh);

    // Subpart 3 & 4: Two-Pin Polarity Poles
    // Pole Alpha: Static Reference Grounding (Left, Cyan, stability)
    const alphaGroup = new THREE.Group();
    alphaGroup.position.set(-2.2, 0, 0);
    coreGroup.add(alphaGroup);
    alphaPinRef.current = alphaGroup;

    const alphaPillarMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.85,
    });
    const alphaPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.15, 2.2, 16), alphaPillarMat);
    alphaPillar.castShadow = !isSoftwareGl;
    alphaGroup.add(alphaPillar);

    // Alpha stabilizing discs (3 stepped bevel rings)
    for (let i = 0; i < 3; i++) {
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35 - i * 0.08, 0.35 - i * 0.08, 0.05, 24),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.15 })
      );
      disc.position.y = -0.8 + i * 0.5;
      alphaGroup.add(disc);
    }
    // Alpha Top Crystal
    const alphaCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x38bdf8, emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.9 })
    );
    alphaCrystal.position.y = 1.2;
    alphaGroup.add(alphaCrystal);

    // Pole Beta: Dynamic Reactor (Right, Magenta, adaptability & mutation)
    const betaGroup = new THREE.Group();
    betaGroup.position.set(2.2, 0, 0);
    coreGroup.add(betaGroup);
    betaPinRef.current = betaGroup;

    const betaPillarMat = new THREE.MeshStandardMaterial({
      color: 0xe879f9,
      roughness: 0.2,
      metalness: 0.85,
    });
    const betaPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.09, 2.2, 16), betaPillarMat);
    betaPillar.castShadow = !isSoftwareGl;
    betaGroup.add(betaPillar);

    // Beta emitter coils (spiral rings)
    for (let i = 0; i < 4; i++) {
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.035, 12, 24),
        new THREE.MeshStandardMaterial({ color: 0xc026d3, metalness: 0.95, roughness: 0.1 })
      );
      coil.rotation.x = Math.PI / 2;
      coil.position.y = -0.6 + i * 0.45;
      betaGroup.add(coil);
    }
    // Beta Reactor Emitter Crown
    const betaCrown = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.45, 12),
      new THREE.MeshStandardMaterial({ color: 0xfdf4ff, emissive: 0xe879f9, emissiveIntensity: 0.9, roughness: 0.1, metalness: 0.9 })
    );
    betaCrown.position.y = 1.25;
    betaGroup.add(betaCrown);

    // Subpart 5 & 6: Counter-Rotating Nonary Temporal Chapter Rings
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.85,
      roughness: 0.25,
    });
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.045, 16, 64), ringMat1);
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.04, 16, 64), ringMat2);
    coreGroup.add(outerRing);
    coreGroup.add(innerRing);

    // Subpart 7: 9 Nonary Tick Nodes distributed on outer ring
    const tickGeo = new THREE.SphereGeometry(0.07, 12, 12);
    const tickMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(Math.cos(angle) * 1.85, Math.sin(angle) * 1.85, 0);
      outerRing.add(tick);
    }

    // ==========================================
    // PART B: Bruce Cathie Harmonic Geodesic Sphere
    // ==========================================
    const cathieGroup = new THREE.Group();
    cathieGroup.position.set(0, 1.2, 0);
    masterContainer.add(cathieGroup);
    cathieGridGroupRef.current = cathieGroup;

    // Harmonic Icosahedral Grid Lines
    const cathieSphereGeo = new THREE.IcosahedronGeometry(2.35, 2);
    const cathieSphereMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const cathieSphereMesh = new THREE.Mesh(cathieSphereGeo, cathieSphereMat);
    cathieGroup.add(cathieSphereMesh);

    // Major Planetary Harmonic Latitudes (Giza 30°, Stonehenge 51.18°, Bermuda 25°, Equator)
    const latitudes = [0, 25, 30, 51.18, -30, -41.28];
    latitudes.forEach(latDeg => {
      const rad = 2.35;
      const phi = ((90 - latDeg) * Math.PI) / 180;
      const y = rad * Math.cos(phi);
      const ringR = rad * Math.sin(phi);
      const latRing = new THREE.Mesh(
        new THREE.TorusGeometry(ringR, 0.02, 8, 48),
        new THREE.MeshBasicMaterial({
          color: latDeg === 30 || latDeg === 51.18 ? 0xfacc15 : 0x38bdf8,
          transparent: true,
          opacity: 0.65,
        })
      );
      latRing.rotation.x = Math.PI / 2;
      latRing.position.y = y;
      cathieGroup.add(latRing);
    });

    // Planetary Node Beacons (Giza, Stonehenge, Bermuda, Tasman, Kailash)
    const nodeCoords = [
      { name: 'Giza', lat: 29.98, lon: 31.13, color: 0xfacc15 },
      { name: 'Stonehenge', lat: 51.18, lon: -1.83, color: 0x38bdf8 },
      { name: 'Bermuda', lat: 25.0, lon: -71.0, color: 0xe879f9 },
      { name: 'Tasman', lat: -41.28, lon: 174.77, color: 0x4ade80 },
      { name: 'Kailash', lat: 31.07, lon: 81.31, color: 0xf43f5e },
    ];
    nodeCoords.forEach(c => {
      const phi = ((90 - c.lat) * Math.PI) / 180;
      const theta = ((c.lon + 180) * Math.PI) / 180;
      const r = 2.38;
      const x = -r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);

      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshBasicMaterial({ color: c.color })
      );
      beacon.position.set(x, y, z);
      cathieGroup.add(beacon);

      // Connecting energy ray to center
      const rayGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z),
      ]);
      const ray = new THREE.Line(
        rayGeo,
        new THREE.LineBasicMaterial({ color: c.color, transparent: true, opacity: 0.3 })
      );
      cathieGroup.add(ray);
    });

    // ==========================================
    // PART C: 432Hz 3D Acoustic Waveform Halo
    // ==========================================
    const wavePointsCount = 256;
    const wavePositions = new Float32Array(wavePointsCount * 3);
    const waveGeo = new THREE.BufferGeometry();
    waveGeo.setAttribute('position', new THREE.BufferAttribute(wavePositions, 3));
    const waveMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    const waveMesh = new THREE.Line(waveGeo, waveMat);
    waveMesh.position.set(0, 1.2, 0);
    masterContainer.add(waveMesh);
    waveMeshRef.current = waveMesh;

    // ==========================================
    // PART D: Real-Time 3D Harmonic Cymatic Interference Shell
    // ==========================================
    const cymaticGeo = new THREE.IcosahedronGeometry(2.15, 3);
    const cymaticBasePos = cymaticGeo.attributes.position.array.slice() as Float32Array;
    const cymaticColors = new Float32Array(cymaticGeo.attributes.position.count * 3);
    cymaticGeo.setAttribute('color', new THREE.BufferAttribute(cymaticColors, 3));

    const cymaticMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
      roughness: 0.15,
      metalness: 0.85,
      side: THREE.DoubleSide,
    });
    const cymaticMesh = new THREE.Mesh(cymaticGeo, cymaticMat);
    cymaticMesh.position.set(0, 1.2, 0);
    masterContainer.add(cymaticMesh);
    cymaticMeshRef.current = cymaticMesh;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 25;
    controls.minDistance = 2;
    controls.target.set(0, 1.0, 0);
    controlsRef.current = controls;

    // 8. RENDER LOOP WITH SOFTWARE WEBGL PACING & EXPONENTIAL DAMPING
    let lastTime = performance.now();
    let wavePhase = 0;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          timeoutIdRef.current = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          timeoutIdRef.current = window.setTimeout(cb, 60);
        }
      };
      timeoutIdRef.current = window.setTimeout(poll, 5);
    };

    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const {
        sceneMode: currentMode,
        isAudioPlaying: audioActive,
        frequency: curFreq,
        polarityAlpha: alphaVal,
        polarityBeta: betaVal,
        wireframeOnly: wireframe,
        rotationSpeed: rotSpd,
        pulseSync: isPulseSync,
      } = stateRef.current;

      // Dynamic rotation speed: when Pulse Synchronization is engaged,
      // the 3D mesh rotation speed oscillates dynamically according to the current harmonic frequency
      let dynamicRotSpeed = rotSpd;
      if (isPulseSync) {
        // Harmonic pulse rate: curFreq / 108 gives 4.0 Hz oscillation cycle at 432 Hz baseline
        const pulseRateHz = curFreq / 108;
        const pulseAmp = audioActive ? 0.75 : 0.45;
        const pulseFactor = 1.0 + pulseAmp * Math.sin(now * 0.001 * pulseRateHz * Math.PI * 2);
        dynamicRotSpeed = rotSpd * Math.max(0.12, pulseFactor);
      }

      const rotDelta = dt * 0.45 * dynamicRotSpeed;

      // Update Shader Uniforms for Core Interference
      interferenceUniforms.uTime.value = now * 0.001;
      interferenceUniforms.uFrequency.value = curFreq;
      interferenceUniforms.uAudioActive.value = audioActive ? 1.0 : 0.0;

      // Update 3D Cymatic Nodal Interference Shell
      if (cymaticMesh) {
        const activeAnalyzer = stateRef.current.analyzerMode;
        const isCymaticVisible = activeAnalyzer !== 'off' && 
          (activeAnalyzer === 'cymatic' || activeAnalyzer === 'combined') &&
          (currentMode === 'sovereign-core' || currentMode === 'lissajous-wave' || audioActive);

        cymaticMesh.visible = isCymaticVisible;

        if (isCymaticVisible) {
          const posAttr = cymaticGeo.attributes.position as THREE.BufferAttribute;
          const colAttr = cymaticGeo.attributes.color as THREE.BufferAttribute;
          const posArr = posAttr.array as Float32Array;
          const colArr = colAttr.array as Float32Array;
          const count = posAttr.count;

          const k = (curFreq / 432) * 3.5;
          const timePhase = now * 0.002;
          const amp = audioActive ? 0.32 : 0.08;

          for (let i = 0; i < count; i++) {
            const bx = cymaticBasePos[i * 3];
            const by = cymaticBasePos[i * 3 + 1];
            const bz = cymaticBasePos[i * 3 + 2];

            _vec3.set(bx, by, bz).normalize();

            // 3D Cymatic standing wave interference formula
            const wave1 = Math.sin(_vec3.x * k * 3.14159 + timePhase * 3.0);
            const wave2 = Math.cos(_vec3.y * k * 3.14159 - timePhase * 2.0);
            const wave3 = Math.sin(_vec3.z * k * 3.14159 + timePhase * 2.5);

            const interference = wave1 * wave2 * wave3;
            const displacement = interference * amp;

            posArr[i * 3] = bx + _vec3.x * displacement;
            posArr[i * 3 + 1] = by + _vec3.y * displacement;
            posArr[i * 3 + 2] = bz + _vec3.z * displacement;

            // Interference color mapping:
            if (interference > 0.2) {
              _colorGold.lerp(_colorAlpha, (interference - 0.2) * 1.2);
              colArr[i * 3] = _colorGold.r;
              colArr[i * 3 + 1] = _colorGold.g;
              colArr[i * 3 + 2] = _colorGold.b;
            } else if (interference < -0.2) {
              colArr[i * 3] = _colorBeta.r;
              colArr[i * 3 + 1] = _colorBeta.g;
              colArr[i * 3 + 2] = _colorBeta.b;
            } else {
              colArr[i * 3] = 0.01;
              colArr[i * 3 + 1] = 0.2;
              colArr[i * 3 + 2] = 0.45;
            }
          }

          posAttr.needsUpdate = true;
          colAttr.needsUpdate = true;
          cymaticMesh.rotation.y += rotDelta * 0.25;
          cymaticMesh.rotation.x = Math.sin(now * 0.0003) * 0.1;
        }
      }

      // Rotate Sovereign Core Nucleus & Rings
      if (coreGroup) {
        nucleusMesh.rotation.x += rotDelta * 0.7;
        nucleusMesh.rotation.y += rotDelta * 0.9;
        heartMesh.rotation.y -= rotDelta * 1.2;

        outerRing.rotation.z += rotDelta * 0.5;
        innerRing.rotation.z -= rotDelta * 0.8;
        innerRing.rotation.x += rotDelta * 0.3;

        // Apply Polarity Heights and Intensities
        const alphaScale = 0.5 + (alphaVal / 100) * 0.8;
        const betaScale = 0.5 + (betaVal / 100) * 0.8;
        alphaGroup.scale.set(alphaScale, alphaScale, alphaScale);
        betaGroup.scale.set(betaScale, betaScale, betaScale);

        // Visibility based on scene mode
        coreGroup.visible = currentMode === 'sovereign-core' || currentMode === 'nonary-clock';
      }

      // Rotate Cathie Grid
      if (cathieGroup) {
        cathieGroup.rotation.y += rotDelta * 0.35;
        cathieGroup.rotation.x = Math.sin(now * 0.0005) * 0.15;
        cathieGroup.visible = currentMode === 'cathie-grid' || currentMode === 'sovereign-core';
      }

      // 432Hz Waveform Dynamic Deformation
      if (waveMesh) {
        waveMesh.visible = currentMode === 'lissajous-wave' || audioActive;
        wavePhase += dt * (audioActive ? (curFreq / 100) : 1.5);
        const posAttr = waveGeo.attributes.position as THREE.BufferAttribute;
        const radius = 2.0;

        for (let i = 0; i < wavePointsCount; i++) {
          const u = (i / wavePointsCount) * Math.PI * 2;
          const harmonicFactor = audioActive ? Math.sin(u * 9 + wavePhase) * 0.28 : Math.sin(u * 9 + wavePhase) * 0.12;
          const r = radius + harmonicFactor;
          const x = r * Math.cos(u);
          const z = r * Math.sin(u);
          const y = Math.cos(u * 3 + wavePhase) * (audioActive ? 0.35 : 0.15);

          posAttr.setXYZ(i, x, y, z);
        }
        posAttr.needsUpdate = true;
      }

      // Wireframe toggling
      nucleusMat.wireframe = wireframe;
      heartMat.wireframe = wireframe;

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    tick();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* Minimal Top-Left Progression Badge (Zero Viewport Occlusion) */}
      <div className="absolute top-3 left-3 z-10 max-w-xs sm:max-w-md pointer-events-auto bg-slate-950/85 cyber:bg-black lab:bg-white/95 border border-slate-800/80 cyber:border-cyan-400/70 lab:border-slate-300 rounded-xl p-2.5 shadow-xl lab:shadow-md text-[11px] font-mono transition-colors">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200 pb-1 mb-1">
          <div className="flex items-center gap-1.5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 cyber:bg-yellow-300 lab:bg-sky-600" />
            <span>MODEL PROGRESSION</span>
          </div>
          <span className="text-[10px] text-slate-400 cyber:text-zinc-200 lab:text-slate-600">
            {timeState ? `${timeState.currentCycle.split(' ')[1]} Phase` : 'Cycle Alpha'}
          </span>
        </div>
        <div className="text-slate-300 cyber:text-white lab:text-slate-700 text-[10px] leading-tight">
          {sceneMode === 'sovereign-core' && (
            <span>Nucleus (p=3,q=4) knot with counter-rotating nonary rings | α {polarityAlpha}% grounding, β {polarityBeta}% reactor</span>
          )}
          {sceneMode === 'cathie-grid' && (
            <span>Bruce Cathie 144k arc-min geodesic sphere tracking 5 planetary nodes (Giza 29.98°, Stonehenge 51.18°)</span>
          )}
          {sceneMode === 'nonary-clock' && (
            <span>54-min hour gear ratio (26.666 D9 hrs/day) | {timeState?.isApexActive ? '⚡ APEX WINDOW ACTIVE' : 'Nominal progression'}</span>
          )}
          {sceneMode === 'lissajous-wave' && (
            <span>432Hz longitudinal Fourier waveform expanding across 256 radial harmonic lattice points</span>
          )}
        </div>
        {onToggleGuide && (
          <button
            onClick={onToggleGuide}
            className="mt-1 text-[9px] text-cyan-400 hover:text-cyan-300 cyber:text-yellow-300 cyber:hover:text-white lab:text-sky-700 lab:hover:text-sky-900 underline cursor-pointer block"
          >
            Explain Model Progression & Mechanics Guide →
          </button>
        )}
      </div>

      {/* Upper-Right Real-time Harmonic Resonance Analyzer HUD Panel */}
      <div className="absolute top-3 right-3 z-10 max-w-xs sm:max-w-sm pointer-events-auto bg-slate-950/90 cyber:bg-black lab:bg-white/95 border border-cyan-500/40 cyber:border-cyan-400 lab:border-slate-300 rounded-xl p-3 shadow-2xl lab:shadow-md text-[11px] font-mono transition-colors">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 font-bold text-xs">
            <Activity className="w-4 h-4 text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 animate-pulse" />
            <span>HARMONIC RESONANCE ANALYZER</span>
          </div>
          <button
            onClick={() => setIsHUDExpanded(!isHUDExpanded)}
            className="p-1 rounded hover:bg-slate-800 cyber:hover:bg-cyan-950 lab:hover:bg-slate-100 text-slate-400 hover:text-slate-200 cyber:text-cyan-300 lab:text-slate-600 transition-colors cursor-pointer"
            title={isHUDExpanded ? 'Minimize Analyzer HUD' : 'Expand Analyzer HUD'}
          >
            {isHUDExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isHUDExpanded && (
          <div className="space-y-2">
            {/* Live Frequency & Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 cyber:text-zinc-200 lab:text-slate-600 flex items-center gap-1">
                <Waves className="w-3.5 h-3.5 text-cyan-400 cyber:text-cyan-300 lab:text-sky-700" />
                Nodal Frequency:
              </span>
              <span className="font-bold text-cyan-300 cyber:text-black cyber:bg-cyan-300 lab:text-sky-800 lab:bg-sky-50 font-mono text-xs bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 cyber:border-cyan-300 lab:border-sky-300 tabular-nums">
                {frequency} Hz
              </span>
            </div>

            {pulseSync && (
              <div className="flex items-center justify-between text-[10px] bg-emerald-950/70 cyber:bg-emerald-950 lab:bg-emerald-50 border border-emerald-500/50 cyber:border-emerald-400 lab:border-emerald-300 px-2 py-1 rounded">
                <span className="text-emerald-300 cyber:text-emerald-300 lab:text-emerald-800 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400 lab:text-emerald-600 animate-pulse" />
                  PULSE SYNC ACTIVE:
                </span>
                <span className="font-mono text-emerald-200 cyber:text-white lab:text-emerald-700 tabular-nums">
                  {(frequency / 108).toFixed(1)} Hz Pulse Wave
                </span>
              </div>
            )}

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-900/80 cyber:bg-[#050811] lab:bg-slate-50 p-2 rounded-lg border border-slate-800 cyber:border-cyan-500/40 lab:border-slate-200 tabular-nums">
              <div>
                <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-500 uppercase block">Wavelength (λ):</span>
                <span className="text-slate-200 cyber:text-white lab:text-slate-900 font-bold">{(343 / Math.max(1, frequency)).toFixed(2)} m</span>
              </div>
              <div>
                <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-500 uppercase block">Coherence Index:</span>
                <span className="text-amber-300 cyber:text-yellow-300 lab:text-amber-700 font-bold">
                  {((frequency % 54 === 0 || frequency === 432 || frequency === 528 || frequency === 144) ? 98.8 : Math.max(72, 98.5 - (Math.abs(frequency - 432) % 54) * 0.4)).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-500 uppercase block">Nodal Symmetry:</span>
                <span className="text-fuchsia-300 cyber:text-fuchsia-300 lab:text-fuchsia-700 font-bold">{Math.round((frequency / 432) * 9)} Nodes (N={Math.round((frequency / 432) * 9)})</span>
              </div>
              <div>
                <span className="text-slate-500 cyber:text-zinc-400 lab:text-slate-500 uppercase block">Interference State:</span>
                <span className={isAudioPlaying ? 'text-emerald-300 cyber:text-emerald-300 lab:text-emerald-700 font-bold' : 'text-slate-400 cyber:text-zinc-300 lab:text-slate-600'}>
                  {isAudioPlaying ? 'CONSTRUCTIVE' : 'STANDBY SHIFT'}
                </span>
              </div>
            </div>

            {/* Real-time Antinode Peak Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-slate-400 cyber:text-zinc-300 lab:text-slate-600">
                <span>ANTINODE PEAK AMPLITUDE</span>
                <span className="text-cyan-400 cyber:text-cyan-300 lab:text-sky-700 font-bold tabular-nums">{isAudioPlaying ? '0.35 A₀' : '0.08 A₀'}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 cyber:bg-zinc-900 lab:bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 ${isAudioPlaying ? 'bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400' : 'bg-slate-700 lab:bg-slate-400'}`}
                  style={{ width: isAudioPlaying ? `${Math.min(100, (frequency / 864) * 100)}%` : '18%' }}
                />
              </div>
            </div>

            {/* Analyzer Mode Selector */}
            <div className="pt-1.5 border-t border-slate-800/80 cyber:border-cyan-500/40 lab:border-slate-200 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 cyber:text-zinc-300 lab:text-slate-600 uppercase text-[9px]">3D Field Mode:</span>
              <div className="flex bg-slate-900 cyber:bg-black lab:bg-slate-100 border border-slate-800 cyber:border-cyan-500/60 lab:border-slate-300 rounded p-0.5">
                {(['combined', 'cymatic', 'core', 'off'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setAnalyzerMode(m)}
                    className={`px-1.5 py-0.5 rounded uppercase font-mono text-[9px] transition-colors cursor-pointer ${
                      analyzerMode === m
                        ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 font-bold cyber:bg-cyan-400 cyber:text-black lab:bg-white lab:text-sky-700 lab:border-slate-300'
                        : 'text-slate-400 hover:text-slate-200 cyber:text-zinc-300 lab:text-slate-600 lab:hover:text-slate-900'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
