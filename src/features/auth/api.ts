import { apiRequest } from "@/lib/api-client";
import type { LoginInput, RegisterInput } from "@/lib/schemas";
import type { CreatorSummary } from "@/types";

type CreatorResponse = { creator: CreatorSummary };

export const authApi = {
  login: (input: LoginInput) => apiRequest<CreatorResponse>("/api/auth/login", { method: "POST", body: input }).then((r) => r.creator),
  register: (input: RegisterInput) =>
    apiRequest<CreatorResponse>("/api/auth/register", { method: "POST", body: input }).then((r) => r.creator),
  logout: () => apiRequest<void>("/api/auth/logout", { method: "POST" }),
  resetDemo: () => apiRequest<void>("/api/demo/reset", { method: "POST" }),
};
