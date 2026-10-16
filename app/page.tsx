"use client"

import { useState, useEffect, useCallback } from "react"
import {
  LayoutDashboard,
  Zap,
  AlertTriangle,
  TrendingUp,
  Sliders,
  Settings,
  Menu,
  Bell,
  User,
  Download,
  Eye,
  Glasses,
  CheckCircle,
  Ticket,
  Calendar,
  Wrench,
  Cable as Cube,
  MessageCircle,
  X,
  Users,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ChatAssistant from "@/components/chat-assistant"
import Building3D from "@/components/building-3d"
import { CrowdDensityHeatmap } from "@/components/crowd-density-heatmap"

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("digital-twin")
  const [selectedAsset, setSelectedAsset] = useState("fan-rtu-01")
  const [weatherTemp, setWeatherTemp] = useState(22)
  const [occupancy, setOccupancy] = useState(150)
  const [simulationResults, setSimulationResults] = useState<any>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<any>>(new Set())
  const [forecastData, setForecastData] = useState<any>(null)
  const [vrMode, setVrMode] = useState(false)
  const [arMode, setArMode] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setLastUpdated(new Date())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSimulate = () => {
    setSimulationResults({
      predictedTemp: 20 + (weatherTemp - 22) * 0.3,
      predictedHumidity: 50 + (occupancy - 150) * 0.05,
      timeToThreshold: Math.max(2, 8 - Math.abs(weatherTemp - 22) * 0.5),
    })
  }

  const handleRunForecast = () => {
    setForecastData({
      hours: Array.from({ length: 48 }, (_, i) => ({
        hour: `${i}h`,
        temp: 20 + Math.sin(i / 8) * 3 + Math.random() * 2,
        humidity: 50 + Math.cos(i / 10) * 10 + Math.random() * 5,
        energy: 2.4 + Math.sin(i / 12) * 0.8,
      })),
    })
  }

  const handleAcknowledgeAlert = (alertId: any) => {
    setAcknowledgedAlerts(new Set([...acknowledgedAlerts, alertId]))
  }

  const handleExportReport = () => {
    const report = `
PREDICTIVE MAINTENANCE REPORT
Generated: ${new Date().toLocaleString()}

ASSET HEALTH SUMMARY:
${assets.map((a) => `- ${a.name}: ${a.health}% (${a.status})`).join("\n")}

ACTIVE ALERTS:
${alerts.map((a) => `- ${a.asset}: ${a.type} (${a.severity}) - ${a.failureTime}`).join("\n")}

SIMULATION RESULTS:
${simulationResults ? `Temperature: ${simulationResults.predictedTemp.toFixed(1)}°C\nHumidity: ${simulationResults.predictedHumidity.toFixed(1)}%` : "No simulation run yet"}
    `
    const blob = new Blob([report], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `maintenance-report-${new Date().getTime()}.txt`
    a.click()
  }

  const metrics = [
    { label: "Zone Temperature", value: "21.5°C", unit: "±1.0°C Setpoint", status: "healthy", icon: "🌡️" },
    { label: "Relative Humidity", value: "48%", unit: "45-55% RH Target", status: "healthy", icon: "💧" },
    { label: "Indoor CO₂", value: "420 ppm", unit: "ASHRAE Standard", status: "healthy", icon: "💨" },
    { label: "HVAC Demand", value: "2.4 kW", unit: "Normal Load", status: "healthy", icon: "⚡" },
  ]

  const assets = [
    {
      id: "fan-rtu-01",
      globalId: "3yWJkHo5T6DAvPfwqyWFQn",
      expressId: 144082,
      name: "Exhaust Fan RTU-01",
      health: 62,
      status: "Critical",
      maintenance: "2024-08-15",
      nextMaint: "2024-11-15",
      location: "Roof - Mech Penthouse",
      model: "Greenheck Upblast 1905 LPS",
      efficiency: 68,
      discipline: "HVAC",
    },
    {
      id: "ahu-01",
      globalId: "2EamY$Bkb3lP3ELdZgZgWX",
      expressId: 92988,
      name: "AHU-01 (Air Handling Unit)",
      health: 94,
      status: "Healthy",
      maintenance: "2024-10-15",
      nextMaint: "2025-01-15",
      location: "Level 1 - Mech Rm 118",
      model: "Carrier Split System 63.3 kW",
      efficiency: 96,
      discipline: "HVAC",
    },
    {
      id: "chiller-01",
      globalId: "3SoaYTU5f6E8ZMh_oXQ2XU",
      expressId: 104428,
      name: "Chiller-01 (Screw Chiller)",
      health: 89,
      status: "Healthy",
      maintenance: "2024-09-10",
      nextMaint: "2024-12-10",
      location: "Roof Mechanical Deck",
      model: "Trane Air-Cooled 633-703 kW",
      efficiency: 92,
      discipline: "HVAC",
    },
    {
      id: "vav-201",
      globalId: "3HmORFD6X1KPVGYdFqdij4",
      expressId: 9435,
      name: "VAV-201 (Single Duct VAV)",
      health: 76,
      status: "Warning",
      maintenance: "2024-09-22",
      nextMaint: "2024-12-22",
      location: "Level 2 - Open Office 203",
      model: "Price Modulating 400mm",
      efficiency: 83,
      discipline: "HVAC",
    },
    {
      id: "panel-lp1",
      globalId: "3JRYqJ5Lb4Jhlpa5ORbi8f",
      expressId: 104908,
      name: "Panel LP-1 (Lighting & Power)",
      health: 91,
      status: "Healthy",
      maintenance: "2024-10-05",
      nextMaint: "2025-01-05",
      location: "Level 1 - Elec Closet 141",
      model: "Square D 208V MLO 225A",
      efficiency: 98,
      discipline: "Electrical",
    },
    {
      id: "pump-cw1",
      globalId: "0VExBi7QH1SACljE9Qo8hl",
      expressId: 162815,
      name: "Pump P-01 (Chilled Water Inline)",
      health: 82,
      status: "Warning",
      maintenance: "2024-09-01",
      nextMaint: "2024-12-01",
      location: "Level 1 - Mech Rm 118",
      model: "Bell & Gossett 3.9 LPS Circulator",
      efficiency: 85,
      discipline: "HVAC",
    },
  ]

  const alerts = [
    {
      id: 1,
      asset: "Exhaust Fan RTU-01",
      globalId: "3yWJkHo5T6DAvPfwqyWFQn",
      type: "Motor Bearing Vibration Anomaly",
      severity: "Critical",
      failureTime: "2 days",
      confidence: 95,
      action: "Schedule emergency bearing replacement & dynamic balance check",
    },
    {
      id: 2,
      asset: "VAV-201 (Single Duct VAV)",
      globalId: "3HmORFD6X1KPVGYdFqdij4",
      type: "Damper Actuator Hunting / Pressure Drop",
      severity: "Major",
      failureTime: "5 days",
      confidence: 88,
      action: "Calibrate actuator stroke and inspect differential static pressure sensor",
    },
    {
      id: 3,
      asset: "Pump P-01 (Chilled Water Inline)",
      globalId: "0VExBi7QH1SACljE9Qo8hl",
      type: "Mechanical Seal Leakage & Cavitation",
      severity: "Major",
      failureTime: "6 days",
      confidence: 81,
      action: "Inspect mechanical seal integrity and verify suction line pressure",
    },
    {
      id: 4,
      asset: "Chiller-01 (Screw Chiller)",
      globalId: "3SoaYTU5f6E8ZMh_oXQ2XU",
      type: "Condenser Approach Temperature Rise",
      severity: "Minor",
      failureTime: "14 days",
      confidence: 74,
      action: "Clean condenser coils and inspect refrigerant subcooling",
    },
    {
      id: 5,
      asset: "Panel LP-1 (Lighting & Power)",
      globalId: "3JRYqJ5Lb4Jhlpa5ORbi8f",
      type: "Phase B Harmonic Load Imbalance",
      severity: "Minor",
      failureTime: "30 days",
      confidence: 69,
      action: "Redistribute single-phase branch circuit loads across bus phases",
    },
  ]

  const rulData = [
    { day: "Day 1", chiller: 28, ahu: 24, fan: 15, vav: 22 },
    { day: "Day 5", chiller: 26, ahu: 22, fan: 12, vav: 20 },
    { day: "Day 10", chiller: 24, ahu: 20, fan: 10, vav: 18 },
    { day: "Day 15", chiller: 22, ahu: 18, fan: 8, vav: 16 },
    { day: "Day 20", chiller: 20, ahu: 16, fan: 6, vav: 14 },
    { day: "Day 25", chiller: 18, ahu: 14, fan: 4, vav: 12 },
    { day: "Day 30", chiller: 16, ahu: 12, fan: 2, vav: 10 },
  ]

  const maintenanceSchedule = [
    { asset: "Exhaust Fan RTU-01", date: "2024-11-15", type: "Corrective", status: "Critical" },
    { asset: "VAV-201 (Single Duct VAV)", date: "2024-12-22", type: "Corrective", status: "Urgent" },
    { asset: "Pump P-01 (Chilled Water Inline)", date: "2024-12-01", type: "Preventive", status: "Scheduled" },
    { asset: "Chiller-01 (Screw Chiller)", date: "2024-12-10", type: "Preventive", status: "Scheduled" },
    { asset: "Panel LP-1 (Lighting & Power)", date: "2025-01-05", type: "Preventive", status: "Scheduled" },
    { asset: "AHU-01 (Air Handling Unit)", date: "2025-01-15", type: "Preventive", status: "Scheduled" },
  ]

  const analyticsData = [
    { name: "HVAC & Air Distribution", value: 45, fill: "#10b981" },
    { name: "Electrical & Distribution", value: 30, fill: "#3b82f6" },
    { name: "Hydronic & Pumping", value: 15, fill: "#f59e0b" },
    { name: "Plumbing & Other", value: 10, fill: "#8b5cf6" },
  ]

  const getSeverityColor = (severity: any) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "Major":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "Minor":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const getHealthColor = (health: any) => {
    if (health >= 85) return "text-green-400"
    if (health >= 70) return "text-amber-400"
    return "text-red-400"
  }

  const getStatusBg = (status: any) => {
    switch (status) {
      case "Healthy":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Warning":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "Critical":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const handleSelectElementFrom3D = useCallback((elementInfo: any) => {
    if (!elementInfo?.globalId && !elementInfo?.expressId) return
    const matched = assets.find(
      (a: any) => a.globalId === elementInfo.globalId || a.expressId === elementInfo.expressId
    )
    if (matched) {
      setSelectedEquipment(matched.id)
      setSelectedAsset(matched.id)
    }
  }, [assets])

  const handleLocateAssetIn3D = useCallback((assetId: string) => {
    setSelectedEquipment(assetId)
    setSelectedAsset(assetId)
    setActiveTab("digital-twin")
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case "digital-twin":
        return (
          <DigitalTwinView
            assets={assets}
            alerts={alerts}
            selectedEquipment={selectedEquipment}
            setSelectedEquipment={(id: string) => {
              setSelectedEquipment(id)
              setSelectedAsset(id)
            }}
            onSelectElementFrom3D={handleSelectElementFrom3D}
            weatherTemp={weatherTemp}
            setWeatherTemp={setWeatherTemp}
            occupancy={occupancy}
            setOccupancy={setOccupancy}
            simulationResults={simulationResults}
            handleSimulate={handleSimulate}
            getHealthColor={getHealthColor}
            getStatusBg={getStatusBg}
            getSeverityColor={getSeverityColor}
            acknowledgedAlerts={acknowledgedAlerts}
            handleAcknowledgeAlert={handleAcknowledgeAlert}
          />
        )
      case "dashboard":
        return (
          <DashboardView
            metrics={metrics}
            assets={assets}
            alerts={alerts}
            rulData={rulData}
            selectedAsset={selectedAsset}
            setSelectedAsset={(id: string) => {
              setSelectedAsset(id)
              setSelectedEquipment(id)
            }}
            onLocateIn3D={handleLocateAssetIn3D}
            weatherTemp={weatherTemp}
            setWeatherTemp={setWeatherTemp}
            occupancy={occupancy}
            setOccupancy={setOccupancy}
            simulationResults={simulationResults}
            handleSimulate={handleSimulate}
            getSeverityColor={getSeverityColor}
            getHealthColor={getHealthColor}
            getStatusBg={getStatusBg}
            acknowledgedAlerts={acknowledgedAlerts}
            handleAcknowledgeAlert={handleAcknowledgeAlert}
          />
        )
      case "assets":
        return (
          <AssetsView
            assets={assets}
            selectedEquipment={selectedEquipment}
            onLocateIn3D={handleLocateAssetIn3D}
            getHealthColor={getHealthColor}
            getStatusBg={getStatusBg}
          />
        )
      case "alerts":
        return (
          <AlertsView
            alerts={alerts}
            assets={assets}
            onLocateIn3D={handleLocateAssetIn3D}
            getSeverityColor={getSeverityColor}
            acknowledgedAlerts={acknowledgedAlerts}
            handleAcknowledgeAlert={handleAcknowledgeAlert}
          />
        )
      case "analytics":
        return (
          <AnalyticsView rulData={rulData} analyticsData={analyticsData} maintenanceSchedule={maintenanceSchedule} />
        )
      case "simulation":
        return (
          <SimulationView
            weatherTemp={weatherTemp}
            setWeatherTemp={setWeatherTemp}
            occupancy={occupancy}
            setOccupancy={setOccupancy}
            simulationResults={simulationResults}
            handleSimulate={handleSimulate}
            forecastData={forecastData}
          />
        )
      case "crowd-density":
        return <CrowdDensityHeatmap />
      case "settings":
        return <SettingsView />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
              <Menu className="w-6 h-6 text-slate-300" />
            </button>
            <div className="flex items-center gap-3">
              {/* Animated 3D Wireframe Sphere */}
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 animate-spin-slow">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Outer circles */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#gradient1)" strokeWidth="1" opacity="0.6" />
                    <circle cx="50" cy="50" r="35" fill="none" stroke="url(#gradient1)" strokeWidth="1" opacity="0.4" />
                    <circle cx="50" cy="50" r="25" fill="none" stroke="url(#gradient1)" strokeWidth="1" opacity="0.3" />

                    {/* Horizontal lines */}
                    <ellipse cx="50" cy="50" rx="45" ry="15" fill="none" stroke="url(#gradient2)" strokeWidth="1" opacity="0.5" />
                    <ellipse cx="50" cy="50" rx="45" ry="30" fill="none" stroke="url(#gradient2)" strokeWidth="1" opacity="0.4" />

                    {/* Vertical lines */}
                    <ellipse cx="50" cy="50" rx="15" ry="45" fill="none" stroke="url(#gradient3)" strokeWidth="1" opacity="0.5" />
                    <ellipse cx="50" cy="50" rx="30" ry="45" fill="none" stroke="url(#gradient3)" strokeWidth="1" opacity="0.4" />

                    {/* Center glow */}
                    <circle cx="50" cy="50" r="8" fill="url(#gradient4)" opacity="0.8" />

                    {/* Gradients */}
                    <defs>
                      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                      <linearGradient id="gradient3" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                      <radialGradient id="gradient4">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>

                {/* Pulsing inner glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse shadow-lg shadow-blue-500/50"></div>
                </div>
              </div>

              <h1 className="text-xl font-bold text-white">
                <span className="hidden sm:inline">NBU Office </span>Digital Twin
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span suppressHydrationWarning>
                Last updated: {mounted ? lastUpdated.toLocaleTimeString() : "--:--:--"}
              </span>
            </div>
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-300" />
            </button>
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <User className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? "w-64" : "w-0"} hidden lg:block border-r border-slate-800/50 bg-slate-950/50 backdrop-blur-xl transition-all duration-300 overflow-hidden`}
        >
          <nav className="p-6 space-y-2">
            <NavItem
              icon={<Cube className="w-5 h-5" />}
              label="Digital Twin"
              active={activeTab === "digital-twin"}
              onClick={() => setActiveTab("digital-twin")}
            />
            <NavItem
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Dashboard"
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            />
            <NavItem
              icon={<Zap className="w-5 h-5" />}
              label="Assets"
              active={activeTab === "assets"}
              onClick={() => setActiveTab("assets")}
            />
            <NavItem
              icon={<AlertTriangle className="w-5 h-5" />}
              label="Alerts"
              active={activeTab === "alerts"}
              onClick={() => setActiveTab("alerts")}
            />
            <NavItem
              icon={<TrendingUp className="w-5 h-5" />}
              label="Analytics"
              active={activeTab === "analytics"}
              onClick={() => setActiveTab("analytics")}
            />
            <NavItem
              icon={<Sliders className="w-5 h-5" />}
              label="Simulation"
              active={activeTab === "simulation"}
              onClick={() => setActiveTab("simulation")}
            />
            <NavItem
              icon={<Users className="w-5 h-5" />}
              label="Crowd Density"
              active={activeTab === "crowd-density"}
              onClick={() => setActiveTab("crowd-density")}
            />
            <NavItem
              icon={<Settings className="w-5 h-5" />}
              label="Settings"
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
            />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-24 lg:pb-6 space-y-6 overflow-auto">
          {renderContent()}

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={handleRunForecast}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Run 48-Hour Forecast
            </Button>
            <Button
              onClick={() => setVrMode(!vrMode)}
              variant="outline"
              className={`border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent ${vrMode ? "bg-blue-600/20 border-blue-500/30" : ""}`}
            >
              <Glasses className="w-4 h-4 mr-2" />
              VR Training Mode {vrMode ? "(Active)" : ""}
            </Button>
            <Button
              onClick={() => setArMode(!arMode)}
              variant="outline"
              className={`border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent ${arMode ? "bg-blue-600/20 border-blue-500/30" : ""}`}
            >
              <Eye className="w-4 h-4 mr-2" />
              AR Technician View {arMode ? "(Active)" : ""}
            </Button>
            <Button
              onClick={handleExportReport}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* VR/AR Mode Indicators */}
          {(vrMode || arMode) && (
            <Card className="border-slate-800/50 bg-blue-500/10 backdrop-blur-xl">
              <CardContent className="p-4">
                <p className="text-blue-300">
                  {vrMode && "VR Training Mode Active - Immersive technician training environment enabled"}
                  {arMode && "AR Technician View Active - Real-time equipment overlay and maintenance guidance"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Forecast Results */}
          {forecastData && (
            <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">48-Hour Forecast Results</CardTitle>
                <CardDescription>Predicted environmental conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={forecastData.hours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis stroke="rgba(148, 163, 184, 0.5)" />
                    <YAxis stroke="rgba(148, 163, 184, 0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      name="Temperature"
                    />
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Humidity"
                    />
                    <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} dot={false} name="Energy" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Bottom Tab Navigation - Mobile Only (shown when sidebar hidden on small screens) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50 z-40 safe-area-inset-bottom">
        <div className="grid grid-cols-8 h-16">
          <button
            onClick={() => setActiveTab("digital-twin")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "digital-twin"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <Cube className="w-5 h-5" />
            <span className="text-[10px] font-medium">Twin</span>
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "dashboard"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveTab("assets")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "assets"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <Zap className="w-5 h-5" />
            <span className="text-[10px] font-medium">Assets</span>
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "alerts"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px] font-medium">Alerts</span>
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "analytics"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-medium">Stats</span>
          </button>
          <button
            onClick={() => setActiveTab("simulation")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "simulation"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span className="text-[10px] font-medium">Sim</span>
          </button>
          <button
            onClick={() => setActiveTab("crowd-density")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "crowd-density"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Crowd</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "settings"
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Chat Assistant Button - Adjusted position for mobile bottom nav */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-20 lg:bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-50"
      >
        {chatOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {/* Chat Assistant */}
      {chatOpen && <ChatAssistant onClose={() => setChatOpen(false)} />}
    </div>
  )
}

function DigitalTwinView({
  assets,
  alerts,
  selectedEquipment,
  setSelectedEquipment,
  onSelectElementFrom3D,
  weatherTemp,
  setWeatherTemp,
  occupancy,
  setOccupancy,
  simulationResults,
  handleSimulate,
  getHealthColor,
  getStatusBg,
  getSeverityColor,
  acknowledgedAlerts,
  handleAcknowledgeAlert,
}: any) {
  const selectedAsset = assets.find((a: any) => a.id === selectedEquipment)
  const [liveForeccast, setLiveForecast] = useState<any>(null)

  // Filter unacknowledged critical alerts for real-time 3D warning beacons (Task 7)
  const activeCriticalAlerts = alerts.filter(
    (a: any) => a.severity === "Critical" && !acknowledgedAlerts?.has(a.id)
  )
  const activeCriticalGuids = activeCriticalAlerts.map((a: any) => a.globalId).filter(Boolean)

  // Generate live 48-hour forecast on component mount
  useEffect(() => {
    const generateLiveForecast = () => {
      const forecastData = Array.from({ length: 48 }, (_, i) => ({
        hour: `${i}h`,
        temp: 21 + Math.sin(i / 8) * 2 + Math.random() * 0.5,
        humidity: 50 + Math.cos(i / 10) * 8 + Math.random() * 3,
        energy: 2.4 + Math.sin(i / 12) * 0.6 + Math.random() * 0.2,
        co2: 420 + Math.sin(i / 6) * 50 + Math.random() * 20,
      }))
      setLiveForecast(forecastData)
    }

    generateLiveForecast()
    // Refresh forecast every 30 minutes
    const interval = setInterval(generateLiveForecast, 1800000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Digital Twin - Virtual Building Model</h2>
        <p className="text-slate-400">Real-time monitoring and predictive analytics of your facility</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Building Visualization */}
        <div className="lg:col-span-2">
          <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle className="text-white">3D Building Model</CardTitle>
              <CardDescription>Interactive virtual representation of your facility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Quick Equipment Focus Bar (Task 6: UI -> 3D link) */}
              <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-800/60 overflow-x-auto no-scrollbar gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium shrink-0">
                  <Cube className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Equipment Focus:</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {assets.map((asset: any) => {
                    const isSelected = selectedEquipment === asset.id
                    const hasActiveAlert = alerts.some((al: any) => al.globalId === asset.globalId && !acknowledgedAlerts?.has(al.id))
                    const isCritical = asset.status === "Critical" && hasActiveAlert
                    const isWarning = asset.status === "Warning" && hasActiveAlert
                    return (
                      <button
                        key={asset.id}
                        onClick={() => setSelectedEquipment(asset.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                          isSelected
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-500/20"
                            : "bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/40"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isCritical ? "bg-red-400 animate-pulse" : isWarning ? "bg-amber-400" : "bg-emerald-400"
                          }`}
                        />
                        <span>{asset.name.split(" ")[0]}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({asset.health}%)</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Active Critical Alert Banner (Task 7: Immediate UI notification & one-click 3D locate / acknowledge) */}
              {activeCriticalAlerts.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-xs shadow-lg shadow-red-950/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
                      <span className="font-semibold text-red-300">
                        Active Critical Alert: {activeCriticalAlerts[0].asset}
                      </span>
                      <span className="text-slate-400 text-[11px] sm:text-xs">
                        <span className="hidden sm:inline">— </span>
                        {activeCriticalAlerts[0].type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t border-red-500/20 sm:border-t-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const assetObj = assets.find((a: any) => a.globalId === activeCriticalAlerts[0].globalId)
                        if (assetObj) setSelectedEquipment(assetObj.id)
                      }}
                      className="h-6 px-2 text-[11px] text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
                    >
                      Locate in 3D
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcknowledgeAlert(activeCriticalAlerts[0].id)}
                      className="h-6 px-2.5 text-[11px] bg-red-600 hover:bg-red-700 text-white font-medium"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Acknowledge
                    </Button>
                  </div>
                </div>
              )}

              <div className="w-full h-[520px] rounded-lg border border-slate-700/30 overflow-hidden">
                <Building3D
                  selectedAssetGuid={selectedAsset?.globalId}
                  onSelectElement={onSelectElementFrom3D}
                  criticalAssetGuids={activeCriticalGuids}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-Time Monitoring */}
        <div className="space-y-4">
          <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white text-sm">Real-Time Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400">Temperature</p>
                <p className="text-xl font-bold text-white">21.5°C</p>
                <div className="w-full h-1 bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-3/4 bg-green-500" />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400">Humidity</p>
                <p className="text-xl font-bold text-white">48%</p>
                <div className="w-full h-1 bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-1/2 bg-blue-500" />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400">Air Pressure</p>
                <p className="text-xl font-bold text-white">1013 mb</p>
                <div className="w-full h-1 bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-2/3 bg-green-500" />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400">Energy Usage</p>
                <p className="text-xl font-bold text-white">2.4 kW</p>
                <div className="w-full h-1 bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-1/3 bg-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live 48-Hour Forecast and System Status - Side by Side */}
      {liveForeccast && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 48-Hour Forecast - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">48-Hour Environmental Forecast</CardTitle>
                    <CardDescription>Predicted environmental conditions and trends</CardDescription>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400">Live Data</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Avg Temp</p>
                    <p className="text-lg font-bold text-white">
                      {(liveForeccast.reduce((acc: number, d: any) => acc + d.temp, 0) / liveForeccast.length).toFixed(1)}°C
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Avg Humidity</p>
                    <p className="text-lg font-bold text-white">
                      {(liveForeccast.reduce((acc: number, d: any) => acc + d.humidity, 0) / liveForeccast.length).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Avg Energy</p>
                    <p className="text-lg font-bold text-white">
                      {(liveForeccast.reduce((acc: number, d: any) => acc + d.energy, 0) / liveForeccast.length).toFixed(2)} kW
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Avg CO₂</p>
                    <p className="text-lg font-bold text-white">
                      {Math.round(liveForeccast.reduce((acc: number, d: any) => acc + d.co2, 0) / liveForeccast.length)} ppm
                    </p>
                  </div>
                </div>

                {/* Forecast Chart */}
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={liveForeccast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis
                      dataKey="hour"
                      stroke="rgba(148, 163, 184, 0.5)"
                      tick={{ fontSize: 11 }}
                      interval={5}
                    />
                    <YAxis stroke="rgba(148, 163, 184, 0.5)" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      name="Temp (°C)"
                    />
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Humidity (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="energy"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      name="Energy (kW)"
                    />
                    <Line
                      type="monotone"
                      dataKey="co2"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      name="CO₂ (ppm)"
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Compact Insights */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-xs font-medium text-blue-300 mb-1">📊 Trend Analysis</p>
                    <p className="text-xs text-slate-300">
                      Conditions stable within optimal ASHRAE thermal comfort & IAQ standards.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-xs font-medium text-green-300 mb-1">✓ System Status</p>
                    <p className="text-xs text-slate-300">
                      HVAC operating normally. Energy within expected parameters.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status - Takes 1 column on right */}
          <div className="lg:col-span-1">
            <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl h-full">
              <CardHeader>
                <CardTitle className="text-white text-sm">System Status</CardTitle>
                <CardDescription className="text-xs">Equipment health overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <span className="text-sm text-slate-300">Air Handling & Chiller</span>
                  <Badge className="bg-green-500/20 text-green-400 text-xs">Optimal</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <span className="text-sm text-slate-300">VAV Terminal Units</span>
                  <Badge className="bg-amber-500/20 text-amber-400 text-xs">Warning</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <span className="text-sm text-slate-300">Power & Lighting Panels</span>
                  <Badge className="bg-green-500/20 text-green-400 text-xs">Optimal</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <span className="text-sm text-slate-300">Rooftop Exhaust RTU</span>
                  <Badge className="bg-red-500/20 text-red-400 text-xs">Critical</Badge>
                </div>

                {/* Additional System Info */}
                <div className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-xs text-slate-400 mb-2">Overall Health</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-[82%] bg-gradient-to-r from-amber-500 to-green-500" />
                    </div>
                    <span className="text-sm font-bold text-white">82%</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-xs font-medium text-blue-300 mb-1">📅 Next Maintenance</p>
                  <p className="text-xs text-slate-300">Exhaust Fan RTU-01 - Immediate bearing service required</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Selected Equipment Details */}
      {selectedAsset && (
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white">{selectedAsset.name}</CardTitle>
                <CardDescription>{selectedAsset.location}</CardDescription>
              </div>
              <Badge className={getStatusBg(selectedAsset.status)}>{selectedAsset.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 mb-1">Health Score</p>
                <p className={`text-2xl font-bold ${getHealthColor(selectedAsset.health)}`}>{selectedAsset.health}%</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 mb-1">Efficiency</p>
                <p className="text-2xl font-bold text-blue-400">{selectedAsset.efficiency}%</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 mb-1">Last Maintenance</p>
                <p className="text-sm font-bold text-white">{selectedAsset.maintenance}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 mb-1">Next Maintenance</p>
                <p className="text-sm font-bold text-white">{selectedAsset.nextMaint}</p>
              </div>
            </div>

            {/* Predictive Alerts for Selected Equipment */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-white mb-3">Predictive Alerts</h4>
              <div className="space-y-2">
                {alerts
                  .filter((a: any) => a.asset === selectedAsset.name)
                  .map((alert: any) => (
                    <div key={alert.id} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{alert.type}</p>
                          <p className="text-xs text-slate-300 mt-1">{alert.action}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                          <p className="text-xs text-slate-300 mt-1">{alert.failureTime}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                {alerts.filter((a: any) => a.asset === selectedAsset.name).length === 0 && (
                  <p className="text-sm text-slate-400">No active alerts for this equipment</p>
                )}
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Wrench className="w-4 h-4 mr-2" />
              Schedule Maintenance
            </Button>
          </CardContent>
        </Card>
      )}

      {/* What-If Scenario Testing */}
      <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">What-If Scenario Testing</CardTitle>
          <CardDescription>Test changes safely before implementing in production</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-300 mb-3 block">Weather Temperature: {weatherTemp}°C</label>
              <input
                type="range"
                min="15"
                max="45"
                value={weatherTemp}
                onChange={(e) => setWeatherTemp(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>15°C</span>
                <span>45°C</span>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-3 block">Occupancy Level: {occupancy} people</label>
              <input
                type="range"
                min="0"
                max="500"
                value={occupancy}
                onChange={(e) => setOccupancy(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>0</span>
                <span>500</span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleSimulate}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Run Simulation
          </Button>
          {simulationResults && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 mb-1">Predicted Temperature</p>
                <p className="text-lg font-bold text-white">{simulationResults.predictedTemp.toFixed(1)}°C</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 mb-1">Predicted Humidity</p>
                <p className="text-lg font-bold text-white">{simulationResults.predictedHumidity.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-slate-400 mb-1">Time to Threshold</p>
                <p className="text-lg font-bold text-amber-400">{simulationResults.timeToThreshold.toFixed(1)}h</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardView({
  metrics,
  assets,
  alerts,
  rulData,
  selectedAsset,
  setSelectedAsset,
  onLocateIn3D,
  weatherTemp,
  setWeatherTemp,
  occupancy,
  setOccupancy,
  simulationResults,
  handleSimulate,
  getSeverityColor,
  getHealthColor,
  getStatusBg,
  acknowledgedAlerts,
  handleAcknowledgeAlert,
}: any) {
  return (
    <>
      {/* Real-Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric: any, idx: number) => (
          <Card
            key={idx}
            className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl hover:bg-slate-900/70 transition-all"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-2">{metric.label}</p>
                  <p className="text-2xl font-bold text-white">{metric.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{metric.unit}</p>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${metric.status === "healthy" ? "bg-green-500/20" : "bg-amber-500/20"}`}
                >
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Asset Health & Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Health Overview */}
        <div className="lg:col-span-1">
          <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle className="text-white">Asset Health</CardTitle>
              <CardDescription>Critical assets overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {assets.map((asset: any) => (
                <div
                  key={asset.id}
                  className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer border border-slate-700/30"
                  onClick={() => setSelectedAsset(asset.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">{asset.name}</p>
                      <Badge className={`mt-1 ${getStatusBg(asset.status)}`}>{asset.status}</Badge>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getHealthColor(asset.health)}`}>{asset.health}%</p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${asset.health >= 85 ? "bg-green-500" : asset.health >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${asset.health}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-2 space-y-1">
                    <p>Last: {asset.maintenance}</p>
                    <p>Next: {asset.nextMaint}</p>
                  </div>
                  {onLocateIn3D && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onLocateIn3D(asset.id)
                      }}
                      className="mt-2 w-full h-7 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30 border border-cyan-800/40"
                    >
                      <Cube className="w-3.5 h-3.5 mr-1" />
                      Locate in 3D Model
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Alert Management */}
        <div className="lg:col-span-2">
          <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl h-full">
            <CardHeader>
              <CardTitle className="text-white">Active Alerts</CardTitle>
              <CardDescription>Priority-sorted by severity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} bg-opacity-10 ${acknowledgedAlerts.has(alert.id) ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-white">{alert.asset}</p>
                      <p className="text-sm text-slate-300">{alert.type}</p>
                    </div>
                    <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <p className="text-slate-400">Failure Time</p>
                      <p className="text-white font-medium">{alert.failureTime}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Confidence</p>
                      <p className="text-white font-medium">{alert.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Action</p>
                      <p className="text-white font-medium">{alert.action}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      variant="outline"
                      className="text-xs h-7 bg-transparent"
                      disabled={acknowledgedAlerts.has(alert.id)}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {acknowledgedAlerts.has(alert.id) ? "Acknowledged" : "Acknowledge"}
                    </Button>
                    {onLocateIn3D && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 text-cyan-400 hover:text-cyan-300 border-cyan-800/40 bg-cyan-950/20"
                        onClick={() => {
                          const matched = assets.find((a: any) => a.globalId === alert.globalId)
                          if (matched) {
                            onLocateIn3D(matched.id)
                          }
                        }}
                      >
                        <Cube className="w-3 h-3 mr-1" />
                        Locate 3D
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-xs h-7 bg-transparent">
                      <Ticket className="w-3 h-3 mr-1" />
                      Create Ticket
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics & Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RUL Chart */}
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Predicted RUL (30 Days)</CardTitle>
            <CardDescription>Remaining useful life for selected assets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={rulData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis stroke="rgba(148, 163, 184, 0.5)" />
                <YAxis stroke="rgba(148, 163, 184, 0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                  }}
                />
                <Line type="monotone" dataKey="hvac" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="airHandler" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="dehumidifier" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="elevator" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Climate Simulation */}
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Climate Simulation</CardTitle>
            <CardDescription>What-if scenario analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Weather Temperature: {weatherTemp}°C</label>
              <input
                type="range"
                min="15"
                max="45"
                value={weatherTemp}
                onChange={(e) => setWeatherTemp(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Occupancy Level: {occupancy} people</label>
              <input
                type="range"
                min="0"
                max="500"
                value={occupancy}
                onChange={(e) => setOccupancy(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleSimulate}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Simulate Impact
            </Button>
            {simulationResults && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 space-y-2">
                <div>
                  <p className="text-xs text-slate-400">Predicted Zone Temp</p>
                  <p className="text-lg font-bold text-white">{simulationResults.predictedTemp.toFixed(1)}°C</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Predicted Humidity</p>
                  <p className="text-lg font-bold text-white">{simulationResults.predictedHumidity.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Time to Threshold</p>
                  <p className="text-lg font-bold text-amber-400">
                    {simulationResults.timeToThreshold.toFixed(1)} hours
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function AssetsView({ assets, selectedEquipment, onLocateIn3D, getHealthColor, getStatusBg }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Asset Management</h2>
        <p className="text-xs text-slate-400">
          Registered BIM MEP equipment with active IoT telemetry & 3D digital twin synchronization
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset: any) => {
          const isSelected = selectedEquipment === asset.id
          return (
            <Card
              key={asset.id}
              className={`border transition-all ${
                isSelected
                  ? "border-cyan-500/60 bg-slate-900/80 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10"
                  : "border-slate-800/50 bg-slate-900/50 hover:bg-slate-900/70"
              } backdrop-blur-xl`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <span>{asset.name}</span>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                          Active
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>{asset.location}</CardDescription>
                  </div>
                  <Badge className={getStatusBg(asset.status)}>{asset.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">Health Score</span>
                    <span className={`text-lg font-bold ${getHealthColor(asset.health)}`}>{asset.health}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${asset.health >= 85 ? "bg-green-500" : asset.health >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${asset.health}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-400">Model</p>
                    <p className="text-white font-medium">{asset.model}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Efficiency</p>
                    <p className="text-white font-medium">{asset.efficiency}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-400">Last Maintenance</p>
                    <p className="text-white font-medium">{asset.maintenance}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Next Maintenance</p>
                    <p className="text-white font-medium">{asset.nextMaint}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  {onLocateIn3D && (
                    <Button
                      onClick={() => onLocateIn3D(asset.id)}
                      className="w-full bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Locate in 3D Model
                    </Button>
                  )}
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Wrench className="w-4 h-4 mr-2" />
                    Schedule Maintenance
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function AlertsView({ alerts, assets, onLocateIn3D, getSeverityColor, acknowledgedAlerts, handleAcknowledgeAlert }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Alert Management</h2>
        <div className="space-y-3">
          {alerts.map((alert: any) => (
            <Card
              key={alert.id}
              className={`border-slate-800/50 bg-slate-900/50 backdrop-blur-xl ${acknowledgedAlerts.has(alert.id) ? "opacity-60" : ""}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white">{alert.asset}</h3>
                      <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      {acknowledgedAlerts.has(alert.id) && (
                        <Badge className="bg-green-500/20 text-green-400">Acknowledged</Badge>
                      )}
                    </div>
                    <p className="text-slate-300 mb-3">{alert.type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Failure Time</p>
                    <p className="text-white font-medium">{alert.failureTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Confidence</p>
                    <p className="text-white font-medium">{alert.confidence}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Recommended Action</p>
                    <p className="text-white font-medium">{alert.action}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    <p
                      className={`font-medium ${acknowledgedAlerts.has(alert.id) ? "text-green-400" : "text-amber-400"}`}
                    >
                      {acknowledgedAlerts.has(alert.id) ? "Acknowledged" : "Active"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    disabled={acknowledgedAlerts.has(alert.id)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {acknowledgedAlerts.has(alert.id) ? "Acknowledged" : "Acknowledge Alert"}
                  </Button>
                  {onLocateIn3D && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const matched = assets?.find((a: any) => a.globalId === alert.globalId)
                        if (matched) {
                          onLocateIn3D(matched.id)
                        }
                      }}
                      className="border-cyan-500/40 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30"
                    >
                      <Cube className="w-4 h-4 mr-2" />
                      Locate in 3D
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
                  >
                    <Ticket className="w-4 h-4 mr-2" />
                    Create Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function AnalyticsView({ rulData, analyticsData, maintenanceSchedule }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Analytics & Insights</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RUL Trends */}
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">RUL Trends (30 Days)</CardTitle>
            <CardDescription>Remaining useful life projections</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rulData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis stroke="rgba(148, 163, 184, 0.5)" />
                <YAxis stroke="rgba(148, 163, 184, 0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                  }}
                />
                <Line type="monotone" dataKey="chiller" stroke="#10b981" strokeWidth={2} name="Chiller-01" />
                <Line type="monotone" dataKey="ahu" stroke="#3b82f6" strokeWidth={2} name="AHU-01" />
                <Line type="monotone" dataKey="fan" stroke="#ef4444" strokeWidth={2} name="Exhaust Fan RTU" />
                <Line type="monotone" dataKey="vav" stroke="#f59e0b" strokeWidth={2} name="VAV Units" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Distribution */}
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Asset Distribution</CardTitle>
            <CardDescription>By system type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Schedule */}
      <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Maintenance Schedule</CardTitle>
          <CardDescription>Upcoming and overdue maintenance tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {maintenanceSchedule.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 flex items-start justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-white">{item.asset}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-400">{item.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    className={
                      item.status === "Critical"
                        ? "bg-red-500/20 text-red-400"
                        : item.status === "Urgent"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-green-500/20 text-green-400"
                    }
                  >
                    {item.status}
                  </Badge>
                  <p className="text-xs text-slate-400 mt-2">{item.type}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SimulationView({
  weatherTemp,
  setWeatherTemp,
  occupancy,
  setOccupancy,
  simulationResults,
  handleSimulate,
  forecastData,
}: any) {
  const [aiSimResults, setAiSimResults] = useState<any>(null)
  const [simLoading, setSimLoading] = useState(false)
  const [simType, setSimType] = useState("environmental")
  const [duration, setDuration] = useState(24)
  const [outdoorHumidity, setOutdoorHumidity] = useState(60)
  const [hvacMode, setHvacMode] = useState("auto")

  const runAISimulation = async () => {
    setSimLoading(true)
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: simType,
          parameters: {
            weatherTemp,
            occupancy,
            duration,
            outdoorHumidity,
            hvacMode,
            currentTemp: 21.5,
            currentHumidity: 48,
          },
        }),
      })

      if (!response.ok) throw new Error("Simulation failed")

      const data = await response.json()
      setAiSimResults(data.results)
    } catch (error) {
      console.error("Simulation error:", error)
    } finally {
      setSimLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">AI-Driven Simulation Engine</h2>
        <p className="text-slate-400 mt-2">
          Advanced predictive modeling for building performance and environmental control
        </p>
      </div>

      {/* Simulation Type Selector */}
      <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Simulation Scenario</CardTitle>
          <CardDescription>Choose the type of analysis to perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setSimType("environmental")}
              className={`p-4 rounded-lg border transition-all ${
                simType === "environmental"
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                  : "bg-slate-800/30 border-slate-700/30 text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              <div className="text-2xl mb-2">🌡️</div>
              <div className="text-sm font-medium">Environmental</div>
            </button>
            <button
              onClick={() => setSimType("equipment-stress")}
              className={`p-4 rounded-lg border transition-all ${
                simType === "equipment-stress"
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                  : "bg-slate-800/30 border-slate-700/30 text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              <div className="text-2xl mb-2">⚙️</div>
              <div className="text-sm font-medium">Equipment</div>
            </button>
            <button
              onClick={() => setSimType("energy-optimization")}
              className={`p-4 rounded-lg border transition-all ${
                simType === "energy-optimization"
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                  : "bg-slate-800/30 border-slate-700/30 text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm font-medium">Energy</div>
            </button>
            <button
              onClick={() => setSimType("emergency")}
              className={`p-4 rounded-lg border transition-all ${
                simType === "emergency"
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                  : "bg-slate-800/30 border-slate-700/30 text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              <div className="text-2xl mb-2">🚨</div>
              <div className="text-sm font-medium">Emergency</div>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Advanced Parameters */}
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Simulation Parameters</CardTitle>
            <CardDescription>Configure environmental and operational conditions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm text-slate-300 mb-3 block flex justify-between">
                <span>Outdoor Temperature</span>
                <span className="text-white font-medium">{weatherTemp}°C</span>
              </label>
              <input
                type="range"
                min="-10"
                max="45"
                value={weatherTemp}
                onChange={(e) => setWeatherTemp(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>-10°C</span>
                <span>45°C</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-3 block flex justify-between">
                <span>Office Occupancy</span>
                <span className="text-white font-medium">{occupancy} people</span>
              </label>
              <input
                type="range"
                min="0"
                max="500"
                value={occupancy}
                onChange={(e) => setOccupancy(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>Empty</span>
                <span>Full (500)</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-3 block flex justify-between">
                <span>Outdoor Humidity</span>
                <span className="text-white font-medium">{outdoorHumidity}%</span>
              </label>
              <input
                type="range"
                min="20"
                max="95"
                value={outdoorHumidity}
                onChange={(e) => setOutdoorHumidity(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>Dry (20%)</span>
                <span>Humid (95%)</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-3 block flex justify-between">
                <span>Simulation Duration</span>
                <span className="text-white font-medium">{duration}h</span>
              </label>
              <input
                type="range"
                min="6"
                max="72"
                step="6"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>6 hours</span>
                <span>72 hours</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-3 block">HVAC Operating Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {["auto", "cooling", "heating"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setHvacMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      hvacMode === mode
                        ? "bg-blue-600/20 border border-blue-500/50 text-blue-300"
                        : "bg-slate-800/30 border border-slate-700/30 text-slate-400 hover:bg-slate-800/50"
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={runAISimulation}
              disabled={simLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
            >
              {simLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running Intelligent Simulation...
                </div>
              ) : (
                "🧠 Run AI Simulation"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI Simulation Results */}
        {aiSimResults && (
          <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Intelligent Analysis Results
                <Badge className="bg-green-500/20 text-green-400">
                  {aiSimResults.confidence}% Confidence
                </Badge>
              </CardTitle>
              <CardDescription>AI-generated predictions and recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-xs text-slate-400 mb-1">Temperature</p>
                  <p className="text-2xl font-bold text-white">{aiSimResults.predictedTemp}°C</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-xs text-slate-400 mb-1">Humidity</p>
                  <p className="text-2xl font-bold text-white">{aiSimResults.predictedHumidity}%</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-xs text-slate-400 mb-1">Energy Usage</p>
                  <p className="text-2xl font-bold text-white">{aiSimResults.predictedEnergy} kW</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-xs text-slate-400 mb-1">Time to Limit</p>
                  <p className="text-2xl font-bold text-amber-400">{aiSimResults.timeToThreshold}h</p>
                </div>
              </div>

              {/* Equipment Stress */}
              {aiSimResults.equipmentStress && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Equipment Stress Levels</p>
                  {Object.entries(aiSimResults.equipmentStress).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                        <span className="text-white font-medium">{value}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            value > 80 ? "bg-red-500" : value > 60 ? "bg-amber-500" : "bg-green-500"
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {aiSimResults.recommendations && aiSimResults.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white">💡 Recommendations</p>
                  {aiSimResults.recommendations.map((rec: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-blue-300"
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {aiSimResults.warnings && aiSimResults.warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white">⚠️ Warnings</p>
                  {aiSimResults.warnings.map((warn: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-300"
                    >
                      {warn}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Chart */}
      {aiSimResults && aiSimResults.chartData && (
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Predicted Trends - {duration} Hour Forecast</CardTitle>
            <CardDescription>Hour-by-hour environmental and energy predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={aiSimResults.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="hour" stroke="rgba(148, 163, 184, 0.5)" />
                <YAxis stroke="rgba(148, 163, 184, 0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                  }}
                />
                <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} name="Temperature (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} name="Humidity (%)" />
                <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} name="Energy (kW)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SettingsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">System Configuration</CardTitle>
            <CardDescription>Manage dashboard settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-sm font-medium text-white mb-2">Alert Thresholds</p>
              <p className="text-xs text-slate-400">Configure when alerts should trigger</p>
              <Button className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Configure Thresholds
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-sm font-medium text-white mb-2">Notification Preferences</p>
              <p className="text-xs text-slate-400">Manage how you receive alerts</p>
              <Button className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Edit Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">User Management</CardTitle>
            <CardDescription>Manage team access and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-sm font-medium text-white mb-2">Team Members</p>
              <p className="text-xs text-slate-400">Add or remove team members</p>
              <Button className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Manage Team
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-sm font-medium text-white mb-2">API Keys</p>
              <p className="text-xs text-slate-400">Generate and manage API keys</p>
              <Button className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Manage API Keys
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">System Information</CardTitle>
          <CardDescription>Dashboard version and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <span className="text-slate-300">Dashboard Version</span>
            <span className="text-white font-medium">v2.1.0</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <span className="text-slate-300">System Status</span>
            <Badge className="bg-green-500/20 text-green-400">Operational</Badge>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <span className="text-slate-300">Last Updated</span>
            <span className="text-white font-medium">{new Date().toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${active ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:bg-slate-800/50"}`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
