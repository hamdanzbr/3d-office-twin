import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { IfcImporter } from "@thatopen/fragments"
import WebIFC from "web-ifc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")

const ifcDir = path.join(rootDir, "ifc", "NBU_OfficeBuilding")
const outputDir = path.join(rootDir, "public", "models")

const DISCIPLINES = [
  {
    id: "architecture",
    name: "Architecture",
    file: "NBU_OfficeBuilding_Arch-Optimized.ifc",
    color: "#e2e8f0",
  },
  {
    id: "structural",
    name: "Structural",
    file: "NBU_OfficeBuilding_Eng-CON-Optimized.ifc",
    color: "#94a3b8",
  },
  {
    id: "electrical",
    name: "Electrical",
    file: "NBU_OfficeBuilding_Eng-ELE.ifc",
    color: "#f59e0b",
  },
  {
    id: "hvac",
    name: "HVAC",
    file: "NBU_OfficeBuilding_Eng-HVAC-Optimized.ifc",
    color: "#06b6d4",
  },
]

async function convert() {
  console.log("==========================================")
  console.log("  NBU Office IFC to .frag Converter")
  console.log("==========================================\n")

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const wasmPath = path.resolve(rootDir, "node_modules", "web-ifc") + path.sep

  // Metadata collection for Storeys, Spaces, Equipment, and Spatial Alignment
  const metadata = {
    disciplines: DISCIPLINES.map((d) => ({ id: d.id, name: d.name, color: d.color })),
    center: { x: 3.82, y: 6.05, z: -4.21 },
    offsets: {
      architecture: { x: 0, y: 0, z: 0 },
      structural: { x: 15.088, y: -3.517, z: 3.331 },
      electrical: { x: -14.134, y: -0.946, z: 1.785 },
      hvac: { x: -14.320, y: -0.946, z: 2.087 },
    },
    storeys: [],
    spaces: [],
    assets: [],
    elementsByStorey: {},
  }

  const ifcApi = new WebIFC.IfcAPI()
  await ifcApi.Init()

  // 1. Convert each discipline to .frag and extract metadata
  for (const disc of DISCIPLINES) {
    const inputPath = path.join(ifcDir, disc.file)
    const outputPath = path.join(outputDir, `${disc.id}.frag`)

    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Source file not found: ${inputPath}`)
      continue
    }

    console.log(`📦 [${disc.name}] Converting ${disc.file}...`)
    const ifcBytes = fs.readFileSync(inputPath)
    console.log(`   Source size: ${(ifcBytes.length / (1024 * 1024)).toFixed(2)} MB`)

    // Extract IFC data using WebIFC
    const modelID = ifcApi.OpenModel(ifcBytes)

    // Extract Storeys (primarily from Architecture)
    if (disc.id === "architecture") {
      const storeyIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCBUILDINGSTOREY)
      for (let i = 0; i < storeyIds.size(); i++) {
        const id = storeyIds.get(i)
        const item = ifcApi.GetLine(modelID, id)
        metadata.storeys.push({
          id,
          name: item.Name?.value || `Level ${i + 1}`,
          elevation: typeof item.Elevation?.value === "number" ? item.Elevation.value : 0,
          globalId: item.GlobalId?.value || "",
        })
      }
      metadata.storeys.sort((a, b) => a.elevation - b.elevation)
      console.log(`   Found ${metadata.storeys.length} storeys:`, metadata.storeys.map((s) => s.name).join(", "))

      // Extract Spaces
      const spaceIds = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCSPACE)
      for (let i = 0; i < spaceIds.size(); i++) {
        const id = spaceIds.get(i)
        const item = ifcApi.GetLine(modelID, id)
        const name = item.Name?.value || ""
        const longName = item.LongName?.value || name
        metadata.spaces.push({
          id,
          globalId: item.GlobalId?.value || "",
          name,
          longName,
        })
      }
      console.log(`   Found ${metadata.spaces.length} spaces/rooms.`)
    }

    // Extract equipment / assets from HVAC and Electrical
    if (disc.id === "hvac" || disc.id === "electrical") {
      const typesToScan = [
        { type: WebIFC.IFCFLOWTERMINAL, category: "Flow Terminal" },
        { type: WebIFC.IFCENERGYCONVERSIONDEVICE, category: "Energy Conversion" },
        { type: WebIFC.IFCFLOWCONTROLLER, category: "Flow Controller" },
        { type: WebIFC.IFCFLOWMOVINGDEVICE, category: "Flow Moving Device (Fan/Pump)" },
        { type: WebIFC.IFCELECTRICDISTRIBUTIONPOINT, category: "Electrical Panel" },
        { type: WebIFC.IFCELECTRICAPPLIANCE, category: "Electric Appliance" },
        { type: WebIFC.IFCDISTRIBUTIONCHAMBERELEMENT, category: "Distribution Chamber" },
      ]

      for (const { type, category } of typesToScan) {
        try {
          const ids = ifcApi.GetLineIDsWithType(modelID, type)
          for (let i = 0; i < ids.size(); i++) {
            const id = ids.get(i)
            const item = ifcApi.GetLine(modelID, id)
            if (item && item.GlobalId?.value) {
              metadata.assets.push({
                expressId: id,
                globalId: item.GlobalId.value,
                name: item.Name?.value || `${category} #${id}`,
                category,
                discipline: disc.id,
                description: item.Description?.value || "",
              })
            }
          }
        } catch {
          // ignore unsupported types in schema
        }
      }
    }

    ifcApi.CloseModel(modelID)

    // Convert to That Open .frag format
    const importer = new IfcImporter()
    importer.wasm = { path: wasmPath, absolute: true }
    importer.addAllAttributes()
    importer.addAllRelations()

    const fragBytes = await importer.process({ bytes: ifcBytes, raw: false })
    fs.writeFileSync(outputPath, fragBytes)
    console.log(`   ✅ Converted to ${disc.id}.frag: ${(fragBytes.length / (1024 * 1024)).toFixed(2)} MB\n`)
  }

  // Write metadata JSON
  const metaPath = path.join(outputDir, "building-metadata.json")
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2))
  console.log(`📝 Saved building metadata to ${metaPath}`)
  console.log(`   - Storeys: ${metadata.storeys.length}`)
  console.log(`   - Spaces: ${metadata.spaces.length}`)
  console.log(`   - Equipment Assets: ${metadata.assets.length}`)
  console.log("\n🎉 All 4 models converted successfully!")
}

convert().catch((err) => {
  console.error("❌ Conversion failed:", err)
  process.exit(1)
})
