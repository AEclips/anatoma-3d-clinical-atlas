import * as THREE from 'three';

export interface SculptedAnatomyResult {
  partGroups: Record<string, THREE.Group>;
  animatedRefs: {
    heartGroup?: THREE.Group;
    leftLung?: THREE.Group;
    rightLung?: THREE.Group;
    diaphragm?: THREE.Group;
  };
  materials: {
    nerveMat: THREE.MeshPhysicalMaterial;
    arteryMat: THREE.MeshPhysicalMaterial;
    veinMat: THREE.MeshPhysicalMaterial;
    muscleMat: THREE.MeshPhysicalMaterial;
    tendonMat: THREE.MeshStandardMaterial;
    brainMat: THREE.MeshPhysicalMaterial;
    heartMat: THREE.MeshPhysicalMaterial;
    lungMat: THREE.MeshPhysicalMaterial;
    liverMat: THREE.MeshPhysicalMaterial;
    gallbladderMat: THREE.MeshPhysicalMaterial;
    stomachMat: THREE.MeshPhysicalMaterial;
    kidneyMat: THREE.MeshPhysicalMaterial;
    intestineSmallMat: THREE.MeshPhysicalMaterial;
    intestineLargeMat: THREE.MeshPhysicalMaterial;
    cartilageMat: THREE.MeshStandardMaterial;
  };
  dispose: () => void;
}

function tagPartGroup(group: THREE.Group, partId: string) {
  group.name = partId;
  group.userData.partId = partId;
  group.traverse((obj) => {
    obj.userData.partId = partId;
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
}

/**
 * Applies smooth organic cortical/surface perturbation to a BufferGeometry
 * using deterministic multi-frequency trigonometry (e.g., brain gyri/sulci, liver/lung contours).
 */
function applyOrganicDisplacement(
  geometry: THREE.BufferGeometry,
  amplitude: number,
  freqX: number,
  freqY: number,
  freqZ: number,
  ridgePower = 1.0
) {
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  geometry.computeVertexNormals();
  const norm = geometry.attributes.normal;

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(norm, i);
    const wave =
      Math.sin(v.x * freqX + v.y * 0.7) *
      Math.cos(v.y * freqY + v.z * 0.6) *
      Math.sin(v.z * freqZ + v.x * 0.5);
    const fold =
      Math.sign(wave) * Math.pow(Math.abs(wave), ridgePower) * amplitude;
    v.addScaledVector(n, fold);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

/**
 * Creates a fusiform muscle belly with tapered tendinous ends along a 3D spline.
 */
function makeMuscleBelly(
  points: [number, number, number][],
  maxRadius: number,
  segments = 20,
  radialSegments = 12,
  material: THREE.Material
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
  );
  const geom = new THREE.TubeGeometry(curve, segments, 1.0, radialSegments, false);
  const pos = geom.attributes.position;
  const ringVerts = radialSegments + 1;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = curve.getPointAt(t);
    // Fusiform profile: tapered at origin/insertion, full belly near center
    const profile = Math.sin(Math.PI * t);
    const radius = maxRadius * (0.22 + 0.78 * Math.pow(profile, 0.75));
    for (let j = 0; j < ringVerts; j++) {
      const idx = i * ringVerts + j;
      const vx = pos.getX(idx) - center.x;
      const vy = pos.getY(idx) - center.y;
      const vz = pos.getZ(idx) - center.z;
      pos.setXYZ(idx, center.x + vx * radius, center.y + vy * radius, center.z + vz * radius);
    }
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return new THREE.Mesh(geom, material);
}

/**
 * Creates a variable-radius organic tube along a 3D spline (used for stomach, intestines, vessels).
 */
function makeVariableTube(
  points: [number, number, number][],
  radiusFn: (t: number) => number,
  segments: number,
  radialSegments: number,
  material: THREE.Material
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
  );
  const geom = new THREE.TubeGeometry(curve, segments, 1.0, radialSegments, false);
  const pos = geom.attributes.position;
  const ringVerts = radialSegments + 1;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = curve.getPointAt(t);
    const r = radiusFn(t);
    for (let j = 0; j < ringVerts; j++) {
      const idx = i * ringVerts + j;
      const vx = pos.getX(idx) - center.x;
      const vy = pos.getY(idx) - center.y;
      const vz = pos.getZ(idx) - center.z;
      pos.setXYZ(idx, center.x + vx * r, center.y + vy * r, center.z + vz * r);
    }
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return new THREE.Mesh(geom, material);
}

function makeTubeMesh(
  points: [number, number, number][],
  radius: number,
  segments: number,
  material: THREE.Material,
  radialSegments = 8
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
  );
  const geom = new THREE.TubeGeometry(curve, segments, radius, radialSegments, false);
  return new THREE.Mesh(geom, material);
}

export function buildSculptedAnatomy(): SculptedAnatomyResult {
  const partGroups: Record<string, THREE.Group> = {};
  const animatedRefs: SculptedAnatomyResult['animatedRefs'] = {};
  const geometries: THREE.BufferGeometry[] = [];

  const trackGeom = <T extends THREE.Group>(grp: T): T => {
    grp.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        geometries.push((child as THREE.Mesh).geometry);
      }
    });
    return grp;
  };

  /* -------------------- REALISTIC PBR CLINICAL MATERIALS -------------------- */
  const brainMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6b8af,
    emissive: 0x3b1818,
    emissiveIntensity: 0.14,
    roughness: 0.42,
    metalness: 0.02,
    clearcoat: 0.45,
    clearcoatRoughness: 0.35,
    transparent: true,
    opacity: 1.0,
  });

  const nerveMat = new THREE.MeshPhysicalMaterial({
    color: 0xfacc15,
    emissive: 0xd97706,
    emissiveIntensity: 0.65,
    roughness: 0.32,
    metalness: 0.12,
    clearcoat: 0.25,
    transparent: true,
    opacity: 1.0,
  });

  const arteryMat = new THREE.MeshPhysicalMaterial({
    color: 0xdc2626,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.42,
    roughness: 0.3,
    metalness: 0.05,
    clearcoat: 0.5,
    transparent: true,
    opacity: 1.0,
  });

  const veinMat = new THREE.MeshPhysicalMaterial({
    color: 0x2563eb,
    emissive: 0x1e3a8a,
    emissiveIntensity: 0.38,
    roughness: 0.34,
    metalness: 0.05,
    clearcoat: 0.45,
    transparent: true,
    opacity: 1.0,
  });

  const muscleMat = new THREE.MeshPhysicalMaterial({
    color: 0x991b1b,
    emissive: 0x450a0a,
    emissiveIntensity: 0.2,
    roughness: 0.5,
    metalness: 0.06,
    clearcoat: 0.28,
    clearcoatRoughness: 0.45,
    transparent: true,
    opacity: 0.88,
  });

  const tendonMat = new THREE.MeshStandardMaterial({
    color: 0xe2dcd0,
    roughness: 0.4,
    metalness: 0.05,
    transparent: true,
    opacity: 0.92,
  });

  const heartMat = new THREE.MeshPhysicalMaterial({
    color: 0x9f1239,
    emissive: 0x4c0519,
    emissiveIntensity: 0.32,
    roughness: 0.28,
    metalness: 0.05,
    clearcoat: 0.72,
    clearcoatRoughness: 0.22,
    transparent: true,
    opacity: 1.0,
  });

  const lungMat = new THREE.MeshPhysicalMaterial({
    color: 0xd99b96,
    emissive: 0x3f1d1d,
    emissiveIntensity: 0.14,
    roughness: 0.56,
    metalness: 0.02,
    clearcoat: 0.25,
    clearcoatRoughness: 0.5,
    transparent: true,
    opacity: 1.0,
  });

  const cartilageMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.35,
    metalness: 0.05,
    transparent: true,
    opacity: 0.95,
  });

  const liverMat = new THREE.MeshPhysicalMaterial({
    color: 0x7c2d12,
    emissive: 0x2e1005,
    emissiveIntensity: 0.2,
    roughness: 0.26,
    metalness: 0.04,
    clearcoat: 0.65,
    clearcoatRoughness: 0.25,
    transparent: true,
    opacity: 1.0,
  });

  const gallbladderMat = new THREE.MeshPhysicalMaterial({
    color: 0x15803d,
    emissive: 0x052e16,
    emissiveIntensity: 0.2,
    roughness: 0.28,
    clearcoat: 0.6,
    transparent: true,
    opacity: 1.0,
  });

  const stomachMat = new THREE.MeshPhysicalMaterial({
    color: 0xd97757,
    emissive: 0x431407,
    emissiveIntensity: 0.18,
    roughness: 0.38,
    clearcoat: 0.45,
    transparent: true,
    opacity: 1.0,
  });

  const kidneyMat = new THREE.MeshPhysicalMaterial({
    color: 0x881337,
    emissive: 0x310817,
    emissiveIntensity: 0.22,
    roughness: 0.26,
    clearcoat: 0.62,
    transparent: true,
    opacity: 1.0,
  });

  const intestineSmallMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6a18a,
    emissive: 0x451a12,
    emissiveIntensity: 0.14,
    roughness: 0.4,
    clearcoat: 0.42,
    transparent: true,
    opacity: 1.0,
  });

  const intestineLargeMat = new THREE.MeshPhysicalMaterial({
    color: 0xc27864,
    emissive: 0x3b1810,
    emissiveIntensity: 0.16,
    roughness: 0.44,
    clearcoat: 0.35,
    transparent: true,
    opacity: 1.0,
  });

  /* ============================================================================
     1. CEREBRUM (DUAL GYRI/SULCI HEMISPHERES + CORPUS CALLOSUM)
     ============================================================================ */
  {
    const grp = new THREE.Group();
    [-1, 1].forEach((side) => {
      const hemiGeom = new THREE.SphereGeometry(3.2, 32, 26);
      hemiGeom.scale(0.84, 1.15, 1.48);
      applyOrganicDisplacement(hemiGeom, 0.26, 2.3, 2.1, 1.9, 0.85);
      const hemi = new THREE.Mesh(hemiGeom, brainMat);
      hemi.position.set(side * 2.55, 174.4, -1.65);
      hemi.rotation.z = side * -0.06;
      grp.add(hemi);

      // Temporal lobe bulge inferiorly-laterally
      const tempGeom = new THREE.SphereGeometry(1.75, 20, 16);
      tempGeom.scale(0.85, 0.85, 1.45);
      applyOrganicDisplacement(tempGeom, 0.16, 2.6, 2.4, 2.2, 0.9);
      const temporal = new THREE.Mesh(tempGeom, brainMat);
      temporal.position.set(side * 3.4, 171.2, -0.4);
      grp.add(temporal);
    });

    // Corpus Callosum bridge
    const ccGeom = new THREE.CylinderGeometry(1.0, 1.0, 2.4, 12);
    ccGeom.rotateZ(Math.PI / 2);
    ccGeom.scale(1.0, 0.7, 2.0);
    const cc = new THREE.Mesh(ccGeom, tendonMat);
    cc.position.set(0, 173.6, -1.6);
    grp.add(cc);

    tagPartGroup(grp, 'organ_brain_cerebrum');
    partGroups['organ_brain_cerebrum'] = trackGeom(grp);
  }

  /* ============================================================================
     2. CEREBELLUM & BRAINSTEM (PONS + MEDULLA OBLONGATA)
     ============================================================================ */
  {
    const grp = new THREE.Group();
    [-1, 1].forEach((side) => {
      const lobeGeom = new THREE.SphereGeometry(2.1, 24, 18);
      lobeGeom.scale(0.92, 0.78, 0.95);
      applyOrganicDisplacement(lobeGeom, 0.14, 1.2, 5.2, 1.6, 0.75); // horizontal folia
      const lobe = new THREE.Mesh(lobeGeom, brainMat);
      lobe.position.set(side * 1.9, 167.2, -6.3);
      grp.add(lobe);
    });

    // Brainstem (Midbrain -> Pons bulge -> Medulla)
    const stem = makeVariableTube(
      [
        [0, 171.5, -2.6],
        [0, 169.0, -3.5],
        [0, 166.2, -4.6],
        [0, 163.2, -5.5],
      ],
      (t) => (t > 0.25 && t < 0.55 ? 1.28 : 0.82),
      20,
      12,
      tendonMat
    );
    grp.add(stem);

    tagPartGroup(grp, 'organ_brain_cerebellum');
    partGroups['organ_brain_cerebellum'] = trackGeom(grp);
  }

  /* ============================================================================
     3. HUMAN HEART & CORONARY GREAT ROOTS (LEFT-TILTED MULTI-CHAMBER)
     ============================================================================ */
  {
    const grp = new THREE.Group();
    const beatPivot = new THREE.Group();
    beatPivot.position.set(1.55, 133.5, 1.85);

    // Ventricular Cone (apex pointing down, forward, and anatomical left +X)
    const ventGeom = new THREE.SphereGeometry(3.1, 28, 22);
    ventGeom.scale(0.9, 1.28, 0.82);
    const vent = new THREE.Mesh(ventGeom, heartMat);
    vent.rotation.z = -0.48;
    vent.rotation.x = 0.22;
    beatPivot.add(vent);

    // Right & Left Atria
    const rAtrium = new THREE.Mesh(new THREE.SphereGeometry(1.75, 18, 16), heartMat);
    rAtrium.position.set(-2.0, 1.8, 0.3);
    beatPivot.add(rAtrium);

    const lAtrium = new THREE.Mesh(new THREE.SphereGeometry(1.6, 18, 16), heartMat);
    lAtrium.position.set(1.3, 2.2, -0.8);
    beatPivot.add(lAtrium);

    // Ascending Aortic Root & Pulmonary Trunk
    const aortaRoot = makeTubeMesh(
      [
        [0.0, 1.8, 0.2],
        [-0.3, 4.2, 0.4],
        [0.8, 6.2, -0.2],
        [1.4, 5.4, -1.6],
      ],
      0.85,
      16,
      arteryMat,
      10
    );
    beatPivot.add(aortaRoot);

    const pulmTrunk = makeTubeMesh(
      [
        [-0.6, 1.5, 1.2],
        [0.6, 4.2, 1.0],
        [2.2, 4.8, 0.1],
      ],
      0.72,
      12,
      veinMat,
      10
    );
    beatPivot.add(pulmTrunk);

    // Epicardial LAD Coronary Artery wrapping the anterior sulcus
    const lad = makeTubeMesh(
      [
        [0.1, 2.4, 1.8],
        [0.7, 0.4, 2.45],
        [1.4, -1.8, 2.25],
        [1.9, -3.2, 1.75],
      ],
      0.16,
      14,
      arteryMat,
      6
    );
    beatPivot.add(lad);

    grp.add(beatPivot);
    animatedRefs.heartGroup = beatPivot;
    tagPartGroup(grp, 'organ_heart');
    partGroups['organ_heart'] = trackGeom(grp);
  }

  /* ============================================================================
     4. BILATERAL LUNGS & CARTILAGINOUS TRACHEA
     ============================================================================ */
  {
    const grp = new THREE.Group();

    // Trachea & Primary Bronchi
    const trachea = makeTubeMesh(
      [
        [0, 159.5, -0.6],
        [0, 152.0, -0.9],
        [0, 145.5, -1.1],
      ],
      0.92,
      16,
      cartilageMat,
      12
    );
    grp.add(trachea);

    // Tracheal C-Rings
    for (let y = 146.5; y <= 158.5; y += 1.2) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.14, 6, 16), cartilageMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, y, -0.9);
      grp.add(ring);
    }

    // Left & Right Primary Bronchi
    [-1, 1].forEach((side) => {
      const bronchus = makeTubeMesh(
        [
          [0, 145.5, -1.1],
          [side * 2.8, 142.8, -1.2],
          [side * 5.2, 140.5, -1.3],
        ],
        0.58,
        10,
        cartilageMat,
        8
      );
      grp.add(bronchus);
    });

    // Right Lung (-X, 3-lobed, slightly wider & shorter due to liver dome)
    const rLungGrp = new THREE.Group();
    rLungGrp.position.set(-5.6, 136.5, -1.3);
    const rLungGeom = new THREE.SphereGeometry(4.6, 26, 22);
    rLungGeom.scale(0.86, 2.25, 1.15);
    // Flatten inferior diaphragmatic base & sculpt medial mediastinal face
    const rPos = rLungGeom.attributes.position;
    for (let i = 0; i < rPos.count; i++) {
      const x = rPos.getX(i);
      const y = rPos.getY(i);
      const z = rPos.getZ(i);
      const taperTop = y > 0 ? 1 - (y / 12.5) * 0.45 : 1 + (-y / 16) * 0.14;
      const flatBase = y < -8.0 ? -8.0 + (y + 8.0) * 0.18 : y;
      const medialIndent = x > 1.2 ? x * 0.68 : x;
      rPos.setXYZ(i, medialIndent * taperTop, flatBase, z * taperTop);
    }
    rPos.needsUpdate = true;
    applyOrganicDisplacement(rLungGeom, 0.18, 0.9, 1.4, 0.9, 1.0);
    rLungGrp.add(new THREE.Mesh(rLungGeom, lungMat));
    grp.add(rLungGrp);
    animatedRefs.rightLung = rLungGrp;

    // Left Lung (+X, 2-lobed, narrower with cardiac notch)
    const lLungGrp = new THREE.Group();
    lLungGrp.position.set(5.8, 137.0, -1.3);
    const lLungGeom = new THREE.SphereGeometry(4.4, 26, 22);
    lLungGeom.scale(0.82, 2.28, 1.12);
    const lPos = lLungGeom.attributes.position;
    for (let i = 0; i < lPos.count; i++) {
      let x = lPos.getX(i);
      const y = lPos.getY(i);
      const z = lPos.getZ(i);
      const taperTop = y > 0 ? 1 - (y / 12.5) * 0.45 : 1 + (-y / 16) * 0.12;
      const flatBase = y < -8.4 ? -8.4 + (y + 8.4) * 0.18 : y;
      // Carve cardiac notch on medial-inferior-anterior margin (-X side of left lung)
      if (x < -0.5 && y < 1.5 && z > -1.5) {
        x += 1.45 * Math.exp(-Math.pow((y + 3.2) / 4.0, 2));
      }
      lPos.setXYZ(i, x * taperTop, flatBase, z * taperTop);
    }
    lPos.needsUpdate = true;
    applyOrganicDisplacement(lLungGeom, 0.18, 0.9, 1.4, 0.9, 1.0);
    lLungGrp.add(new THREE.Mesh(lLungGeom, lungMat));
    grp.add(lLungGrp);
    animatedRefs.leftLung = lLungGrp;

    tagPartGroup(grp, 'organ_lungs');
    partGroups['organ_lungs'] = trackGeom(grp);
  }

  /* ============================================================================
     5. THORACIC DIAPHRAGM (MUSCULAR DOME)
     ============================================================================ */
  {
    const grp = new THREE.Group();
    const domePivot = new THREE.Group();
    domePivot.position.set(0, 123.5, -1.2);

    const domeGeom = new THREE.SphereGeometry(9.2, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.46);
    domeGeom.scale(1.04, 0.42, 0.68);
    const dPos = domeGeom.attributes.position;
    for (let i = 0; i < dPos.count; i++) {
      const x = dPos.getX(i);
      const y = dPos.getY(i);
      // Right hemidiaphragm (-X) sits ~1.1 cm higher due to liver
      const asymmetricBoost = x < 0 ? 0.65 * Math.exp(-Math.pow((x + 4.5) / 4, 2)) : 0;
      dPos.setY(i, y + asymmetricBoost);
    }
    dPos.needsUpdate = true;
    domeGeom.computeVertexNormals();

    const domeMat = muscleMat.clone();
    domeMat.side = THREE.DoubleSide;
    const domeMesh = new THREE.Mesh(domeGeom, domeMat);
    domePivot.add(domeMesh);

    // Central Tendon Cloverleaf
    const tendonCap = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.8, 0.45, 16),
      tendonMat
    );
    tendonCap.scale.set(1.1, 1.0, 0.72);
    tendonCap.position.set(0, 3.65, 0.2);
    domePivot.add(tendonCap);

    grp.add(domePivot);
    animatedRefs.diaphragm = domePivot;
    tagPartGroup(grp, 'organ_diaphragm');
    partGroups['organ_diaphragm'] = trackGeom(grp);
  }

  /* ============================================================================
     6. LIVER & GALLBLADDER (RIGHT UPPER QUADRANT WEDGE)
     ============================================================================ */
  {
    const grp = new THREE.Group();
    const liverGeom = new THREE.SphereGeometry(5.6, 26, 20);
    liverGeom.scale(1.38, 0.74, 0.92);
    const lPos = liverGeom.attributes.position;
    for (let i = 0; i < lPos.count; i++) {
      const x = lPos.getX(i);
      let y = lPos.getY(i);
      const z = lPos.getZ(i);
      // Wedge taper toward anatomical left (+X)
      const wedgeScale = x > 0 ? Math.max(0.25, 1 - x / 9.2) : 1.08;
      // Concave inferior visceral surface
      if (y < 0) y *= 0.65;
      lPos.setXYZ(i, x, y * wedgeScale, z * wedgeScale);
    }
    lPos.needsUpdate = true;
    liverGeom.computeVertexNormals();

    const liverMesh = new THREE.Mesh(liverGeom, liverMat);
    liverMesh.position.set(-3.4, 118.8, 1.4);
    liverMesh.rotation.z = 0.22;
    grp.add(liverMesh);

    // Gallbladder tucked under right inferior hepatic margin
    const gbGeom = new THREE.SphereGeometry(1.15, 16, 14);
    gbGeom.scale(0.85, 1.55, 0.85);
    const gallbladder = new THREE.Mesh(gbGeom, gallbladderMat);
    gallbladder.position.set(-4.6, 114.8, 3.1);
    gallbladder.rotation.z = 0.35;
    gallbladder.rotation.x = 0.4;
    grp.add(gallbladder);

    tagPartGroup(grp, 'organ_liver');
    partGroups['organ_liver'] = trackGeom(grp);
  }

  /* ============================================================================
     7. STOMACH (J-SHAPED GASTRIC CHAMBER)
     ============================================================================ */
  {
    const grp = new THREE.Group();
    const stomachMesh = makeVariableTube(
      [
        [1.1, 123.5, 0.4], // Esophageal cardia
        [5.2, 122.2, 0.9], // Gastric fundus dome
        [6.8, 117.5, 2.0], // Greater curvature body
        [4.8, 113.0, 2.5], // Angular incisure
        [1.6, 113.8, 2.1], // Pyloric antrum -> Duodenal bulb
      ],
      (t) => {
        if (t < 0.12) return 0.75 + t * 5.0;
        if (t < 0.65) return 2.45 * Math.sin(t * Math.PI * 0.85) + 0.8;
        return Math.max(0.8, 2.2 * (1 - (t - 0.65) * 1.8));
      },
      28,
      16,
      stomachMat
    );
    grp.add(stomachMesh);

    tagPartGroup(grp, 'organ_stomach');
    partGroups['organ_stomach'] = trackGeom(grp);
  }

  /* ============================================================================
     8. KIDNEYS, ADRENAL GLANDS & URETERS
     ============================================================================ */
  {
    const grp = new THREE.Group();
    [-1, 1].forEach((side) => {
      // Right kidney (-X) sits ~1.2 cm lower under liver
      const yBase = side === -1 ? 111.2 : 112.6;
      const kGeom = new THREE.SphereGeometry(2.15, 22, 18);
      kGeom.scale(0.85, 1.48, 0.72);
      const kPos = kGeom.attributes.position;
      for (let i = 0; i < kPos.count; i++) {
        let x = kPos.getX(i);
        const y = kPos.getY(i);
        // Medial hilum indentation
        const isMedial = (side === -1 && x > 0.4) || (side === 1 && x < -0.4);
        if (isMedial && Math.abs(y) < 1.6) {
          x *= 0.65;
        }
        kPos.setX(i, x);
      }
      kPos.needsUpdate = true;
      kGeom.computeVertexNormals();

      const kidney = new THREE.Mesh(kGeom, kidneyMat);
      kidney.position.set(side * 4.5, yBase, -3.6);
      kidney.rotation.z = side * -0.14;
      grp.add(kidney);

      // Suprarenal (Adrenal) Gland cap
      const adrenal = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.3, 10), nerveMat);
      adrenal.position.set(side * 4.1, yBase + 3.4, -3.5);
      adrenal.rotation.z = side * 0.2;
      grp.add(adrenal);

      // Ureter descending to pelvic cavity
      const ureter = makeTubeMesh(
        [
          [side * 3.4, yBase - 0.3, -3.3],
          [side * 3.1, 103.0, -2.6],
          [side * 2.4, 94.0, -0.5],
        ],
        0.22,
        14,
        tendonMat,
        6
      );
      grp.add(ureter);
    });

    tagPartGroup(grp, 'organ_kidneys');
    partGroups['organ_kidneys'] = trackGeom(grp);
  }

  /* ============================================================================
     9. SMALL & LARGE INTESTINES (HAUSTRATED COLON + JEJUNAL/ILEAL COILS)
     ============================================================================ */
  {
    const grp = new THREE.Group();

    // Haustrated Framing Colon (Cecum -> Asc -> Trans -> Desc -> Sigmoid)
    const colon = makeVariableTube(
      [
        [-6.0, 96.5, 1.4], // Cecum (RLQ)
        [-6.6, 103.5, 1.2], // Ascending colon
        [-5.8, 109.8, 2.2], // Hepatic flexure
        [0.0, 109.2, 3.4], // Transverse colon dip
        [6.2, 111.2, 1.8], // Splenic flexure
        [6.5, 103.0, 1.0], // Descending colon
        [4.8, 95.8, 1.2], // Sigmoid loop
        [0.2, 93.2, -1.6], // Rectum
      ],
      (t) => 1.35 + 0.22 * Math.sin(t * Math.PI * 36), // Haustra segmentation
      72,
      12,
      intestineLargeMat
    );
    grp.add(colon);

    // Small Intestine Multi-Loop Cluster inside Colon Frame
    const smallPts: [number, number, number][] = [
      [-1.2, 110.5, 0.2], // Duodenum
      [2.6, 108.0, 1.8],
      [-3.4, 106.4, 2.2],
      [3.6, 104.2, 2.5],
      [-3.8, 102.0, 2.2],
      [3.5, 100.0, 2.4],
      [-3.4, 98.0, 1.9],
      [2.8, 96.4, 1.8],
      [-4.8, 96.6, 1.5], // Ileocecal junction
    ];
    const smallInt = makeTubeMesh(smallPts, 0.92, 84, intestineSmallMat, 10);
    grp.add(smallInt);

    tagPartGroup(grp, 'organ_intestines');
    partGroups['organ_intestines'] = trackGeom(grp);
  }

  /* ============================================================================
     10. SPINAL CORD & INTERCOSTAL NERVE ROOTS
     ============================================================================ */
  {
    const grp = new THREE.Group();
    const cord = makeVariableTube(
      [
        [0, 163.2, -5.5],
        [0, 148.0, -5.8],
        [0, 134.0, -6.5],
        [0, 120.0, -5.6],
        [0, 109.5, -5.2], // Conus Medullaris (L1-L2)
        [0, 96.0, -4.8], // Cauda Equina
      ],
      (t) => (t < 0.78 ? 0.62 : 0.35),
      36,
      10,
      nerveMat
    );
    grp.add(cord);

    // 12 Pairs of Thoracic Intercostal Nerves
    for (let i = 0; i < 12; i++) {
      const y = 149.0 - i * 2.45;
      [-1, 1].forEach((side) => {
        const icNerve = makeTubeMesh(
          [
            [0, y, -5.8],
            [side * 5.2, y - 0.5, -4.5],
            [side * 9.8, y - 1.2, -1.0],
            [side * 5.2, y - 1.8, 4.2],
          ],
          0.16,
          12,
          nerveMat,
          6
        );
        grp.add(icNerve);
      });
    }

    tagPartGroup(grp, 'nerve_spinal_cord');
    partGroups['nerve_spinal_cord'] = trackGeom(grp);
  }

  /* ============================================================================
     11. BRACHIAL PLEXUS & UPPER LIMB NERVES (ALIGNED TO TRUE GLB ARM BONES)
     ============================================================================ */
  {
    const grp = new THREE.Group();
    [-1, 1].forEach((side) => {
      // Median + Ulnar + Radial main brachial path
      const median = makeTubeMesh(
        [
          [side * 1.6, 152.0, -5.2],
          [side * 9.5, 144.8, -5.2],
          [side * 19.6, 134.0, -5.4],
          [side * 25.0, 118.5, -4.2],
          [side * 28.2, 104.0, -2.8],
          [side * 30.8, 86.0, 0.3],
        ],
        0.26,
        28,
        nerveMat,
        7
      );
      grp.add(median);

      const radial = makeTubeMesh(
        [
          [side * 9.8, 144.2, -6.2],
          [side * 21.0, 134.5, -7.2],
          [side * 24.4, 120.5, -4.8],
          [side * 28.5, 107.0, -4.5],
          [side * 31.4, 88.5, -0.4],
        ],
        0.2,
        24,
        nerveMat,
        6
      );
      grp.add(radial);

      // Digital nerve twigs fanning into fingers
      [-0.8, 0, 0.8].forEach((dz) => {
        const digit = makeTubeMesh(
          [
            [side * 30.8, 86.0, 0.3],
            [side * 31.5, 81.2, 0.3 + dz * 1.8],
          ],
          0.11,
          6,
          nerveMat,
          5
        );
        grp.add(digit);
      });
    });

    tagPartGroup(grp, 'nerve_brachial_plexus');
    partGroups['nerve_brachial_plexus'] = trackGeom(grp);
  }

  /* ============================================================================
     12. SCIATIC & FEMORAL NERVE TRUNKS (ALIGNED TO TRUE GLB LEG BONES)
     ============================================================================ */
  {
    const grp = new THREE.Group();
    [-1, 1].forEach((side) => {
      // Posterior Sciatic -> Tibial Nerve
      const sciatic = makeTubeMesh(
        [
          [side * 3.8, 97.5, -4.8],
          [side * 8.6, 86.5, -5.2],
          [side * 9.8, 72.0, -4.6],
          [side * 8.4, 52.0, -4.2],
          [side * 7.2, 28.0, -5.2],
          [side * 7.8, 4.5, -1.0],
        ],
        0.46,
        32,
        nerveMat,
        8
      );
      grp.add(sciatic);

      // Common Fibular Branch at knee
      const fibular = makeTubeMesh(
        [
          [side * 8.4, 52.0, -4.2],
          [side * 9.8, 42.0, -3.4],
          [side * 8.4, 24.0, -2.5],
          [side * 8.2, 5.2, 3.2],
        ],
        0.24,
        18,
        nerveMat,
        6
      );
      grp.add(fibular);

      // Anterior Femoral Nerve
      const femoral = makeTubeMesh(
        [
          [side * 3.2, 104.0, -3.5],
          [side * 8.2, 90.0, 0.8],
          [side * 9.8, 72.0, 0.4],
          [side * 8.4, 54.0, 0.2],
        ],
        0.28,
        18,
        nerveMat,
        6
      );
      grp.add(femoral);
    });

    tagPartGroup(grp, 'nerve_sciatic_femoral');
    partGroups['nerve_sciatic_femoral'] = trackGeom(grp);
  }

  /* ============================================================================
     13. CAROTID & JUGULAR NEUROVASCULAR AXIS
     ============================================================================ */
  {
    const grp = new THREE.Group();
    [-1, 1].forEach((side) => {
      const carotid = makeTubeMesh(
        [
          [side * 1.2, 146.5, 0.5],
          [side * 2.9, 155.0, 0.2],
          [side * 3.3, 164.0, 0.1],
          [side * 2.5, 171.5, -0.8],
        ],
        0.42,
        18,
        arteryMat,
        8
      );
      grp.add(carotid);

      const jugular = makeTubeMesh(
        [
          [side * 2.2, 147.0, 0.9],
          [side * 3.8, 155.0, 0.5],
          [side * 4.1, 164.5, 0.0],
          [side * 3.4, 170.5, -1.6],
        ],
        0.52,
        18,
        veinMat,
        8
      );
      grp.add(jugular);
    });

    tagPartGroup(grp, 'vascular_carotid_jugular');
    partGroups['vascular_carotid_jugular'] = trackGeom(grp);
  }

  /* ============================================================================
     14. AORTA & VENA CAVA SYSTEMIC TRUNKS
     ============================================================================ */
  {
    const grp = new THREE.Group();
    // Thoracic & Abdominal Aorta + Iliac Bifurcation
    const aorta = makeTubeMesh(
      [
        [1.2, 138.0, 1.4],
        [0.4, 145.5, 1.0],
        [-0.4, 147.0, -0.6],
        [-0.7, 139.0, -2.5],
        [-0.5, 122.0, -2.6],
        [-0.3, 104.0, -2.0],
      ],
      0.88,
      36,
      arteryMat,
      10
    );
    grp.add(aorta);

    // Superior & Inferior Vena Cava
    const svc = makeTubeMesh(
      [
        [-1.8, 150.5, 0.6],
        [-1.6, 143.0, 1.0],
        [-1.4, 136.0, 1.3],
      ],
      0.92,
      16,
      veinMat,
      10
    );
    grp.add(svc);

    const ivc = makeTubeMesh(
      [
        [-1.4, 131.5, 0.8],
        [-1.6, 121.0, -0.8],
        [-1.4, 104.0, -1.4],
      ],
      0.96,
      24,
      veinMat,
      10
    );
    grp.add(ivc);

    // Bilateral Renal Arteries & Veins
    [-1, 1].forEach((side) => {
      grp.add(
        makeTubeMesh(
          [
            [-0.4, 113.0, -2.3],
            [side * 3.8, 112.0, -3.4],
          ],
          0.32,
          8,
          arteryMat,
          6
        )
      );
      grp.add(
        makeTubeMesh(
          [
            [-1.5, 112.8, -1.2],
            [side * 3.8, 111.8, -3.2],
          ],
          0.36,
          8,
          veinMat,
          6
        )
      );
    });

    tagPartGroup(grp, 'vascular_aorta_vena_cava');
    partGroups['vascular_aorta_vena_cava'] = trackGeom(grp);
  }

  /* ============================================================================
     15. UPPER LIMB VASCULAR TREE
     ============================================================================ */
  {
    const grp = new THREE.Group();
    [-1, 1].forEach((side) => {
      const armArt = makeTubeMesh(
        [
          [side * 1.4, 146.5, -0.6],
          [side * 10.5, 144.0, -4.6],
          [side * 19.2, 134.0, -4.8],
          [side * 24.0, 118.5, -3.5],
          [side * 26.8, 106.0, -2.5],
          [side * 30.2, 86.5, 0.6],
        ],
        0.34,
        28,
        arteryMat,
        7
      );
      grp.add(armArt);

      // Ulnar Artery Split in Forearm
      const ulnarArt = makeTubeMesh(
        [
          [side * 24.0, 118.5, -3.5],
          [side * 27.6, 105.5, -4.2],
          [side * 30.8, 86.5, -0.2],
        ],
        0.24,
        16,
        arteryMat,
        6
      );
      grp.add(ulnarArt);

      const armVein = makeTubeMesh(
        [
          [side * 2.0, 147.2, 0.2],
          [side * 11.2, 144.6, -3.8],
          [side * 20.5, 134.0, -4.0],
          [side * 25.0, 118.5, -2.6],
          [side * 28.0, 106.0, -1.8],
          [side * 31.2, 86.5, 0.8],
        ],
        0.38,
        28,
        veinMat,
        7
      );
      grp.add(armVein);
    });

    tagPartGroup(grp, 'vascular_upper_limb');
    partGroups['vascular_upper_limb'] = trackGeom(grp);
  }

  /* ============================================================================
     16. LOWER LIMB VASCULAR TREE
     ============================================================================ */
  {
    const grp = new THREE.Group();
    [-1, 1].forEach((side) => {
      const legArt = makeTubeMesh(
        [
          [-0.3, 104.0, -2.0],
          [side * 5.8, 96.5, -0.6],
          [side * 8.6, 85.0, 0.4],
          [side * 9.0, 72.0, -1.2],
          [side * 7.6, 51.0, -3.2],
          [side * 7.0, 28.0, -3.4],
          [side * 8.2, 5.2, 2.2],
        ],
        0.44,
        34,
        arteryMat,
        8
      );
      grp.add(legArt);

      const legVein = makeTubeMesh(
        [
          [-1.4, 104.0, -1.4],
          [side * 4.8, 96.5, 0.2],
          [side * 7.8, 85.0, 1.0],
          [side * 8.2, 72.0, -0.4],
          [side * 6.8, 51.0, -2.2],
          [side * 6.4, 28.0, -2.5],
          [side * 7.4, 5.2, 2.6],
        ],
        0.48,
        34,
        veinMat,
        8
      );
      grp.add(legVein);
    });

    tagPartGroup(grp, 'vascular_lower_limb');
    partGroups['vascular_lower_limb'] = trackGeom(grp);
  }

  /* ============================================================================
     17. MUSCULAR GROUPS (SCULPTED FUSIFORM MUSCLE BELLIES + TENDONS)
     ============================================================================ */
  // 17A. Head & Neck Muscles
  {
    const grp = new THREE.Group();
    [-1, 1].forEach((side) => {
      // Sternocleidomastoid (SCM)
      grp.add(
        makeMuscleBelly(
          [
            [side * 5.0, 165.2, -3.6],
            [side * 3.8, 158.0, -0.8],
            [side * 1.4, 151.0, 2.0],
          ],
          1.35,
          16,
          10,
          muscleMat
        )
      );
      // Masseter
      grp.add(
        makeMuscleBelly(
          [
            [side * 5.2, 168.0, 1.5],
            [side * 5.3, 165.0, 1.8],
            [side * 4.8, 162.5, 1.2],
          ],
          1.4,
          12,
          10,
          muscleMat
        )
      );
      // Temporalis fan
      const temp = new THREE.Mesh(new THREE.SphereGeometry(2.6, 14, 12), muscleMat);
      temp.scale.set(0.35, 1.1, 1.25);
      temp.position.set(side * 6.3, 173.2, -0.5);
      grp.add(temp);
    });

    tagPartGroup(grp, 'muscle_head_neck');
    partGroups['muscle_head_neck'] = trackGeom(grp);
  }

  // 17B. Thoracic & Core Muscles (Pectoralis Major + Rectus Abdominis + Obliques)
  {
    const grp = new THREE.Group();
    [-1, 1].forEach((side) => {
      // Pectoralis Major Clavicular & Sternal Heads
      grp.add(
        makeMuscleBelly(
          [
            [side * 1.4, 144.0, 4.4],
            [side * 7.8, 140.5, 5.2],
            [side * 17.5, 138.0, -2.5],
          ],
          2.6,
          18,
          12,
          muscleMat
        )
      );
      grp.add(
        makeMuscleBelly(
          [
            [side * 1.4, 136.5, 5.4],
            [side * 7.5, 136.0, 5.6],
            [side * 17.2, 137.2, -2.5],
          ],
          2.5,
          18,
          12,
          muscleMat
        )
      );

      // 4 Segmented Rectus Abdominis Packs per side
      for (let row = 0; row < 4; row++) {
        const y = 123.5 - row * 5.6;
        const pack = new THREE.Mesh(new THREE.SphereGeometry(2.3, 14, 12), muscleMat);
        pack.scale.set(1.05, 1.15, 0.45);
        pack.position.set(side * 2.6, y, 4.8 - row * 0.25);
        grp.add(pack);
      }

      // External Obliques flanking abdomen
      grp.add(
        makeMuscleBelly(
          [
            [side * 10.4, 128.0, 1.0],
            [side * 10.0, 115.0, 2.2],
            [side * 8.2, 102.0, 2.4],
          ],
          2.1,
          18,
          10,
          muscleMat
        )
      );
    });

    tagPartGroup(grp, 'muscle_pectoralis_core');
    partGroups['muscle_pectoralis_core'] = trackGeom(grp);
  }

  // 17C. Upper Limb Muscles (Deltoid, Biceps, Triceps, Forearm Flexors)
  {
    const grp = new THREE.Group();
    [-1, 1].forEach((side) => {
      // Deltoid cap
      grp.add(
        makeMuscleBelly(
          [
            [side * 14.2, 146.2, -5.8],
            [side * 19.6, 142.0, -5.8],
            [side * 20.4, 134.5, -6.2],
          ],
          2.8,
          16,
          12,
          muscleMat
        )
      );
      // Biceps Brachii (anterior)
      grp.add(
        makeMuscleBelly(
          [
            [side * 18.2, 141.0, -4.6],
            [side * 20.6, 132.5, -3.4],
            [side * 23.2, 121.0, -4.0],
          ],
          2.25,
          18,
          12,
          muscleMat
        )
      );
      // Triceps Brachii (posterior)
      grp.add(
        makeMuscleBelly(
          [
            [side * 18.8, 140.5, -7.8],
            [side * 21.0, 132.5, -8.5],
            [side * 23.4, 121.0, -6.6],
          ],
          2.35,
          18,
          12,
          muscleMat
        )
      );
      // Forearm Flexor/Brachioradialis mass
      grp.add(
        makeMuscleBelly(
          [
            [side * 23.8, 120.0, -4.4],
            [side * 27.6, 111.0, -3.2],
            [side * 29.8, 95.5, -1.6],
          ],
          2.05,
          18,
          12,
          muscleMat
        )
      );
    });

    tagPartGroup(grp, 'muscle_upper_limb');
    partGroups['muscle_upper_limb'] = trackGeom(grp);
  }

  // 17D. Lower Limb Muscles (Gluteus, Quadriceps, Hamstrings, Calves & Achilles Tendon)
  {
    const grp = new THREE.Group();
    [-1, 1].forEach((side) => {
      // Gluteus Maximus
      const glute = new THREE.Mesh(new THREE.SphereGeometry(4.4, 16, 14), muscleMat);
      glute.scale.set(1.05, 1.32, 0.72);
      glute.position.set(side * 6.8, 92.0, -7.4);
      grp.add(glute);

      // Quadriceps (Rectus Femoris + Vastus Lateralis/Medialis)
      grp.add(
        makeMuscleBelly(
          [
            [side * 9.5, 92.0, 1.2],
            [side * 10.2, 74.5, 1.6],
            [side * 9.4, 54.5, 1.4],
          ],
          3.45,
          20,
          14,
          muscleMat
        )
      );
      // Hamstrings (Posterior thigh)
      grp.add(
        makeMuscleBelly(
          [
            [side * 8.4, 89.0, -5.8],
            [side * 9.6, 73.0, -6.0],
            [side * 8.8, 54.0, -5.4],
          ],
          3.0,
          20,
          12,
          muscleMat
        )
      );
      // Gastrocnemius Calf
      grp.add(
        makeMuscleBelly(
          [
            [side * 7.8, 50.0, -5.8],
            [side * 7.4, 36.5, -7.2],
            [side * 7.2, 21.0, -6.8],
          ],
          2.8,
          18,
          12,
          muscleMat
        )
      );
      // Achilles Tendon
      grp.add(
        makeTubeMesh(
          [
            [side * 7.2, 22.0, -6.8],
            [side * 7.6, 12.0, -7.4],
            [side * 8.0, 4.2, -7.8],
          ],
          0.75,
          12,
          tendonMat,
          8
        )
      );
    });

    tagPartGroup(grp, 'muscle_lower_limb');
    partGroups['muscle_lower_limb'] = trackGeom(grp);
  }

  return {
    partGroups,
    animatedRefs,
    materials: {
      nerveMat,
      arteryMat,
      veinMat,
      muscleMat,
      tendonMat,
      brainMat,
      heartMat,
      lungMat,
      liverMat,
      gallbladderMat,
      stomachMat,
      kidneyMat,
      intestineSmallMat,
      intestineLargeMat,
      cartilageMat,
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      [
        nerveMat,
        arteryMat,
        veinMat,
        muscleMat,
        tendonMat,
        brainMat,
        heartMat,
        lungMat,
        liverMat,
        gallbladderMat,
        stomachMat,
        kidneyMat,
        intestineSmallMat,
        intestineLargeMat,
        cartilageMat,
      ].forEach((m) => m.dispose());
    },
  };
}
