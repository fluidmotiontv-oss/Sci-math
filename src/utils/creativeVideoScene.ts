import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type VideoShowcasePreset =
  | 'auto-director'
  | 'orbit-showcase'
  | 'sovereign-core'
  | 'cathie-grid';

export interface VideoResolutionOption {
  id: 'hd-720' | 'fhd-1080' | 'square-1080';
  label: string;
  width: number;
  height: number;
}

export const VIDEO_RESOLUTIONS: VideoResolutionOption[] = [
  { id: 'hd-720', label: '720p HD (1280×720)', width: 1280, height: 720 },
  { id: 'fhd-1080', label: '1080p Full HD (1920×1080)', width: 1920, height: 1080 },
  { id: 'square-1080', label: '1:1 Square (1080×1080)', width: 1080, height: 1080 },
];

export interface CreativeVideoStageConfig {
  width: number;
  height: number;
  polarityAlpha: number;
  polarityBeta: number;
  baseFrequency: number;
}

export interface CreativeVideoFrameInput {
  elapsedSec: number;
  dtSec: number;
  preset: VideoShowcasePreset;
  bassEnergy: number; // 0..1
  midEnergy: number; // 0..1
  highEnergy: number; // 0..1
  overallRms: number; // 0..1
  freqData: Uint8Array | null;
  timeData: Float32Array | null;
  polarityAlpha: number;
  polarityBeta: number;
  baseFrequency: number;
  trackTitle: string;
  totalDurationSec: number;
  showHudOverlay: boolean;
}

export interface CreativeVideoStageHandle {
  outputCanvas: HTMLCanvasElement;
  renderFrame: (input: CreativeVideoFrameInput) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
}

export function pickSupportedVideoMimeType(): { mimeType: string; ext: 'mp4' | 'webm' } {
  const candidates: { mimeType: string; ext: 'mp4' | 'webm' }[] = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
    { mimeType: 'video/mp4;codecs=avc1,mp4a.40.2', ext: 'mp4' },
    { mimeType: 'video/mp4', ext: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { mimeType: 'video/webm', ext: 'webm' },
  ];
  if (typeof MediaRecorder === 'undefined') {
    return { mimeType: 'video/webm', ext: 'webm' };
  }
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c.mimeType)) {
        return c;
      }
    } catch {
      // continue checking fallbacks
    }
  }
  return { mimeType: '', ext: 'webm' };
}

const _vec3 = new THREE.Vector3();
const _cGold = new THREE.Color('#facc15');
const _cAlpha = new THREE.Color('#38bdf8');
const _cBeta = new THREE.Color('#e879f9');
const _cTemp = new THREE.Color();
const _dummyMat = new THREE.Object3D();

/**
 * Creates a self-contained Three.js studio stage + composited 2D HUD canvas
 * that renders all Dragon 9 creative 3D models synchronized to live MP3 audio energy.
 */
export function createCreativeVideoStage(config: CreativeVideoStageConfig): CreativeVideoStageHandle {
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

  const webglCanvas = document.createElement('canvas');
  webglCanvas.width = config.width;
  webglCanvas.height = config.height;

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = config.width;
  outputCanvas.height = config.height;
  const ctx2d = outputCanvas.getContext('2d');

  const renderer = new THREE.WebGLRenderer({
    canvas: webglCanvas,
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setSize(config.width, config.height, false);
  renderer.setPixelRatio(1); // Exact export pixel dimensions
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030712);
  scene.fog = new THREE.FogExp2(0x030712, 0.04);

  const camera = new THREE.PerspectiveCamera(45, config.width / config.height, 0.1, 100);
  camera.position.set(0, 3.8, 7.6);
  camera.lookAt(0, 1.2, 0);

  // Studio environment reflection
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmremGenerator.dispose();

  // Warm/Cool 3-point Lighting Rig
  const keyLight = new THREE.DirectionalLight(0xffedd5, 2.5);
  keyLight.position.set(6, 10, 6);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.35);
  fillLight.position.set(-6, 4, -5);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xe879f9, 1.1);
  rimLight.position.set(0, 3, -7);
  scene.add(rimLight);

  const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x030712, 0.85);
  scene.add(hemiLight);

  // Ground Grid
  const gridHelper = new THREE.GridHelper(22, 44, 0x38bdf8, 0x1e293b);
  gridHelper.position.y = -0.35;
  scene.add(gridHelper);

  const masterGroup = new THREE.Group();
  masterGroup.position.set(0, 1.2, 0);
  scene.add(masterGroup);

  // ==============================================================
  // 1. DRAGON 9 SOVEREIGN CORE (TorusKnot + Heart + Alpha/Beta + Rings)
  // ==============================================================
  const coreGroup = new THREE.Group();
  masterGroup.add(coreGroup);

  const shaderUniforms = {
    uTime: { value: 0 },
    uEnergy: { value: 0.25 },
  };

  const nucleusMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.16,
    metalness: 0.92,
  });
  nucleusMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = shaderUniforms.uTime;
    shader.uniforms.uEnergy = shaderUniforms.uEnergy;
    shader.vertexShader = `
      uniform float uTime;
      uniform float uEnergy;
      varying float vDisp;
      ${shader.vertexShader}
    `.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float w = sin(position.x * 4.5 + uTime * 3.5) * cos(position.y * 4.0 - uTime * 2.5) * sin(position.z * 5.0 + uTime * 3.0);
      float amp = 0.04 + uEnergy * 0.18;
      transformed += normal * w * amp;
      vDisp = w;
      `
    );
    shader.fragmentShader = `
      uniform float uTime;
      uniform float uEnergy;
      varying float vDisp;
      ${shader.fragmentShader}
    `.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      float f = smoothstep(-0.4, 0.4, vDisp);
      vec3 c1 = vec3(0.18, 0.75, 0.98);
      vec3 c2 = vec3(0.92, 0.48, 0.98);
      vec3 cGold = vec3(0.98, 0.82, 0.14);
      vec3 mixC = mix(c1, c2, f);
      if (abs(vDisp) > 0.55) mixC = mix(mixC, cGold, (abs(vDisp) - 0.55) * 2.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, mixC, 0.35 + uEnergy * 0.55);
      `
    );
  };

  const nucleusMesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.85, 0.22, 128, 32, 3, 4),
    nucleusMat
  );
  coreGroup.add(nucleusMesh);

  const heartMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.7,
    roughness: 0.25,
    metalness: 0.85,
  });
  const heartMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), heartMat);
  coreGroup.add(heartMesh);

  // Alpha Static Pole
  const alphaGroup = new THREE.Group();
  alphaGroup.position.set(-2.2, 0, 0);
  coreGroup.add(alphaGroup);
  alphaGroup.add(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.15, 2.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.85 })
    )
  );
  for (let i = 0; i < 3; i++) {
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35 - i * 0.08, 0.35 - i * 0.08, 0.05, 24),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.15 })
    );
    disc.position.y = -0.8 + i * 0.5;
    alphaGroup.add(disc);
  }
  const alphaCrystalMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.9,
    roughness: 0.1,
    metalness: 0.9,
  });
  const alphaCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), alphaCrystalMat);
  alphaCrystal.position.y = 1.2;
  alphaGroup.add(alphaCrystal);

  // Beta Reactor Pole
  const betaGroup = new THREE.Group();
  betaGroup.position.set(2.2, 0, 0);
  coreGroup.add(betaGroup);
  betaGroup.add(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.09, 2.2, 16),
      new THREE.MeshStandardMaterial({ color: 0xe879f9, roughness: 0.2, metalness: 0.85 })
    )
  );
  for (let i = 0; i < 4; i++) {
    const coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.035, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0xc026d3, metalness: 0.95, roughness: 0.1 })
    );
    coil.rotation.x = Math.PI / 2;
    coil.position.y = -0.6 + i * 0.45;
    betaGroup.add(coil);
  }
  const betaCrownMat = new THREE.MeshStandardMaterial({
    color: 0xfdf4ff,
    emissive: 0xe879f9,
    emissiveIntensity: 0.9,
    roughness: 0.1,
    metalness: 0.9,
  });
  const betaCrown = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.45, 12), betaCrownMat);
  betaCrown.position.y = 1.25;
  betaGroup.add(betaCrown);

  // Counter-rotating Nonary Rings
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.045, 16, 64),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.2 })
  );
  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.04, 16, 64),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.25 })
  );
  const tickGeo = new THREE.SphereGeometry(0.07, 12, 12);
  const tickMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xd97706,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.8,
  });
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeo, tickMat);
    tick.position.set(Math.cos(angle) * 1.85, Math.sin(angle) * 1.85, 0);
    outerRing.add(tick);
  }
  coreGroup.add(outerRing);
  coreGroup.add(innerRing);

  // ==============================================================
  // 2. BRUCE CATHIE HARMONIC GEODESIC SPHERE
  // ==============================================================
  const cathieGroup = new THREE.Group();
  masterGroup.add(cathieGroup);

  const cathieWire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.45, 2),
    new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    })
  );
  cathieGroup.add(cathieWire);

  [0, 25, 30, 51.18, -30, -41.28].forEach((latDeg) => {
    const rad = 2.45;
    const phi = ((90 - latDeg) * Math.PI) / 180;
    const y = rad * Math.cos(phi);
    const ringR = rad * Math.sin(phi);
    const latRing = new THREE.Mesh(
      new THREE.TorusGeometry(ringR, 0.018, 8, 48),
      new THREE.MeshBasicMaterial({
        color: latDeg === 30 || latDeg === 51.18 ? 0xfacc15 : 0x38bdf8,
        transparent: true,
        opacity: 0.6,
      })
    );
    latRing.rotation.x = Math.PI / 2;
    latRing.position.y = y;
    cathieGroup.add(latRing);
  });

  [
    { lat: 29.98, lon: 31.13, color: 0xfacc15 },
    { lat: 51.18, lon: -1.83, color: 0x38bdf8 },
    { lat: 25.0, lon: -71.0, color: 0xe879f9 },
    { lat: -41.28, lon: 174.77, color: 0x4ade80 },
    { lat: 31.07, lon: 81.31, color: 0xf43f5e },
  ].forEach((c) => {
    const phi = ((90 - c.lat) * Math.PI) / 180;
    const theta = ((c.lon + 180) * Math.PI) / 180;
    const r = 2.48;
    const x = -r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 12, 12),
      new THREE.MeshBasicMaterial({ color: c.color })
    );
    beacon.position.set(x, y, z);
    cathieGroup.add(beacon);

    const rayGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(x, y, z),
    ]);
    cathieGroup.add(
      new THREE.Line(rayGeo, new THREE.LineBasicMaterial({ color: c.color, transparent: true, opacity: 0.3 }))
    );
  });

  // ==============================================================
  // 3. CYMATIC STANDING-WAVE INTERFERENCE SHELL
  // ==============================================================
  const cymaticGeo = new THREE.IcosahedronGeometry(2.1, 3);
  const cymaticBasePos = cymaticGeo.attributes.position.array.slice() as Float32Array;
  const cymaticColors = new Float32Array(cymaticGeo.attributes.position.count * 3);
  cymaticGeo.setAttribute('color', new THREE.BufferAttribute(cymaticColors, 3));
  const cymaticMesh = new THREE.Mesh(
    cymaticGeo,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: 0.78,
      roughness: 0.15,
      metalness: 0.85,
    })
  );
  masterGroup.add(cymaticMesh);

  // ==============================================================
  // 4. AUDIO-REACTIVE WAVEFORM HALO + RADIAL SPECTRUM CRYSTAL RING
  // ==============================================================
  const waveCount = 256;
  const wavePos = new Float32Array(waveCount * 3);
  const waveGeo = new THREE.BufferGeometry();
  waveGeo.setAttribute('position', new THREE.BufferAttribute(wavePos, 3));
  const waveMesh = new THREE.LineLoop(
    waveGeo,
    new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.92 })
  );
  masterGroup.add(waveMesh);

  const fftBarCount = 45;
  const fftBarGeo = new THREE.BoxGeometry(0.11, 1.0, 0.11);
  const fftBarMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.85,
  });
  const fftInstanced = new THREE.InstancedMesh(fftBarGeo, fftBarMat, fftBarCount);
  fftInstanced.position.set(0, -1.52, 0);
  fftInstanced.frustumCulled = false;
  for (let i = 0; i < fftBarCount; i++) {
    const tColor = i % 3 === 0 ? _cAlpha : i % 3 === 1 ? _cBeta : _cGold;
    fftInstanced.setColorAt(i, tColor);
  }
  if (fftInstanced.instanceColor) fftInstanced.instanceColor.needsUpdate = true;
  masterGroup.add(fftInstanced);

  const renderFrame = (input: CreativeVideoFrameInput) => {
    const {
      elapsedSec,
      dtSec,
      preset,
      bassEnergy,
      midEnergy,
      highEnergy,
      overallRms,
      freqData,
      timeData,
      polarityAlpha,
      polarityBeta,
      baseFrequency,
    } = input;

    const dt = Math.min(dtSec, 0.1);
    const audioIntensity = Math.min(1, overallRms * 2.4 + bassEnergy * 0.6);

    // Visibility per showcase preset
    coreGroup.visible = preset !== 'cathie-grid';
    cathieGroup.visible = preset !== 'sovereign-core';
    cymaticMesh.visible = true;
    waveMesh.visible = true;
    fftInstanced.visible = true;

    // Update shader uniforms
    shaderUniforms.uTime.value = elapsedSec;
    shaderUniforms.uEnergy.value = audioIntensity;

    // Pulse rotation speed driven by MP3 bass & mid energy
    const rotMult = 1.0 + bassEnergy * 2.1 + midEnergy * 0.9;
    const rotDelta = dt * 0.48 * rotMult;

    nucleusMesh.rotation.x += rotDelta * 0.7;
    nucleusMesh.rotation.y += rotDelta * 0.95;
    heartMesh.rotation.y -= rotDelta * 1.3;
    const heartPulse = 1 + bassEnergy * 0.28;
    heartMesh.scale.set(heartPulse, heartPulse, heartPulse);
    heartMat.emissiveIntensity = 0.55 + bassEnergy * 1.4;

    outerRing.rotation.z += rotDelta * 0.55;
    innerRing.rotation.z -= rotDelta * 0.85;
    innerRing.rotation.x += rotDelta * 0.35;

    const aScale = 0.5 + (polarityAlpha / 100) * 0.8 + highEnergy * 0.12;
    const bScale = 0.5 + (polarityBeta / 100) * 0.8 + bassEnergy * 0.18;
    alphaGroup.scale.set(aScale, aScale, aScale);
    betaGroup.scale.set(bScale, bScale, bScale);
    alphaCrystalMat.emissiveIntensity = 0.65 + highEnergy * 1.6;
    betaCrownMat.emissiveIntensity = 0.65 + bassEnergy * 1.8;

    // Rotate Cathie Sphere
    cathieGroup.rotation.y += rotDelta * 0.32;
    cathieGroup.rotation.x = Math.sin(elapsedSec * 0.45) * 0.16;

    // Deform Cymatic Shell smoothly
    const cPos = cymaticGeo.attributes.position as THREE.BufferAttribute;
    const cCol = cymaticGeo.attributes.color as THREE.BufferAttribute;
    const posArr = cPos.array as Float32Array;
    const colArr = cCol.array as Float32Array;
    const k = (baseFrequency / 432) * (3.2 + midEnergy * 2.2);
    const cAmp = 0.08 + audioIntensity * 0.34;

    for (let i = 0; i < cPos.count; i++) {
      const bx = cymaticBasePos[i * 3];
      const by = cymaticBasePos[i * 3 + 1];
      const bz = cymaticBasePos[i * 3 + 2];
      _vec3.set(bx, by, bz).normalize();

      const w1 = Math.sin(_vec3.x * k * Math.PI + elapsedSec * 3.0);
      const w2 = Math.cos(_vec3.y * k * Math.PI - elapsedSec * 2.1);
      const w3 = Math.sin(_vec3.z * k * Math.PI + elapsedSec * 2.6);
      const interference = w1 * w2 * w3;
      const disp = interference * cAmp;

      posArr[i * 3] = bx + _vec3.x * disp;
      posArr[i * 3 + 1] = by + _vec3.y * disp;
      posArr[i * 3 + 2] = bz + _vec3.z * disp;

      if (interference > 0.18) {
        _cTemp.copy(_cGold).lerp(_cAlpha, Math.min(1, (interference - 0.18) * 1.25));
        colArr[i * 3] = _cTemp.r;
        colArr[i * 3 + 1] = _cTemp.g;
        colArr[i * 3 + 2] = _cTemp.b;
      } else if (interference < -0.18) {
        colArr[i * 3] = _cBeta.r;
        colArr[i * 3 + 1] = _cBeta.g;
        colArr[i * 3 + 2] = _cBeta.b;
      } else {
        colArr[i * 3] = 0.03;
        colArr[i * 3 + 1] = 0.25 + highEnergy * 0.3;
        colArr[i * 3 + 2] = 0.55 + midEnergy * 0.35;
      }
    }
    cPos.needsUpdate = true;
    cCol.needsUpdate = true;
    cymaticMesh.rotation.y += rotDelta * 0.25;

    // Update 3D Acoustic Waveform Halo from live PCM
    const wAttr = waveGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < waveCount; i++) {
      const u = (i / waveCount) * Math.PI * 2;
      const pcm = timeData ? timeData[Math.floor((i / waveCount) * Math.min(512, timeData.length))] : 0;
      const r = 2.65 + Math.sin(u * 9 + elapsedSec * 2.5) * 0.12 + pcm * 0.65;
      const y = Math.cos(u * 3 + elapsedSec * 2.0) * (0.18 + midEnergy * 0.35) + pcm * 0.45;
      wAttr.setXYZ(i, r * Math.cos(u), y, r * Math.sin(u));
    }
    wAttr.needsUpdate = true;

    // Update 45-bar Circular FFT Horizon Ring
    for (let i = 0; i < fftBarCount; i++) {
      const angle = (i / fftBarCount) * Math.PI * 2 + elapsedSec * 0.18;
      const ringR = 3.25;
      let mag = 0.12 + 0.08 * Math.sin(elapsedSec * 3 + i * 0.5);
      if (freqData && freqData.length > 0) {
        const bin = Math.min(freqData.length - 1, Math.floor((i / fftBarCount) * 110));
        mag = 0.1 + (freqData[bin] / 255) * 1.45;
      }
      _dummyMat.position.set(Math.cos(angle) * ringR, mag * 0.5, Math.sin(angle) * ringR);
      _dummyMat.rotation.set(0, -angle, 0);
      _dummyMat.scale.set(1, mag, 1);
      _dummyMat.updateMatrix();
      fftInstanced.setMatrixAt(i, _dummyMat.matrix);
    }
    fftInstanced.instanceMatrix.needsUpdate = true;

    // Cinematic Camera Choreography
    if (preset === 'auto-director') {
      const phaseAngle = elapsedSec * 0.35;
      const elevationPhase = Math.sin(elapsedSec * 0.24);
      const camR = 7.4 - bassEnergy * 0.55 + Math.cos(elapsedSec * 0.2) * 0.9;
      camera.position.set(
        Math.sin(phaseAngle) * camR,
        2.9 + elevationPhase * 2.1,
        Math.cos(phaseAngle) * camR
      );
      camera.lookAt(0, 1.15, 0);
    } else if (preset === 'orbit-showcase') {
      const ang = elapsedSec * 0.42;
      camera.position.set(Math.sin(ang) * 7.8, 3.6, Math.cos(ang) * 7.8);
      camera.lookAt(0, 1.1, 0);
    } else if (preset === 'sovereign-core') {
      const ang = elapsedSec * 0.3;
      camera.position.set(Math.sin(ang) * 5.2, 2.0 + Math.sin(elapsedSec * 0.5) * 0.5, Math.cos(ang) * 5.2);
      camera.lookAt(0, 1.2, 0);
    } else {
      // 'cathie-grid'
      const ang = elapsedSec * 0.28;
      camera.position.set(Math.sin(ang) * 6.8, 4.8 + Math.sin(elapsedSec * 0.4) * 0.8, Math.cos(ang) * 6.8);
      camera.lookAt(0, 1.2, 0);
    }

    renderer.render(scene, camera);

    // Composite WebGL frame + optional Broadcast HUD onto outputCanvas
    if (ctx2d) {
      const w = outputCanvas.width;
      const h = outputCanvas.height;
      ctx2d.clearRect(0, 0, w, h);
      ctx2d.drawImage(webglCanvas, 0, 0, w, h);

      if (input.showHudOverlay) {
        drawBroadcastHudOverlay(ctx2d, w, h, input);
      }
    }
  };

  const resize = (width: number, height: number) => {
    webglCanvas.width = width;
    webglCanvas.height = height;
    outputCanvas.width = width;
    outputCanvas.height = height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const dispose = () => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.LineLoop) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });
    envTex.dispose();
    renderer.dispose();
  };

  return {
    outputCanvas,
    renderFrame,
    resize,
    dispose,
  };
}

function formatClockSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function drawBroadcastHudOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  input: CreativeVideoFrameInput
): void {
  const pad = Math.round(Math.min(w, h) * 0.032);
  const scale = Math.max(0.75, w / 1280);

  ctx.save();

  // Top-left Track & Dragon 9 Telemetry Chip
  const boxW = Math.min(w - pad * 2, Math.round(460 * scale));
  const boxH = Math.round(58 * scale);
  ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.beginPath();
  ctx.roundRect(pad, pad, boxW, boxH, Math.round(10 * scale));
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = `700 ${Math.round(11 * scale)}px monospace`;
  ctx.fillText('DRAGON 9 CREATIVE 3D SHOWCASE · 432HZ ENGINE', pad + Math.round(14 * scale), pad + Math.round(21 * scale));

  ctx.fillStyle = '#f8fafc';
  ctx.font = `600 ${Math.round(14 * scale)}px sans-serif`;
  const cleanTitle = input.trackTitle.length > 36 ? input.trackTitle.slice(0, 35) + '…' : input.trackTitle;
  ctx.fillText(cleanTitle, pad + Math.round(14 * scale), pad + Math.round(43 * scale));

  // Top-right Timecode & Polarity Readout
  const rightW = Math.round(210 * scale);
  ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
  ctx.strokeStyle = 'rgba(232, 121, 249, 0.4)';
  ctx.beginPath();
  ctx.roundRect(w - pad - rightW, pad, rightW, boxH, Math.round(10 * scale));
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e879f9';
  ctx.font = `700 ${Math.round(11 * scale)}px monospace`;
  ctx.fillText(
    `α ${input.polarityAlpha}% / β ${input.polarityBeta}%`,
    w - pad - rightW + Math.round(14 * scale),
    pad + Math.round(21 * scale)
  );
  ctx.fillStyle = '#facc15';
  ctx.font = `700 ${Math.round(14 * scale)}px monospace`;
  ctx.fillText(
    `${formatClockSec(input.elapsedSec)} / ${formatClockSec(input.totalDurationSec)}`,
    w - pad - rightW + Math.round(14 * scale),
    pad + Math.round(43 * scale)
  );

  // Bottom Audio Spectrum Bar Ribbon
  if (input.freqData && input.freqData.length > 0) {
    const barCount = 48;
    const ribbonW = Math.min(w - pad * 2, Math.round(620 * scale));
    const startX = (w - ribbonW) / 2;
    const baseY = h - pad;
    const gap = Math.round(4 * scale);
    const barW = (ribbonW - gap * (barCount - 1)) / barCount;

    for (let i = 0; i < barCount; i++) {
      const bin = Math.min(input.freqData.length - 1, Math.floor((i / barCount) * 120));
      const norm = input.freqData[bin] / 255;
      const barH = Math.max(3, norm * Math.round(48 * scale));
      ctx.fillStyle =
        i % 3 === 0 ? 'rgba(56, 189, 248, 0.85)' : i % 3 === 1 ? 'rgba(232, 121, 249, 0.8)' : 'rgba(250, 204, 21, 0.85)';
      ctx.fillRect(startX + i * (barW + gap), baseY - barH, barW, barH);
    }
  }

  ctx.restore();
}
