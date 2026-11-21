import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("Phase 7 PWA manifest, icons, service worker, and Windows scripts", () => {
  it("provides a valid standalone PWA manifest with 192x192 and 512x512 PNG icons", () => {
    const manifestPath = path.join(ROOT, "public", "manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
      name: string;
      display: string;
      theme_color: string;
      icons: Array<{ src: string; sizes: string; type: string }>;
    };

    expect(manifest.name).toBe("Shasthyo Sheba");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#059669");

    const sizes = manifest.icons.map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");

    // Verify 192x192 and 512x512 PNG files and their IHDR dimensions
    for (const dim of [192, 512]) {
      const iconPath = path.join(ROOT, "public", "icons", `icon-${dim}.png`);
      expect(fs.existsSync(iconPath)).toBe(true);
      const buf = fs.readFileSync(iconPath);
      // PNG signature: 137 80 78 71 13 10 26 10
      expect(buf[0]).toBe(137);
      expect(buf.toString("ascii", 1, 4)).toBe("PNG");
      // IHDR width & height at byte offsets 16 and 20
      expect(buf.readUInt32BE(16)).toBe(dim);
      expect(buf.readUInt32BE(20)).toBe(dim);
    }
  });

  it("includes service worker, start-fast.bat, install-autostart.bat, and updated README.md", () => {
    const swPath = path.join(ROOT, "public", "sw.js");
    expect(fs.existsSync(swPath)).toBe(true);
    const swContent = fs.readFileSync(swPath, "utf8");
    expect(swContent).toContain("addEventListener(\"install\"");
    expect(swContent).toContain("addEventListener(\"fetch\"");

    const startFastPath = path.join(ROOT, "start-fast.bat");
    expect(fs.existsSync(startFastPath)).toBe(true);
    expect(fs.readFileSync(startFastPath, "utf8")).toContain("run start");

    const autoStartPath = path.join(ROOT, "install-autostart.bat");
    expect(fs.existsSync(autoStartPath)).toBe(true);
    expect(fs.readFileSync(autoStartPath, "utf8")).toContain(
      "ShasthyoSheba.lnk"
    );

    const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
    expect(readme).toContain("Daily Use");
    expect(readme).toContain("Restore on a New PC");
    expect(readme).toContain("0.0.0.0");
    expect(readme).toContain("Firewall");
  });
});
