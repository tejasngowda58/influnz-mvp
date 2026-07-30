import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

interface BrandSignupBody {
  name?: string;
  companyName?: string;
  workEmail?: string;
  companyWebsite?: string;
  industryCategory?: string;
  city?: string;
  password?: string;
}

export async function POST(request: Request) {
  let body: BrandSignupBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, companyName, workEmail, companyWebsite, industryCategory, city, password } = body;

  if (!name || !companyName || !workEmail || !companyWebsite || !industryCategory || !city || !password) {
    return NextResponse.json(
      { error: "name, companyName, workEmail, companyWebsite, industryCategory, city, and password are all required" },
      { status: 400 },
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: workEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email: workEmail,
          passwordHash,
          role: "BRAND",
          brandProfile: {
            create: {
              name,
              companyName,
              workEmail,
              companyWebsite,
              industryCategory,
              city,
            },
          },
        },
        select: {
          id: true,
          email: true,
          role: true,
          brandProfile: true,
        },
      });
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Brand signup failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
