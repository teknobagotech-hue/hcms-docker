import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as mammoth from 'mammoth';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
// Note: Fallback key for demo purposes only if env isn't loaded properly, 
// normally we'd just check it and fail if missing.
const genAI = new GoogleGenerativeAI(apiKey || 'missing-api-key');

export const parseDocumentData = async (fileBuffer) => {
  try {
    // 1. Extract text using mammoth
    const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
    const text = result.value;

    if (!apiKey) {
      console.warn("Missing VITE_GEMINI_API_KEY in environment variables.");
    }

    // 2. Setup Gemini Schema for Structured Output
    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        patient: {
          type: SchemaType.OBJECT,
          properties: {
            firstName: { type: SchemaType.STRING },
            lastName: { type: SchemaType.STRING },
            address: { type: SchemaType.STRING },
            dateOfBirth: { type: SchemaType.STRING, description: "YYYY-MM-DD format if possible" },
            gender: { type: SchemaType.STRING },
            contactNumber: { type: SchemaType.STRING },
            occupation: { type: SchemaType.STRING },
            knownAllergies: { type: SchemaType.STRING },
            pastMedicalHistory: { type: SchemaType.STRING },
            surgicalHistory: { type: SchemaType.STRING },
            smokingHistory: { type: SchemaType.STRING },
            alcoholicIntake: { type: SchemaType.STRING },
            emergencyContactName: { type: SchemaType.STRING },
            guardianName: { type: SchemaType.STRING }
          },
          required: ["firstName", "lastName"]
        },
        medicalRecord: {
          type: SchemaType.OBJECT,
          properties: {
            chiefComplaint: { type: SchemaType.STRING },
            diagnosis: { type: SchemaType.STRING },
            visitDate: { type: SchemaType.STRING, description: "YYYY-MM-DD format if possible" }
          }
        },
        consultations: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              visitDate: { type: SchemaType.STRING, description: "YYYY-MM-DD format if possible" },
              chiefComplaint: { type: SchemaType.STRING, description: "Subjective & Objective (S-O) findings or chief complaint" },
              diagnosis: { type: SchemaType.STRING, description: "Assessment (A) or Diagnosis" },
              plan: { type: SchemaType.STRING, description: "Plan (P), Treatment, or Recommendations" }
            }
          }
        },
        prescriptions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              medicationName: { type: SchemaType.STRING },
              dosage: { type: SchemaType.STRING },
              frequency: { type: SchemaType.STRING },
              duration: { type: SchemaType.STRING },
              instructions: { type: SchemaType.STRING }
            }
          }
        },
        imagingReports: {
          type: SchemaType.OBJECT,
          properties: {
            ultrasoundReports: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  date: { type: SchemaType.STRING },
                  location: { type: SchemaType.STRING },
                  impression: { type: SchemaType.STRING }
                }
              }
            },
            arterialDuplexScan: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  date: { type: SchemaType.STRING },
                  location: { type: SchemaType.STRING },
                  impression: { type: SchemaType.STRING }
                }
              }
            },
            venousDuplexScan: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  date: { type: SchemaType.STRING },
                  location: { type: SchemaType.STRING },
                  impression: { type: SchemaType.STRING }
                }
              }
            },
            xrayReports: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  date: { type: SchemaType.STRING },
                  location: { type: SchemaType.STRING },
                  impression: { type: SchemaType.STRING }
                }
              }
            }
          }
        },
        vitalSigns: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              date: { type: SchemaType.STRING },
              age: { type: SchemaType.STRING },
              weight: { type: SchemaType.STRING },
              bp: { type: SchemaType.STRING },
              spo2: { type: SchemaType.STRING },
              pr: { type: SchemaType.STRING },
              temperature: { type: SchemaType.STRING }
            }
          }
        },
        labs: {
          type: SchemaType.OBJECT,
          properties: {
            cbc: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  date: { type: SchemaType.STRING },
                  wbc: { type: SchemaType.STRING },
                  rbc: { type: SchemaType.STRING },
                  hemoglobin: { type: SchemaType.STRING },
                  hematocrit: { type: SchemaType.STRING },
                  plateletCount: { type: SchemaType.STRING },
                  segmenters: { type: SchemaType.STRING },
                  neutrophils: { type: SchemaType.STRING },
                  lymphocytes: { type: SchemaType.STRING },
                  monocytes: { type: SchemaType.STRING },
                  eosinophils: { type: SchemaType.STRING }
                }
              }
            },
            chemistry: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  date: { type: SchemaType.STRING },
                  creatinine: { type: SchemaType.STRING },
                  sodium: { type: SchemaType.STRING },
                  potassium: { type: SchemaType.STRING },
                  chloride: { type: SchemaType.STRING },
                  ionizedCalcium: { type: SchemaType.STRING },
                  bun: { type: SchemaType.STRING },
                  uricAcid: { type: SchemaType.STRING },
                  phosphorous: { type: SchemaType.STRING },
                  sgptAlt: { type: SchemaType.STRING },
                  sgotAst: { type: SchemaType.STRING },
                  hba1c: { type: SchemaType.STRING },
                  fbs: { type: SchemaType.STRING },
                  rbs: { type: SchemaType.STRING },
                  totalCholesterol: { type: SchemaType.STRING },
                  triglycerides: { type: SchemaType.STRING },
                  hdl: { type: SchemaType.STRING },
                  ldl: { type: SchemaType.STRING },
                  vldl: { type: SchemaType.STRING },
                  cholHdlRatio: { type: SchemaType.STRING },
                  dDimer: { type: SchemaType.STRING },
                  procalcitonin: { type: SchemaType.STRING },
                  albumin: { type: SchemaType.STRING },
                  tropI: { type: SchemaType.STRING },
                  proBnp: { type: SchemaType.STRING },
                  ptpaPatient: { type: SchemaType.STRING },
                  ptpaControl: { type: SchemaType.STRING },
                  percentActivity: { type: SchemaType.STRING },
                  inr: { type: SchemaType.STRING },
                  ptpaRatio: { type: SchemaType.STRING }
                }
              }
            },
            serology: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  date: { type: SchemaType.STRING },
                  tsh: { type: SchemaType.STRING }
                }
              }
            },
            urinalysis: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  date: { type: SchemaType.STRING },
                  color: { type: SchemaType.STRING },
                  transparency: { type: SchemaType.STRING },
                  protein: { type: SchemaType.STRING },
                  ph: { type: SchemaType.STRING },
                  specificGravity: { type: SchemaType.STRING },
                  glucose: { type: SchemaType.STRING },
                  pusCells: { type: SchemaType.STRING },
                  rbcMicro: { type: SchemaType.STRING },
                  epithelialCells: { type: SchemaType.STRING },
                  bacteria: { type: SchemaType.STRING }
                }
              }
            }
          }
        }
      },
      required: ["patient"]
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const prompt = `
      Extract structured patient and clinical data from the following medical document according to the schema.
      
      Parsing rules:
      1. Patient Profile:
         - Separate name into firstName and lastName (e.g., "DICHOSO, WILMA C." -> lastName: "DICHOSO", firstName: "WILMA C.").
         - Extract address if present.
         - Convert dates (e.g. Birthdate "August 1, 1948", Visit dates) into standard YYYY-MM-DD format (e.g. "1948-08-01").
         - Extract contactNumber, occupation, knownAllergies, pastMedicalHistory (include Medical Diagnosis / Medical History), surgicalHistory, smokingHistory, alcoholicIntake.
      2. Prescriptions:
         - Extract ALL prescribed medications (e.g. under "MEDICATIONS" section or in consultations).
         - Separate medicationName (e.g. "Valsartan + Sacubutril (Sanare)", "Cilnidipine (Cildine)") from dosage (e.g. "200mg/tab", "20 mg/tab").
         - Extract frequency (e.g. "2 x a day", "once a day 6pm"), duration (e.g. "1 day"), and instructions if present.
      3. Medical Records & Consultations:
         - Under the "CONSULTATIONS" section (or throughout the clinical encounters), extract ALL listed consultation encounters into the "consultations" array.
         - For each consultation encounter, extract:
           - visitDate (YYYY-MM-DD format if possible)
           - chiefComplaint: Subjective & Objective (S-O) notes, vital signs if included, or chief complaint
           - diagnosis: Assessment / Diagnosis (A)
           - plan: Plan / Treatment / Medications / Recommendations (P)
         - Also populate "medicalRecord" with the details of the most recent consultation encounter.
      4. Lab Flow Sheets & Vital Signs:
         - Extract all historical records for Vital Signs, CBC, Blood Chemistry, Serology, Urinalysis, and Imaging/X-Ray reports.
         - For Lab Flow Sheets formatted as matrices/tables with dates as column headers (e.g., 07/14/2025, 07/22/2025...) and lab tests as rows (e.g., Creatinine, Sodium, Potassium, SGPT/ALT, HbA1c, Pro-BNP, etc.), create a separate object per DATE column in the chemistry or cbc array with all test values corresponding to that specific date.
         - Pay close attention to extracting ALL Chemistry parameters: Creatinine, Sodium, Potassium, Chloride, Ionized Calcium, BUN, Uric Acid, Phosphorous, SGPT/ALT (sgptAlt), SGOT/AST (sgotAst), HbA1c (hba1c), FBS (fbs), RBS (rbs), Total Cholesterol (totalCholesterol), Triglycerides (triglycerides), HDL (hdl), LDL (ldl), VLDL (vldl), CHOL/HDL Ratio (cholHdlRatio), D-Dimer (dDimer), Procalcitonin (procalcitonin), Albumin (albumin), Trop-I (tropI), Pro-BNP (proBnp), PTPA Patient (ptpaPatient), PTPA Control (ptpaControl), Percent Activity / % Activity (percentActivity), INR (inr), PTPA Ratio (ptpaRatio).
         - For CBC, extract WBC, RBC, Hemoglobin, Hematocrit, Platelet Count, Segmenters, Neutrophils, Lymphocytes, Monocytes, Eosinophils.

      If any field is not present in the document, leave it empty or as an empty array.
      
      Document text:
      ${text}
    `;

    try {
      const response = await model.generateContent(prompt);
      let jsonText = response.response.text();
      jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
      const parsedData = JSON.parse(jsonText);
      if (parsedData && parsedData.patient) {
        return parsedData;
      }
    } catch (geminiError) {
      console.warn("Gemini AI parse error, using text fallback:", geminiError);
    }

    return parseTextFallback(text);

  } catch (error) {
    console.error("Error reading file with mammoth:", error);
    throw error;
  }
};

const parseTextFallback = (text) => {
  const data = {
    patient: { firstName: '', lastName: '', address: '', dateOfBirth: '', gender: '', contactNumber: '', occupation: '', knownAllergies: '', pastMedicalHistory: '', surgicalHistory: '', smokingHistory: '', alcoholicIntake: '', emergencyContactName: '', guardianName: '' },
    medicalRecord: { chiefComplaint: '', diagnosis: '', visitDate: '' },
    consultations: [],
    prescriptions: [],
    imagingReports: { ultrasoundReports: [], arterialDuplexScan: [], venousDuplexScan: [], xrayReports: [] },
    vitalSigns: [],
    labs: { cbc: [], chemistry: [], serology: [], urinalysis: [] }
  };

  if (!text) return data;

  // Name (e.g. "NAME: DICHOSO, WILMA C.")
  const nameMatch = text.match(/NAME:\s*([^\r\n]+)/i);
  if (nameMatch) {
    const rawName = nameMatch[1].trim();
    if (rawName.includes(',')) {
      const parts = rawName.split(',');
      data.patient.lastName = parts[0].trim();
      data.patient.firstName = parts[1].trim();
    } else {
      const parts = rawName.split(' ');
      data.patient.lastName = parts.pop() || '';
      data.patient.firstName = parts.join(' ') || '';
    }
  }

  // Address
  const addrMatch = text.match(/ADDRESS:\s*([^\r\n]+)/i);
  if (addrMatch) data.patient.address = addrMatch[1].trim();

  // Birthdate
  const dobMatch = text.match(/BIRTHDATE:\s*([^\r\n]+)/i);
  if (dobMatch) data.patient.dateOfBirth = dobMatch[1].trim();

  // Gender
  const sexMatch = text.match(/(?:SEX|GENDER):\s*([^\r\n]+)/i);
  if (sexMatch) data.patient.gender = sexMatch[1].trim();

  // Contact
  const phoneMatch = text.match(/CONTACT\s*NUMBER:\s*([^\r\n]+)/i);
  if (phoneMatch) data.patient.contactNumber = phoneMatch[1].trim();

  // Medical History / Diagnosis
  const diagMatch = text.match(/MEDICAL\s*DIAGNOSIS:\s*([^\r\n]+)/i);
  if (diagMatch) data.patient.pastMedicalHistory = diagMatch[1].trim();

  // Consultations section parsing
  const consultSectionMatch = text.match(/CONSULTATIONS\s*([\s\S]*?)(?:GLADDAYS|MEDICATIONS|PREVIOUS|SURGICAL|ALLERGIES|LMP|LAB FLOW|BLOOD CHEMISTRY|X-RAY|ULTRASOUND|ARTERIAL|VENOUS|SEROLOGY|CLINICAL MICROSCOPY|Medical Certificate|Referral Letter|$)/i);
  if (consultSectionMatch) {
    const rawConsultText = consultSectionMatch[1];
    const dateRegex = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{1,2}[,\-\s]+\d{2,4})|(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi;
    const matches = [...rawConsultText.matchAll(dateRegex)];
    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const dateStr = matches[i][0].trim();
        const startIdx = matches[i].index + matches[i][0].length;
        const endIdx = i + 1 < matches.length ? matches[i + 1].index : rawConsultText.length;
        const chunk = rawConsultText.slice(startIdx, endIdx).trim();

        const lines = chunk.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          const chief = lines.slice(0, Math.max(1, Math.ceil(lines.length / 2))).join(' ');
          const diag = lines.slice(Math.ceil(lines.length / 2)).join(' ');
          data.consultations.push({
            visitDate: dateStr,
            chiefComplaint: chief,
            diagnosis: diag,
            plan: ''
          });
        }
      }
    }
  }

  if (data.consultations.length > 0) {
    data.medicalRecord.visitDate = data.consultations[0].visitDate;
    data.medicalRecord.chiefComplaint = data.consultations[0].chiefComplaint;
    data.medicalRecord.diagnosis = data.consultations[0].diagnosis;
  }

  // Prescriptions
  const medSectionMatch = text.match(/MEDICATIONS:\s*([\s\S]*?)(?:PREVIOUS|SURGICAL|ALLERGIES|LMP|CONSULTATIONS|LAB FLOW|$)/i);
  if (medSectionMatch) {
    const lines = medSectionMatch[1].split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
    data.prescriptions = lines.map(line => {
      const dosageMatch = line.match(/^(.+?)\s+((?:\d+[\/\d]*\s*(?:mg|g|mcg|ml|tab|sachet)?)|(?:sachet)|(?:\d+.*))$/i);
      if (dosageMatch) {
        return {
          medicationName: dosageMatch[1].trim(),
          dosage: dosageMatch[2].trim(),
          frequency: '',
          duration: ''
        };
      }
      return { medicationName: line, dosage: '', frequency: '', duration: '' };
    });
  }

  return data;
};
