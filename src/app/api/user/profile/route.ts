import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { normalizeIndianPhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true, whatsappConsent: true, role: true },
      });
    }
    if (!user && userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, name: true, email: true, phone: true, whatsappConsent: true, role: true },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('Error fetching user profile:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    }
    if (!user && userEmail) {
      user = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, phone, whatsappConsent, currentPassword, newPassword } = body;

    const updateData: any = {};
    if (typeof name === 'string' && name.trim().length >= 2) {
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      if (phone && phone.trim()) {
        const normalized = normalizeIndianPhone(phone);
        if (!normalized) {
          return NextResponse.json(
            { error: 'Please enter a valid 10-digit Indian mobile number' },
            { status: 400 }
          );
        }
        updateData.phone = normalized;
      } else {
        updateData.phone = null;
      }
    }

    if (whatsappConsent !== undefined) {
      updateData.whatsappConsent = Boolean(whatsappConsent);
    }

    // Verify current password and hash new password with bcrypt
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change password.' },
          { status: 400 }
        );
      }
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return NextResponse.json(
          { error: 'New password must be at least 8 characters long.' },
          { status: 400 }
        );
      }

      const userWithHash = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      });

      if (!userWithHash?.passwordHash) {
        return NextResponse.json(
          { error: 'Account does not have a local password set.' },
          { status: 400 }
        );
      }

      const isMatch = await bcrypt.compare(currentPassword, userWithHash.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Incorrect current password.' },
          { status: 400 }
        );
      }

      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappConsent: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updated,
    });
  } catch (err: any) {
    console.error('Error updating user profile:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
