import { GeminiWavePreset, OscillatorState } from '../types';

// Helper to get API key from Vite defined environment or process.env
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  }
  return '';
};

// Fallback Mathematical Generator for offline / no-key mode - Supports up to 21 oscillators
const generateFallbackPreset = (prompt: string): GeminiWavePreset => {
  const p = prompt.toLowerCase();
  let baseFreq = 432;
  let title = "Sinergia Armónica Multicapa Cuántica (21 Frecuencias)";
  let explanation = "Matriz holográfica hiper-dimensionada de hasta 21 capas armónicas sincronizadas en volumen, fase angular 3D y distribución espacial.";
  let mathematicalConcept = "Secuencia de octavas en progresión áurea Φ (1.618), armónicos 3-6-9 de Tesla y pulsación Schumann.";

  if (p.includes("sueño") || p.includes("dormir") || p.includes("delta") || p.includes("relax")) {
    baseFreq = 174;
    title = "Sinergia Neuro-Delta y Regeneración Somática Profunda (21 Capas)";
    explanation = "Matriz completa de 21 osciladores que integran Epsilon 0.5Hz, Delta 2Hz, Solfeggio 174Hz, 285Hz y ondas de modulación tisular.";
    mathematicalConcept = "Diferenciales binaurales escalonados f2 - f1 = 0.5Hz a 4Hz en campo 3D.";
  } else if (p.includes("adn") || p.includes("amor") || p.includes("528") || p.includes("curac")) {
    baseFreq = 528;
    title = "Matriz Biogénica Rife & Solfeggio de Reparación de ADN (21 Ondas)";
    explanation = "Complejo de 21 osciladores acoplados para resonancia cromosómica, limpieza del terreno bioeléctrico y coherencia miocárdica.";
    mathematicalConcept = "Armónicos naturales de la nota Mi 528Hz con micro-desfase angular y modulaciones de valles.";
  } else if (p.includes("foco") || p.includes("concentra") || p.includes("gamma") || p.includes("estudio")) {
    baseFreq = 432;
    title = "Sincronización Neuro-Gamma Acelerada y Neuroplasticidad (21 Armónicos)";
    explanation = "Entramado de 21 fuentes sonoras proyectando hiper-coherencia cortical a 40Hz con soporte Alfa 10Hz y base Verdi 432Hz.";
    mathematicalConcept = "Sincronía interhemisférica multinivel con envolvente isocrónica y matriz de pan 3D.";
  } else if (p.includes("chakra") || p.includes("pineal") || p.includes("963") || p.includes("tercer ojo") || p.includes("tesla") || p.includes("3-6-9")) {
    baseFreq = 963;
    title = "Vórtex Dimensional 3-6-9 de Tesla & Geometría Sagrada (21 Capas)";
    explanation = "Orquesta de 21 osciladores distribuidos en los puntos nodales de la matemática de vórtex de Tesla (369Hz, 639Hz, 963Hz).";
    mathematicalConcept = "Suma Teosófica reducida a 3-6-9 con desplazamiento angular de fase en espiral.";
  }

  const colors = [
    '#38bdf8', '#c084fc', '#4ade80', '#fbbf24', '#f472b6', 
    '#60a5fa', '#a78bfa', '#34d399', '#f59e0b', '#ec4899',
    '#22d3ee', '#e879f9', '#10b981', '#facc15', '#f43f5e',
    '#818cf8', '#d8b4fe', '#6ee7b7', '#fde047', '#fb7185', '#2dd4bf'
  ];

  // Determine target count (up to 21 frequencies based on user prompt complexity)
  const targetCount = (p.includes("21") || p.includes("completa") || p.includes("orquesta") || p.includes("max") || p.includes("vórtex") || p.includes("masiva")) ? 21 : 12;

  const oscillators: Partial<OscillatorState>[] = [];

  // Generate up to 21 harmonic layers
  for (let i = 0; i < targetCount; i++) {
    const isBinauralRight = i % 2 === 1;
    const layer = Math.floor(i / 2);
    
    // Harmonic multipliers based on Solfeggio, Phi, Tesla ratios
    let freq = baseFreq;
    if (i === 0) freq = baseFreq;
    else if (i === 1) freq = baseFreq + 7.83; // Schumann
    else if (i === 2) freq = baseFreq * 1.5; // Perfect fifth
    else if (i === 3) freq = baseFreq * 1.618; // Phi ratio
    else if (i === 4) freq = baseFreq / 2; // Sub-octave
    else if (i === 5) freq = 369;
    else if (i === 6) freq = 639;
    else if (i === 7) freq = 963;
    else if (i === 8) freq = 111; // Malta
    else if (i === 9) freq = 174;
    else if (i === 10) freq = 285;
    else if (i === 11) freq = 528;
    else if (i === 12) freq = 741;
    else if (i === 13) freq = 852;
    else if (i === 14) freq = 10000 / 10; // 1000Hz Rife sub
    else if (i === 15) freq = 40; // Gamma
    else if (i === 16) freq = 10; // Alpha
    else if (i === 17) freq = 4.5; // Theta
    else if (i === 18) freq = 2.0; // Delta
    else if (i === 19) freq = 0.5; // Epsilon
    else freq = baseFreq * 2; // Double octave

    const panX = ((i / (targetCount - 1)) * 2 - 1) * 0.9;
    const panY = Math.sin((i / targetCount) * Math.PI * 2) * 0.7;
    const panZ = Math.cos((i / targetCount) * Math.PI * 2) * 0.5;

    oscillators.push({
      name: `Capa ${i + 1}: ${freq.toFixed(1)} Hz (${isBinauralRight ? 'Der/Fase' : 'Izq/Base'})`,
      frequency: parseFloat(freq.toFixed(2)),
      type: i % 4 === 0 ? 'sine' : i % 4 === 1 ? 'triangle' : i % 4 === 2 ? 'sawtooth' : 'sine',
      volume: parseFloat((0.6 - (i * 0.015)).toFixed(2)),
      panX: parseFloat(panX.toFixed(2)),
      panY: parseFloat(panY.toFixed(2)),
      panZ: parseFloat(panZ.toFixed(2)),
      crestValleyRatio: parseFloat((0.8 + (i % 5) * 0.15).toFixed(2)),
      dutyCycle: parseFloat((((i % 3) - 1) * 0.15).toFixed(2)),
      phaseOffset: (i * 17) % 360,
      color: colors[i % colors.length]
    });
  }

  return {
    title,
    explanation,
    mathematicalConcept,
    oscillators
  };
};

export const generateWavePresetWithGemini = async (
  userPrompt: string,
  userApiKey?: string
): Promise<GeminiWavePreset> => {
  const apiKey = userApiKey || getApiKey();

  if (!apiKey) {
    // Return mathematical fallback preset seamlessly
    return generateFallbackPreset(userPrompt);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const systemInstruction = `
Eres un Físico Acústico Quantum y Maestro de Síntesis de Audio.
Debes responder ÚNICAMENTE en formato JSON válido sin markdown adicional ni explicaciones fuera del JSON.

El JSON debe cumplir exactamente la siguiente interfaz:
{
  "title": "string con título poético/científico de la sinergia",
  "explanation": "string con explicación neuroacústica y terapéutica",
  "mathematicalConcept": "string con las ecuaciones o proporciones matemáticas usadas",
  "oscillators": [
    {
      "name": "Nombre descriptivo de la onda",
      "frequency": numero_float_en_Hz,
      "type": "sine" | "square" | "sawtooth" | "triangle",
      "volume": numero_float_entre_0.1_y_0.8,
      "panX": numero_float_entre_-1.0_y_1.0,
      "panY": numero_float_entre_-1.0_y_1.0,
      "panZ": numero_float_entre_-1.0_y_1.0,
      "crestValleyRatio": numero_float_entre_0.5_y_2.0,
      "dutyCycle": numero_float_entre_-0.5_y_0.5,
      "phaseOffset": numero_entero_entre_0_y_360,
      "color": "color_hexadecimal_como_#38bdf8"
    }
  ]
}
Genera la cantidad de osciladores óptima según la complejidad de la solicitud del usuario (pudiendo generar hasta un máximo de 21 osciladores armónicamente conectados en espacio 3D).
`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nSolicitud del usuario: "${userPrompt}"` }]
          }
        ],
        generationConfig: {
          temperature: 0.75,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      console.warn("Gemini API returned error, falling back to math synthesis", response.status);
      return generateFallbackPreset(userPrompt);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return generateFallbackPreset(userPrompt);

    const parsed: GeminiWavePreset = JSON.parse(rawText);
    return parsed;
  } catch (error) {
    console.error("Failed to query Gemini API:", error);
    return generateFallbackPreset(userPrompt);
  }
};
