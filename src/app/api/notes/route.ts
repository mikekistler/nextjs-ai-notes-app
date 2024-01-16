import { notesIndex } from "@/lib/db/pinecone";
import prisma from "@/lib/db/prisma";
import { getEmbedding } from "@/lib/openai";
import {
  createNoteSchema,
  deleteNoteSchema,
  updateNoteSchema,
} from "@/lib/validation/note";
import { auth } from "@clerk/nextjs";

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // zod is the most popular library for schema validation
    const parseResult = createNoteSchema.safeParse(body);
    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: parseResult.error }, { status: 400 });
    }

    const { title, content } = parseResult.data;

    const embedding = await getEmbeddingForNote(title, content);

    const note = await prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: {
          title,
          content,
          userId,
        },
      });

      // If this upsert fails, the transaction will abort and create will be rolled back
      await notesIndex.upsert([
        {
          id: note.id,
          values: embedding,
          metadata: { userId },
        },
      ]);

      return note;
    });

    return Response.json({ note }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // zod is the most popular library for schema validation
    const parseResult = updateNoteSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: parseResult.error }, { status: 400 });
    }

    const { id, title, content } = parseResult.data;

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    if (userId !== note.userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const embedding = await getEmbeddingForNote(title, content);

    const updatedNote = await prisma.$transaction(async (tx) => {
      const updatedNote = await prisma.note.update({
        where: {
          id: id,
        },
        data: {
          title,
          content,
        },
      });

      // If this upsert fails, the transaction will abort and create will be rolled back
      await notesIndex.upsert([
        {
          id: id,
          values: embedding,
          metadata: { userId },
        },
      ]);

      return updatedNote;
    });

    return Response.json({ updatedNote }, { status: 200 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // zod is the most popular library for schema validation
    const parseResult = deleteNoteSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: parseResult.error }, { status: 400 });
    }

    const { id } = parseResult.data;

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    if (userId !== note.userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await prisma.note.delete({
        where: {
          id: id,
        },
      });
      
      await notesIndex.deleteOne(id);
    });

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getEmbeddingForNote(title: string, content: string | undefined) {
  return getEmbedding(title + (content ? "\n\n" + content : ""));
}
