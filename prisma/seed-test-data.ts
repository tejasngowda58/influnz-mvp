import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import type { ContentCategory } from "@prisma/client";

/**
 * One-off script to populate the database with dummy creator and brand
 * accounts for manual testing (directory browsing, filters, pagination,
 * admin dashboard, etc). Safe to re-run — skips any email that already
 * exists. Run with: npx tsx prisma/seed-test-data.ts
 */

const TEST_PASSWORD = "password123";

interface CreatorSeed {
  name: string;
  email: string;
  phone: string;
  instagramHandle: string;
  contentCategory: ContentCategory;
  city: string;
}

interface BrandSeed {
  name: string;
  email: string;
  companyName: string;
  companyWebsite: string;
  industryCategory: string;
  city: string;
}

const CREATORS: CreatorSeed[] = [
  { name: "Aisha Khan", email: "aisha.khan@test.com", phone: "9876500001", instagramHandle: "aisha.styles", contentCategory: "FASHION", city: "Mumbai" },
  { name: "Rohan Mehta", email: "rohan.mehta@test.com", phone: "9876500002", instagramHandle: "rohan.tech", contentCategory: "TECH", city: "Bangalore" },
  { name: "Priya Nair", email: "priya.nair@test.com", phone: "9876500003", instagramHandle: "priya.glow", contentCategory: "BEAUTY", city: "Kochi" },
  { name: "Karan Singh", email: "karan.singh@test.com", phone: "9876500004", instagramHandle: "karan.eats", contentCategory: "FOOD", city: "Delhi" },
  { name: "Sneha Patil", email: "sneha.patil@test.com", phone: "9876500005", instagramHandle: "sneha.fit", contentCategory: "FITNESS", city: "Pune" },
  { name: "Arjun Rao", email: "arjun.rao@test.com", phone: "9876500006", instagramHandle: "arjun.wanders", contentCategory: "TRAVEL", city: "Goa" },
  { name: "Meera Iyer", email: "meera.iyer@test.com", phone: "9876500007", instagramHandle: "meera.vibes", contentCategory: "OTHER", city: "Chennai" },
  { name: "Vikram Joshi", email: "vikram.joshi@test.com", phone: "9876500008", instagramHandle: "vikram.fashion", contentCategory: "FASHION", city: "Ahmedabad" },
  { name: "Divya Reddy", email: "divya.reddy@test.com", phone: "9876500009", instagramHandle: "divya.beauty", contentCategory: "BEAUTY", city: "Hyderabad" },
  { name: "Aditya Kumar", email: "aditya.kumar@test.com", phone: "9876500010", instagramHandle: "aditya.gadgets", contentCategory: "TECH", city: "Bangalore" },
  { name: "Neha Gupta", email: "neha.gupta@test.com", phone: "9876500011", instagramHandle: "neha.foodie", contentCategory: "FOOD", city: "Mumbai" },
  { name: "Rahul Verma", email: "rahul.verma@test.com", phone: "9876500012", instagramHandle: "rahul.gains", contentCategory: "FITNESS", city: "Delhi" },
  { name: "Ananya Das", email: "ananya.das@test.com", phone: "9876500013", instagramHandle: "ananya.explores", contentCategory: "TRAVEL", city: "Kolkata" },
  { name: "Ishaan Kapoor", email: "ishaan.kapoor@test.com", phone: "9876500014", instagramHandle: "ishaan.style", contentCategory: "FASHION", city: "Pune" },
  { name: "Tanvi Shah", email: "tanvi.shah@test.com", phone: "9876500015", instagramHandle: "tanvi.daily", contentCategory: "OTHER", city: "Surat" },
];

const BRANDS: BrandSeed[] = [
  { name: "Kavita Menon", email: "kavita.menon@brandtest.com", companyName: "Lumen Cosmetics", companyWebsite: "https://lumencosmetics.com", industryCategory: "Beauty & Personal Care", city: "Mumbai" },
  { name: "Sanjay Malhotra", email: "sanjay.malhotra@brandtest.com", companyName: "Byte Gear", companyWebsite: "https://bytegear.io", industryCategory: "Consumer Electronics", city: "Bangalore" },
  { name: "Ritu Chawla", email: "ritu.chawla@brandtest.com", companyName: "UrbanThreads", companyWebsite: "https://urbanthreads.in", industryCategory: "Fashion & Apparel", city: "Delhi" },
  { name: "Manish Bhatt", email: "manish.bhatt@brandtest.com", companyName: "Spice Route Foods", companyWebsite: "https://spiceroutefoods.com", industryCategory: "Food & Beverage", city: "Pune" },
  { name: "Pooja Desai", email: "pooja.desai@brandtest.com", companyName: "FitCore Nutrition", companyWebsite: "https://fitcorenutrition.com", industryCategory: "Health & Fitness", city: "Ahmedabad" },
  { name: "Deepak Sinha", email: "deepak.sinha@brandtest.com", companyName: "Wanderly Travels", companyWebsite: "https://wanderly.travel", industryCategory: "Travel & Tourism", city: "Goa" },
  { name: "Nisha Pillai", email: "nisha.pillai@brandtest.com", companyName: "GlowUp Skincare", companyWebsite: "https://glowupskin.com", industryCategory: "Beauty & Personal Care", city: "Kochi" },
  { name: "Rajesh Kulkarni", email: "rajesh.kulkarni@brandtest.com", companyName: "NextGen Devices", companyWebsite: "https://nextgendevices.com", industryCategory: "Consumer Electronics", city: "Hyderabad" },
  { name: "Swati Agarwal", email: "swati.agarwal@brandtest.com", companyName: "Vogue Loom", companyWebsite: "https://vogueloom.in", industryCategory: "Fashion & Apparel", city: "Chennai" },
  { name: "Amitabh Roy", email: "amitabh.roy@brandtest.com", companyName: "Curry House Co.", companyWebsite: "https://curryhouseco.com", industryCategory: "Food & Beverage", city: "Kolkata" },
  { name: "Neelam Choudhary", email: "neelam.choudhary@brandtest.com", companyName: "Peak Performance Gear", companyWebsite: "https://peakperformance.in", industryCategory: "Health & Fitness", city: "Jaipur" },
  { name: "Vivek Nambiar", email: "vivek.nambiar@brandtest.com", companyName: "Trailblaze Tours", companyWebsite: "https://trailblazetours.com", industryCategory: "Travel & Tourism", city: "Bangalore" },
  { name: "Anjali Mathur", email: "anjali.mathur@brandtest.com", companyName: "Radiance Beauty Co.", companyWebsite: "https://radiancebeauty.com", industryCategory: "Beauty & Personal Care", city: "Mumbai" },
  { name: "Suresh Pandey", email: "suresh.pandey@brandtest.com", companyName: "CircuitWorks", companyWebsite: "https://circuitworks.tech", industryCategory: "Consumer Electronics", city: "Pune" },
  { name: "Kritika Sharma", email: "kritika.sharma@brandtest.com", companyName: "Thread & Co", companyWebsite: "https://threadandco.in", industryCategory: "Fashion & Apparel", city: "Delhi" },
];

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  let createdCreators = 0;
  let skippedCreators = 0;

  for (const creator of CREATORS) {
    const existing = await prisma.user.findUnique({ where: { email: creator.email } });
    if (existing) {
      skippedCreators++;
      continue;
    }

    await prisma.user.create({
      data: {
        email: creator.email,
        passwordHash,
        role: "CREATOR",
        creatorProfile: {
          create: {
            name: creator.name,
            phone: creator.phone,
            instagramHandle: creator.instagramHandle,
            contentCategory: creator.contentCategory,
            city: creator.city,
          },
        },
      },
    });
    createdCreators++;
  }

  let createdBrands = 0;
  let skippedBrands = 0;

  for (const brand of BRANDS) {
    const existing = await prisma.user.findUnique({ where: { email: brand.email } });
    if (existing) {
      skippedBrands++;
      continue;
    }

    await prisma.user.create({
      data: {
        email: brand.email,
        passwordHash,
        role: "BRAND",
        brandProfile: {
          create: {
            name: brand.name,
            companyName: brand.companyName,
            workEmail: brand.email,
            companyWebsite: brand.companyWebsite,
            industryCategory: brand.industryCategory,
            city: brand.city,
          },
        },
      },
    });
    createdBrands++;
  }

  console.log(`Creators: ${createdCreators} created, ${skippedCreators} already existed.`);
  console.log(`Brands: ${createdBrands} created, ${skippedBrands} already existed.`);
  console.log(`All test accounts use the password: ${TEST_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Seeding test data failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
