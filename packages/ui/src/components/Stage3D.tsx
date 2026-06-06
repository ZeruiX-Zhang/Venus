import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import {
  resolveCharacterAssetPath,
  type CharacterAssetManifest
} from "@personal-character-agent/avatar-assets";
import type { AvatarState } from "@personal-character-agent/avatar-runtime";
import { CharacterAssetRenderer } from "@personal-character-agent/avatar-assets/react";

export interface Stage3DProps {
  manifest: CharacterAssetManifest;
  state: AvatarState;
  memoryActive?: boolean;
  safetyActive?: boolean;
  ariaLabel?: string;
}

function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

function pickStagePngPath(manifest: CharacterAssetManifest): string | undefined {
  const stage = manifest.assets?.stage;
  if (!stage) return undefined;
  const preferred =
    stage.transparentFullbody ??
    stage.fullbodyFront ??
    stage.halfbody ??
    stage.bust;
  if (!preferred) return undefined;
  return resolveCharacterAssetPath(manifest, preferred);
}

function pickGlbPath(manifest: CharacterAssetManifest): string | undefined {
  const raw = manifest.runtimeAssets?.glb ?? manifest.runtimeAssets?.vrm;
  if (!raw) return undefined;
  return resolveCharacterAssetPath(manifest, raw);
}

function useGazeTracker() {
  const gazeRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -((event.clientY / window.innerHeight) * 2 - 1);
      gazeRef.current.x = Math.max(-1, Math.min(1, x));
      gazeRef.current.y = Math.max(-1, Math.min(1, y));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return gazeRef;
}

function CharacterBillboard({
  texturePath,
  gazeRef,
  memoryActive,
  safetyActive
}: {
  texturePath: string;
  gazeRef: React.MutableRefObject<{ x: number; y: number }>;
  memoryActive: boolean;
  safetyActive: boolean;
}) {
  const texture = useLoader(THREE.TextureLoader, texturePath);
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
  }, [texture]);

  const aspect = useMemo(() => {
    if (!texture.image) return 0.6;
    const img = texture.image as { width: number; height: number };
    return img.width && img.height ? img.width / img.height : 0.6;
  }, [texture.image]);

  const planeHeight = 4.6;
  const planeWidth = planeHeight * aspect;

  useFrame((three, delta) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = three.clock.elapsedTime;
    const gx = gazeRef.current.x;
    const gy = gazeRef.current.y;

    const targetRotY = gx * 0.18;
    const targetRotX = -gy * 0.08;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY,
      Math.min(1, delta * 3)
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotX,
      Math.min(1, delta * 3)
    );

    const targetX = gx * 0.12;
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetX,
      Math.min(1, delta * 2)
    );

    const breathe = Math.sin(t * 1.05) * 0.04;
    const sway = Math.sin(t * 0.6) * 0.025;
    meshRef.current.position.y = breathe;
    meshRef.current.rotation.z = sway;
    const scalePulse = 1 + Math.sin(t * 1.05) * 0.006;
    meshRef.current.scale.setScalar(scalePulse);
  });

  const tint = safetyActive
    ? new THREE.Color("#fff5e8")
    : memoryActive
      ? new THREE.Color("#eaf6ec")
      : new THREE.Color("#ffffff");

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      {/* soft jade ground reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -planeHeight / 2 - 0.05, 0]}>
        <circleGeometry args={[planeWidth * 0.7, 64]} />
        <meshBasicMaterial color="#a8c5b4" transparent opacity={0.18} />
      </mesh>
      <mesh ref={meshRef}>
        <planeGeometry args={[planeWidth, planeHeight, 1, 1]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.02}
          color={tint}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

function GLBCharacter({
  glbPath,
  gazeRef,
  memoryActive,
  safetyActive
}: {
  glbPath: string;
  gazeRef: React.MutableRefObject<{ x: number; y: number }>;
  memoryActive: boolean;
  safetyActive: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [scene, setScene] = useState<THREE.Group | null>(null);

  // 手动加载 GLB，注册 meshopt decoder 支持压缩模型
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      glbPath,
      (gltf) => {
        gltf.scene.traverse((child) => {
          const obj = child as THREE.Mesh;
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });
        // 如果模型自带 idle 动画就播放
        const idle =
          gltf.animations.find((c) => /idle|stand|breath/i.test(c.name)) ??
          gltf.animations[0];
        if (idle) {
          mixerRef.current = new THREE.AnimationMixer(gltf.scene);
          mixerRef.current.clipAction(idle).play();
        }
        setScene(gltf.scene);
      },
      undefined,
      (err) => {
        console.error("GLB load failed:", err);
      }
    );
  }, [glbPath]);

  useFrame((_three, delta) => {
    mixerRef.current?.update(delta);
    if (!groupRef.current) return;
    const gx = gazeRef.current.x;
    const targetY = gx * 0.25;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY,
      Math.min(1, delta * 2.5)
    );
  });

  // sentinel — keeps memory/safety tints in line w/ billboard path
  void memoryActive;
  void safetyActive;

  if (!scene) return null;

  return (
    <group ref={groupRef} position={[0, -2, 0]} scale={1.5}>
      <primitive object={scene} />
    </group>
  );
}

function SceneLighting({
  memoryActive,
  safetyActive
}: {
  memoryActive: boolean;
  safetyActive: boolean;
}) {
  const intensity = safetyActive ? 1.05 : memoryActive ? 0.95 : 0.85;
  const rimColor = safetyActive ? "#ffd9a0" : memoryActive ? "#bfe8c8" : "#cfe6dc";
  return (
    <>
      <ambientLight intensity={0.55} color="#f5f1e9" />
      <directionalLight
        position={[2, 4, 3]}
        intensity={intensity}
        color="#fbf6ec"
      />
      <pointLight position={[-3, 2, -2]} intensity={0.6} color={rimColor} />
      <pointLight position={[0, -1, 4]} intensity={0.25} color="#ffffff" />
    </>
  );
}

function AmbientParticles({ count = 36 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.6 - 0.6;
      phases[i] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    return g;
  }, [count]);

  useFrame((three) => {
    if (!ref.current) return;
    const t = three.clock.elapsedTime;
    const positions = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const phases = ref.current.geometry.attributes.aPhase as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const phase = phases.getX(i);
      const baseY = positions.getY(i);
      positions.setY(i, baseY + Math.sin(t * 0.4 + phase) * 0.0015);
    }
    positions.needsUpdate = true;
    ref.current.rotation.y = t * 0.02;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.035}
        color="#e6efe8"
        transparent
        opacity={0.55}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function SoftBackdrop() {
  return (
    <mesh position={[0, 0, -3]}>
      <planeGeometry args={[16, 10, 1, 1]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={{
          uTopColor: { value: new THREE.Color("#f3eee2") },
          uBottomColor: { value: new THREE.Color("#dde8df") }
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform vec3 uTopColor;
          uniform vec3 uBottomColor;
          void main() {
            float t = smoothstep(0.0, 1.0, vUv.y);
            vec3 c = mix(uBottomColor, uTopColor, t);
            float vignette = smoothstep(0.95, 0.4, distance(vUv, vec2(0.5)));
            gl_FragColor = vec4(c, vignette);
          }
        `}
      />
    </mesh>
  );
}

function CameraRig() {
  const { camera } = useThree();
  useFrame((three) => {
    const t = three.clock.elapsedTime;
    camera.position.x = Math.sin(t * 0.15) * 0.1;
    camera.position.y = 0.05 + Math.sin(t * 0.2) * 0.03;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function StageLoadingHint() {
  return (
    <div className="pca-stage3d__loading">
      <span>容相凝形中…</span>
    </div>
  );
}

export function Stage3D({
  manifest,
  state,
  memoryActive = false,
  safetyActive = false,
  ariaLabel
}: Stage3DProps) {
  const [supportsWebGL, setSupportsWebGL] = useState<boolean | null>(null);
  const gazeRef = useGazeTracker();
  const glbPath = useMemo(() => pickGlbPath(manifest), [manifest]);
  const billboardPath = useMemo(() => pickStagePngPath(manifest), [manifest]);

  useEffect(() => {
    setSupportsWebGL(detectWebGL());
  }, []);

  if (supportsWebGL !== true) {
    return (
      <CharacterAssetRenderer
        manifest={manifest}
        state={state}
        memoryActive={memoryActive}
        safetyActive={safetyActive}
        size="stage"
        view="fullbody"
      />
    );
  }

  return (
    <div
      className="pca-stage3d"
      data-render-mode={glbPath ? "glb" : billboardPath ? "billboard" : "empty"}
      aria-label={ariaLabel}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.1, 5.2], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <SoftBackdrop />
        <SceneLighting memoryActive={memoryActive} safetyActive={safetyActive} />
        <AmbientParticles />
        <CameraRig />
        <Suspense fallback={null}>
          {glbPath ? (
            <GLBCharacter
              glbPath={glbPath}
              gazeRef={gazeRef}
              memoryActive={memoryActive}
              safetyActive={safetyActive}
            />
          ) : billboardPath ? (
            <CharacterBillboard
              texturePath={billboardPath}
              gazeRef={gazeRef}
              memoryActive={memoryActive}
              safetyActive={safetyActive}
            />
          ) : null}
        </Suspense>
      </Canvas>
      <Suspense fallback={<StageLoadingHint />}>
        <></>
      </Suspense>
      {!glbPath && billboardPath ? (
        <span className="pca-stage3d__badge" aria-hidden="true">
          幻形 · 等真身降临
        </span>
      ) : null}
      {/* sentinel: state used to drive subtle CSS hooks */}
      <span className="pca-stage3d__state" data-state={state} aria-hidden="true" />
    </div>
  );
}

export default Stage3D;
