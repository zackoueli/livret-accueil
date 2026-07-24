import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { requireAdmin } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const promotionCodes = await stripe.promotionCodes.list({
      limit: 100,
      expand: ["data.promotion.coupon"],
    });

    const codes = promotionCodes.data.map((pc) => {
      const coupon = pc.promotion.coupon;
      return {
        id: pc.id,
        code: pc.code,
        active: pc.active,
        percentOff: typeof coupon === "object" && coupon ? coupon.percent_off ?? null : null,
        maxRedemptions: pc.max_redemptions ?? null,
        timesRedeemed: pc.times_redeemed,
        expiresAt: pc.expires_at ? pc.expires_at * 1000 : null,
        createdAt: pc.created * 1000,
      };
    });

    return NextResponse.json({ codes });
  } catch (err) {
    console.error("[admin/promo-codes GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { code, percentOff, expiresAt, maxRedemptions } = await request.json();

    if (!code || !percentOff) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }
    if (percentOff <= 0 || percentOff > 100) {
      return NextResponse.json({ error: "percentOff invalide" }, { status: 400 });
    }

    const coupon = await stripe.coupons.create({
      percent_off: percentOff,
      duration: "once",
    });

    const promotionCode = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code: code.toUpperCase(),
      ...(expiresAt ? { expires_at: Math.floor(expiresAt / 1000) } : {}),
      ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
    });

    return NextResponse.json({ ok: true, id: promotionCode.id });
  } catch (err: any) {
    console.error("[admin/promo-codes POST]", err);
    return NextResponse.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, active } = await request.json();
    if (!id || typeof active !== "boolean") {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }
    await stripe.promotionCodes.update(id, { active });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/promo-codes PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
