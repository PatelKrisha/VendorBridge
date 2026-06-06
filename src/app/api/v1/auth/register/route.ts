import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, vendors, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      companyName,
      gstNumber,
      pan,
      category,
      contactPerson,
      email,
      password,
      phone,
      address,
    } = body;

    // --- Basic field validation ---
    if (!companyName || !gstNumber || !pan || !contactPerson || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be filled in.' },
        { status: 400 }
      );
    }

    // --- Password strength check ---
    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.isValid) {
      return NextResponse.json(
        { success: false, error: pwCheck.message },
        { status: 400 }
      );
    }

    // --- GSTIN format validation (basic: 15 chars) ---
    if (gstNumber.length !== 15) {
      return NextResponse.json(
        { success: false, error: 'GSTIN must be exactly 15 characters.' },
        { status: 400 }
      );
    }

    // --- PAN format validation (basic: 10 chars) ---
    if (pan.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'PAN must be exactly 10 characters.' },
        { status: 400 }
      );
    }

    // --- Fetch the default organization (first/only org) ---
    const orgList = await db.select().from(organizations).limit(1);
    if (!orgList.length) {
      return NextResponse.json(
        { success: false, error: 'No organization found. Please contact the administrator.' },
        { status: 500 }
      );
    }
    const org = orgList[0];

    // --- Check if self-registration is enabled for this org ---
    if (!org.vendorSelfRegisterEnabled) {
      return NextResponse.json(
        { success: false, error: 'Vendor self-registration is currently disabled. Please contact the procurement team.' },
        { status: 403 }
      );
    }

    // --- Check if email is already registered ---
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    // --- Check if GST is already registered ---
    const existingVendor = await db
      .select({ id: vendors.id })
      .from(vendors)
      .where(eq(vendors.gstNumber, gstNumber))
      .limit(1);

    if (existingVendor.length > 0) {
      return NextResponse.json(
        { success: false, error: 'A vendor with this GSTIN is already registered.' },
        { status: 409 }
      );
    }

    // --- Hash password ---
    const passwordHash = await hashPassword(password);

    // --- Create vendor profile (status: PENDING — requires admin activation) ---
    const [newVendor] = await db
      .insert(vendors)
      .values({
        orgId: org.id,
        companyName,
        gstNumber,
        pan,
        category: category ? (Array.isArray(category) ? category : [category]) : [],
        contactPerson,
        contactEmail: email,
        status: 'PENDING',
        performanceScore: '100.00',
        bankDetails: {
          phone: phone || '',
          address: address || '',
        },
      })
      .returning();

    // --- Create VENDOR user account ---
    const [newUser] = await db
      .insert(users)
      .values({
        orgId: org.id,
        name: contactPerson,
        email,
        passwordHash,
        role: 'VENDOR',
        isActive: true,
      })
      .returning();

    // --- Issue tokens so the user is logged in immediately after registration ---
    const jwtPayload = {
      userId: newUser.id,
      orgId: newUser.orgId,
      role: newUser.role,
      email: newUser.email,
    };

    const accessToken = await signAccessToken(jwtPayload);
    const refreshToken = await signRefreshToken(jwtPayload);

    const cookieStore = await cookies();
    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          orgId: newUser.orgId,
        },
        vendor: {
          id: newVendor.id,
          companyName: newVendor.companyName,
          status: newVendor.status,
        },
      },
    });
  } catch (error: any) {
    console.error('Vendor registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
