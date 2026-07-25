import { FrequencyItem } from '../types';

export const frequencyData: FrequencyItem[] = [
  // --- 1. ESPECTRO SOLFEGGIO COMPLETO & FRECUENCIAS SECRETAS ---
  { 
    id: 'solf_174', hz: "174", numericalHz: 174, 
    name: "Fa3 - El Anestésico Cuántico", category: "solfeggio", 
    description: "Seguridad, arraigo y alivio fisiológico del dolor.", 
    detailedUsage: "Constituye el cimiento del espectro Solfeggio. Actúa sobre el sistema nervioso central inhibiendo señales nociceptivas y estabilizando el campo energético bioeléctrico. Suma Teosófica: 12 → 3.", 
    evidence: "Dr. Joseph Puleo / Dr. Leonard Horowitz" 
  },
  { 
    id: 'solf_285', hz: "285", numericalHz: 285, 
    name: "Do#4 - Restauración Tisular", category: "solfeggio", 
    description: "Regeneración de tejidos y matriz etérica.", 
    detailedUsage: "Envía un patrón armónico para recordar a la matriz celular su estado saludable original. Acelera cicatrización y regeneración de órganos. Suma Teosófica: 15 → 6.", 
    evidence: "Dr. Joseph Puleo" 
  },
  { 
    id: 'solf_396', hz: "396", numericalHz: 396, 
    name: "UT - Liberación (Sol4)", category: "solfeggio", 
    description: "Chakra Raíz: Liberación de culpa y miedo.", 
    detailedUsage: "Desintegra patrones subconscientes de culpa, fobias y traumas pasados. Fortalece los cimientos psíquicos y eleva la resiliencia. Suma Teosófica: 18 → 9.", 
    evidence: "Dr. Joseph Puleo" 
  },
  { 
    id: 'solf_417', hz: "417", numericalHz: 417, 
    name: "RE - Transmutación (Sol#4)", category: "solfeggio", 
    description: "Chakra Sacro: Facilitación del cambio y creatividad.", 
    detailedUsage: "Limpia bloqueos creativos y memorias traumáticas acumuladas en el cuerpo etérico. Proporciona una reserva inagotable de energía renovadora. Suma Teosófica: 12 → 3.", 
    evidence: "Dr. Joseph Puleo" 
  },
  { 
    id: 'solf_528', hz: "528", numericalHz: 528, 
    name: "MI - Frecuencia Milagrosa (Do5)", category: "solfeggio", 
    description: "Plexo Solar/Corazón: Reparación biológica de ADN y Amor Universal.", 
    detailedUsage: "Frecuencia central del espectro Solfeggio. Ligada al color verde clorofila, la luz UV y la restauración cromosómica. Promueve la coherencia cardíaca y la paz cósmica. Suma Teosófica: 15 → 6.", 
    evidence: "Biochemist Dr. Lee Lorenzen / Dr. Horowitz" 
  },
  { 
    id: 'solf_639', hz: "639", numericalHz: 639, 
    name: "FA - Red Integradora (Mi5)", category: "solfeggio", 
    description: "Chakra Corazón: Armonía relacional y unificación.", 
    detailedUsage: "Fomenta la comunicación intercelular y el entendimiento en relaciones interpersonales. Equilibra hemisferios cerebrales y disuelve el aislamiento. Suma Teosófica: 18 → 9.", 
    evidence: "Dr. Joseph Puleo" 
  },
  { 
    id: 'solf_741', hz: "741", numericalHz: 741, 
    name: "SOL - Limpiador del Espectro (Fa#5)", category: "solfeggio", 
    description: "Chakra Garganta: Desintoxicación celular y voz superior.", 
    detailedUsage: "Elimina la radiación electromagnética y la carga toxicológica celular. Clarifica la expresión pura de la verdad interna. Suma Teosófica: 12 → 3.", 
    evidence: "Dr. Joseph Puleo" 
  },
  { 
    id: 'solf_852', hz: "852", numericalHz: 852, 
    name: "LA - Despertar de la Intuición (La5)", category: "solfeggio", 
    description: "Tercer Ojo: Apertura de la percepción espiritual.", 
    detailedUsage: "Restaura el orden espiritual disolviendo el ruido cognitivo. Eleva la percepción extrasensorial y la visión holográfica. Suma Teosófica: 15 → 6.", 
    evidence: "Dr. Joseph Puleo" 
  },
  { 
    id: 'solf_963', hz: "963", numericalHz: 963, 
    name: "SI - Frecuencia de los Dioses (Si5)", category: "solfeggio", 
    description: "Chakra Corona: Conexión con la Conciencia Universal.", 
    detailedUsage: "Activa la glándula pineal. Reconecta el campo energético humano con el entramado del universo. Suma Teosófica: 18 → 9.", 
    evidence: "Dr. Joseph Puleo" 
  },
  { 
    id: 'solf_1074', hz: "1074", numericalHz: 1074, 
    name: "Solfeggio Armónico Superior I", category: "solfeggio", 
    description: "Expansión del aura y campo electromagnético toroidal.", 
    detailedUsage: "Suma Teosófica: 12 → 3. Activa los planos superiores del cuerpo sutil.", 
    evidence: "Investigación Neopitagórica" 
  },
  { 
    id: 'solf_1185', hz: "1185", numericalHz: 1185, 
    name: "Solfeggio Armónico Superior II", category: "solfeggio", 
    description: "Coherencia del cuerpo de luz (Merkaba).", 
    detailedUsage: "Suma Teosófica: 15 → 6. Sincronización del cuerpo de luz con patrones geométricos fractales.", 
    evidence: "Geometría Sagrada" 
  },

  // --- 2. FRECUENCIAS PLANETARIAS (OCTAVA CÓSMICA DE HANS COUSTO) ---
  { 
    id: 'plan_sun', hz: "126.22", numericalHz: 126.22, 
    name: "Sol - Centro Vital (Si1)", category: "planetary", 
    description: "Expansión de la conciencia, vitalidad y voluntad.", 
    detailedUsage: "Frecuencia del período de rotación solar. Calienta el cuerpo sutil, aumenta la autoconfianza y proyecta el poder de la voluntad.", 
    evidence: "Hans Cousto - Die Kosmische Oktave" 
  },
  { 
    id: 'plan_merc', hz: "141.27", numericalHz: 141.27, 
    name: "Mercurio - El Mensajero (Do#3)", category: "planetary", 
    description: "Agilidad intelectual, percepción lógica y lenguaje.", 
    detailedUsage: "Sincronizado con la órbita de Mercurio. Potencia el procesamiento cognitivo, la versatilidad de pensamiento y la elocuencia.", 
    evidence: "Hans Cousto" 
  },
  { 
    id: 'plan_ven', hz: "221.23", numericalHz: 221.23, 
    name: "Venus - Armonía y Estética (La3)", category: "planetary", 
    description: "Amor incondicional, equilibrio y belleza.", 
    detailedUsage: "Frecuencia del año venusiano. Armoniza las emociones, despierta la sensualidad pura y restaura el equilibrio magnético del chakra corazón.", 
    evidence: "Hans Cousto" 
  },
  { 
    id: 'plan_earth_year', hz: "136.10", numericalHz: 136.10, 
    name: "Tierra: Año (OM) (Do#3)", category: "planetary", 
    description: "Equilibrio primordial, meditación y centramiento.", 
    detailedUsage: "Frecuencia del año sidéreo de la Tierra (Tono OM). Estándar internacional para musicoterapia y alineación del alma.", 
    evidence: "Hans Cousto / Tradición Védica" 
  },
  { 
    id: 'plan_schumann', hz: "7.83", numericalHz: 7.83, 
    name: "Resonancia Schumann - Latido de Gaia", category: "planetary", 
    description: "Onda electromagnética fundamental de la biosfera terrestre.", 
    detailedUsage: "Pulsación entre la superficie terrestre y la ionosfera. Induce coherencia bioeléctrica, reducción del estrés y sincronía con la Tierra.", 
    evidence: "W.O. Schumann / NASA" 
  },
  { 
    id: 'plan_moon', hz: "210.42", numericalHz: 210.42, 
    name: "Luna Sinódica (Sol#3)", category: "planetary", 
    description: "Subconsciente, ritmos biológicos y fluido emocional.", 
    detailedUsage: "Basada en el ciclo de fases lunares. Regula los fluidos corporales, la intuición nocturna y el equilibrio del sistema endocrino.", 
    evidence: "Hans Cousto" 
  },
  { 
    id: 'plan_mars', hz: "144.72", numericalHz: 144.72, 
    name: "Marte - El Impulso (Re3)", category: "planetary", 
    description: "Fuerza motriz, decisión y coraje.", 
    detailedUsage: "Frecuencia orbital de Marte. Estimula la energía física, el coraje operacional y la superación del estancamiento.", 
    evidence: "Hans Cousto" 
  },
  { 
    id: 'plan_jupiter', hz: "183.58", numericalHz: 183.58, 
    name: "Júpiter - Expansión (Fa#3)", category: "planetary", 
    description: "Abundancia, sabiduría y expansión de horizontes.", 
    detailedUsage: "Frecuencia del período orbital jupiteriano. Estimula el pensamiento filosófico, la visión estratégica y la apertura mental.", 
    evidence: "Hans Cousto" 
  },
  { 
    id: 'plan_saturn', hz: "147.85", numericalHz: 147.85, 
    name: "Saturno - Eje de Estructura (Re#3)", category: "planetary", 
    description: "Disciplina, cristalización y concentración.", 
    detailedUsage: "Frecuencia de la estructura saturniana. Ayuda a definir límites saludables, consolidar proyectos y disciplinar la mente.", 
    evidence: "Hans Cousto" 
  },
  { 
    id: 'plan_uranus', hz: "207.36", numericalHz: 207.36, 
    name: "Urano - La Revelación (Sol#3)", category: "planetary", 
    description: "Innovación, intuición cuántica y libertad.", 
    detailedUsage: "Asociada a la ruptura de paradigmas obsoletos y destellos de inspiración repentina.", 
    evidence: "Hans Cousto" 
  },
  { 
    id: 'plan_neptune', hz: "211.44", numericalHz: 211.44, 
    name: "Neptuno - El Océano Místico (Sol#3)", category: "planetary", 
    description: "Inspiración artística, misticismo y empatía.", 
    detailedUsage: "Frecuencia orbital de Neptuno. Disuelve barreras del ego y abre el canal de conexión con el inconsciente colectivo.", 
    evidence: "Hans Cousto" 
  },
  { 
    id: 'plan_pluto', hz: "140.25", numericalHz: 140.25, 
    name: "Plutón - La Transmutación (Do#3)", category: "planetary", 
    description: "Transformación profunda y renacimiento.", 
    detailedUsage: "Favorece procesos de catarsis, eliminación de viejos patrones y renovación interior radical.", 
    evidence: "Hans Cousto" 
  },

  // --- 3. NEUROACÚSTICA Y ONDAS CEREBRALES ---
  { 
    id: 'brain_epsilon', hz: "0.5", numericalHz: 0.5, 
    name: "Onda Epsilon (0.5 Hz)", category: "brain", 
    description: "Estados extraordinarios de conciencia y meditación cuántica.", 
    detailedUsage: "Frecuencia cerebral infra-baja asociada a compresión de estados samadhi, insensibilidad al dolor y sanación celular profunda.", 
    evidence: "Dr. Jeffrey Thompson" 
  },
  { 
    id: 'brain_delta_2', hz: "2.0", numericalHz: 2.0, 
    name: "Onda Delta Profunda (2.0 Hz)", category: "brain", 
    description: "Sueño reparador y liberación de Hormona del Crecimiento (HGH).", 
    detailedUsage: "Frecuencia dominante en el sueño no-REM profundo. Estimula la reparación de tejidos y la eliminación de toxinas cerebrales.", 
    evidence: "EEG Neuroscience" 
  },
  { 
    id: 'brain_theta_45', hz: "4.5", numericalHz: 4.5, 
    name: "Onda Theta Chamánica (4.5 Hz)", category: "brain", 
    description: "Trance meditativo, memoria episódica e imaginería visual.", 
    detailedUsage: "Acceso al subconsciente profundo, creatividad analógica y estados de trance profundo.", 
    evidence: "Monroe Institute" 
  },
  { 
    id: 'brain_alpha_10', hz: "10.0", numericalHz: 10.0, 
    name: "Onda Alfa Pura (10.0 Hz)", category: "brain", 
    description: "Puente entre consciente y subconsciente; aprendizaje acelerado.", 
    detailedUsage: "Induce relajación alerta sin somnolencia. Incrementa la producción de serotonina y la capacidad de asimilación de datos.", 
    evidence: "Hans Berger / EEG Standard" 
  },
  { 
    id: 'brain_beta_18', hz: "18.0", numericalHz: 18.0, 
    name: "Onda Beta Alta (18.0 Hz)", category: "brain", 
    description: "Procesamiento analítico denso y lógica cuantitativa.", 
    detailedUsage: "Frecuencia para resolver problemas complejos, concentración ejecutiva y alto rendimiento mental.", 
    evidence: "Cognitive Psychology" 
  },
  { 
    id: 'brain_gamma_40', hz: "40.0", numericalHz: 40.0, 
    name: "Onda Gamma Máxima (40.0 Hz)", category: "brain", 
    description: "Sincronización neuro-cortical global, insight y memoria.", 
    detailedUsage: "Vibración vinculada a momentos de máxima lucidez 'Aha!'. Promueve la limpieza de placas amiloides en terapias neurodegenerativas.", 
    evidence: "MIT Research / Dr. Li-Huei Tsai" 
  },
  { 
    id: 'brain_lambda_200', hz: "200.0", numericalHz: 200.0, 
    name: "Onda Lambda Ultra-Alta (200 Hz)", category: "brain", 
    description: "Procesamiento ultrarrápido de información intuitiva.", 
    detailedUsage: "Frecuencia super-rápida detectada en meditadores avanzados durante la integración holística instantánea.", 
    evidence: "Advanced EEG Studies" 
  },

  // --- 4. RIFE & BIO-RESONANCIA ORGANICA Y PATOGENOS ---
  { 
    id: 'rife_detox', hz: "10000", numericalHz: 10000, 
    name: "Frecuencia Universal de Bio-Desintoxicación", category: "bioresonance", 
    description: "Estimulación del sistema linfático y purificación bioeléctrica.", 
    detailedUsage: "Frecuencia maestra de Royal Raymond Rife utilizada para armonizar el terreno celular antes y después de terapias bioenergéticas.", 
    evidence: "Dr. Royal Raymond Rife" 
  },
  { 
    id: 'rife_727', hz: "727", numericalHz: 727, 
    name: "Regeneración Celular Rife", category: "bioresonance", 
    description: "Inhibición de patógenos y estimulación inmunológica.", 
    detailedUsage: "Una de las frecuencias más versátiles de la tabla de Rife. Ayuda a desactivar cargas infecciosas comunes.", 
    evidence: "Dr. Royal Rife Original Charts" 
  },
  { 
    id: 'rife_880', hz: "880", numericalHz: 880, 
    name: "Resonancia Inmunológica 880 Hz", category: "bioresonance", 
    description: "Refuerzo del sistema inmune y respuesta inflamatoria.", 
    detailedUsage: "Estimula la proliferación de leucocitos y la respuesta de defensa fagocítica.", 
    evidence: "Dr. Rife" 
  },
  { 
    id: 'rife_787', hz: "787", numericalHz: 787, 
    name: "Anti-Inflamatorio Bioeléctrico", category: "bioresonance", 
    description: "Modulación del dolor tisular y reducción de edema.", 
    detailedUsage: "Normaliza la diferencia de potencial transmembrana celular en tejidos sometidos a estrés térmico o mecánico.", 
    evidence: "Bio-Medical Research" 
  },
  { 
    id: 'rife_liver_56', hz: "56", numericalHz: 56, 
    name: "Resonancia Hepática (Hígado)", category: "bioresonance", 
    description: "Bio-desintoxicación hepática y filtración enzimática.", 
    detailedUsage: "Frecuencia del órgano según la escala de bio-resonancia Paul Schmidt / Rife. Favorece la metabolización de grasas.", 
    evidence: "Paul Schmidt Bio-Resonance" 
  },
  { 
    id: 'rife_heart_100', hz: "100", numericalHz: 100, 
    name: "Resonancia Miocárdica (Corazón)", category: "bioresonance", 
    description: "Tonificación muscular cardíaca y circulación sistémica.", 
    detailedUsage: "Ajusta la elasticidad del tejido miocárdico y el ritmo de perfusión coronaria.", 
    evidence: "Nogier / Bio-Resonance" 
  },
  { 
    id: 'rife_kidney_9', hz: "9.2", numericalHz: 9.2, 
    name: "Resonancia Renal (Riñones)", category: "bioresonance", 
    description: "Equilibrio osmótico y purificación hidrostática.", 
    detailedUsage: "Rhythm de pulso bio-eléctrico de las nefronas para optimizar la filtración renal.", 
    evidence: "Paul Schmidt Institute" 
  },
  { 
    id: 'rife_lung_72', hz: "72", numericalHz: 72, 
    name: "Resonancia Alveolar (Pulmones)", category: "bioresonance", 
    description: "Oxigenación celular y capacidad pulmonar vital.", 
    detailedUsage: "Estimula la superficie alveolo-capilar para un intercambio de CO2/O2 eficiente.", 
    evidence: "Bio-Resonance Frequency Tables" 
  },

  // --- 5. ACÚSTICA MEGALÍTICA Y ARQUEOACÚSTICA ---
  { 
    id: 'mega_111', hz: "111", numericalHz: 111, 
    name: "Hipogeo de Malta - Resonancia Cuántica", category: "pyramid", 
    description: "Arqueoacústica del oráculo de Malta y desactivación del cortex frontal.", 
    detailedUsage: "Frecuencia de resonancia exacta hallada en los templos megalíticos subterráneos de Malta. Desconecta temporalmente el lenguaje verbal activando el hemisferio intuitivo.", 
    evidence: "Dr. Paul Devereux / Cambridge University" 
  },
  { 
    id: 'mega_giza', hz: "432", numericalHz: 432, 
    name: "Cámara del Rey - Gran Pirámide de Giza", category: "pyramid", 
    description: "Resonancia del sarcófago de granito y geometría sagrada.", 
    detailedUsage: "Afinación natural en A=432Hz. La acústica de la Cámara del Rey actúa como un resonador de cavidad para ondas electromagnéticas celestes.", 
    evidence: "Christopher Dunn - The Giza Power Plant" 
  },
  { 
    id: 'mega_stonehenge', hz: "117.5", numericalHz: 117.5, 
    name: "Círculo de Piedras - Stonehenge", category: "pyramid", 
    description: "Resonancia de bloque de sarsen y amplificación telúrica.", 
    detailedUsage: "Frecuencia de batido que se genera en el centro del trilitón durante solsticios.", 
    evidence: "Archaeoacoustics Project" 
  },

  // --- 6. CHAKRAS & SISTEMA BIOENERGÉTICO ---
  { 
    id: 'chak_muladhara', hz: "256", numericalHz: 256, 
    name: "Chakra Raíz - Muladhara (Do4 Científico)", category: "chakras", 
    description: "Estabilidad física, arraigo y densidad biológica.", 
    detailedUsage: "Tono Do Científico (Basado en A=432Hz). Alinea el coxis y fortalece la estructura ósea.", 
    evidence: "Giuseppe Verdi / Scientific Tuning" 
  },
  { 
    id: 'chak_svadhisthana', hz: "288", numericalHz: 288, 
    name: "Chakra Sacro - Svadhisthana (Re4)", category: "chakras", 
    description: "Vitalidad sexual, fluidez emocional y creación.", 
    detailedUsage: "Proporción 9:8 respecto a Do. Normaliza la circulación de fluidos y la polaridad emocional.", 
    evidence: "Afinación Pitagórica" 
  },
  { 
    id: 'chak_manipura', hz: "320", numericalHz: 320, 
    name: "Chakra Plexo Solar - Manipura (Mi4)", category: "chakras", 
    description: "Poder personal, digestión y fuego interior.", 
    detailedUsage: "Proporción 5:4 respecto al tono base. Fortalece la voluntad personal y la asimilación de nutrientes.", 
    evidence: "Sistema Bioenergético" 
  },
  { 
    id: 'chak_anahata', hz: "341.33", numericalHz: 341.33, 
    name: "Chakra Corazón - Anahata (Fa4)", category: "chakras", 
    description: "Amor compasivo, Timo y coherencia electrocardíaca.", 
    detailedUsage: "Proporción 4:3 de la cuarta perfecta. Abre la cavidad torácica y armoniza el campo magnético del corazón.", 
    evidence: "HeartMath Institute" 
  },
  { 
    id: 'chak_vishuddha', hz: "384", numericalHz: 384, 
    name: "Chakra Garganta - Vishuddha (Sol4)", category: "chakras", 
    description: "Verdad pura, comunicación y tiroides.", 
    detailedUsage: "Quinta justa 3:2 respecto a Do 256. Resonancia directa con las cuerdas vocales y la laringe.", 
    evidence: "Escala Armónica Justa" 
  },
  { 
    id: 'chak_ajna', hz: "426.66", numericalHz: 426.66, 
    name: "Chakra Tercer Ojo - Ajna (La4)", category: "chakras", 
    description: "Visión cuántica, intuición y sistema nervioso.", 
    detailedUsage: "Sexta mayor justa 5:3. Estimula el lóbulo frontal y la percepción holográfica.", 
    evidence: "Sistema Védico de Tonos" 
  },
  { 
    id: 'chak_sahasrara', hz: "480", numericalHz: 480, 
    name: "Chakra Corona - Sahasrara (Si4)", category: "chakras", 
    description: "Unidad cósmica y glándula pineal.", 
    detailedUsage: "Séptima mayor justa 15:8. Conecta el sistema nervioso central con la red de conciencia unificada.", 
    evidence: "Escala Védica" 
  },

  // --- 7. RITMOS E ISOCRÓNICOS ---
  { 
    id: 'iso_alpha_pulse', hz: "10", numericalHz: 10, 
    name: "Pulso Isocrónico Alfa 10Hz", category: "rhythms", 
    description: "Pulsación acústica rítmica para sincronización hemisférica sin auriculares.", 
    detailedUsage: "Los pulsos isocrónicos no requieren auriculares estéreo. Inducen arrastre de ondas cerebrales Alfa de forma directa por envolvente de amplitud.", 
    evidence: "Brainwave Entrainment Technology" 
  },
  { 
    id: 'iso_theta_pulse', hz: "6", numericalHz: 6, 
    name: "Pulso Isocrónico Theta 6Hz", category: "rhythms", 
    description: "Ritmo de modulación para meditación vívida y sueños lúcidos.", 
    detailedUsage: "Interrupciones rítmicas precisas a 6 cuadros por segundo. Inducen estados hypnagógicos conscientes.", 
    evidence: "Neuro-Acoustic Entrainment" 
  },

  // --- 8. PITAGÓRICAS & MICROTONALES ---
  { 
    id: 'pit_432', hz: "432", numericalHz: 432, 
    name: "A=432 Hz - La Afinación Natural de Verdi", category: "microtonal", 
    description: "Afinación matemática en coherencia con la espiral Áurea y el agua.", 
    detailedUsage: "Afinación basada en potencias de 2 y 3. Resuena con los patrones de la geometría fractal de la naturaleza.", 
    evidence: "Giuseppe Verdi / Schiller Institute" 
  },
  { 
    id: 'pit_444', hz: "444", numericalHz: 444, 
    name: "A=444 Hz - Clave de Do=528Hz", category: "microtonal", 
    description: "Afinación armónica que coloca el tono Do exactamente en 528 Hz.", 
    detailedUsage: "Utilizada por músicos para alinear la escala moderna temperada con la frecuencia Mi Solfeggio.", 
    evidence: "David Hulse / Sound Therapy" 
  },

  // --- 9. SINERGIAS Y RECETAS MULTI-OSCILADOR ---
  {
    id: 'syn_tesla_369', hz: "369-639-963", numericalHz: 369,
    name: "Sinergia Vórtex 3-6-9 de Nikola Tesla", category: "synergy",
    description: "Triada sagrada de Tesla para manifestación y energía libre de la mente.",
    detailedUsage: "Stack de 3 osciladores en 369Hz, 639Hz y 963Hz. Genera interferencia constructiva en la escala teosófica 3-6-9.",
    evidence: "Matemática Vórtex / Nikola Tesla"
  },
  {
    id: 'syn_heart_coherence', hz: "341.3-528-10", numericalHz: 528,
    name: "Sinergia Coherencia Cardíaca y Relaciones (HeartMath)", category: "synergy",
    description: "Chakra Corazón 341.33Hz + 528Hz ADN + Pulso Alfa 10Hz.",
    detailedUsage: "Integra la cuarta perfecta del corazón con la reparación celular de 528Hz y el estado Alfa de 10Hz.",
    evidence: "HeartMath Institute & Solfeggio"
  },
  {
    id: 'syn_merkaba', hz: "111-432-963", numericalHz: 432,
    name: "Sinergia Activación de Campo Toroidal Merkaba", category: "synergy",
    description: "111Hz Oráculo + 432Hz Giza + 963Hz Corona.",
    detailedUsage: "Conecta la cavidad megalítica de Malta con la geometría de Giza y el vórtex pineal en 3D.",
    evidence: "Arqueoacústica y Geometría Sagrada"
  },
  {
    id: 'syn_deep_sleep', hz: "0.5-2.0-174", numericalHz: 174,
    name: "Sinergia Sueño Profundo & Anestesia Regenerativa", category: "synergy",
    description: "Onda Epsilon 0.5Hz + Delta 2Hz + Solfeggio 174Hz.",
    detailedUsage: "Induce relajación muscular profunda con alivio del dolor y liberación de hormona de crecimiento HGH.",
    evidence: "Neuroacústica de Sueño"
  }
];
