import { NextResponse } from "next/server"

// The desktop installer's filename is version-stamped by electron-builder
// (e.g. "Inteliar.Label.Setup.1.0.0.exe") and changes on every release, so a
// hardcoded /releases/latest/download/<fixed-name> link breaks the moment a
// new version ships with a different filename. This endpoint always resolves
// the actual .exe asset of the latest "desktop-*" release and redirects to it.
export const revalidate = 300 // cache the resolved URL for 5 minutes

export async function GET() {
  try {
    const res = await fetch(
      "https://api.github.com/repos/Inteliar-Stack-Agencia/Inteliar-Labels/releases",
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) throw new Error(`GitHub API ${res.status}`)

    const releases: Array<{
      tag_name: string
      draft: boolean
      prerelease: boolean
      assets: Array<{ name: string; browser_download_url: string }>
    }> = await res.json()

    const desktopRelease = releases.find(
      (r) => !r.draft && !r.prerelease && r.tag_name.startsWith("desktop-")
    )
    const asset = desktopRelease?.assets.find((a) => a.name.toLowerCase().endsWith(".exe"))

    if (!asset) {
      // Fall back to the releases page so the user isn't stuck on a dead link
      return NextResponse.redirect(
        "https://github.com/Inteliar-Stack-Agencia/Inteliar-Labels/releases"
      )
    }

    return NextResponse.redirect(asset.browser_download_url)
  } catch (e) {
    console.error("[download/agent] failed to resolve latest release:", e)
    return NextResponse.redirect(
      "https://github.com/Inteliar-Stack-Agencia/Inteliar-Labels/releases"
    )
  }
}
