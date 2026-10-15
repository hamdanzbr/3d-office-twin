import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { scenario, parameters } = await request.json()

    if (!scenario || !parameters) {
      return Response.json({ error: "Invalid request format" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("[Simulation] OPENAI_API_KEY not configured")
      return Response.json({ error: "Simulation engine not configured" }, { status: 500 })
    }

    // AI-driven simulation system prompt
    const systemPrompt = `You are an advanced Building Simulation Engine for an Office Digital Twin system. Your role is to generate accurate, realistic simulation results based on input parameters.

SIMULATION EXPERTISE:
- Environmental physics and thermodynamics
- Commercial HVAC system behavior and response times
- Energy consumption modeling
- Humidity and temperature correlations
- Occupancy impact on building systems
- Equipment efficiency under various conditions
- Failure prediction and cascade effects

CURRENT BUILDING BASELINE:
- Office Size: 45,000 sq ft across 3 floors
- Construction: Reinforced concrete & curtain wall glazing
- HVAC Capacity: Trane Chiller (633-703 kW), Carrier AHU (63.3 kW)
- Ventilation: Greenheck Rooftop Fans, 21 Modulating VAV terminal units
- Occupancy Capacity: 500 people maximum
- Energy Baseline: 2.4 kW baseline demand at 150 occupancy

EQUIPMENT SPECIFICATIONS:
- AHU-01: Carrier Split System (94% health, 96% efficiency)
- Chiller-01: Trane Air-Cooled (89% health, 92% efficiency)
- Exhaust Fan RTU-01: Greenheck Upblast (62% health, 68% efficiency)
- VAV-201: Price Single Duct (76% health, 83% efficiency)
- Panel LP-1: Square D 208V (91% health, 98% efficiency)
- Pump P-01: Bell & Gossett (82% health, 85% efficiency)
- Current Temperature: 21.5°C
- Current Humidity: 48% RH

SIMULATION RULES:
1. Temperature Impact:
   - Outdoor temp affects indoor temp (0.3°C change per 1°C outdoor change)
   - Each person adds ~100W heat load
   - HVAC response time: 15-30 minutes
   - Equipment efficiency degrades 2% per 10°C extreme temp

2. Humidity Correlation:
   - Each person adds ~50g/hour moisture
   - Outdoor humidity affects indoor (±10% typical)
   - Dehumidifier removes 100 pints/day at full capacity
   - Reduced capacity at 65% health: ~65 pints/day

3. Energy Consumption:
   - Base load: 1.5 kW
   - HVAC: +0.5 kW per 5°C temp difference
   - Lighting: 0.3 kW
   - Per person: +0.005 kW
   - Dehumidifier: +0.8 kW when running

4. Time to Threshold:
   - Normal conditions: 6-8 hours to exceed safe range
   - Extreme conditions: 2-4 hours
   - Emergency conditions: <1 hour

5. Equipment Stress:
   - High occupancy increases wear by 20%
   - Extreme temps reduce equipment life
   - Prolonged operation at >90% capacity critical

OUTPUT FORMAT (JSON only):
{
  "predictedTemp": number (in °C),
  "predictedHumidity": number (in %),
  "predictedEnergy": number (in kW),
  "timeToThreshold": number (in hours),
  "equipmentStress": {
    "hvac": number (0-100%),
    "dehumidifier": number (0-100%),
    "airHandler": number (0-100%)
  },
  "recommendations": string[],
  "warnings": string[],
  "confidence": number (0-100%),
  "chartData": [
    {"hour": "0h", "temp": number, "humidity": number, "energy": number},
    // ... 24 hourly data points
  ]
}

Be realistic, consider physics, and account for equipment health status. Generate scientifically accurate predictions.`

    // Format the simulation request
    const userPrompt = `Generate a simulation for the following scenario:

Scenario Type: ${scenario}

Input Parameters:
${Object.entries(parameters)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}

Provide detailed simulation results in JSON format as specified. Consider the current equipment health status and building conditions.`

    console.log("[Simulation] Running AI simulation:", scenario)

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.3, // Lower temperature for more consistent results
      maxTokens: 2000,
    } as any)

    console.log("[Simulation] AI response received")

    // Parse the JSON response
    let simulationResults
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        simulationResults = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("[Simulation] Failed to parse AI response:", parseError)
      // Fallback to basic simulation
      simulationResults = generateFallbackSimulation(parameters)
    }

    return Response.json({ results: simulationResults })
  } catch (error) {
    console.error("[Simulation] Error:", error instanceof Error ? error.message : String(error))
    const errorMessage = error instanceof Error ? error.message : String(error)
    return Response.json(
      {
        error: "Simulation failed",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

// Fallback simulation if AI fails
function generateFallbackSimulation(parameters: any) {
  const weatherTemp = parameters.weatherTemp || 22
  const occupancy = parameters.occupancy || 150
  const duration = parameters.duration || 24

  const tempDiff = (weatherTemp - 22) * 0.3
  const occupancyEffect = ((occupancy - 150) / 100) * 0.5

  const predictedTemp = 21 + tempDiff + occupancyEffect
  const predictedHumidity = 50 + ((occupancy - 150) / 100) * 5
  const predictedEnergy = 2.4 + Math.abs(tempDiff) * 0.2 + (occupancy / 100) * 0.1

  const chartData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}h`,
    temp: predictedTemp + Math.sin(i / 4) * 1.5,
    humidity: predictedHumidity + Math.cos(i / 6) * 3,
    energy: predictedEnergy + Math.sin(i / 8) * 0.3,
  }))

  return {
    predictedTemp: Number(predictedTemp.toFixed(1)),
    predictedHumidity: Number(predictedHumidity.toFixed(1)),
    predictedEnergy: Number(predictedEnergy.toFixed(2)),
    timeToThreshold: Math.max(2, 8 - Math.abs(weatherTemp - 22) * 0.5),
    equipmentStress: {
      chiller: Math.min(100, 50 + Math.abs(tempDiff) * 10),
      ahu: Math.min(100, 55 + (occupancy / 15)),
      exhaustFan: Math.min(100, 65 + (occupancy / 10)),
    },
    recommendations: [
      predictedTemp > 22 ? "Consider pre-cooling office zones" : "Maintain current HVAC settings",
      occupancy > 300 ? "Monitor CO₂ and increase outdoor air damper ventilation" : "Normal ventilation adequate",
    ],
    warnings: [
      predictedTemp > 23 ? "Zone temperature exceeding ASHRAE comfort limits" : null,
      predictedEnergy > 4 ? "Peak electrical demand threshold exceeded" : null,
    ].filter(Boolean),
    confidence: 85,
    chartData,
  }
}
