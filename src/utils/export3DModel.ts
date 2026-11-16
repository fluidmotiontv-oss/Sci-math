import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

export type Export3DFormat = 'glb' | 'gltf' | 'obj' | 'stl';

export type Export3DTarget =
  | 'visible'
  | 'sovereign-core'
  | 'cathie-grid'
  | 'cymatic-shell'
  | 'acoustic-wave'
  | 'full-ecosystem';

export type ViewportSceneMode = 'sovereign-core' | 'cathie-grid' | 'nonary-clock' | 'lissajous-wave';

export interface SceneSnapshotCapture {
  dataUrl: string;
  width: number;
  height: number;
  mimeType: string;
  capturedAt: string;
}

export interface Live3DSnapshotRefs {
  coreGroup: THREE.Group | null;
  cathieGroup: THREE.Group | null;
  waveMesh: THREE.Line | null;
  cymaticMesh: THREE.Mesh | null;
  captureSnapshot?: () => SceneSnapshotCapture | null;
}

export interface Export3DBuildParams {
  target: Export3DTarget;
  format: Export3DFormat;
  sceneMode: ViewportSceneMode;
  frequency: number;
  isAudioPlaying: boolean;
  polarityAlpha: number;
  polarityBeta: number;
  codename: string;
  bakeHarmonicWave: boolean;
  centerAtOrigin: boolean;
  liveRefs?: Live3DSnapshotRefs | null;
}

export interface Export3DStats {
  meshCount: number;
  lineCount: number;
  vertexCount: number;
  triangleCount: number;
  boundsSize: { x: number; y: number; z: number };
}

export interface Export3DResult {
  filename: string;
  byteSize: number;
  stats: Export3DStats;
}

const PLANETARY_NODE_COORDS = [
  { name: 'Node_Giza', lat: 29.98, lon: 31.13, color: 0xfacc15 },
  { name: 'Node_Stonehenge', lat: 51.18, lon: -1.83, color: 0x38bdf8 },
  { name: 'Node_Bermuda', lat: 25.0, lon: -71.0, color: 0xe879f9 },
  { name: 'Node_Tasman', lat: -41.28, lon: 174.77, color: 0x4ade80 },
  { name: 'Node_Kailash', lat: 31.07, lon: 81.31, color: 0xf43f5e },
];

const CATHIE_LATITUDES = [0, 25, 30, 51.18, -30, -41.28];

/**
 * Applies the Dragon 9 standing-wave harmonic interference displacement
 * cleanly onto a cloned BufferGeometry so shader effects bake into exported vertices.
 */
function bakeInterferenceDisplacement(
  geo: THREE.BufferGeometry,
  frequency: number,
  isAudioPlaying: boolean,
  waveScale: number,
  amplitudeActive: number,
  amplitudeIdle: number
): void {
  const posAttr = geo.getAttribute('position') as THREE.BufferAttribute | undefined;
  let normAttr = geo.getAttribute('normal') as THREE.BufferAttribute | undefined;
  if (!posAttr) return;

  if (!normAttr) {
    geo.computeVertexNormals();
    normAttr = geo.getAttribute('normal') as THREE.BufferAttribute | undefined;
  }
  if (!normAttr) return;

  const k = (Math.max(1, frequency) / 432) * waveScale;
  const amp = isAudioPlaying ? amplitudeActive : amplitudeIdle;
  const phase = 1.25; // Deterministic crisp harmonic freeze phase

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);

    const nx = normAttr.getX(i);
    const ny = normAttr.getY(i);
    const nz = normAttr.getZ(i);

    const wave1 = Math.sin(x * k + phase * 3.5);
    const wave2 = Math.cos(y * k * 0.85 - phase * 2.5);
    const wave3 = Math.sin(z * k * 1.15 + phase * 3.0);
    const interference = wave1 * wave2 * wave3;

    posAttr.setXYZ(
      i,
      x + nx * interference * amp,
      y + ny * interference * amp,
      z + nz * interference * amp
    );
  }

  posAttr.needsUpdate = true;
  geo.computeVertexNormals();
}

/**
 * Converts a wireframe BufferGeometry into unique cylindrical struts so STL/3D-print exports
 * preserve geodesic grid edges as solid printable triangles.
 */
function buildSolidWireframeStruts(
  sourceGeo: THREE.BufferGeometry,
  strutRadius: number,
  color: number,
  name: string
): THREE.Group {
  const group = new THREE.Group();
  group.name = name;

  const wireGeo = new THREE.WireframeGeometry(sourceGeo);
  const pos = wireGeo.getAttribute('position');
  const seenEdges = new Set<string>();

  const up = new THREE.Vector3(0, 1, 0);
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const quat = new THREE.Quaternion();

  const unitCyl = new THREE.CylinderGeometry(strutRadius, strutRadius, 1, 6, 1);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.35,
    metalness: 0.7,
  });

  for (let i = 0; i < pos.count; i += 2) {
    vA.fromBufferAttribute(pos, i);
    vB.fromBufferAttribute(pos, i + 1);

    const kA = `${vA.x.toFixed(3)},${vA.y.toFixed(3)},${vA.z.toFixed(3)}`;
    const kB = `${vB.x.toFixed(3)},${vB.y.toFixed(3)},${vB.z.toFixed(3)}`;
    const edgeKey = kA < kB ? `${kA}|${kB}` : `${kB}|${kA}`;
    if (seenEdges.has(edgeKey)) continue;
    seenEdges.add(edgeKey);

    const dist = vA.distanceTo(vB);
    if (dist < 1e-4) continue;

    dir.subVectors(vB, vA).normalize();
    mid.addVectors(vA, vB).multiplyScalar(0.5);
    quat.setFromUnitVectors(up, dir);

    const mesh = new THREE.Mesh(unitCyl.clone(), mat);
    mesh.name = `${name}_Strut_${seenEdges.size}`;
    mesh.position.copy(mid);
    mesh.quaternion.copy(quat);
    mesh.scale.set(1, dist, 1);
    group.add(mesh);
  }

  unitCyl.dispose();
  wireGeo.dispose();
  return group;
}

/**
 * Clones a Three.js MeshStandard/MeshBasic material cleanly without custom shader hooks
 * so GLTFExporter/OBJExporter serialize standard PBR attributes reliably.
 */
function sanitizeMaterialForExport(srcMat: THREE.Material | THREE.Material[]): THREE.Material {
  const baseMat = Array.isArray(srcMat) ? srcMat[0] : srcMat;

  if (baseMat instanceof THREE.MeshStandardMaterial) {
    return new THREE.MeshStandardMaterial({
      name: baseMat.name || undefined,
      color: baseMat.color.clone(),
      emissive: baseMat.emissive.clone(),
      emissiveIntensity: baseMat.emissiveIntensity,
      roughness: baseMat.roughness,
      metalness: baseMat.metalness,
      vertexColors: baseMat.vertexColors,
      transparent: baseMat.transparent,
      opacity: baseMat.opacity,
      side: baseMat.side,
    });
  }

  if (baseMat instanceof THREE.MeshBasicMaterial) {
    return new THREE.MeshStandardMaterial({
      name: baseMat.name || undefined,
      color: baseMat.color.clone(),
      emissive: baseMat.color.clone(),
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.6,
      vertexColors: baseMat.vertexColors,
      transparent: baseMat.transparent,
      opacity: baseMat.opacity,
      side: baseMat.side,
    });
  }

  return new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.3,
    metalness: 0.7,
  });
}

/**
 * Builds or clones the Dragon 9 Sovereign Core 3D group.
 */
function buildCoreExportGroup(params: Export3DBuildParams): THREE.Group {
  const { frequency, isAudioPlaying, polarityAlpha, polarityBeta, bakeHarmonicWave, liveRefs } = params;

  if (liveRefs?.coreGroup) {
    const cloned = liveRefs.coreGroup.clone(true);
    cloned.name = 'Dragon9_Sovereign_Core';
    cloned.visible = true;

    let partIdx = 0;
    cloned.traverse((child) => {
      child.visible = true;
      if (child instanceof THREE.Mesh) {
        partIdx += 1;
        child.geometry = child.geometry.clone();
        child.material = sanitizeMaterialForExport(child.material);

        if (child.geometry instanceof THREE.TorusKnotGeometry) {
          child.name = 'Sovereign_Nucleus_TorusKnot';
          if (bakeHarmonicWave) {
            bakeInterferenceDisplacement(child.geometry, frequency, isAudioPlaying, 4.5, 0.14, 0.04);
          }
        } else if (child.geometry instanceof THREE.DodecahedronGeometry) {
          child.name = 'Inner_Resonant_Dodecahedron_Heart';
          if (bakeHarmonicWave) {
            bakeInterferenceDisplacement(child.geometry, frequency, isAudioPlaying, 5.5, 0.1, 0.03);
          }
        } else if (!child.name) {
          child.name = `Core_Component_${partIdx}`;
        }
      }
    });

    return cloned;
  }

  // Deterministic procedural fallback when 3D Viewport is unmounted
  const coreGroup = new THREE.Group();
  coreGroup.name = 'Dragon9_Sovereign_Core';
  coreGroup.position.set(0, 1.2, 0);

  const nucleusGeo = new THREE.TorusKnotGeometry(0.85, 0.22, 128, 32, 3, 4);
  if (bakeHarmonicWave) {
    bakeInterferenceDisplacement(nucleusGeo, frequency, isAudioPlaying, 4.5, 0.14, 0.04);
  }
  const nucleusMesh = new THREE.Mesh(
    nucleusGeo,
    new THREE.MeshStandardMaterial({
      name: 'Obsidian_Titanium_Nucleus',
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.92,
    })
  );
  nucleusMesh.name = 'Sovereign_Nucleus_TorusKnot';
  coreGroup.add(nucleusMesh);

  const heartGeo = new THREE.DodecahedronGeometry(0.55, 0);
  if (bakeHarmonicWave) {
    bakeInterferenceDisplacement(heartGeo, frequency, isAudioPlaying, 5.5, 0.1, 0.03);
  }
  const heartMesh = new THREE.Mesh(
    heartGeo,
    new THREE.MeshStandardMaterial({
      name: 'Cyan_Resonant_Heart',
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.8,
    })
  );
  heartMesh.name = 'Inner_Resonant_Dodecahedron_Heart';
  coreGroup.add(heartMesh);

  // Alpha Pole
  const alphaGroup = new THREE.Group();
  alphaGroup.name = 'Polarity_Pin_Alpha_Static';
  alphaGroup.position.set(-2.2, 0, 0);
  const alphaScale = 0.5 + (polarityAlpha / 100) * 0.8;
  alphaGroup.scale.set(alphaScale, alphaScale, alphaScale);

  const alphaPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.15, 2.2, 16),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.85 })
  );
  alphaPillar.name = 'Alpha_Pillar';
  alphaGroup.add(alphaPillar);

  for (let i = 0; i < 3; i++) {
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35 - i * 0.08, 0.35 - i * 0.08, 0.05, 24),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.15 })
    );
    disc.name = `Alpha_Stabilizing_Disc_${i + 1}`;
    disc.position.y = -0.8 + i * 0.5;
    alphaGroup.add(disc);
  }

  const alphaCrystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22, 0),
    new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
    })
  );
  alphaCrystal.name = 'Alpha_Crystal_Beacon';
  alphaCrystal.position.y = 1.2;
  alphaGroup.add(alphaCrystal);
  coreGroup.add(alphaGroup);

  // Beta Pole
  const betaGroup = new THREE.Group();
  betaGroup.name = 'Polarity_Pin_Beta_Reactor';
  betaGroup.position.set(2.2, 0, 0);
  const betaScale = 0.5 + (polarityBeta / 100) * 0.8;
  betaGroup.scale.set(betaScale, betaScale, betaScale);

  const betaPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.09, 2.2, 16),
    new THREE.MeshStandardMaterial({ color: 0xe879f9, roughness: 0.2, metalness: 0.85 })
  );
  betaPillar.name = 'Beta_Pillar';
  betaGroup.add(betaPillar);

  for (let i = 0; i < 4; i++) {
    const coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.035, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0xc026d3, metalness: 0.95, roughness: 0.1 })
    );
    coil.name = `Beta_Emitter_Coil_${i + 1}`;
    coil.rotation.x = Math.PI / 2;
    coil.position.y = -0.6 + i * 0.45;
    betaGroup.add(coil);
  }

  const betaCrown = new THREE.Mesh(
    new THREE.ConeGeometry(0.25, 0.45, 12),
    new THREE.MeshStandardMaterial({
      color: 0xfdf4ff,
      emissive: 0xe879f9,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9,
    })
  );
  betaCrown.name = 'Beta_Reactor_Crown';
  betaCrown.position.y = 1.25;
  betaGroup.add(betaCrown);
  coreGroup.add(betaGroup);

  // Counter-rotating Nonary Temporal Rings
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.045, 16, 64),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.2 })
  );
  outerRing.name = 'Nonary_Outer_Chapter_Ring';

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
    const tick = new THREE.Mesh(tickGeo.clone(), tickMat);
    tick.name = `Nonary_Tick_Node_${i + 1}`;
    tick.position.set(Math.cos(angle) * 1.85, Math.sin(angle) * 1.85, 0);
    outerRing.add(tick);
  }
  tickGeo.dispose();

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.04, 16, 64),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.25 })
  );
  innerRing.name = 'Nonary_Inner_Harmonic_Ring';

  coreGroup.add(outerRing);
  coreGroup.add(innerRing);

  return coreGroup;
}

/**
 * Builds Bruce Cathie Geodesic Sphere group cleanly for GLTF/GLB/OBJ/STL.
 */
function buildCathieExportGroup(params: Export3DBuildParams): THREE.Group {
  const { format, liveRefs } = params;
  const cathieGroup = new THREE.Group();
  cathieGroup.name = 'Bruce_Cathie_Harmonic_Grid';

  if (liveRefs?.cathieGroup) {
    cathieGroup.position.copy(liveRefs.cathieGroup.position);
    cathieGroup.rotation.copy(liveRefs.cathieGroup.rotation);
    cathieGroup.scale.copy(liveRefs.cathieGroup.scale);
  } else {
    cathieGroup.position.set(0, 1.2, 0);
  }

  // Geodesic wireframe sphere: solid struts for STL, crisp LineSegments for GLB/GLTF/OBJ
  const sphereGeo = new THREE.IcosahedronGeometry(2.35, 2);
  if (format === 'stl') {
    const struts = buildSolidWireframeStruts(sphereGeo, 0.016, 0x0284c7, 'Cathie_Geodesic_Lattice');
    cathieGroup.add(struts);
  } else {
    const wireGeo = new THREE.WireframeGeometry(sphereGeo);
    const wireLines = new THREE.LineSegments(
      wireGeo,
      new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.65 })
    );
    wireLines.name = 'Cathie_Geodesic_Wireframe';
    cathieGroup.add(wireLines);
  }
  sphereGeo.dispose();

  // Planetary harmonic latitude rings
  CATHIE_LATITUDES.forEach((latDeg) => {
    const rad = 2.35;
    const phi = ((90 - latDeg) * Math.PI) / 180;
    const y = rad * Math.cos(phi);
    const ringR = rad * Math.sin(phi);
    const latRing = new THREE.Mesh(
      new THREE.TorusGeometry(ringR, 0.025, 10, 48),
      new THREE.MeshStandardMaterial({
        color: latDeg === 30 || latDeg === 51.18 ? 0xfacc15 : 0x38bdf8,
        emissive: latDeg === 30 || latDeg === 51.18 ? 0xca8a04 : 0x0284c7,
        emissiveIntensity: 0.4,
        roughness: 0.25,
        metalness: 0.8,
      })
    );
    latRing.name = `Harmonic_Latitude_${latDeg}deg`;
    latRing.rotation.x = Math.PI / 2;
    latRing.position.y = y;
    cathieGroup.add(latRing);
  });

  // 5 Planetary Node Beacons & Energy Rays
  PLANETARY_NODE_COORDS.forEach((c) => {
    const phi = ((90 - c.lat) * Math.PI) / 180;
    const theta = ((c.lon + 180) * Math.PI) / 180;
    const r = 2.38;
    const x = -r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 16, 16),
      new THREE.MeshStandardMaterial({
        color: c.color,
        emissive: c.color,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.7,
      })
    );
    beacon.name = c.name;
    beacon.position.set(x, y, z);
    cathieGroup.add(beacon);

    if (format !== 'stl') {
      const rayGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z),
      ]);
      const ray = new THREE.Line(
        rayGeo,
        new THREE.LineBasicMaterial({ color: c.color, transparent: true, opacity: 0.45 })
      );
      ray.name = `${c.name}_Energy_Ray`;
      cathieGroup.add(ray);
    }
  });

  return cathieGroup;
}

/**
 * Builds the 3D Harmonic Cymatic Interference Shell sculpted at current frequency.
 */
function buildCymaticExportObject(params: Export3DBuildParams): THREE.Mesh {
  const { frequency, isAudioPlaying, bakeHarmonicWave, liveRefs } = params;

  if (liveRefs?.cymaticMesh && bakeHarmonicWave) {
    const geo = liveRefs.cymaticMesh.geometry.clone();
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        name: 'Cymatic_Interference_Material',
        vertexColors: true,
        roughness: 0.2,
        metalness: 0.8,
        side: THREE.DoubleSide,
      })
    );
    mesh.name = 'Harmonic_Cymatic_Interference_Shell';
    mesh.position.copy(liveRefs.cymaticMesh.position);
    mesh.rotation.copy(liveRefs.cymaticMesh.rotation);
    return mesh;
  }

  const cymaticGeo = new THREE.IcosahedronGeometry(2.15, 3);
  const posAttr = cymaticGeo.getAttribute('position') as THREE.BufferAttribute;
  const count = posAttr.count;
  const colors = new Float32Array(count * 3);

  const k = (Math.max(1, frequency) / 432) * 3.5;
  const amp = bakeHarmonicWave ? (isAudioPlaying ? 0.32 : 0.14) : 0.04;
  const timePhase = 1.4;
  const v = new THREE.Vector3();
  const cAlpha = new THREE.Color('#38bdf8');
  const cBeta = new THREE.Color('#e879f9');
  const cGold = new THREE.Color('#facc15');

  for (let i = 0; i < count; i++) {
    const bx = posAttr.getX(i);
    const by = posAttr.getY(i);
    const bz = posAttr.getZ(i);
    v.set(bx, by, bz).normalize();

    const w1 = Math.sin(v.x * k * Math.PI + timePhase * 3.0);
    const w2 = Math.cos(v.y * k * Math.PI - timePhase * 2.0);
    const w3 = Math.sin(v.z * k * Math.PI + timePhase * 2.5);
    const interference = w1 * w2 * w3;
    const disp = interference * amp;

    posAttr.setXYZ(i, bx + v.x * disp, by + v.y * disp, bz + v.z * disp);

    if (interference > 0.2) {
      const c = cGold.clone().lerp(cAlpha, Math.min(1, (interference - 0.2) * 1.2));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    } else if (interference < -0.2) {
      colors[i * 3] = cBeta.r;
      colors[i * 3 + 1] = cBeta.g;
      colors[i * 3 + 2] = cBeta.b;
    } else {
      colors[i * 3] = 0.04;
      colors[i * 3 + 1] = 0.28;
      colors[i * 3 + 2] = 0.55;
    }
  }

  posAttr.needsUpdate = true;
  cymaticGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  cymaticGeo.computeVertexNormals();

  const mesh = new THREE.Mesh(
    cymaticGeo,
    new THREE.MeshStandardMaterial({
      name: 'Cymatic_Interference_Material',
      vertexColors: true,
      roughness: 0.2,
      metalness: 0.8,
      side: THREE.DoubleSide,
    })
  );
  mesh.name = 'Harmonic_Cymatic_Interference_Shell';
  mesh.position.set(0, 1.2, 0);
  return mesh;
}

/**
 * Builds the 432Hz Acoustic Waveform Halo.
 * Automatically extrudes into a closed TubeGeometry when exporting to STL so slicers get solid triangles.
 */
function buildWaveExportObject(params: Export3DBuildParams): THREE.Object3D {
  const { format, frequency, isAudioPlaying, liveRefs } = params;
  const points: THREE.Vector3[] = [];

  if (liveRefs?.waveMesh) {
    const pos = liveRefs.waveMesh.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      points.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
    }
  } else {
    const count = 256;
    const radius = 2.0;
    const phase = (frequency / 432) * 2.1;
    for (let i = 0; i < count; i++) {
      const u = (i / count) * Math.PI * 2;
      const harmonicFactor = Math.sin(u * 9 + phase) * (isAudioPlaying ? 0.28 : 0.14);
      const r = radius + harmonicFactor;
      points.push(
        new THREE.Vector3(
          r * Math.cos(u),
          Math.cos(u * 3 + phase) * (isAudioPlaying ? 0.35 : 0.18),
          r * Math.sin(u)
        )
      );
    }
  }

  if (format === 'stl') {
    const curve = new THREE.CatmullRomCurve3(points, true);
    const tubeGeo = new THREE.TubeGeometry(curve, 160, 0.04, 10, true);
    const mesh = new THREE.Mesh(
      tubeGeo,
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.25, metalness: 0.85 })
    );
    mesh.name = 'Harmonic_Acoustic_Waveform_Tube';
    mesh.position.set(0, 1.2, 0);
    return mesh;
  }

  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  const lineLoop = new THREE.LineLoop(
    lineGeo,
    new THREE.LineBasicMaterial({ color: 0x38bdf8 })
  );
  lineLoop.name = 'Harmonic_Acoustic_Waveform_Halo';
  lineLoop.position.set(0, 1.2, 0);
  return lineLoop;
}

/**
 * Resolves which sub-assemblies should be included for the chosen Export3DTarget.
 */
export function resolveIncludedAssemblies(
  target: Export3DTarget,
  sceneMode: ViewportSceneMode,
  isAudioPlaying: boolean
): {
  includeCore: boolean;
  includeCathie: boolean;
  includeCymatic: boolean;
  includeWave: boolean;
} {
  if (target === 'sovereign-core') {
    return { includeCore: true, includeCathie: false, includeCymatic: false, includeWave: false };
  }
  if (target === 'cathie-grid') {
    return { includeCore: false, includeCathie: true, includeCymatic: false, includeWave: false };
  }
  if (target === 'cymatic-shell') {
    return { includeCore: false, includeCathie: false, includeCymatic: true, includeWave: false };
  }
  if (target === 'acoustic-wave') {
    return { includeCore: false, includeCathie: false, includeCymatic: false, includeWave: true };
  }
  if (target === 'full-ecosystem') {
    return { includeCore: true, includeCathie: true, includeCymatic: true, includeWave: true };
  }

  // 'visible': matches ThreeViewport visibility logic
  return {
    includeCore: sceneMode === 'sovereign-core' || sceneMode === 'nonary-clock',
    includeCathie: sceneMode === 'cathie-grid' || sceneMode === 'sovereign-core',
    includeCymatic: sceneMode === 'sovereign-core' || sceneMode === 'lissajous-wave' || isAudioPlaying,
    includeWave: sceneMode === 'lissajous-wave' || isAudioPlaying,
  };
}

/**
 * Assembles the temporary Three.js export group and computes accurate mesh/triangle statistics.
 */
export function buildExportSceneGroup(params: Export3DBuildParams): {
  exportGroup: THREE.Group;
  stats: Export3DStats;
} {
  const exportGroup = new THREE.Group();
  exportGroup.name = `Dragon9_${params.codename.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const { includeCore, includeCathie, includeCymatic, includeWave } = resolveIncludedAssemblies(
    params.target,
    params.sceneMode,
    params.isAudioPlaying
  );

  if (includeCore) {
    exportGroup.add(buildCoreExportGroup(params));
  }
  if (includeCathie) {
    exportGroup.add(buildCathieExportGroup(params));
  }
  if (includeCymatic) {
    exportGroup.add(buildCymaticExportObject(params));
  }
  if (includeWave) {
    exportGroup.add(buildWaveExportObject(params));
  }

  if (params.centerAtOrigin) {
    exportGroup.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(exportGroup);
    if (!box.isEmpty()) {
      const center = box.getCenter(new THREE.Vector3());
      exportGroup.children.forEach((child) => {
        child.position.sub(center);
      });
    }
  }

  exportGroup.updateMatrixWorld(true);

  let meshCount = 0;
  let lineCount = 0;
  let vertexCount = 0;
  let triangleCount = 0;

  exportGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      meshCount += 1;
      const pos = obj.geometry.getAttribute('position');
      if (pos) vertexCount += pos.count;
      const idx = obj.geometry.getIndex();
      if (idx) {
        triangleCount += Math.floor(idx.count / 3);
      } else if (pos) {
        triangleCount += Math.floor(pos.count / 3);
      }
    } else if (obj instanceof THREE.Line || obj instanceof THREE.LineSegments || obj instanceof THREE.LineLoop) {
      lineCount += 1;
      const pos = obj.geometry.getAttribute('position');
      if (pos) vertexCount += pos.count;
    }
  });

  const bounds = new THREE.Box3().setFromObject(exportGroup);
  const size = bounds.isEmpty() ? new THREE.Vector3(0, 0, 0) : bounds.getSize(new THREE.Vector3());

  return {
    exportGroup,
    stats: {
      meshCount,
      lineCount,
      vertexCount,
      triangleCount,
      boundsSize: {
        x: Number(size.x.toFixed(2)),
        y: Number(size.y.toFixed(2)),
        z: Number(size.z.toFixed(2)),
      },
    },
  };
}

/**
 * Frees all temporary cloned geometries & materials created for an export pass.
 */
export function disposeExportGroup(group: THREE.Object3D): void {
  const disposedMaterials = new Set<THREE.Material>();
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.LineSegments || obj instanceof THREE.LineLoop) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => {
          if (!disposedMaterials.has(m)) {
            m.dispose();
            disposedMaterials.add(m);
          }
        });
      } else if (obj.material && !disposedMaterials.has(obj.material)) {
        obj.material.dispose();
        disposedMaterials.add(obj.material);
      }
    }
  });
}

function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Serializes the selected Dragon 9 3D assembly to GLB, GLTF, OBJ, or STL and downloads it.
 */
export async function exportDragon3DModel(params: Export3DBuildParams): Promise<Export3DResult> {
  const { exportGroup, stats } = buildExportSceneGroup(params);
  const safeSlug = params.codename.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'dragon9';
  const targetSlug = params.target === 'visible' ? params.sceneMode : params.target;
  const filename = `${safeSlug}-${targetSlug}-${Math.round(params.frequency)}hz.${params.format}`;

  try {
    let blob: Blob;

    if (params.format === 'glb') {
      const exporter = new GLTFExporter();
      const buffer = await exporter.parseAsync(exportGroup, {
        binary: true,
        onlyVisible: false,
      });
      if (!(buffer instanceof ArrayBuffer)) {
        throw new Error('GLTFExporter did not return a binary ArrayBuffer.');
      }
      blob = new Blob([buffer], { type: 'model/gltf-binary' });
    } else if (params.format === 'gltf') {
      const exporter = new GLTFExporter();
      const jsonObj = await exporter.parseAsync(exportGroup, {
        binary: false,
        onlyVisible: false,
      });
      const jsonStr = JSON.stringify(jsonObj, null, 2);
      blob = new Blob([jsonStr], { type: 'model/gltf+json' });
    } else if (params.format === 'obj') {
      const exporter = new OBJExporter();
      const objStr = exporter.parse(exportGroup);
      const header = `# Dragon 9 Sovereign 3D Export\n# Node: ${params.codename} | Target: ${targetSlug} | Frequency: ${params.frequency}Hz\n`;
      blob = new Blob([header + objStr], { type: 'text/plain;charset=utf-8' });
    } else {
      // 'stl' binary
      const exporter = new STLExporter();
      const dataView = exporter.parse(exportGroup, { binary: true });
      const stlBytes = new Uint8Array(dataView.byteLength);
      stlBytes.set(new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength));
      blob = new Blob([stlBytes], { type: 'model/stl' });
    }

    triggerFileDownload(blob, filename);

    return {
      filename,
      byteSize: blob.size,
      stats,
    };
  } finally {
    disposeExportGroup(exportGroup);
  }
}
