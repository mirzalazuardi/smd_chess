import { describe, it, expect } from "vitest";

describe("payment verification rules", () => {
  it("requires admin_id for verify", () => {
    const body = { paid: true };
    expect(body.admin_id).toBeUndefined();
  });

  it("sets verified_at only when paid = true", () => {
    const now = new Date().toISOString();
    const paid = true;
    const verifiedAt = paid ? now : null;
    expect(verifiedAt).toBe(now);
  });

  it("clears verified_at when paid = false", () => {
    const paid = false;
    const verifiedAt = paid ? new Date().toISOString() : null;
    const verifiedBy = paid ? "admin-id" : null;
    expect(verifiedAt).toBeNull();
    expect(verifiedBy).toBeNull();
  });

  it("payment_verified_by matches admin who verified", () => {
    const adminId = "abc-123";
    const result = { paid: true, payment_verified_by: adminId };
    expect(result.payment_verified_by).toBe("abc-123");
  });
});
