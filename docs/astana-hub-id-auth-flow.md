# Astana Hub ID Verification Flow

This design keeps the existing email/password + JWT cookie auth intact and adds a second verification tier for a self-declared Astana Hub ID. Astana Hub does not provide public OAuth today, so Tier 2 verifies email ownership only and stores the Hub ID as user-declared data.

## Tier 1: Standard User

Status: existing flow.

- User signs in with email + password.
- Backend issues the same JWT token and cookie session as today.
- No JWT payload change is required for existing users.
- The user can use the app without `astana_hub_id`.

Recommended JWT addition, only if the frontend needs it:

```py
claims = {
    "sub": str(user.id),
    "email": user.email,
    "hub_resident": bool(user.astana_hub_verified_at),
}
```

## Tier 2: Astana Hub Verified User

### SQLAlchemy Model

```py
from datetime import datetime
from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    astana_hub_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    astana_hub_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    astana_hub_verification_method: Mapped[str | None] = mapped_column(String(32), nullable=True)
    astana_hub_badge: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Reserved for Tier 3.
    astana_hub_oauth_sub: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True)
```

### Alembic Migration

```py
"""add astana hub id verification fields

Revision ID: 20260614_astana_hub_id
Revises: previous_revision
Create Date: 2026-06-14
"""

from alembic import op
import sqlalchemy as sa

revision = "20260614_astana_hub_id"
down_revision = "previous_revision"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("users", sa.Column("astana_hub_id", sa.String(length=64), nullable=True))
    op.add_column("users", sa.Column("astana_hub_verified_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("astana_hub_verification_method", sa.String(length=32), nullable=True))
    op.add_column("users", sa.Column("astana_hub_badge", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("astana_hub_oauth_sub", sa.String(length=128), nullable=True))
    op.create_index("ix_users_astana_hub_id", "users", ["astana_hub_id"])
    op.create_unique_constraint("uq_users_astana_hub_oauth_sub", "users", ["astana_hub_oauth_sub"])
    op.alter_column("users", "astana_hub_badge", server_default=None)

def downgrade() -> None:
    op.drop_constraint("uq_users_astana_hub_oauth_sub", "users", type_="unique")
    op.drop_index("ix_users_astana_hub_id", table_name="users")
    op.drop_column("users", "astana_hub_oauth_sub")
    op.drop_column("users", "astana_hub_badge")
    op.drop_column("users", "astana_hub_verification_method")
    op.drop_column("users", "astana_hub_verified_at")
    op.drop_column("users", "astana_hub_id")
```

### Redis OTP Storage

```py
import hashlib
import hmac
import os
import secrets
from dataclasses import dataclass

from redis.asyncio import Redis

OTP_TTL_SECONDS = 10 * 60
ATTEMPT_TTL_SECONDS = 15 * 60
MAX_ATTEMPTS = 3

OTP_SECRET = os.environ["OTP_SECRET"]

def email_key(email: str) -> str:
    normalized = email.strip().lower()
    digest = hashlib.sha256(normalized.encode()).hexdigest()
    return digest

def hash_otp(email: str, otp: str) -> str:
    payload = f"{email.strip().lower()}:{otp}".encode()
    return hmac.new(OTP_SECRET.encode(), payload, hashlib.sha256).hexdigest()

def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"

@dataclass
class OtpCheck:
    ok: bool
    reason: str | None = None

async def store_otp(redis: Redis, email: str, otp: str) -> None:
    key = email_key(email)
    await redis.setex(f"ah_otp:{key}", OTP_TTL_SECONDS, hash_otp(email, otp))
    await redis.delete(f"ah_otp_attempts:{key}")

async def verify_otp(redis: Redis, email: str, otp: str) -> OtpCheck:
    key = email_key(email)
    attempts_key = f"ah_otp_attempts:{key}"
    attempts = await redis.incr(attempts_key)
    if attempts == 1:
        await redis.expire(attempts_key, ATTEMPT_TTL_SECONDS)

    if attempts > MAX_ATTEMPTS:
        return OtpCheck(False, "too_many_attempts")

    expected = await redis.get(f"ah_otp:{key}")
    if not expected:
        return OtpCheck(False, "expired")

    actual = hash_otp(email, otp)
    if not hmac.compare_digest(expected.decode() if isinstance(expected, bytes) else expected, actual):
        return OtpCheck(False, "invalid")

    await redis.delete(f"ah_otp:{key}", attempts_key)
    return OtpCheck(True)
```

### SendGrid Integration

```py
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

SENDGRID_API_KEY = os.environ["SENDGRID_API_KEY"]
SENDGRID_FROM_EMAIL = os.environ["SENDGRID_FROM_EMAIL"]

def otp_subject(lang: str) -> str:
    if lang == "kk":
        return "Astana Hub ID растау коды"
    return "Код подтверждения Astana Hub ID"

def otp_body(otp: str, lang: str) -> str:
    if lang == "kk":
        return (
            f"Astana Hub ID растау коды: {otp}\n\n"
            "Код 10 минут жарамды. Егер бұл әрекетті сіз жасамасаңыз, хатты елемеңіз."
        )
    return (
        f"Код подтверждения Astana Hub ID: {otp}\n\n"
        "Код действует 10 минут. Если вы не запрашивали код, просто игнорируйте письмо."
    )

async def send_otp_email(email: str, otp: str, lang: str = "ru") -> None:
    message = Mail(
        from_email=SENDGRID_FROM_EMAIL,
        to_emails=email,
        subject=otp_subject(lang),
        plain_text_content=otp_body(otp, lang),
    )
    client = SendGridAPIClient(SENDGRID_API_KEY)
    client.send(message)
```

### FastAPI Routes

These routes require the existing JWT cookie/session and bind the badge to the logged-in account. The submitted email must match the account email.

```py
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth", tags=["auth"])

HUB_ID_PATTERN = re.compile(r"^AH-\d{4,10}$", re.IGNORECASE)

class SendOtpIn(BaseModel):
    email: EmailStr
    astana_hub_id: str = Field(min_length=4, max_length=64)
    lang: str = "ru"

class VerifyOtpIn(BaseModel):
    email: EmailStr
    astana_hub_id: str = Field(min_length=4, max_length=64)
    otp: str = Field(pattern=r"^\d{6}$")
    lang: str = "ru"

def msg(lang: str, ru: str, kk: str) -> dict[str, str]:
    return {"message": kk if lang == "kk" else ru}

def normalize_hub_id(value: str) -> str:
    return value.strip().upper()

async def enforce_send_rate_limit(redis: Redis, email: str) -> None:
    key = f"ah_otp_send:{email_key(email)}"
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, ATTEMPT_TTL_SECONDS)
    if count > MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="too_many_requests")

@router.post("/send-otp")
async def send_astana_hub_otp(
    payload: SendOtpIn,
    current_user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> dict[str, str]:
    lang = "kk" if payload.lang == "kk" else "ru"
    email = payload.email.strip().lower()
    hub_id = normalize_hub_id(payload.astana_hub_id)

    if email != current_user.email.lower():
        raise HTTPException(status_code=400, detail=msg(lang, "Email должен совпадать с аккаунтом.", "Email аккаунтпен сәйкес болуы керек."))
    if not HUB_ID_PATTERN.match(hub_id):
        raise HTTPException(status_code=400, detail=msg(lang, "Формат Astana Hub ID: AH-29471.", "Astana Hub ID форматы: AH-29471."))

    await enforce_send_rate_limit(redis, email)
    otp = generate_otp()
    await store_otp(redis, email, otp)
    await send_otp_email(email, otp, lang)

    return msg(lang, "Код отправлен на email. Он действует 10 минут.", "Код email-ға жіберілді. Ол 10 минут жарамды.")

@router.post("/verify-otp")
async def verify_astana_hub_otp(
    payload: VerifyOtpIn,
    current_user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str | bool]:
    lang = "kk" if payload.lang == "kk" else "ru"
    email = payload.email.strip().lower()
    hub_id = normalize_hub_id(payload.astana_hub_id)

    if email != current_user.email.lower():
        raise HTTPException(status_code=400, detail=msg(lang, "Email должен совпадать с аккаунтом.", "Email аккаунтпен сәйкес болуы керек."))
    if not HUB_ID_PATTERN.match(hub_id):
        raise HTTPException(status_code=400, detail=msg(lang, "Формат Astana Hub ID: AH-29471.", "Astana Hub ID форматы: AH-29471."))

    result = await verify_otp(redis, email, payload.otp)
    if not result.ok:
        status = 429 if result.reason == "too_many_attempts" else 400
        raise HTTPException(status_code=status, detail=msg(lang, "Неверный или истекший код.", "Код қате немесе мерзімі өтті."))

    current_user.astana_hub_id = hub_id
    current_user.astana_hub_verified_at = datetime.now(timezone.utc)
    current_user.astana_hub_verification_method = "email_otp_self_declared"
    current_user.astana_hub_badge = True
    await db.commit()

    return {
        "message": "Astana Hub ID подтвержден." if lang == "ru" else "Astana Hub ID расталды.",
        "hubResident": True,
    }
```

### Next.js Frontend Form

No `<form>` tag is used. This component relies on the existing JWT cookie by sending `credentials: "include"`.

```tsx
"use client";

import { useState } from "react";

type Lang = "ru" | "kk";

export function AstanaHubIdVerification({ lang = "ru" }: { lang?: Lang }) {
  const [email, setEmail] = useState("");
  const [astanaHubId, setAstanaHubId] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"send" | "verify">("send");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function sendOtp() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/auth/send-otp", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, astana_hub_id: astanaHubId, lang }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.detail?.message ?? data.detail ?? "Error");
      return;
    }
    setMessage(data.message);
    setStep("verify");
  }

  async function verifyOtp() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/auth/verify-otp", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, astana_hub_id: astanaHubId, otp, lang }),
    });
    const data = await res.json();
    setLoading(false);
    setMessage(data.detail?.message ?? data.message ?? "Error");
  }

  return (
    <section className="rounded-lg border border-emerald-700/30 bg-white p-4 text-slate-950 dark:bg-slate-950 dark:text-white">
      <h2 className="text-base font-bold">
        {lang === "kk" ? "Astana Hub ID растау" : "Подтверждение Astana Hub ID"}
      </h2>
      <div className="mt-4 grid gap-3">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={lang === "kk" ? "Email" : "Email"}
          className="rounded-md border px-3 py-2 text-sm"
        />
        <input
          value={astanaHubId}
          onChange={(event) => setAstanaHubId(event.target.value.toUpperCase())}
          placeholder="AH-29471"
          className="rounded-md border px-3 py-2 text-sm"
        />
        {step === "verify" && (
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder={lang === "kk" ? "6 таңбалы код" : "6-значный код"}
            className="rounded-md border px-3 py-2 text-sm"
          />
        )}
        <button
          type="button"
          disabled={loading}
          onClick={step === "send" ? sendOtp : verifyOtp}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading
            ? lang === "kk" ? "Күтіңіз..." : "Подождите..."
            : step === "send"
              ? lang === "kk" ? "Код жіберу" : "Отправить код"
              : lang === "kk" ? "Растау" : "Подтвердить"}
        </button>
        {message && <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>}
      </div>
    </section>
  );
}
```

### Security Controls

- Require existing JWT session for both OTP routes.
- Keep `astana_hub_id` nullable so non-residents are not affected.
- Validate Hub ID format, but show in UI that it is self-declared until official OAuth exists.
- Store only HMAC hashes of OTP codes in Redis.
- OTP expiry: 10 minutes.
- Attempt limit: max 3 verify attempts per email per 15 minutes.
- Send limit: max 3 OTP sends per email per 15 minutes.
- Use generic OTP failure text; do not reveal whether the code expired or was wrong.
- Use `Secure`, `HttpOnly`, `SameSite=Lax` or stricter cookies for JWT sessions.
- Log OTP events without storing the OTP value.
- Do not use the Hub Resident badge for high-risk authorization until Tier 3 exists.

## Tier 3: Future Official OAuth

When Astana Hub publishes OAuth 2.0:

1. Add OAuth provider config: authorization URL, token URL, JWKS/userinfo URL, client ID and client secret.
2. Add `astana_hub_oauth_sub` as the stable external account ID.
3. Keep `astana_hub_id` nullable and keep existing Tier 2 users working.
4. On OAuth callback, link by current JWT user first. If the user is not signed in, link by verified email only after an extra confirmation step.
5. If OAuth returns an official resident ID, overwrite or confirm `astana_hub_id` and change `astana_hub_verification_method` to `official_oauth`.
6. Preserve the same internal `users.id`; do not create a second account for the same person.
7. Keep Tier 2 badges as `email_otp_self_declared` until the user completes OAuth. After OAuth, promote the badge to official.
8. JWT can continue to use the same `sub = users.id`; only the claim `hub_resident_verification_method` changes.

Migration rule:

```py
if user.astana_hub_verification_method == "email_otp_self_declared":
    user.astana_hub_oauth_sub = oauth_profile.sub
    user.astana_hub_id = oauth_profile.official_hub_id or user.astana_hub_id
    user.astana_hub_verification_method = "official_oauth"
    user.astana_hub_verified_at = now_utc()
```

This keeps all RSVPs, likes, chat history and profile state attached to the existing account.
