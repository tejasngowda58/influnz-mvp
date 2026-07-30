import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import type { ContentCategory } from "@prisma/client";

const CONTENT_CATEGORIES: ContentCategory[] = [
  "FASHION",
  "BEAUTY",
  "TECH",
  "FOOD",
  "FITNESS",
  "TRAVEL",
  "OTHER",
];

interface CreatorSignupBody {
  name?: string;
  email?: string;
  phone?: string;
  instagramHandle?: string;
  contentCategory?: string;
  city?: string;
  password?: string;
}

export async function POST(request: Request) {
  let body: CreatorSignupBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, phone, instagramHandle, contentCategory, city, password } = body;

  if (!name || !email || !phone || !instagramHandle || !contentCategory || !city || !password) {
    return NextResponse.json(
      { error: "name, email, phone, instagramHandle, contentCategory, city, and password are all required" },
      { status: 400 },
    );
  }

  if (!CONTENT_CATEGORIES.includes(contentCategory as ContentCategory)) {
    return NextResponse.json(
      { error: `contentCategory must be one of: ${CONTENT_CATEGORIES.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email,
          passwordHash,
          role: "CREATOR",
          creatorProfile: {
            create: {
              name,
              phone,
              instagramHandle,
              contentCategory: contentCategory as ContentCategory,
              city,
            },
          },
        },
        select: {
          id: true,
          email: true,
          role: true,
          creatorProfile: true,
        },
      });
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Creator signup failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
