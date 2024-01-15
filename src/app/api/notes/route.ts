import prisma from "@/lib/db/prisma";
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

    const note = await prisma.note.create({
      data: {
        title,
        content,
        userId,
      },
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

    const updatedNote = await prisma.note.update({
      where: {
        id: id,
      },
      data: {
        title,
        content,
      },
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

    await prisma.note.delete({
      where: {
        id: id,
      },
    });

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
