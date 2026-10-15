"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Building2,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Minus,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Wind,
  Layers,
  CheckCircle2,
} from "lucide-react"

// Room definition from real NBU Office BIM model (IfcSpace)
export interface OfficeRoom {
  id: string
  number: string
  name: string
  floor: "Level 1" | "Level 2"
  area: number // m² in real BIM geometry
  capacity: number // calculated: Math.floor(area / 10) per 10m²/person standard
  x: number // layout percentage X (0-100)
  y: number // layout percentage Y (0-100)
  w: number // layout percentage width (0-100)
  h: number // layout percentage height (0-100)
  type: "office" | "conference" | "breakroom" | "corridor" | "technical"
}

interface Person {
  id: number
  x: number
  y: number
  targetX: number
  targetY: number
  roomId: string
  floor: "Level 1" | "Level 2"
  speed: number
}

// Authentic office rooms derived from NBU Office Building IfcSpace metadata
const OFFICE_ROOMS: Record<"Level 1" | "Level 2", OfficeRoom[]> = {
  "Level 1": [
    {
      id: "rm-113",
      number: "113",
      name: "Open Office North",
      floor: "Level 1",
      area: 120,
      capacity: 12,
      x: 4,
      y: 6,
      w: 44,
      h: 27,
      type: "office",
    },
    {
      id: "rm-110",
      number: "110",
      name: "Cmd Conference Rm",
      floor: "Level 1",
      area: 60,
      capacity: 6,
      x: 51,
      y: 6,
      w: 22,
      h: 27,
      type: "conference",
    },
    {
      id: "rm-150",
      number: "150",
      name: "Conference Rm B",
      floor: "Level 1",
      area: 40,
      capacity: 4,
      x: 75,
      y: 6,
      w: 21,
      h: 27,
      type: "conference",
    },
    {
      id: "rm-121",
      number: "121",
      name: "Central Circulation Corridor",
      floor: "Level 1",
      area: 160,
      capacity: 16,
      x: 4,
      y: 36,
      w: 92,
      h: 14,
      type: "corridor",
    },
    {
      id: "rm-140",
      number: "140",
      name: "Open Office South",
      floor: "Level 1",
      area: 140,
      capacity: 14,
      x: 4,
      y: 53,
      w: 44,
      h: 41,
      type: "office",
    },
    {
      id: "rm-143",
      number: "143",
      name: "SCIF Open Office",
      floor: "Level 1",
      area: 90,
      capacity: 9,
      x: 51,
      y: 53,
      w: 22,
      h: 25,
      type: "office",
    },
    {
      id: "rm-125",
      number: "125",
      name: "Break Rm & Kitchenette",
      floor: "Level 1",
      area: 50,
      capacity: 5,
      x: 51,
      y: 80,
      w: 22,
      h: 14,
      type: "breakroom",
    },
    {
      id: "rm-158",
      number: "158",
      name: "NOC (Network Ops)",
      floor: "Level 1",
      area: 50,
      capacity: 5,
      x: 75,
      y: 53,
      w: 21,
      h: 19,
      type: "technical",
    },
    {
      id: "rm-118",
      number: "118",
      name: "Mech Rm (AHU/Pumps)",
      floor: "Level 1",
      area: 70,
      capacity: 7,
      x: 75,
      y: 74,
      w: 21,
      h: 20,
      type: "technical",
    },
  ],
  "Level 2": [
    {
      id: "rm-203",
      number: "203",
      name: "Open Office East",
      floor: "Level 2",
      area: 130,
      capacity: 13,
      x: 4,
      y: 6,
      w: 44,
      h: 27,
      type: "office",
    },
    {
      id: "rm-208",
      number: "208",
      name: "Executive Conf Rm",
      floor: "Level 2",
      area: 50,
      capacity: 5,
      x: 51,
      y: 6,
      w: 22,
      h: 27,
      type: "conference",
    },
    {
      id: "rm-205",
      number: "205",
      name: "Secure Document Vault",
      floor: "Level 2",
      area: 30,
      capacity: 3,
      x: 75,
      y: 6,
      w: 21,
      h: 27,
      type: "technical",
    },
    {
      id: "rm-201",
      number: "201",
      name: "Level 2 Corridor",
      floor: "Level 2",
      area: 140,
      capacity: 14,
      x: 4,
      y: 36,
      w: 92,
      h: 14,
      type: "corridor",
    },
    {
      id: "rm-221",
      number: "221",
      name: "Open Office West",
      floor: "Level 2",
      area: 120,
      capacity: 12,
      x: 4,
      y: 53,
      w: 44,
      h: 41,
      type: "office",
    },
    {
      id: "rm-229",
      number: "229",
      name: "Open Office Central",
      floor: "Level 2",
      area: 110,
      capacity: 11,
      x: 51,
      y: 53,
      w: 22,
      h: 25,
      type: "office",
    },
    {
      id: "rm-231",
      number: "231",
      name: "Break Rm & Lounge",
      floor: "Level 2",
      area: 60,
      capacity: 6,
      x: 51,
      y: 80,
      w: 22,
      h: 14,
      type: "breakroom",
    },
    {
      id: "rm-237",
      number: "237",
      name: "Open Office North",
      floor: "Level 2",
      area: 100,
      capacity: 10,
      x: 75,
      y: 53,
      w: 21,
      h: 23,
      type: "office",
    },
    {
      id: "rm-219",
      number: "219",
      name: "Mech Penthouse Access",
      floor: "Level 2",
      area: 40,
      capacity: 4,
      x: 75,
      y: 78,
      w: 21,
      h: 16,
      type: "technical",
    },
  ],
}

interface CrowdDensityHeatmapProps {
  className?: string
}

export function CrowdDensityHeatmap({ className = "" }: CrowdDensityHeatmapProps) {
  const [selectedFloor, setSelectedFloor] = useState<"Level 1" | "Level 2">("Level 1")
  const [people, setPeople] = useState<Person[]>([])
  const [liveMode, setLiveMode] = useState(false)
  const [liveSpeed, setLiveSpeed] = useState<number>(1)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  const floorPlanRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nextPersonIdRef = useRef(1)

  const activeRooms = useMemo(() => OFFICE_ROOMS[selectedFloor], [selectedFloor])

  // Helper to generate a random coordinate inside a specific room
  const getRandomPointInRoom = useCallback((room: OfficeRoom) => {
    const padX = room.w * 0.12
    const padY = room.h * 0.12
    const x = room.x + padX + Math.random() * (room.w - padX * 2)
    const y = room.y + padY + Math.random() * (room.h - padY * 2)
    return { x, y }
  }, [])

  // Initialize realistic office occupancy on mount
  useEffect(() => {
    const initialPeople: Person[] = []
    ;(["Level 1", "Level 2"] as const).forEach((floor) => {
      OFFICE_ROOMS[floor].forEach((room) => {
        // Distribute realistic normal-hour occupancy (~50-60% of capacity)
        const count = Math.min(room.capacity, Math.round(room.capacity * (0.35 + Math.random() * 0.35)))
        for (let i = 0; i < count; i++) {
          const pt = getRandomPointInRoom(room)
          initialPeople.push({
            id: nextPersonIdRef.current++,
            x: pt.x,
            y: pt.y,
            targetX: pt.x,
            targetY: pt.y,
            roomId: room.id,
            floor,
            speed: 0.15 + Math.random() * 0.15,
          })
        }
      })
    })
    setPeople(initialPeople)
  }, [getRandomPointInRoom])

  // Resize canvas to match floor plan container
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current && floorPlanRef.current) {
        canvasRef.current.width = floorPlanRef.current.offsetWidth
        canvasRef.current.height = floorPlanRef.current.offsetHeight
      }
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  // Calculate live occupancy counts and status per room for current floor
  const roomOccupancyStats = useMemo(() => {
    const stats: Record<
      string,
      {
        count: number
        capacity: number
        ratio: number
        status: "normal" | "warning" | "overcrowded"
      }
    > = {}

    activeRooms.forEach((room) => {
      const count = people.filter((p) => p.floor === selectedFloor && p.roomId === room.id).length
      const ratio = room.capacity > 0 ? count / room.capacity : 0

      let status: "normal" | "warning" | "overcrowded" = "normal"
      if (ratio >= 1.0) {
        status = "overcrowded" // Red: 100%+
      } else if (ratio >= 0.7) {
        status = "warning" // Amber: 70% to 99%
      } else {
        status = "normal" // Green: < 70%
      }

      stats[room.id] = { count, capacity: room.capacity, ratio, status }
    })

    return stats
  }, [activeRooms, people, selectedFloor])

  // Total floor metrics
  const totalFloorOccupancy = useMemo(() => {
    return people.filter((p) => p.floor === selectedFloor).length
  }, [people, selectedFloor])

  const totalFloorCapacity = useMemo(() => {
    return activeRooms.reduce((sum, r) => sum + r.capacity, 0)
  }, [activeRooms])

  const overcrowdedRoomCount = useMemo(() => {
    return Object.values(roomOccupancyStats).filter((s) => s.status === "overcrowded").length
  }, [roomOccupancyStats])

  const warningRoomCount = useMemo(() => {
    return Object.values(roomOccupancyStats).filter((s) => s.status === "warning").length
  }, [roomOccupancyStats])

  // Draw density heatmap on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const floorPeople = people.filter((p) => p.floor === selectedFloor)
    if (floorPeople.length === 0) return

    floorPeople.forEach((person) => {
      const cx = (person.x / 100) * canvas.width
      const cy = (person.y / 100) * canvas.height
      const radius = 45

      const roomStat = roomOccupancyStats[person.roomId]
      const isOver = roomStat?.status === "overcrowded"
      const isWarn = roomStat?.status === "warning"

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      if (isOver) {
        grad.addColorStop(0, "rgba(239, 68, 68, 0.45)") // Red
        grad.addColorStop(1, "rgba(239, 68, 68, 0.0)")
      } else if (isWarn) {
        grad.addColorStop(0, "rgba(245, 158, 11, 0.35)") // Amber
        grad.addColorStop(1, "rgba(245, 158, 11, 0.0)")
      } else {
        grad.addColorStop(0, "rgba(16, 185, 129, 0.25)") // Emerald
        grad.addColorStop(1, "rgba(16, 185, 129, 0.0)")
      }

      ctx.globalCompositeOperation = "screen"
      ctx.fillStyle = grad
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
    })
    ctx.globalCompositeOperation = "source-over"
  }, [people, selectedFloor, roomOccupancyStats])

  // Autonomous pedestrian movement simulation in live mode
  useEffect(() => {
    if (!liveMode) return

    const interval = setInterval(() => {
      setPeople((prev) =>
        prev.map((person) => {
          if (person.floor !== selectedFloor) return person

          const currentRoom = activeRooms.find((r) => r.id === person.roomId)
          if (!currentRoom) return person

          // Occasionally pick a new target position in current room or move to adjacent room
          let targetX = person.targetX
          let targetY = person.targetY
          let roomId = person.roomId

          if (Math.random() < 0.08) {
            // 85% stay in room, 15% move to corridor/adjacent
            if (Math.random() < 0.15 && currentRoom.type !== "corridor") {
              const corridor = activeRooms.find((r) => r.type === "corridor") || currentRoom
              roomId = corridor.id
              const pt = getRandomPointInRoom(corridor)
              targetX = pt.x
              targetY = pt.y
            } else {
              const pt = getRandomPointInRoom(currentRoom)
              targetX = pt.x
              targetY = pt.y
            }
          }

          const dx = targetX - person.x
          const dy = targetY - person.y
          const dist = Math.hypot(dx, dy)

          let newX = person.x
          let newY = person.y

          if (dist > 0.4) {
            const step = (person.speed * 0.45 * liveSpeed) / Math.max(dist, 1)
            newX = person.x + dx * step
            newY = person.y + dy * step
          }

          return {
            ...person,
            x: newX,
            y: newY,
            targetX,
            targetY,
            roomId,
          }
        })
      )
    }, 60)

    return () => clearInterval(interval)
  }, [liveMode, liveSpeed, selectedFloor, activeRooms, getRandomPointInRoom])

  // Click on floor plan to add person into specific clicked room
  const handleFloorPlanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!floorPlanRef.current) return
    const rect = floorPlanRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Find clicked room
    const clickedRoom = activeRooms.find(
      (r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
    )

    if (clickedRoom) {
      addPersonToRoom(clickedRoom.id)
    }
  }

  // Add a person directly into a specific room
  const addPersonToRoom = (roomId: string) => {
    const room = activeRooms.find((r) => r.id === roomId)
    if (!room) return

    const pt = getRandomPointInRoom(room)
    const newPerson: Person = {
      id: nextPersonIdRef.current++,
      x: pt.x,
      y: pt.y,
      targetX: pt.x,
      targetY: pt.y,
      roomId: room.id,
      floor: selectedFloor,
      speed: 0.15 + Math.random() * 0.15,
    }

    setPeople((prev) => [...prev, newPerson])
  }

  // Remove a person from a specific room
  const removePersonFromRoom = (roomId: string) => {
    setPeople((prev) => {
      const idx = prev.findIndex((p) => p.floor === selectedFloor && p.roomId === roomId)
      if (idx === -1) return prev
      const updated = [...prev]
      updated.splice(idx, 1)
      return updated
    })
  }

  // Preset Crowd Scenarios
  const setScenario = (scenario: "empty" | "normal" | "busy" | "overcrowded") => {
    const newPeople: Person[] = []
    activeRooms.forEach((room) => {
      let count = 0
      switch (scenario) {
        case "empty":
          count = Math.random() < 0.3 ? 1 : 0
          break
        case "normal":
          count = Math.max(1, Math.round(room.capacity * (0.35 + Math.random() * 0.25)))
          break
        case "busy":
          count = Math.max(2, Math.round(room.capacity * (0.75 + Math.random() * 0.2)))
          break
        case "overcrowded":
          count = Math.max(room.capacity + 1, Math.round(room.capacity * (1.1 + Math.random() * 0.35)))
          break
      }

      for (let i = 0; i < count; i++) {
        const pt = getRandomPointInRoom(room)
        newPeople.push({
          id: nextPersonIdRef.current++,
          x: pt.x,
          y: pt.y,
          targetX: pt.x,
          targetY: pt.y,
          roomId: room.id,
          floor: selectedFloor,
          speed: 0.15 + Math.random() * 0.15,
        })
      }
    })

    setPeople((prev) => [
      ...prev.filter((p) => p.floor !== selectedFloor),
      ...newPeople,
    ])
  }

  // Clear all people from current floor
  const clearCurrentFloor = () => {
    setPeople((prev) => prev.filter((p) => p.floor !== selectedFloor))
  }

  // Calculate HVAC demand dynamic impact (ASHRAE standard ~15-20 CFM per occupant)
  const hvacVentilationDemand = useMemo(() => {
    const baselineKw = 2.4
    const variableKw = (totalFloorOccupancy * 0.08)
    return (baselineKw + variableKw).toFixed(2)
  }, [totalFloorOccupancy])

  const indoorAirQualityPpm = useMemo(() => {
    const baseCo2 = 410
    const ratio = totalFloorCapacity > 0 ? totalFloorOccupancy / totalFloorCapacity : 0
    return Math.round(baseCo2 + ratio * 320)
  }, [totalFloorOccupancy, totalFloorCapacity])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Floor Selector & Standard Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-cyan-400" />
              Office Crowd Density & Room Capacity
            </h2>
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs">
              Task 8 · BIM Space Driven
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Real-time space occupancy computed via BIM model geometry (<span className="text-cyan-300 font-mono">10 m²</span> per person capacity formula).
            Rooms are dynamically color-coded: <span className="text-emerald-400 font-medium">Green (&lt;70%)</span>, <span className="text-amber-400 font-medium">Amber (70-99%)</span>, <span className="text-red-400 font-medium">Red (≥100% Overcrowded)</span>.
          </p>
        </div>

        {/* Storey / Floor Selector */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg shrink-0">
          <span className="text-xs text-slate-400 flex items-center gap-1 pl-1">
            <Building2 className="w-3.5 h-3.5 text-amber-400" /> Floor:
          </span>
          <button
            onClick={() => setSelectedFloor("Level 1")}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              selectedFloor === "Level 1"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Level 1 (Operations)
          </button>
          <button
            onClick={() => setSelectedFloor("Level 2")}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              selectedFloor === "Level 2"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Level 2 (Executive)
          </button>
        </div>
      </div>

      {/* Top Telemetry KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">Total {selectedFloor} Occupants</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-white">{totalFloorOccupancy}</span>
                  <span className="text-xs text-slate-500 font-mono">/ {totalFloorCapacity} cap</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  totalFloorOccupancy / totalFloorCapacity >= 1.0
                    ? "bg-red-500"
                    : totalFloorOccupancy / totalFloorCapacity >= 0.7
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, (totalFloorOccupancy / totalFloorCapacity) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">Overcrowded Rooms</p>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-bold ${overcrowdedRoomCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {overcrowdedRoomCount}
                  </span>
                  <span className="text-xs text-slate-500">of {activeRooms.length} rooms</span>
                </div>
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  overcrowdedRoomCount > 0
                    ? "bg-red-500/10 border border-red-500/30 text-red-400"
                    : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                }`}
              >
                {overcrowdedRoomCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              {warningRoomCount} approaching limit (70-99%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">HVAC Vent Demand</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-white">{hvacVentilationDemand}</span>
                  <span className="text-xs text-slate-500">kW</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Wind className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              Modulating VAV dampers to airflow demand
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">Predicted Indoor CO₂</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-white">{indoorAirQualityPpm}</span>
                  <span className="text-xs text-slate-500">ppm</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              {indoorAirQualityPpm < 600 ? "Optimal Fresh Air (ASHRAE 62.1)" : "Elevated Occupancy Load"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Floor Plan & Simulation Control Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive 2D Office Floor Plan (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <span>{selectedFloor} Architectural Floor Plan</span>
                    <Badge variant="outline" className="text-[11px] font-mono border-slate-700 text-slate-400">
                      Click room to add person
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Rooms colored by occupancy capacity (Area ÷ 10 m²)
                  </CardDescription>
                </div>

                {/* Density Color Legend */}
                <div className="flex items-center gap-3 text-xs bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-md">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-300 text-[11px]">&lt;70% Normal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-slate-300 text-[11px]">70-99% Warning</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-slate-300 text-[11px]">≥100% Full</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-center">
              {/* 2D Architectural Floor Plan Graphic */}
              <div
                ref={floorPlanRef}
                onClick={handleFloorPlanClick}
                className="relative w-full aspect-[16/10] bg-slate-950 rounded-lg border-2 border-slate-800 overflow-hidden shadow-2xl cursor-crosshair select-none"
              >
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px]" />

                {/* Heatmap density canvas layer */}
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                {/* Architectural Office Rooms (Color Coded Green / Amber / Red) */}
                {activeRooms.map((room) => {
                  const stat = roomOccupancyStats[room.id] || { count: 0, capacity: room.capacity, ratio: 0, status: "normal" }
                  const isSelected = selectedRoomId === room.id

                  let statusClasses = "border-emerald-500/40 bg-emerald-950/15 text-emerald-300 hover:border-emerald-400"
                  let pillClasses = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"

                  if (stat.status === "overcrowded") {
                    statusClasses = "border-red-500/80 bg-red-950/30 text-red-200 ring-2 ring-red-500/40 animate-pulse"
                    pillClasses = "bg-red-500/30 text-red-300 border-red-500/60 font-bold"
                  } else if (stat.status === "warning") {
                    statusClasses = "border-amber-500/60 bg-amber-950/25 text-amber-200 hover:border-amber-400"
                    pillClasses = "bg-amber-500/25 text-amber-300 border-amber-500/50"
                  }

                  return (
                    <div
                      key={room.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedRoomId(room.id)
                        addPersonToRoom(room.id)
                      }}
                      style={{
                        left: `${room.x}%`,
                        top: `${room.y}%`,
                        width: `${room.w}%`,
                        height: `${room.h}%`,
                      }}
                      title={`${room.name} (${room.number}): ${stat.count}/${stat.capacity} people (${Math.round(stat.ratio * 100)}%). Click to add person.`}
                      className={`absolute rounded-md border p-2 flex flex-col justify-between transition-all duration-300 cursor-pointer ${statusClasses} ${
                        isSelected ? "ring-2 ring-cyan-400" : ""
                      }`}
                    >
                      {/* Room Header Info */}
                      <div className="flex items-start justify-between gap-1 overflow-hidden">
                        <div className="truncate">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-slate-900/80 border border-slate-700/60 text-slate-300 font-semibold">
                              {room.number}
                            </span>
                            <span className="text-[11px] font-semibold truncate leading-tight">
                              {room.name}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {room.area} m² · cap {room.capacity}
                          </span>
                        </div>

                        {/* Live Occupancy Pill */}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 font-mono ${pillClasses}`}>
                          {stat.count}/{stat.capacity}
                        </span>
                      </div>

                      {/* Percentage progress indicator bar */}
                      <div className="w-full h-1 bg-slate-900/80 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full transition-all duration-300 ${
                            stat.status === "overcrowded"
                              ? "bg-red-500"
                              : stat.status === "warning"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, stat.ratio * 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}

                {/* Animated Person Dots */}
                {people
                  .filter((p) => p.floor === selectedFloor)
                  .map((person) => (
                    <div
                      key={person.id}
                      style={{
                        left: `${person.x}%`,
                        top: `${person.y}%`,
                      }}
                      className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 border border-slate-950 shadow-md pointer-events-none transition-all duration-75"
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Simulation Controls & Scenarios (1 col) */}
        <div className="space-y-4">
          <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <span>⚙️</span>
                <span>Crowd Scenarios</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Test color-coded capacity thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setScenario("empty")}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white"
                >
                  🏢 Empty (5)
                </Button>
                <Button
                  onClick={() => setScenario("normal")}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-slate-800/50 border-slate-700 text-emerald-400 hover:text-emerald-300"
                >
                  ✓ Normal (&lt;70%)
                </Button>
                <Button
                  onClick={() => setScenario("busy")}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-slate-800/50 border-slate-700 text-amber-400 hover:text-amber-300"
                >
                  ⚠️ Busy (70-99%)
                </Button>
                <Button
                  onClick={() => setScenario("overcrowded")}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-slate-800/50 border-slate-700 text-red-400 hover:text-red-300"
                >
                  🚨 Full (≥100%)
                </Button>
              </div>

              {/* Live Movement Simulation Toggle */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${liveMode ? "bg-green-500 animate-pulse" : "bg-slate-600"}`} />
                    Autonomous Movement
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setLiveMode(!liveMode)}
                    variant={liveMode ? "destructive" : "default"}
                    className="h-7 text-xs px-2.5"
                  >
                    {liveMode ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                    {liveMode ? "Pause" : "Start Live"}
                  </Button>
                </div>

                {liveMode && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <span className="text-slate-400 text-[11px]">Speed:</span>
                    <div className="flex items-center gap-1">
                      {[0.5, 1, 2].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setLiveSpeed(spd)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            liveSpeed === spd
                              ? "bg-cyan-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Global Add / Clear Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    activeRooms.forEach((r) => addPersonToRoom(r.id))
                  }}
                  className="flex-1 h-8 text-xs border-slate-700 text-slate-300 bg-transparent"
                >
                  <Plus className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                  +1 All Rooms
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearCurrentFloor}
                  className="h-8 text-xs border-slate-700 text-slate-400 hover:text-red-400 bg-transparent"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Clear
                </Button>
              </div>

              {/* Formula & Rule Card */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-slate-300 space-y-1.5">
                <p className="font-semibold text-blue-300 flex items-center gap-1">
                  <span>📐</span> Occupancy Rule & Calculation
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Formula: <span className="text-white font-mono font-medium">Capacity = Area (m²) ÷ 10 m²</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Per ASHRAE Standard 62.1 & OSHA workplace standards, 10 m² per occupant ensures optimal ventilation and IAQ.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Office Room Capacity Roster Table */}
      <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-base">
                {selectedFloor} Room Capacity Roster
              </CardTitle>
              <CardDescription className="text-xs">
                Detailed space metrics from IFC IfcSpace geometry with live capacity adjustment
              </CardDescription>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {activeRooms.length} Spaces Registered
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Room #</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Area (m²)</th>
                  <th className="py-2.5 px-3">Standard Formula</th>
                  <th className="py-2.5 px-3">Live Occupants</th>
                  <th className="py-2.5 px-3">Utilization</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Quick Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {activeRooms.map((room) => {
                  const stat = roomOccupancyStats[room.id] || { count: 0, capacity: room.capacity, ratio: 0, status: "normal" }
                  const pct = Math.round(stat.ratio * 100)

                  let badgeColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  let label = "Normal (<70%)"
                  if (stat.status === "overcrowded") {
                    badgeColor = "bg-red-500/20 text-red-400 border-red-500/40 font-bold"
                    label = "Overcrowded (≥100%)"
                  } else if (stat.status === "warning") {
                    badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    label = "Near Capacity (70-99%)"
                  }

                  return (
                    <tr
                      key={room.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        stat.status === "overcrowded" ? "bg-red-950/10" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-white">{room.number}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-200">{room.name}</td>
                      <td className="py-2.5 px-3 capitalize font-sans text-slate-400">{room.type}</td>
                      <td className="py-2.5 px-3">{room.area} m²</td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans">
                        {room.area} ÷ 10 = <span className="font-mono text-cyan-300 font-bold">{room.capacity} cap</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        {stat.count} / {room.capacity}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                stat.status === "overcrowded"
                                  ? "bg-red-500"
                                  : stat.status === "warning"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="text-[10px]">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <Badge className={`${badgeColor} text-[10px] px-1.5 py-0`}>
                          {label}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removePersonFromRoom(room.id)}
                            disabled={stat.count === 0}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addPersonToRoom(room.id)}
                            className="h-6 w-6 p-0 text-cyan-400 hover:text-cyan-300"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
