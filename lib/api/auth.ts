export type User = {
  id: string;
  email: string;
};

export type Session = {
  user: User;
  expiresAt: string;
};

type SessionResponse = {
  sessionId: string;
  email: string;
  expiresAt: string;
};

function isSessionResponse(value: unknown): value is SessionResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "sessionId" in value &&
    typeof value.sessionId === "string" &&
    "email" in value &&
    typeof value.email === "string" &&
    "expiresAt" in value &&
    typeof value.expiresAt === "string"
  );
}

/** Adapta o contrato HTTP de `GET /auth/session` ao modelo do AuthProvider. */
export function parseSessionResponse(value: unknown): Session | null {
  if (!isSessionResponse(value)) {
    return null;
  }

  return {
    user: {
      id: value.sessionId,
      email: value.email,
    },
    expiresAt: value.expiresAt,
  };
}
