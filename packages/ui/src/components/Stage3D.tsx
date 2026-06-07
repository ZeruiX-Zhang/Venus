import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "meshoptimizer";
import {
  resolveCharacterAssetPath,
  type CharacterAssetManifest
} from "@personal-character-agent/avatar-assets";
import type { AvatarState } from "@personal-character-agent/avatar-runtime";
import { CharacterAssetRenderer } from "@personal-character-agent/avatar-assets/react";
import { XianxiaBackdrop } from "./XianxiaBackdrop";
import { onPlayCharacterClip } from "../lib/animationBus";

export interface Stage3DProps {
  manifest: CharacterAssetManifest;
  state: AvatarState;
  memoryActive?: boolean;
  safetyActive?: boolean;
  ariaLabel?: string;
  // bare 模式：去掉渐变背景板和粒子，纯透明，只显示模型（桌宠用）
  bare?: boolean;
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

// 动画片段语义（已校准）：0吐槽 1哭泣 2害怕 3逃跑 4警惕 5鼓掌 6跳舞
// 点击角色身体部位（调戏）→ 触发负面反应；摸越"不对"的部位反应越强烈。
const TOUCH_REACTIONS: Record<"head" | "body" | "lower", number[]> = {
  head: [0, 4],    // 点头/脸 → 吐槽 / 警惕
  body: [2, 1, 3], // 点胸/躯干（不对的部位）→ 害怕 / 哭泣 / 逃跑
  lower: [3, 2, 4] // 点下半身（不对的部位）→ 逃跑 / 害怕 / 警惕
};
// 待机随机只用「跳舞」（其余都是负面反应，不该无故出现）
const NATURAL_CLIPS = [6];
// 「逃跑」片段：播放时让角色转身背对观众，更像逃开
const FLEE_CLIP = 3;

function GLBCharacter({
  glbPath,
  gazeRef,
  memoryActive,
  safetyActive,
  gazeEnabled = true
}: {
  glbPath: string;
  gazeRef: React.MutableRefObject<{ x: number; y: number }>;
  memoryActive: boolean;
  safetyActive: boolean;
  gazeEnabled?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  // 所有动画片段对应的 action（按序号索引）
  const actionsRef = useRef<THREE.AnimationAction[]>([]);
  // 当前正在播放的一次性动作；null = 站立待机
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 目标转身角度（逃跑时转到 180°背对，结束回到 0 正面）
  const turnTargetRef = useRef(0);
  const [scene, setScene] = useState<THREE.Group | null>(null);
  // 自动适配后的缩放比例（每个上传的模型尺寸都不同，需要动态计算）
  const [fitScale, setFitScale] = useState(1);

  // 播放某个动画片段一次，结束后自动淡出回到站立姿势
  const playClipOnce = (index: number) => {
    const action = actionsRef.current[index];
    if (!action) return;
    const prev = currentActionRef.current;
    if (prev && prev !== action) prev.fadeOut(0.3);
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = false;
    action.fadeIn(0.25).play();
    currentActionRef.current = action;
    // 逃跑时转身背对，其它动作保持正面
    turnTargetRef.current = index === FLEE_CLIP ? Math.PI : 0;
  };

  // 订阅"动画总线"：聊天区的表情按钮点击时，会发布要播放的动画序号，这里收到后播放
  useEffect(() => {
    return onPlayCharacterClip((index) => playClipOnce(index));
    // playClipOnce 只读 ref，行为稳定；空依赖即可
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 待机时隔一段随机时间，自动来个自然动作
  const scheduleIdleAction = () => {
    const delay = 7000 + Math.random() * 9000; // 7~16 秒
    idleTimerRef.current = setTimeout(() => {
      // 只在没有动作播放时触发（约 70% 概率，避免太频繁）
      if (!currentActionRef.current && NATURAL_CLIPS.length > 0 && Math.random() < 0.7) {
        const idx = NATURAL_CLIPS[Math.floor(Math.random() * NATURAL_CLIPS.length)]!;
        playClipOnce(idx);
      }
      scheduleIdleAction();
    }, delay);
  };

  // 手动加载 GLB，注册 meshopt decoder 支持压缩模型
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      glbPath,
      (gltf) => {
        const loaded = gltf.scene;
        loaded.traverse((child) => {
          const obj = child as THREE.Mesh;
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
            // 让材质接收环境光反射、增强表面细节，降低"裸 CG"的扁平感
            const mat = obj.material as THREE.MeshStandardMaterial;
            if (mat && "envMapIntensity" in mat) {
              mat.envMapIntensity = 0.7; // 适度环境反射，过强会显得假/油亮
              // 增强法线贴图细节：让布料褶皱、面部起伏更立体真实
              if (mat.normalMap && mat.normalScale) {
                mat.normalScale.set(1.3, 1.3);
              }
              mat.needsUpdate = true;
            }
          }
        });

        // 自动适配：计算包围盒，把模型重心移到原点并缩放到统一高度
        // 这样任何尺寸/坐标系的上传模型都能正确居中显示在舞台中央
        const box = new THREE.Box3().setFromObject(loaded);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        // 把模型平移，使其几何中心落在原点
        loaded.position.set(-center.x, -center.y, -center.z);
        // 目标高度 1.8 单位（相机 fov 32 / 距离 5.2 下竖直可见约 3 单位）
        // 留出充足上下余量，避免头顶/裙摆被舞台顶部和聊天框裁切；用户可滚轮缩放、右键拖动平移微调
        const targetHeight = 1.8;
        const scale = size.y > 0.0001 ? targetHeight / size.y : 1;

        // 去掉动画里的"根部位移"(root motion)：很多片段(走/投篮等)整体会平移，
        // 导致角色播放时移出画面。删掉所有骨骼的 .position 轨道 → 动作原地播放，
        // 骨骼旋转照常，人物始终居中。（标准的 in-place 处理）
        gltf.animations.forEach((clip) => {
          clip.tracks = clip.tracks.filter((track) => !track.name.endsWith(".position"));
        });

        // 把模型自带的所有动画片段都建成 action（按序号存起来）
        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(loaded);
          mixerRef.current = mixer;
          actionsRef.current = gltf.animations.map((clip) => mixer.clipAction(clip));
          // 一次性动作播完后，淡出回到站立姿势
          mixer.addEventListener("finished", () => {
            currentActionRef.current?.fadeOut(0.4);
            currentActionRef.current = null;
            turnTargetRef.current = 0; // 动作结束转回正面
          });
          // 启动待机随机动作调度
          scheduleIdleAction();
        }

        setScene(loaded);
        setFitScale(scale);
      },
      undefined,
      (err) => {
        console.error("GLB load failed:", err);
      }
    );
    // 卸载时清理定时器和动画
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      mixerRef.current?.stopAllAction();
    };
  }, [glbPath]);

  useFrame((state, delta) => {
    mixerRef.current?.update(delta);
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    if (!currentActionRef.current) {
      // 没有骨骼动作播放时，给整体加一点轻微呼吸/摇摆，让站姿不死板
      g.position.y = Math.sin(t * 1.0) * 0.012;
      g.rotation.z = Math.sin(t * 0.6) * 0.006;
    } else {
      // 骨骼动作进行中：整体归正，让动画本身主导
      g.position.y = THREE.MathUtils.lerp(g.position.y, 0, Math.min(1, delta * 4));
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, 0, Math.min(1, delta * 4));
    }
    // 逃跑转身：平滑转到目标朝向（背对/正面）
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, turnTargetRef.current, Math.min(1, delta * 5));
  });

  // 这两个 + gaze 暂未在骨骼动画路径中使用（保留接口）
  void memoryActive;
  void safetyActive;
  void gazeEnabled;
  void gazeRef;

  if (!scene) return null;

  // 点击角色不同部位（调戏）→ 触发对应的负面反应（按点击高度判断头/身/下半身）
  const handleClick = (e: { stopPropagation: () => void; point: THREE.Vector3 }) => {
    e.stopPropagation();
    const y = e.point.y; // 模型居中于原点、总高约 1.8，故 y∈[-0.9,0.9]
    const region: "head" | "body" | "lower" = y > 0.45 ? "head" : y < -0.3 ? "lower" : "body";
    const pool = TOUCH_REACTIONS[region];
    const idx = pool[Math.floor(Math.random() * pool.length)]!;
    playClipOnce(idx);
  };

  // 外层 group 负责轻微待机微动，内层 group 负责自动缩放（围绕已居中的模型原点）
  return (
    <group ref={groupRef} position={[0, 0, 0]} onClick={handleClick}>
      <group scale={fitScale}>
        <primitive object={scene} />
      </group>
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
  const keyIntensity = safetyActive ? 1.3 : memoryActive ? 1.15 : 1.05;
  const rimColor = safetyActive ? "#ffe6c0" : memoryActive ? "#cdeed4" : "#dcefe6";
  return (
    <>
      {/* 柔和环境底光 */}
      <ambientLight intensity={0.35} color="#f5f1e9" />
      {/* 主光：暖白，带柔和阴影 */}
      <directionalLight
        position={[3, 5, 4]}
        intensity={keyIntensity}
        color="#fdf8ee"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      {/* 玉色轮廓光，勾边、增加层次 */}
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color={rimColor} />
      {/* 正面柔和补光：照亮面部、柔化死板阴影，让脸更自然不像 CG */}
      <directionalLight position={[0, 1.2, 5]} intensity={0.55} color="#fff3e8" />
    </>
  );
}

// 用 three 自带的 RoomEnvironment 生成柔光环境贴图（IBL），给模型自然反射，不联网、不依赖 drei
function SceneEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    const prev = scene.environment;
    scene.environment = envTex;
    return () => {
      scene.environment = prev;
      envTex.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

// 轨道控制：左键拖动旋转、滚轮缩放、右键/双指拖动平移（用 three 官方 OrbitControls，和 R3F 完全兼容）
function OrbitController({ enableZoom = true, enablePan = true }: { enableZoom?: boolean; enablePan?: boolean }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const controlsRef = useRef<ThreeOrbitControls | null>(null);
  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement);
    controls.enablePan = enablePan;
    controls.screenSpacePanning = true; // 平移跟随屏幕（上下左右移动模型），更直观
    controls.enableZoom = enableZoom;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.5;
    controls.maxDistance = 9;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;
    return () => controls.dispose();
  }, [camera, gl, enableZoom, enablePan]);
  useFrame(() => {
    controlsRef.current?.update();
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
  ariaLabel,
  bare = false
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
      data-bare={bare ? "true" : "false"}
      aria-label={ariaLabel}
    >
      {/* 古风夜色背景（绝对定位铺在画布之后；画布透明会透出来） */}
      <XianxiaBackdrop floating={bare} />
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.1, 5.2], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        // 电影级色调映射 + 略微提亮，让明暗过渡更柔和自然（降低生硬 CG 感）
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.96; // 略降曝光，人物不刺亮，和暮色背景更协调
        }}
      >
        <SceneLighting memoryActive={memoryActive} safetyActive={safetyActive} />
        {/* 柔光环境贴图（IBL），降低生硬 CG 感——舞台和桌宠都用 */}
        <SceneEnvironment />
        <Suspense fallback={null}>
          {glbPath ? (
            <GLBCharacter
              glbPath={glbPath}
              gazeRef={gazeRef}
              memoryActive={memoryActive}
              safetyActive={safetyActive}
              gazeEnabled={false}
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
        {/* 舞台：左键转、滚轮缩放、右键/双指平移；桌宠：只转+缩放（移动窗口靠拖动手柄） */}
        <OrbitController enablePan={!bare} />
      </Canvas>
      {/* 前景雾气：盖在角色脚下，把下身融进远山雾气，增强景深与和谐（仅舞台，不用于桌宠） */}
      {!bare && <div className="pca-stage3d__foremist" aria-hidden="true" />}
      {/* 统一色调薄罩：把前景人物与暮色背景拉到同一色调，减少"贴上去"的割裂感 */}
      {!bare && <div className="pca-stage3d__wash" aria-hidden="true" />}
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
