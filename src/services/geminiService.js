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
        prescriptions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              medicationName: { type: SchemaType.STRING },
              dosage: { type: SchemaType.STRING },
              frequency: { type: SchemaType.STRING },
              duration: { type: SchemaType.STRING }
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
                  fbs: { type: SchemaType.STRING },
                  rbs: { type: SchemaType.STRING },
                  totalCholesterol: { type: SchemaType.STRING },
                  triglycerides: { type: SchemaType.STRING },
                  hdl: { type: SchemaType.STRING },
                  ldl: { type: SchemaType.STRING }
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
      Extract the structured data according to the schema from the following patient medical document. 
      If any information is missing, leave the field empty or an empty array.
      Document text:
      ${text}
    `;

    const response = await model.generateContent(prompt);
    const parsedData = JSON.parse(response.response.text());
    return parsedData;

  } catch (error) {
    console.error("Error parsing document with Gemini:", error);
    throw error;
  }
};
