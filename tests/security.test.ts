// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { calculateMonth } from "../src/domain/calculations";
import { parseWhatsAppMessage } from "../src/domain/parser";
import { escapeHtml, DashboardView } from "../src/ui/dashboard-view";
import type { DashboardData } from "../src/domain/models";

describe("Cybersecurity Defense Suite", () => {
  describe("XSS Neutralization (escapeHtml)", () => {
    it("escapes script tags and attributes", () => {
      const payload = '<script>alert("xss")</script>';
      const sanitized = escapeHtml(payload);
      expect(sanitized).toBe("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
      expect(sanitized).not.toContain("<script>");
    });

    it("escapes event handlers and attribute injection", () => {
      const payload = '<img src="x" onerror="alert(1)">';
      const sanitized = escapeHtml(payload);
      expect(sanitized).toBe("&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;");
    });

    it("escapes single quotes, ampersands and special chars", () => {
      const payload = "Claudio's & 'admin' <test>";
      const sanitized = escapeHtml(payload);
      expect(sanitized).toBe("Claudio&#039;s &amp; &#039;admin&#039; &lt;test&gt;");
    });
  });

  describe("DashboardView DOM XSS Defense", () => {
    it("renders malicious user displayName safely without executing script", () => {
      const container = document.createElement("div");
      const view = new DashboardView(container);
      
      const maliciousUser = {
        displayName: "<script id=\"xss-marker\">window.__hacked = true;</script>Hacker",
        email: "hacker<img src=x onerror=alert(1)>@example.com",
      };
      view.setUser(maliciousUser);

      const summary = calculateMonth({
        deliveries: [],
        debts: [],
        expenses: [],
        settings: { pricePerDelivery: 0.7, currency: "EUR" },
        rawMessages: [],
      }, "2026-03");

      view.render(summary);

      // Verify that no unescaped script tag or img tag exists in the DOM
      expect(container.querySelector("#xss-marker")).toBeNull();
      expect(container.querySelector("script")).toBeNull();
      expect(container.querySelector("img")).toBeNull();
      expect(container.innerHTML).toContain("&lt;script");
      expect(container.innerHTML).not.toContain("<script id=\"xss-marker\">");
      expect(container.innerHTML).toContain("&lt;img src=x");
      expect(container.innerHTML).not.toContain("<img src=x");
    });

    it("sanitizes migration banner counts to prevent DOM manipulation", () => {
      const container = document.createElement("div");
      const view = new DashboardView(container);
      
      // Inject negative or float count
      view.showMigrationBanner(-5, async () => {});
      const banner = document.querySelector("#cloud-banner");
      expect(banner).not.toBeNull();
      expect(banner?.textContent).toContain("0 registro(s)");
      banner?.remove();
    });
  });

  describe("Defensive Calculations (Client DoS Protection)", () => {
    it("handles null, undefined and corrupted records gracefully without crashing", () => {
      const corruptedData: any = {
        deliveries: [
          null,
          undefined,
          { date: 12345, delivered: "fifty" },
          { date: "2026-03-10", delivered: -100 }, // Negative delivery rejected
          { date: "2026-03-11", delivered: Number.NaN },
          { date: "2026-03-12", delivered: Number.POSITIVE_INFINITY },
          { date: "2026-03-13", delivered: 45 }, // Valid
        ],
        debts: [
          null,
          { date: "2026-03-10", amount: "not a number" },
          { date: "2026-03-11", amount: 15 }, // Valid
        ],
        expenses: [
          null,
          { date: "2026-03-01", amount: null },
          { date: "2026-03-01", amount: 25 }, // Valid
        ],
        settings: null, // missing settings fallback
        rawMessages: [],
      };

      const result = calculateMonth(corruptedData as DashboardData, "2026-03");

      expect(result.deliveries).toBe(45);
      expect(result.grossIncome).toBe(31.5); // 45 * default 0.7
      expect(result.debts).toBe(15);
      expect(result.expenses).toBe(25);
      expect(result.net).toBe(31.5 - 15 - 25);
      expect(result.daysWithDeliveries).toBe(1);
    });

    it("handles invalid month string safely", () => {
      const data: DashboardData = {
        deliveries: [],
        debts: [],
        expenses: [],
        settings: { pricePerDelivery: 0.7, currency: "EUR" },
        rawMessages: [],
      };

      // @ts-expect-error Testing runtime invalid month argument
      const result = calculateMonth(data, null);
      expect(result.month).toBeNull();
      expect(result.monthName).toBe("Mes");
    });
  });

  describe("Parser Denial of Service Protection", () => {
    it("rejects empty or whitespace-only inputs", () => {
      const res = parseWhatsAppMessage("   ");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("El mensaje no puede estar vacío.");
      }
    });

    it("rejects excessively large payloads to prevent UI freezing", () => {
      const hugeString = "a".repeat(500_001);
      const res = parseWhatsAppMessage(hugeString);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("El mensaje excede el tamaño máximo permitido");
      }
    });
  });
});
