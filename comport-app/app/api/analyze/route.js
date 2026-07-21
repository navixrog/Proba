import { openai } from "@/lib/openai";
import { BE_PRACTICAL_SCHEMA } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

// Best-effort cleanup so uploaded PDFs / threads don't linger on OpenAI's side longer than needed (GDPR hygiene).
async function cleanup({ threadId, vectorStoreId }) {
  try {
    if (vectorStoreId) {
      const files = await openai.beta.vectorStores.files.list(vectorStoreId);
      await Promise.allSettled(files.data.map((f) => openai.files.del(f.id)));
      await openai.beta.vectorStores.del(vectorStoreId);
    }
    if (threadId) {
      await openai.beta.threads.del(threadId);
    }
  } catch (err) {
    console.error("Cleanup upozorenje (nije blokirajuće):", err);
  }
}

export async function POST(req) {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_ASSISTANT_ID) {
    return Response.json(
      { error: "Backend nije konfiguriran. Postavite OPENAI_API_KEY i OPENAI_ASSISTANT_ID u .env.local." },
      { status: 500 }
    );
  }

  let threadId = null;
  let vectorStoreId = null;

  try {
    const formData = await req.formData();
    const problem = (formData.get("problem") || "").toString().trim();
    const files = formData.getAll("files").filter((f) => f instanceof File && f.size > 0);

    if (!problem && files.length === 0) {
      return Response.json({ error: "Unesite opis problema ili priložite barem jedan PDF." }, { status: 400 });
    }

    if (files.length > 0) {
      const vectorStore = await openai.beta.vectorStores.create({ name: `comport-${Date.now()}` });
      vectorStoreId = vectorStore.id;
      await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStoreId, { files });
    }

    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: problem || "Analizirajte priloženu dokumentaciju i identificirajte ključni bihevioralni problem.",
        },
      ],
      tool_resources: vectorStoreId ? { file_search: { vector_store_ids: [vectorStoreId] } } : undefined,
    });
    threadId = thread.id;

    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
      response_format: { type: "json_schema", json_schema: BE_PRACTICAL_SCHEMA },
    });

    if (run.status !== "completed") {
      return Response.json(
        { error: `Analiza nije uspjela (status: ${run.status}). ${run.last_error?.message ?? ""}`.trim() },
        { status: 502 }
      );
    }

    const messages = await openai.beta.threads.messages.list(threadId, { order: "desc", limit: 1 });
    const textPart = messages.data[0]?.content?.find((c) => c.type === "text");

    if (!textPart) {
      return Response.json({ error: "Model nije vratio tekstualni odgovor." }, { status: 502 });
    }

    const plan = JSON.parse(textPart.text.value);

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
    await cleanup({ threadId, vectorStoreId });
  }
}
