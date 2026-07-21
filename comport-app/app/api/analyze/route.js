import { ai, MODEL } from "@/lib/gemini";
import { BE_PRACTICAL_SCHEMA } from "@/lib/schema";
import { BE_PRACTICAL_SYSTEM_PROMPT } from "@/lib/systemPrompt";

export const runtime = "nodejs";
export const maxDuration = 60;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadAndWait(file) {
  let uploaded = await ai.files.upload({
    file,
    config: { mimeType: "application/pdf", displayName: file.name },
  });

  while (uploaded.state === "PROCESSING") {
    await sleep(1000);
    uploaded = await ai.files.get({ name: uploaded.name });
  }

  if (uploaded.state === "FAILED") {
    throw new Error(`Obrada datoteke "${file.name}" nije uspjela.`);
  }

  return uploaded;
}

// Best-effort cleanup so uploaded PDFs don't linger on Google's side longer than needed (GDPR hygiene).
async function cleanup(uploadedFiles) {
  await Promise.allSettled(uploadedFiles.map((f) => ai.files.delete({ name: f.name })));
}

export async function POST(req) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "Backend nije konfiguriran. Postavite GEMINI_API_KEY u .env.local." },
      { status: 500 }
    );
  }

  const uploadedFiles = [];

  try {
    const formData = await req.formData();
    const problem = (formData.get("problem") || "").toString().trim();
    const files = formData.getAll("files").filter((f) => f instanceof File && f.size > 0);

    if (!problem && files.length === 0) {
      return Response.json({ error: "Unesite opis problema ili priložite barem jedan PDF." }, { status: 400 });
    }

    const parts = [
      { text: problem || "Analizirajte priloženu dokumentaciju i identificirajte ključni bihevioralni problem." },
    ];

    for (const file of files) {
      const uploaded = await uploadAndWait(file);
      uploadedFiles.push(uploaded);
      parts.push({ fileData: { fileUri: uploaded.uri, mimeType: uploaded.mimeType } });
    }

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: BE_PRACTICAL_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: BE_PRACTICAL_SCHEMA,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) {
      return Response.json({ error: "Model nije vratio odgovor." }, { status: 502 });
    }

    const plan = JSON.parse(text);

    // Hard ethical gate: enforce it server-side too, don't rely solely on the model following the instruction.
    if (Array.isArray(plan.prioritisation_matrix)) {
      plan.prioritisation_matrix = plan.prioritisation_matrix.map((row) => {
        const ethicsScore = row.ethical_acceptability?.score;
        return {
          ...row,
          eligible_as_priority: typeof ethicsScore === "number" ? ethicsScore >= 4 : row.eligible_as_priority,
        };
      });
    }

    return Response.json(plan);
  } catch (err) {
    console.error("Analyze route error:", err);
    return Response.json({ error: err?.message || "Neočekivana greška prilikom analize." }, { status: 500 });
  } finally {
    await cleanup(uploadedFiles);
  }
}
