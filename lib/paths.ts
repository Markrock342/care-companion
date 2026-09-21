import type { Profile } from "./types";

export function dashboardPath(role: Profile["role"] | undefined) {
  if (role === "admin") return "/admin";
  if (role === "companion") return "/companion";
  return "/customer";
}
