import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM || "onboarding@resend.dev";
const APP_URL = "https://app.bunkly.co";

const baseStyle = `
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f9fafb;
  margin: 0; padding: 0;
`;

function layout(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${baseStyle}">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <!-- Header -->
    <div style="background:#f97316;padding:28px 32px;text-align:center;">
      <span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;">Bunkly<span style="opacity:0.7">.</span></span>
    </div>
    <!-- Content -->
    <div style="padding:32px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        Bunkly · <a href="https://app.bunkly.co" style="color:#f97316;text-decoration:none;">app.bunkly.co</a> ·
        <a href="mailto:hello@bunkly.co" style="color:#f97316;text-decoration:none;">hello@bunkly.co</a>
      </p>
    </div>
  </div>
</body></html>`;
}

function btn(text: string, url: string, color = "#f97316") {
  return `<a href="${url}" style="display:inline-block;background:${color};color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:14px;text-decoration:none;margin-top:8px;">${text}</a>`;
}

// ── 1. Confirmation d'achat ────────────────────────────────────────────────────

export async function sendPurchaseConfirmation({
  to, name, plan, billingPeriod,
}: { to: string; name: string; plan: string; billingPeriod: string }) {
  const planLabel: Record<string, string> = { pro: "Pro", agency: "Agence" };
  const periodLabel = billingPeriod === "yearly" ? "annuel" : "mensuel";
  const price: Record<string, Record<string, string>> = {
    pro:    { monthly: "9€/mois", yearly: "69€/an" },
    agency: { monthly: "29€/mois", yearly: "249€/an" },
  };

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Bienvenue sur le plan ${planLabel[plan] ?? plan} ! 🎉</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Bonjour ${name || ""},<br><br>
      Votre abonnement <strong>Bunkly ${planLabel[plan] ?? plan}</strong> (${periodLabel} · ${price[plan]?.[billingPeriod] ?? ""}) est maintenant actif.
      Vous pouvez dès maintenant profiter de toutes les fonctionnalités.
    </p>
    <div style="background:#fff7ed;border-radius:16px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:0.5px;">Votre plan inclut</p>
      ${plan === "agency" ? `
        <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;">
          <li>Livrets illimités</li>
          <li>Tous les templates</li>
          <li>Import IA</li>
          <li>Dossiers & Analytics</li>
          <li>White-label</li>
        </ul>` : `
        <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;">
          <li>Jusqu'à 10 livrets</li>
          <li>Tous les templates</li>
          <li>Import IA</li>
          <li>Dossiers & Analytics</li>
          <li>Badge Bunkly masqué</li>
        </ul>`}
    </div>
    <div style="text-align:center;">
      ${btn("Accéder à mon espace →", `${APP_URL}/dashboard`)}
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      Une question ? Répondez à cet email ou écrivez-nous à <a href="mailto:hello@bunkly.co" style="color:#f97316;">hello@bunkly.co</a>
    </p>
  `;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Confirmation — Abonnement Bunkly ${planLabel[plan] ?? plan} activé`,
    html: layout(content),
  });
}

// ── 2. Expiration imminente (7j) ───────────────────────────────────────────────

export async function sendExpirationWarning({
  to, name, daysLeft, renewalDate,
}: { to: string; name: string; daysLeft: number; renewalDate: string }) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Votre abonnement expire bientôt ⚠️</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Bonjour ${name || ""},<br><br>
      Votre abonnement Bunkly arrive à expiration dans <strong>${daysLeft} jour${daysLeft > 1 ? "s" : ""}</strong> (le ${renewalDate}).
      <br>Renouvelez maintenant pour conserver l'accès à tous vos livrets et fonctionnalités.
    </p>
    <div style="background:#fef3c7;border-radius:16px;padding:20px;margin-bottom:24px;border-left:4px solid #f59e0b;">
      <p style="margin:0;font-size:14px;color:#92400e;line-height:1.7;">
        ⚠️ Sans renouvellement, vos livrets seront <strong>mis en pause</strong> et vos voyageurs ne pourront plus y accéder. Vos données sont conservées.
      </p>
    </div>
    <div style="text-align:center;">
      ${btn("Renouveler mon abonnement →", `${APP_URL}/dashboard/settings`)}
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      Besoin d'aide ? <a href="mailto:hello@bunkly.co" style="color:#f97316;">hello@bunkly.co</a>
    </p>
  `;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ Votre abonnement Bunkly expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
    html: layout(content),
  });
}

// ── 3. Abonnement expiré → passage en free ────────────────────────────────────

export async function sendSubscriptionExpired({
  to, name,
}: { to: string; name: string }) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Votre abonnement a expiré</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Bonjour ${name || ""},<br><br>
      Votre abonnement Bunkly est arrivé à expiration. Votre compte est repassé sur le <strong>plan Gratuit</strong>.
    </p>
    <div style="background:#fef2f2;border-radius:16px;padding:20px;margin-bottom:24px;border-left:4px solid #ef4444;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:0.5px;">Ce qui change</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;">
        <li>Vos livrets sont <strong>mis en pause</strong> (vos voyageurs ne peuvent plus y accéder)</li>
        <li>Vos données sont <strong>intégralement conservées</strong></li>
        <li>Réactivez votre abonnement pour tout retrouver instantanément</li>
      </ul>
    </div>
    <div style="text-align:center;">
      ${btn("Réactiver mon abonnement →", `${APP_URL}/dashboard/settings`, "#ef4444")}
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      Une question ? <a href="mailto:hello@bunkly.co" style="color:#f97316;">hello@bunkly.co</a>
    </p>
  `;

  return resend.emails.send({
    from: FROM,
    to,
    subject: "Votre abonnement Bunkly a expiré — vos livrets sont en pause",
    html: layout(content),
  });
}

// ── 4. Nouvelle commission d'affiliation ──────────────────────────────────────

export async function sendAffiliateCommissionEmail({
  to, name, amount,
}: { to: string; name: string; amount: number }) {
  const euroAmount = (amount / 100).toFixed(2).replace(".", ",");

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Nouvelle commission ! 💰</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Bonjour ${name || ""},<br><br>
      Un utilisateur que vous avez parrainé vient de renouveler son abonnement Bunkly.
      Une commission vous a été créditée.
    </p>
    <div style="background:#fff7ed;border-radius:16px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:0.5px;">Commission créditée</p>
      <p style="margin:0;font-size:32px;font-weight:900;color:#111827;">${euroAmount} €</p>
    </div>
    <div style="text-align:center;">
      ${btn("Voir mes gains →", `${APP_URL}/dashboard/affiliation`)}
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      Retrait disponible dès 30 € accumulés.
    </p>
  `;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `+${euroAmount} € de commission Bunkly`,
    html: layout(content),
  });
}
