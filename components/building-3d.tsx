"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { SingleThreadedFragmentsModel } from "@thatopen/fragments"
import {
  Layers,
  Eye,
  EyeOff,
  Building2,
  Cpu,
  Zap,
  Wind,
  Info,
  RefreshCw,
  X,
  Ghost,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  Maximize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export interface DisciplineState {
  architecture: boolean
  structural: boolean
  electrical: boolean
  hvac: boolean
}

export interface Building3DProps {
  onSelectElement?: (element: any) => void
  selectedAssetGuid?: string
  criticalAssetGuids?: string[]
  className?: string
}

interface SelectedElementInfo {
  expressId?: number
  globalId?: string
  name?: string
  category?: string
  discipline?: string
  storey?: string
  properties?: Record<string, any>
}

// Task 7: 3D Alert Mesh state tracking (for real-time pulsing and clean reversion)
interface AlertMeshState {
  mesh: THREE.Mesh
  originalMaterial: THREE.Material | THREE.Material[]
  alertMaterial: THREE.MeshStandardMaterial
  beaconSprite?: THREE.Sprite
}

// Procedural 3D Warning Beacon sprite (depthTest: false ensures visibility through walls)
function createAlertBeaconSprite(): THREE.Sprite {
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext("2d")
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 14, 64, 64, 64)
    grad.addColorStop(0, "rgba(239, 68, 68, 1.0)")
    grad.addColorStop(0.5, "rgba(220, 38, 38, 0.75)")
    grad.addColorStop(1, "rgba(239, 68, 68, 0.0)")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(64, 64, 62, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#ef4444"
    ctx.beginPath()
    ctx.arc(64, 64, 32, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = "#ffffff"
    ctx.stroke()

    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 44px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("!", 64, 63)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })

  const sprite = new THREE.Sprite(spriteMat)
  sprite.renderOrder = 9999
  sprite.scale.set(1.4, 1.4, 1)
  return sprite
}

// Default bounding center of the Architecture model (used to center building at origin 0,0,0)
const DEFAULT_ARCH_CENTER = new THREE.Vector3(3.82, 6.05, -4.21)

// Default spatial alignment offsets to align Structural, Electrical, and HVAC disciplines to the Architectural coordinate frame
const DEFAULT_DISCIPLINE_OFFSETS: Record<string, { x: number; y: number; z: number }> = {
  architecture: { x: 0, y: 0, z: 0 },
  structural: { x: 15.088, y: -3.517, z: 3.331 },
  electrical: { x: -14.134, y: -0.946, z: 1.785 },
  hvac: { x: -14.320, y: -0.946, z: 2.087 },
}

export default function Building3D({
  onSelectElement,
  selectedAssetGuid,
  criticalAssetGuids = [],
  className = "",
}: Building3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const buildingRootRef = useRef<THREE.Group | null>(null)
  const groupsRef = useRef<Record<string, THREE.Group>>({})
  const meshesByGuidRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const alertStateRef = useRef<Map<string, AlertMeshState>>(new Map())
  const focusAssetByGuidRef = useRef<(guid: string) => void>(() => {})
  const onSelectElementRef = useRef(onSelectElement)
  useEffect(() => {
    onSelectElementRef.current = onSelectElement
  }, [onSelectElement])
  const metadataRef = useRef<any>(null)
  const selectedMeshRef = useRef<THREE.Mesh | null>(null)
  const originalSelectedColorRef = useRef<THREE.Color | null>(null)
  const flyAnimationRef = useRef<number | null>(null)
  const prevFocusedMeshRef = useRef<THREE.Mesh | null>(null)
  const prevFocusedMaterialRef = useRef<THREE.Material | THREE.Material[] | null>(null)
  const modelsRef = useRef<Record<string, SingleThreadedFragmentsModel>>({})
  const materialsRef = useRef<Record<string, THREE.MeshStandardMaterial>>({})
  const [copiedGuid, setCopiedGuid] = useState(false)
  const [xrayWalls, setXrayWalls] = useState(false)
  const [countsByDiscipline, setCountsByDiscipline] = useState<Record<string, number>>({
    architecture: 1560,
    structural: 4325,
    electrical: 1654,
    hvac: 11797,
  })

  const [loading, setLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState<Record<string, number>>({
    architecture: 0,
    structural: 0,
    electrical: 0,
    hvac: 0,
  })
  const [loadingStatus, setLoadingStatus] = useState("Loading NBU Office BIM models...")
  const [meshCountInfo, setMeshCountInfo] = useState<string>("0 BIM elements loaded")

  const [disciplines, setDisciplines] = useState<DisciplineState>({
    architecture: true,
    structural: true,
    electrical: true,
    hvac: true,
  })

  const [storeys, setStoreys] = useState<Array<{ id: number; name: string; elevation: number }>>([])
  const [selectedFloor, setSelectedFloor] = useState<string>("all")
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  const disciplineConfigs = [
    { id: "architecture", name: "Architecture", icon: Building2, color: "#cbd5e1" },
    { id: "structural", name: "Structural", icon: Cpu, color: "#94a3b8" },
    { id: "hvac", name: "HVAC", icon: Wind, color: "#06b6d4" },
    { id: "electrical", name: "Electrical", icon: Zap, color: "#f59e0b" },
  ]

  useEffect(() => {
    let isCancelled = false
    const container = containerRef.current
    if (!container) return

    // 1. Scene Setup
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color("#0a0f1d") // Sleek dark digital twin backdrop

    const width = container.clientWidth || 800
    const height = container.clientHeight || 520
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500)
    cameraRef.current = camera
    camera.position.set(38, 25, 40)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    })
    rendererRef.current = renderer
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.outputColorSpace = THREE.SRGBColorSpace

    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }
    container.appendChild(renderer.domElement)

    // Controls with smooth inertia damping
    const controls = new OrbitControls(camera, renderer.domElement)
    controlsRef.current = controls
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.target.set(0, 0, 0)
    controls.maxDistance = 160
    controls.minDistance = 0.5
    controls.minPolarAngle = 0
    controls.maxPolarAngle = Math.PI / 2 + 0.08

    // Lighting (Calibrated 3-point architectural illumination)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95)
    scene.add(ambientLight)

    const sun = new THREE.DirectionalLight(0xffffff, 1.3)
    sun.position.set(50, 80, 50)
    scene.add(sun)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6)
    fillLight.position.set(-50, 40, -50)
    scene.add(fillLight)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0f172a, 0.65)
    scene.add(hemiLight)

    // Ground Coordinate Grid (Centered under building base)
    const grid = new THREE.GridHelper(80, 40, 0x0ea5e9, 0x1e293b)
    grid.position.set(0, -6.8, 0)
    scene.add(grid)

    // Building Root group (centered dynamically from metadata)
    const buildingRoot = new THREE.Group()
    buildingRoot.position.set(-DEFAULT_ARCH_CENTER.x, -DEFAULT_ARCH_CENTER.y, -DEFAULT_ARCH_CENTER.z)
    scene.add(buildingRoot)
    buildingRootRef.current = buildingRoot

    // Discipline Groups
    const groups: Record<string, THREE.Group> = {
      architecture: new THREE.Group(),
      structural: new THREE.Group(),
      electrical: new THREE.Group(),
      hvac: new THREE.Group(),
    }
    groupsRef.current = groups
    Object.values(groups).forEach((grp) => buildingRoot.add(grp))

    // Animation Loop
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      controls.update()

      // Task 7: Real-time breathing/pulsing animation for critical alert equipment and beacons
      if (alertStateRef.current.size > 0) {
        const time = performance.now() * 0.005
        const pulse = 0.35 + 0.55 * (Math.sin(time) * 0.5 + 0.5)
        alertStateRef.current.forEach(({ mesh, alertMaterial, beaconSprite }) => {
          if (mesh.material === alertMaterial) {
            alertMaterial.emissiveIntensity = pulse
          }
          if (beaconSprite) {
            // Synchronize beacon visibility with discipline and floor visibility
            const isMeshVisible = mesh.visible && (mesh.parent?.visible ?? true)
            beaconSprite.visible = isMeshVisible
            const scalePulse = 1.0 + 0.16 * Math.sin(time * 1.5)
            beaconSprite.scale.set(1.4 * scalePulse, 1.4 * scalePulse, 1)
          }
        })
      }

      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener("resize", handleResize)

    // Shared materials per discipline (PBR metallic-roughness workflow)
    const materials: Record<string, THREE.MeshStandardMaterial> = {
      architecture: new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.6,
        metalness: 0.1,
        transparent: true,
        opacity: 0.82,
        side: THREE.DoubleSide,
      }),
      structural: new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.7,
        metalness: 0.3,
        side: THREE.DoubleSide,
      }),
      hvac: new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        roughness: 0.35,
        metalness: 0.5,
        side: THREE.DoubleSide,
      }),
      electrical: new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.35,
        metalness: 0.6,
        side: THREE.DoubleSide,
      }),
    }
    materialsRef.current = materials

    // 2. Load Models from .frag files
    async function loadModels() {
      try {
        const metaRes = await fetch("/models/building-metadata.json")
        if (metaRes.ok) {
          const meta = await metaRes.json()
          metadataRef.current = meta
          if (meta.storeys) {
            const sortedStoreys = [...meta.storeys].sort((a: any, b: any) => (a.elevation || 0) - (b.elevation || 0))
            metadataRef.current.storeys = sortedStoreys
            setStoreys(sortedStoreys)
          }
          if (meta.center) {
            buildingRoot.position.set(-meta.center.x, -meta.center.y, -meta.center.z)
          }
        }

        // Build fast O(1) indexed lookup map for element expressIds
        const assetByExpressId = new Map<number, any>()
        if (metadataRef.current?.assets) {
          for (const a of metadataRef.current.assets) {
            assetByExpressId.set(a.expressId, a)
          }
        }

        const disciplinesList = ["architecture", "structural", "electrical", "hvac"]
        let totalCount = 0

        for (const disc of disciplinesList) {
          if (isCancelled) return
          setLoadingStatus(`Loading ${disc.toUpperCase()} model (.frag)...`)

          const res = await fetch(`/models/${disc}.frag`)
          if (!res.ok) continue

          const arrayBuffer = await res.arrayBuffer()
          const uint8 = new Uint8Array(arrayBuffer)
          setLoadProgress((prev) => ({ ...prev, [disc]: 50 }))

          const model = new SingleThreadedFragmentsModel(disc, uint8)
          await model.ready
          modelsRef.current[disc] = model

          const geoms = await (model as any).getItemsGeometry()
          const discGroup = groups[disc]
          const discOffset =
            metadataRef.current?.offsets?.[disc] ||
            DEFAULT_DISCIPLINE_OFFSETS[disc] ||
            { x: 0, y: 0, z: 0 }
          const discMat = materials[disc]

          // Offset whole discipline group so all 4 models align with Architecture
          discGroup.position.set(-discOffset.x, -discOffset.y, -discOffset.z)

          let discItemCount = 0
          for (const geomGroup of geoms) {
            const list = Array.isArray(geomGroup) ? geomGroup : [geomGroup]
            for (const item of list) {
              if (!item || !item.positions || !item.indices) continue

              const bufferGeom = new THREE.BufferGeometry()
              bufferGeom.setAttribute("position", new THREE.BufferAttribute(item.positions, 3))
              bufferGeom.setIndex(new THREE.BufferAttribute(item.indices, 1))

              if (item.normals && item.normals.length === item.positions.length) {
                const normalsFloat = new Float32Array(item.normals.length)
                for (let n = 0; n < item.normals.length; n++) {
                  normalsFloat[n] = item.normals[n] / 32767
                }
                bufferGeom.setAttribute("normal", new THREE.BufferAttribute(normalsFloat, 3))
              } else {
                bufferGeom.computeVertexNormals()
              }

              const mesh = new THREE.Mesh(bufferGeom, discMat)

              if (item.transform?.elements) {
                mesh.applyMatrix4(new THREE.Matrix4().fromArray(item.transform.elements))
              }

              // Optimization: Freeze static transformation matrix to eliminate per-frame matrix recalculations
              mesh.matrixAutoUpdate = false
              mesh.updateMatrix()

              // Optimization: Pre-compute bounding sphere and bounding box for efficient frustum culling and raycasting
              bufferGeom.computeBoundingBox()
              bufferGeom.computeBoundingSphere()

              // Calculate true unified building elevation Y (accounting for geometry transform and discipline offset)
              let elevationY = 0
              if (bufferGeom.boundingBox) {
                const geomCenter = new THREE.Vector3()
                bufferGeom.boundingBox.getCenter(geomCenter)
                if (item.transform?.elements) {
                  geomCenter.applyMatrix4(new THREE.Matrix4().fromArray(item.transform.elements))
                }
                elevationY = geomCenter.y - discOffset.y
              }

              mesh.userData = {
                discipline: disc,
                localId: item.localId,
                elevationY: elevationY,
              }

              // Map GlobalId for Assets and Alerts (O(1) indexed lookup)
              const asset = assetByExpressId.get(item.localId)
              if (asset?.globalId) {
                mesh.userData.globalId = asset.globalId
                mesh.userData.assetName = asset.name
                mesh.userData.assetCategory = asset.category
                meshesByGuidRef.current.set(asset.globalId, mesh)
              }

              discGroup.add(mesh)
              discItemCount++
              totalCount++
            }
          }

          setCountsByDiscipline((prev) => ({ ...prev, [disc]: discItemCount }))
          setLoadProgress((prev) => ({ ...prev, [disc]: 100 }))
        }

        if (!isCancelled) {
          setLoading(false)
          setMeshCountInfo(`${totalCount.toLocaleString()} BIM elements loaded`)
        }
      } catch (err) {
        console.error("Error loading fragments:", err)
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadModels()

    // 3. Click Raycasting (Task 4)
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    const pointerDownPos = { x: 0, y: 0 }
    let pointerDownTime = 0

    const onPointerDown = (event: PointerEvent) => {
      pointerDownPos.x = event.clientX
      pointerDownPos.y = event.clientY
      pointerDownTime = performance.now()
    }

    const onPointerUp = async (event: PointerEvent) => {
      // Only process primary mouse button (ignore right click / middle click used for pan and zoom)
      if (event.button !== 0) return

      // Differentiate deliberate clicks from camera drag / orbit / tilt
      const dx = event.clientX - pointerDownPos.x
      const dy = event.clientY - pointerDownPos.y
      const dist = Math.hypot(dx, dy)
      const elapsed = performance.now() - pointerDownTime

      // If user moved cursor > 6px or held button > 350ms, they were orbiting/tilting/panning the camera
      if (dist > 6 || elapsed > 350) return

      const rect = container.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      // Task 7: Check if clicked directly on an alert beacon sprite
      const beacons: THREE.Sprite[] = []
      alertStateRef.current.forEach((st) => {
        if (st.beaconSprite && st.beaconSprite.visible) beacons.push(st.beaconSprite)
      })
      if (beacons.length > 0) {
        const beaconHits = raycaster.intersectObjects(beacons, false)
        if (beaconHits.length > 0) {
          const beacon = beaconHits[0].object as THREE.Sprite
          const targetGuid = beacon.userData?.guid
          if (targetGuid) {
            focusAssetByGuidRef.current(targetGuid)
            return
          }
        }
      }

      const visibleMeshes: THREE.Mesh[] = []
      Object.values(groupsRef.current).forEach((grp) => {
        if (grp.visible) {
          grp.traverse((child) => {
            if ((child as THREE.Mesh).isMesh && child.visible) {
              visibleMeshes.push(child as THREE.Mesh)
            }
          })
        }
      })

      const intersects = raycaster.intersectObjects(visibleMeshes, false)
      if (intersects.length > 0) {
        const hit = intersects[0]
        const mesh = hit.object as THREE.Mesh

        // Reset previous highlight
        if (selectedMeshRef.current && originalSelectedColorRef.current) {
          ;(selectedMeshRef.current.material as THREE.MeshStandardMaterial).color.copy(
            originalSelectedColorRef.current
          )
        }

        // Highlight hit mesh in glowing cyan
        selectedMeshRef.current = mesh
        const highlightMat = (mesh.material as THREE.MeshStandardMaterial).clone()
        originalSelectedColorRef.current = (mesh.material as THREE.MeshStandardMaterial).color.clone()
        highlightMat.color.setHex(0x38bdf8)
        highlightMat.emissive = new THREE.Color(0x0284c7)
        highlightMat.emissiveIntensity = 0.45
        mesh.material = highlightMat

        const localId = mesh.userData.localId
        const disc = mesh.userData.discipline

        // 1. Check if element matches an equipment asset in metadata
        let assetInfo: any = null
        if (metadataRef.current?.assets) {
          assetInfo = metadataRef.current.assets.find(
            (a: any) =>
              (a.discipline === disc && a.expressId === localId) ||
              (mesh.userData.globalId && a.globalId === mesh.userData.globalId)
          )
        }

        // 2. Query true BIM schema attributes from the loaded That Open Fragments model (Task 4)
        const model = modelsRef.current[disc]
        let ifcClass = assetInfo?.category || "IFC Element"
        let realGuid = mesh.userData.globalId || assetInfo?.globalId || ""
        let realName = assetInfo?.name || ""
        const psets: Record<string, any> = {
          Discipline: disc.charAt(0).toUpperCase() + disc.slice(1),
          "Express ID": localId,
          Elevation: `${(mesh.userData.elevationY ?? 0).toFixed(2)}m`,
        }

        if (model) {
          try {
            const raw = (model as any).getItemsData([localId])
            const itemsData = Array.isArray(raw) ? raw : await raw
            if (itemsData && itemsData.length > 0 && itemsData[0]) {
              const data = itemsData[0]
              if (data._category?.value) {
                ifcClass = data._category.value
              }
              if (data._guid?.value) {
                realGuid = data._guid.value
              }
              if (data.Name?.value) {
                realName = data.Name.value
              }
              if (data.ObjectType?.value) {
                psets["Object Type"] = data.ObjectType.value
              }
              if (data.Tag?.value) {
                psets["Revit / Tag"] = data.Tag.value
              }
            }
          } catch (err) {
            console.warn("Fragment item data retrieval:", err)
          }
        }

        // Production fallbacks
        if (!realGuid) {
          realGuid = `NBU-${disc.toUpperCase()}-${localId}`
        }
        if (!realName) {
          realName = `${ifcClass} #${localId}`
        }
        psets["Global ID"] = realGuid
        psets["IFC Class"] = ifcClass

        // 3. Dynamic storey attribution based on unified world elevation (reading from metadataRef to avoid React stale closure)
        const currentStoreys = (metadataRef.current?.storeys || storeys) as Array<{ name: string; elevation: number }>
        let storeyName = "Level 1"
        if (currentStoreys && currentStoreys.length > 0) {
          const elevY = mesh.userData.elevationY ?? 0
          for (let s = currentStoreys.length - 1; s >= 0; s--) {
            if (elevY >= (currentStoreys[s].elevation ?? 0) - 0.4) {
              storeyName = currentStoreys[s].name
              break
            }
          }
        }
        psets["Storey"] = storeyName

        const info: SelectedElementInfo = {
          expressId: localId,
          globalId: realGuid,
          name: realName,
          category: ifcClass,
          discipline: disc,
          storey: storeyName,
          properties: psets,
        }

        setSelectedElement(info)
        setInspectorOpen(true)
        if (onSelectElementRef.current) {
          onSelectElementRef.current(info)
        }
      }
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown)
    renderer.domElement.addEventListener("pointerup", onPointerUp)

    return () => {
      isCancelled = true
      renderer.domElement.removeEventListener("pointerdown", onPointerDown)
      renderer.domElement.removeEventListener("pointerup", onPointerUp)
      cancelAnimationFrame(animId)
      if (flyAnimationRef.current) {
        cancelAnimationFrame(flyAnimationRef.current)
      }
      if (prevFocusedMaterialRef.current && prevFocusedMeshRef.current) {
        if (prevFocusedMeshRef.current.material !== prevFocusedMaterialRef.current) {
          if (Array.isArray(prevFocusedMeshRef.current.material)) {
            prevFocusedMeshRef.current.material.forEach((mat) => mat.dispose())
          } else {
            ;(prevFocusedMeshRef.current.material as THREE.Material).dispose()
          }
        }
      }
      window.removeEventListener("resize", handleResize)
      renderer.domElement.removeEventListener("pointerdown", onPointerDown)

      // Task 7: Dispose alert materials and beacon sprites on unmount
      alertStateRef.current.forEach((state) => {
        if (state.beaconSprite) {
          if (state.beaconSprite.parent) {
            state.beaconSprite.parent.remove(state.beaconSprite)
          }
          if (state.beaconSprite.material.map) {
            state.beaconSprite.material.map.dispose()
          }
          state.beaconSprite.material.dispose()
        }
        state.alertMaterial.dispose()
      })
      alertStateRef.current.clear()

      // Comprehensive GPU memory cleanup (prevents WebGL context exhaustion on tab navigation)
      buildingRoot.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh
          if (m.geometry) m.geometry.dispose()
          if (m.material && m.material !== materials[m.userData?.discipline]) {
            if (Array.isArray(m.material)) {
              m.material.forEach((mat) => mat.dispose())
            } else {
              m.material.dispose()
            }
          }
        }
      })
      Object.values(materials).forEach((mat) => mat.dispose())
      controls.dispose()
      renderer.dispose()

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  // Reset Camera View
  const fitCameraToBuilding = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return
    cameraRef.current.position.set(38, 25, 40)
    controlsRef.current.target.set(0, 0, 0)
    controlsRef.current.update()
  }, [])

  // Discipline Visibility Toggle (Task 2: instant switching without reloading)
  const toggleDiscipline = (discId: keyof DisciplineState, altKey = false) => {
    if (altKey) {
      soloDiscipline(discId)
      return
    }

    setDisciplines((prev) => {
      const updated = { ...prev, [discId]: !prev[discId] }
      const grp = groupsRef.current[discId]
      if (grp) {
        grp.visible = updated[discId]
      }
      // State sync: If we hide the discipline containing the currently inspected element, close inspector and reset highlight
      if (!updated[discId] && selectedElement?.discipline === discId) {
        setInspectorOpen(false)
        if (selectedMeshRef.current && originalSelectedColorRef.current) {
          ;(selectedMeshRef.current.material as THREE.MeshStandardMaterial).color.copy(
            originalSelectedColorRef.current
          )
          selectedMeshRef.current = null
        }
      }
      return updated
    })
  }

  // Quick Solo Mode: Isolate a single discipline (e.g. view only ducts or only wiring)
  const soloDiscipline = (discId: keyof DisciplineState, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setDisciplines(() => {
      const updated: DisciplineState = {
        architecture: discId === "architecture",
        structural: discId === "structural",
        electrical: discId === "electrical",
        hvac: discId === "hvac",
      }
      Object.entries(groupsRef.current).forEach(([id, grp]) => {
        grp.visible = id === discId
      })
      if (selectedElement && selectedElement.discipline !== discId) {
        setInspectorOpen(false)
        if (selectedMeshRef.current && originalSelectedColorRef.current) {
          ;(selectedMeshRef.current.material as THREE.MeshStandardMaterial).color.copy(
            originalSelectedColorRef.current
          )
          selectedMeshRef.current = null
        }
      }
      return updated
    })
  }

  // Show all disciplines
  const showAllDisciplines = () => {
    setDisciplines({
      architecture: true,
      structural: true,
      electrical: true,
      hvac: true,
    })
    Object.values(groupsRef.current).forEach((grp) => {
      grp.visible = true
    })
  }

  // X-Ray Ghost Walls: Toggles architecture transparency so internal MEP ducts are visible in context
  const toggleXrayWalls = () => {
    setXrayWalls((prev) => {
      const next = !prev
      const archMat = materialsRef.current?.architecture
      if (archMat) {
        archMat.opacity = next ? 0.2 : 0.82
        archMat.needsUpdate = true
      }
      return next
    })
  }

  // Floor Selector Handler (Task 3: dynamic slicing derived from IfcBuildingStorey elevations)
  const handleFloorChange = (floorName: string) => {
    setSelectedFloor(floorName)

    if (floorName === "all") {
      // Restore full visibility across all 4 models
      Object.values(groupsRef.current).forEach((grp) => {
        grp.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.visible = true
          }
        })
      })
      fitCameraToBuilding()
      return
    }

    const storeyIndex = storeys.findIndex((s) => s.name === floorName)
    if (storeyIndex === -1) return

    const selectedStorey = storeys[storeyIndex]
    const currentElevation = selectedStorey.elevation

    // Dynamic elevation slicing derived entirely from IfcBuildingStorey sequence
    // Lower bound: Lowest floor includes ground/basement levels; otherwise midpoint from previous storey
    const lowerBound = storeyIndex === 0
      ? -Infinity
      : (storeys[storeyIndex - 1].elevation + currentElevation) / 2

    // Upper bound: Top floor includes rooftop structures; otherwise elevation of the next storey
    const upperBound = storeyIndex === storeys.length - 1
      ? Infinity
      : (storeys[storeyIndex + 1]?.elevation ?? currentElevation + 4.0)

    // Slice all 4 models (Architecture, Structural, HVAC, Electrical) dynamically
    Object.values(groupsRef.current).forEach((grp) => {
      grp.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const y = child.userData.elevationY ?? 0
          const isFloorMember = y >= lowerBound && y < upperBound
          child.visible = isFloorMember
        }
      })
    })

    // State sync: If inspected element is not on this floor, dismiss inspector
    const selectedMesh = selectedMeshRef.current
    if (selectedMesh && !selectedMesh.visible) {
      setInspectorOpen(false)
      if (originalSelectedColorRef.current) {
        ;(selectedMesh.material as THREE.MeshStandardMaterial).color.copy(
          originalSelectedColorRef.current
        )
        selectedMeshRef.current = null
      }
    }

    // Smoothly focus camera onto the isolated floor level
    if (cameraRef.current && controlsRef.current) {
      const archCenterY = metadataRef.current?.center?.y ?? DEFAULT_ARCH_CENTER.y
      const elevationTarget = currentElevation - archCenterY
      cameraRef.current.position.set(28, elevationTarget + 12, 30)
      controlsRef.current.target.set(0, elevationTarget + 1.2, 0)
      controlsRef.current.update()
    }
  }

  // Quick floor navigation helper (Previous / Next floor stepper)
  const stepFloor = (direction: "up" | "down") => {
    if (storeys.length === 0) return

    if (selectedFloor === "all") {
      if (direction === "up") {
        handleFloorChange(storeys[0].name)
      } else {
        handleFloorChange(storeys[storeys.length - 1].name)
      }
      return
    }

    const currentIndex = storeys.findIndex((s) => s.name === selectedFloor)
    if (currentIndex === -1) return

    if (direction === "up") {
      if (currentIndex < storeys.length - 1) {
        handleFloorChange(storeys[currentIndex + 1].name)
      } else {
        handleFloorChange("all")
      }
    } else {
      if (currentIndex > 0) {
        handleFloorChange(storeys[currentIndex - 1].name)
      } else {
        handleFloorChange("all")
      }
    }
  }

  // Smoothly animate camera position and target with cubic ease-out
  const animateCameraTo = useCallback(
    (targetPos: THREE.Vector3, targetLookAt: THREE.Vector3, duration = 900) => {
      if (!cameraRef.current || !controlsRef.current) return

      if (flyAnimationRef.current) {
        cancelAnimationFrame(flyAnimationRef.current)
        flyAnimationRef.current = null
      }

      const camera = cameraRef.current
      const controls = controlsRef.current

      const startPos = camera.position.clone()
      const startTarget = controls.target.clone()
      const startTime = performance.now()

      controls.enabled = false

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

      const step = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = easeOutCubic(progress)

        camera.position.lerpVectors(startPos, targetPos, eased)
        controls.target.lerpVectors(startTarget, targetLookAt, eased)
        controls.update()

        if (progress < 1) {
          flyAnimationRef.current = requestAnimationFrame(step)
        } else {
          controls.enabled = true
          flyAnimationRef.current = null
        }
      }

      flyAnimationRef.current = requestAnimationFrame(step)
    },
    []
  )

  // Camera view angle presets (Isometric, Top/Bird's-Eye, Front, Side)
  const setViewPreset = useCallback(
    (view: "iso" | "top" | "front" | "side") => {
      if (!cameraRef.current || !controlsRef.current) return
      const target = new THREE.Vector3(0, 0, 0)
      let newCamPos = new THREE.Vector3()

      switch (view) {
        case "iso":
          newCamPos = new THREE.Vector3(34, 24, 34)
          break
        case "top":
          newCamPos = new THREE.Vector3(0.01, 54, 0.01)
          break
        case "front":
          newCamPos = new THREE.Vector3(0, 8, 48)
          break
        case "side":
          newCamPos = new THREE.Vector3(48, 8, 0)
          break
      }
      animateCameraTo(newCamPos, target, 750)
    },
    [animateCameraTo]
  )

  // Focus and highlight asset in 3D by IFC GlobalId (Task 6: UI -> 3D link)
  const focusAssetByGuid = useCallback(
    (guid: string) => {
      if (!guid) return
      const mesh = meshesByGuidRef.current.get(guid)
      if (!mesh) return

      // 1. Gracefully restore previously focused mesh material
      if (prevFocusedMeshRef.current && prevFocusedMaterialRef.current) {
        if (prevFocusedMeshRef.current.material !== prevFocusedMaterialRef.current) {
          if (Array.isArray(prevFocusedMeshRef.current.material)) {
            prevFocusedMeshRef.current.material.forEach((mat) => mat.dispose())
          } else {
            ;(prevFocusedMeshRef.current.material as THREE.Material).dispose()
          }
        }
        prevFocusedMeshRef.current.material = prevFocusedMaterialRef.current
        prevFocusedMeshRef.current = null
        prevFocusedMaterialRef.current = null
      }

      // Also reset any selectedMesh from direct raycasting if present
      if (selectedMeshRef.current && originalSelectedColorRef.current) {
        ;(selectedMeshRef.current.material as THREE.MeshStandardMaterial).color.copy(
          originalSelectedColorRef.current
        )
        selectedMeshRef.current = null
        originalSelectedColorRef.current = null
      }

      // 2. Ensure discipline containing this asset is visible
      const disc = mesh.userData?.discipline as keyof DisciplineState
      if (disc && !disciplines[disc]) {
        setDisciplines((prev) => ({ ...prev, [disc]: true }))
        const grp = groupsRef.current[disc]
        if (grp) grp.visible = true
      }

      // 3. Ensure floor is visible (reset floor slicing if mesh is currently hidden)
      if (!mesh.visible) {
        setSelectedFloor("all")
        Object.values(groupsRef.current).forEach((grp) => {
          grp.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) child.visible = true
          })
        })
      }

      // 4. Highlight focused equipment in bright cyan with emissive radiance
      prevFocusedMeshRef.current = mesh
      prevFocusedMaterialRef.current = mesh.material

      const highlightMat = (mesh.material as THREE.MeshStandardMaterial).clone()
      highlightMat.color.setHex(0x00f0ff) // Vibrant cyan
      highlightMat.emissive.setHex(0x0077aa)
      highlightMat.emissiveIntensity = 0.75
      highlightMat.roughness = 0.2
      highlightMat.metalness = 0.7
      mesh.material = highlightMat
      selectedMeshRef.current = mesh

      // 5. Compute dynamic bounding sphere and smooth camera fly-to
      mesh.updateWorldMatrix(true, false)
      const box = new THREE.Box3().setFromObject(mesh)
      const center = new THREE.Vector3()
      box.getCenter(center)

      const size = new THREE.Vector3()
      box.getSize(size)
      const radius = Math.max(size.x, size.y, size.z, 1.4)
      const targetPos = center.clone().add(new THREE.Vector3(radius * 2.6, radius * 1.8, radius * 2.6))

      animateCameraTo(targetPos, center, 950)

      // 6. Query BIM properties to open and populate the Inspector drawer
      const localId = mesh.userData?.localId
      const model = modelsRef.current[disc]

      const buildInfoAndOpen = (itemData?: any) => {
        const ifcClass = itemData?._category?.value || mesh.userData?.assetCategory || "IFC Element"
        const realName =
          itemData?.Name?.value || mesh.userData?.assetName || (localId ? `Item #${localId}` : `Item #${guid}`)
        const realGuid = itemData?._guid?.value || mesh.userData?.globalId || guid

        const psets: Record<string, any> = {}
        if (itemData?.ObjectType?.value) psets["Object Type"] = itemData.ObjectType.value
        if (itemData?.Tag?.value) psets["Revit / Tag"] = itemData.Tag.value
        if (mesh.userData?.elevationY !== undefined) {
          psets["Elevation (rel)"] = `${mesh.userData.elevationY.toFixed(2)} m`
        }
        psets["Discipline"] = disc ? disc.toUpperCase() : "GENERAL"

        const elev = mesh.userData?.elevationY ?? 0
        const storeysList = metadataRef.current?.storeys || storeys
        let storeyName = "Level 1"
        if (storeysList.length > 0) {
          for (let i = 0; i < storeysList.length; i++) {
            const currentStorey = storeysList[i]
            const nextStorey = storeysList[i + 1]
            if (!nextStorey || elev < nextStorey.elevation) {
              storeyName = currentStorey.name
              break
            }
          }
        }

        const info: SelectedElementInfo = {
          expressId: localId || 0,
          globalId: realGuid,
          name: realName,
          category: ifcClass,
          discipline: disc || "general",
          storey: storeyName,
          properties: psets,
        }
        setSelectedElement(info)
        setInspectorOpen(true)
      }

      if (model && localId) {
        Promise.resolve()
          .then(() => (model as any).getItemsData([localId]))
          .then((itemsData: any[]) => {
            buildInfoAndOpen(itemsData?.[0])
          })
          .catch((err: unknown) => {
            console.warn("Could not query IFC properties for focused asset, using fallback:", err)
            buildInfoAndOpen()
          })
      } else {
        buildInfoAndOpen()
      }
    },
    [disciplines, storeys, animateCameraTo]
  )

  useEffect(() => {
    focusAssetByGuidRef.current = focusAssetByGuid
  }, [focusAssetByGuid])

  // Handle dynamic critical alert highlighting & warning beacons in 3D (Task 7)
  useEffect(() => {
    if (loading) return

    const currentGuids = new Set(criticalAssetGuids)
    const activeMap = alertStateRef.current

    // 1. Remove alerts that have been acknowledged (no longer in criticalAssetGuids)
    activeMap.forEach((state, guid) => {
      if (!currentGuids.has(guid)) {
        // Gracefully revert mesh material if not currently focused
        if (selectedMeshRef.current === state.mesh) {
          prevFocusedMaterialRef.current = state.originalMaterial
        } else {
          state.mesh.material = state.originalMaterial
        }

        // Dispose cloned alert material
        state.alertMaterial.dispose()

        // Dispose and remove floating beacon sprite
        if (state.beaconSprite) {
          if (state.beaconSprite.parent) {
            state.beaconSprite.parent.remove(state.beaconSprite)
          }
          if (state.beaconSprite.material.map) {
            state.beaconSprite.material.map.dispose()
          }
          state.beaconSprite.material.dispose()
        }

        activeMap.delete(guid)
      }
    })

    // 2. Add new active alerts to 3D scene
    criticalAssetGuids.forEach((guid) => {
      if (!activeMap.has(guid)) {
        const mesh = meshesByGuidRef.current.get(guid)
        if (mesh) {
          const originalMaterial = mesh.material

          const alertMat = (mesh.material as THREE.MeshStandardMaterial).clone()
          alertMat.color.setHex(0xef4444) // Vibrant emergency red
          alertMat.emissive.setHex(0xdc2626) // Deep pulsing red radiance
          alertMat.emissiveIntensity = 0.6
          alertMat.roughness = 0.3
          alertMat.metalness = 0.5

          if (selectedMeshRef.current !== mesh) {
            mesh.material = alertMat
          } else {
            prevFocusedMaterialRef.current = alertMat
          }

          // Create floating 3D beacon sprite
          mesh.updateWorldMatrix(true, false)
          const box = new THREE.Box3().setFromObject(mesh)
          const center = new THREE.Vector3()
          box.getCenter(center)

          const beacon = createAlertBeaconSprite()
          beacon.position.set(center.x, box.max.y + 1.1, center.z)
          beacon.userData = { isAlertBeacon: true, guid }

          if (sceneRef.current) {
            sceneRef.current.add(beacon)
          }

          activeMap.set(guid, {
            mesh,
            originalMaterial,
            alertMaterial: alertMat,
            beaconSprite: beacon,
          })
        }
      }
    })
  }, [loading, criticalAssetGuids])

  const lastFocusedGuidRef = useRef<string | null>(null)

  // React to selectedAssetGuid changes from parent (Task 6)
  useEffect(() => {
    if (loading) return
    if (!selectedAssetGuid) {
      lastFocusedGuidRef.current = null
      return
    }
    if (lastFocusedGuidRef.current !== selectedAssetGuid) {
      lastFocusedGuidRef.current = selectedAssetGuid
      focusAssetByGuid(selectedAssetGuid)
    }
  }, [loading, selectedAssetGuid, focusAssetByGuid])

  // Fly camera to frame the currently selected element
  const flyToSelectedElement = useCallback(() => {
    if (!selectedMeshRef.current) return
    const mesh = selectedMeshRef.current
    mesh.updateWorldMatrix(true, false)
    const box = new THREE.Box3().setFromObject(mesh)
    const center = new THREE.Vector3()
    box.getCenter(center)
    const size = new THREE.Vector3()
    box.getSize(size)
    const radius = Math.max(size.x, size.y, size.z, 1.4)
    const targetPos = center.clone().add(new THREE.Vector3(radius * 2.5, radius * 1.8, radius * 2.5))
    animateCameraTo(targetPos, center, 800)
  }, [animateCameraTo])

  // Copy IFC GlobalId to system clipboard
  const handleCopyGuid = (guid?: string) => {
    if (!guid) return
    navigator.clipboard.writeText(guid)
    setCopiedGuid(true)
    setTimeout(() => setCopiedGuid(false), 2000)
  }

  return (
    <div className={`relative w-full h-full min-h-[520px] bg-[#0a0f1d] rounded-lg overflow-hidden select-none ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div ref={containerRef} className="w-full h-full min-h-[520px] cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[#0a0f1d]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20">
          <div className="w-14 h-14 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
          <h3 className="text-base font-semibold text-white mb-1">Loading Office Digital Twin (BIM)</h3>
          <p className="text-xs text-slate-400 mb-5">{loadingStatus}</p>

          <div className="w-full max-w-sm space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            {disciplineConfigs.map((disc) => (
              <div key={disc.id} className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-2">
                  <disc.icon className="w-3.5 h-3.5" style={{ color: disc.color }} />
                  {disc.name} (.frag)
                </span>
                <span className="font-mono text-cyan-400">{loadProgress[disc.id] || 0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Floating Control Stack: Disciplines (Row 1) & Floor/Camera (Row 2) */}
      <div className="absolute top-3 left-3 right-3 flex flex-col gap-1.5 pointer-events-none z-10">
        {/* Row 1: Disciplines Bar */}
        <div className="flex items-center pointer-events-auto max-w-full overflow-x-auto no-scrollbar">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700/60 shadow-xl whitespace-nowrap">
            <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1.5 shrink-0">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Disciplines:
            </span>
            {disciplineConfigs.map((d) => {
              const isVisible = disciplines[d.id as keyof DisciplineState]
              const Icon = d.icon
              const count = countsByDiscipline[d.id] || 0
              const countBadge = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count
              return (
                <div key={d.id} className="relative group/disc flex items-center shrink-0">
                  <Button
                    size="sm"
                    variant={isVisible ? "default" : "outline"}
                    onClick={(e) => toggleDiscipline(d.id as keyof DisciplineState, e.altKey)}
                    title={`${d.name} (${count.toLocaleString()} elements). Alt+click to Solo.`}
                    className={`h-7 px-2.5 text-xs transition-all flex items-center gap-1.5 ${
                      isVisible
                        ? "bg-slate-800 text-white border-slate-600 hover:bg-slate-700 shadow-sm"
                        : "bg-slate-950/60 text-slate-500 border-slate-800 hover:text-slate-300"
                    }`}
                  >
                    <Icon className="w-3 h-3" style={{ color: isVisible ? d.color : "#64748b" }} />
                    <span>{d.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">({countBadge})</span>
                    {isVisible ? (
                      <Eye className="w-3 h-3 text-emerald-400 ml-0.5" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-slate-500 ml-0.5" />
                    )}
                  </Button>
                  {/* Solo Action Button on hover */}
                  <button
                    type="button"
                    onClick={(e) => soloDiscipline(d.id as keyof DisciplineState, e)}
                    title={`Isolate ${d.name} only`}
                    className="opacity-0 group-hover/disc:opacity-100 transition-opacity absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] bg-slate-950 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-700 hover:bg-cyan-950 shadow z-30 whitespace-nowrap"
                  >
                    Solo
                  </button>
                </div>
              )
            })}

            {/* Show All if any are hidden */}
            {Object.values(disciplines).some((v) => !v) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={showAllDisciplines}
                title="Show all building disciplines"
                className="h-7 px-2 text-[11px] text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 shrink-0"
              >
                Show All
              </Button>
            )}

            {/* X-Ray Ghost Walls (Task 2 feature for inspecting MEP ducts inside walls) */}
            <Button
              size="sm"
              variant={xrayWalls ? "default" : "outline"}
              onClick={toggleXrayWalls}
              title="Toggle semi-transparent walls to inspect internal ducts and wiring in context"
              className={`h-7 px-2 text-xs transition-all flex items-center gap-1 ml-1 shrink-0 ${
                xrayWalls
                  ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-sm"
                  : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              <Ghost className="w-3 h-3 text-cyan-400" />
              <span>X-Ray</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Floor Selector, Storey Steppers & Camera Angle Tools */}
        <div className="flex items-center pointer-events-auto max-w-full overflow-x-auto no-scrollbar">
          <div className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700/60 shadow-xl whitespace-nowrap">
            <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1.5 shrink-0">
              <Building2 className="w-3.5 h-3.5 text-amber-400" /> Floor:
            </span>
            <select
              value={selectedFloor}
              onChange={(e) => handleFloorChange(e.target.value)}
              className="h-7 px-2 text-xs bg-slate-800 text-white border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer font-medium shrink-0"
            >
              <option value="all">🏢 All Floors</option>
              {storeys.map((st) => (
                <option key={st.id} value={st.name}>
                  📍 {st.name} ({st.elevation.toFixed(1)}m)
                </option>
              ))}
            </select>

            {/* Up/Down Storey Stepper */}
            <div className="flex items-center border border-slate-700 rounded bg-slate-800/80 overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => stepFloor("down")}
                title="Previous Floor / Ground"
                className="h-7 px-1.5 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => stepFloor("up")}
                title="Next Floor / Roof"
                className="h-7 px-1.5 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border-l border-slate-700"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={fitCameraToBuilding}
              title="Reset Camera View"
              className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>

            {/* Quick Camera Angle Presets */}
            <div className="flex items-center border border-slate-700/80 rounded bg-slate-800/80 overflow-hidden text-[10px] font-medium text-slate-300 shrink-0">
              <button
                type="button"
                onClick={() => setViewPreset("iso")}
                title="Isometric 3D Perspective"
                className="px-2 py-1 hover:text-white hover:bg-slate-700 transition-colors"
              >
                3D
              </button>
              <button
                type="button"
                onClick={() => setViewPreset("top")}
                title="Top View (Plan / Roof)"
                className="px-2 py-1 hover:text-white hover:bg-slate-700 transition-colors border-l border-slate-700/80"
              >
                Top
              </button>
              <button
                type="button"
                onClick={() => setViewPreset("front")}
                title="Front Elevation View"
                className="px-2 py-1 hover:text-white hover:bg-slate-700 transition-colors border-l border-slate-700/80"
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => setViewPreset("side")}
                title="Side Elevation View"
                className="px-2 py-1 hover:text-white hover:bg-slate-700 transition-colors border-l border-slate-700/80"
              >
                Side
              </button>
            </div>

            {/* Active Alerts in 3D (Task 7) */}
            {criticalAssetGuids && criticalAssetGuids.length > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-950/80 border border-red-500/50 rounded-md shadow-lg shadow-red-900/30 shrink-0">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <span className="text-[11px] font-semibold text-red-300">
                  {criticalAssetGuids.length} Alert{criticalAssetGuids.length > 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => focusAssetByGuid(criticalAssetGuids[0])}
                  title="Fly camera to critical alert equipment"
                  className="h-5 px-1.5 text-[10px] bg-red-900 hover:bg-red-800 text-white rounded border border-red-700/60 font-medium transition-colors"
                >
                  Inspect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Discreet Info Status Badge */}
      <div className="absolute bottom-2.5 right-3 pointer-events-none z-10">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded px-2.5 py-1 text-[10px] text-slate-400 flex items-center gap-1.5 pointer-events-auto shadow-sm">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>NBU Office BIM</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-slate-400">{meshCountInfo}</span>
        </div>
      </div>

      {/* Element Properties Inspector Drawer (Task 4) */}
      {inspectorOpen && selectedElement && (
        <div className="absolute top-22 right-3 w-84 max-w-[340px] max-h-[calc(100%-96px)] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl p-4 overflow-y-auto z-20 text-white animate-in fade-in slide-in-from-right-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <h4 className="font-semibold text-sm">BIM Element Inspector</h4>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={flyToSelectedElement}
                title="Focus Camera on Element"
                className="h-6 w-6 p-0 text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setInspectorOpen(false)}
                title="Close Inspector"
                className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-3 space-y-3 text-xs">
            {/* Element Name */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                Element Name
              </span>
              <p className="font-medium text-slate-100 break-words leading-snug bg-slate-950/40 p-2 rounded border border-slate-800">
                {selectedElement.name}
              </p>
            </div>

            {/* Badges: IFC Class, Discipline, Storey */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                🏷️ {selectedElement.category}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                🏢 {selectedElement.discipline}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/60">
                📍 {selectedElement.storey}
              </span>
            </div>

            {/* GlobalId with One-Click Copy */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Global ID (IFC GUID)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyGuid(selectedElement.globalId)}
                  className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
                >
                  {copiedGuid ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono text-[11px] text-amber-300 bg-slate-950/70 p-1.5 rounded border border-slate-800 break-all select-all">
                {selectedElement.globalId}
              </p>
            </div>

            {/* Express ID & Elevation */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950/40 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Express ID</span>
                <span className="font-mono font-medium text-slate-200">{selectedElement.expressId}</span>
              </div>
              <div className="bg-slate-950/40 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Storey Elevation</span>
                <span className="font-medium text-slate-200">
                  {selectedElement.properties?.Elevation || "N/A"}
                </span>
              </div>
            </div>

            {/* Property Sets (Psets) */}
            {selectedElement.properties && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Property Sets (Psets)
                </span>
                <div className="space-y-1 bg-slate-950/50 p-2.5 rounded border border-slate-800">
                  {Object.entries(selectedElement.properties).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-start gap-2 py-0.5 border-b border-slate-800/40 last:border-b-0 text-[11px]">
                      <span className="text-slate-400 shrink-0">{k}:</span>
                      <span className="font-medium text-slate-200 text-right break-words">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
