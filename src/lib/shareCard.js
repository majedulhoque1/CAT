// Client-side canvas render of a shareable result card — no PDFShift credits,
// no network, works offline. Monochrome: black canvas, white ink, mono
// Holland code set large, wordmark, short link back to the assessment.
const WIDTH = 1080
const HEIGHT = 1080

export function renderShareCard({ hollandCode, headline, siteOrigin }) {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#0A0A0A'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1
  const m = 64
  ctx.beginPath()
  ctx.moveTo(m, m + 24); ctx.lineTo(m, m); ctx.lineTo(m + 24, m)
  ctx.moveTo(WIDTH - m - 24, m); ctx.lineTo(WIDTH - m, m); ctx.lineTo(WIDTH - m, m + 24)
  ctx.moveTo(m, HEIGHT - m - 24); ctx.lineTo(m, HEIGHT - m); ctx.lineTo(m + 24, HEIGHT - m)
  ctx.moveTo(WIDTH - m - 24, HEIGHT - m); ctx.lineTo(WIDTH - m, HEIGHT - m); ctx.lineTo(WIDTH - m, HEIGHT - m - 24)
  ctx.stroke()

  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'

  ctx.font = '500 20px monospace'
  ctx.letterSpacing = '4px'
  ctx.fillText('CAREER IDENTITY REPORT', WIDTH / 2, 220)

  ctx.font = '300 220px monospace'
  ctx.letterSpacing = '18px'
  ctx.fillText(hollandCode, WIDTH / 2 + 9, 480)

  ctx.font = '400 40px sans-serif'
  ctx.letterSpacing = '0px'
  ctx.fillText(headline, WIDTH / 2, 600)

  ctx.font = '300 26px sans-serif'
  ctx.letterSpacing = '2px'
  ctx.fillText('thriveABL', WIDTH / 2, HEIGHT - 140)

  ctx.font = '400 20px monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.fillText(`${siteOrigin}/assessment`, WIDTH / 2, HEIGHT - 96)

  return canvas
}

export async function shareCardBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      // canvas.toBlob silently hands back PNG when it can't encode the
      // requested type — assert blob.type rather than trusting the call.
      if (!blob || blob.type !== 'image/png') {
        reject(new Error('Could not render the share card as PNG.'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}

export async function downloadShareCard(canvas, filename) {
  const blob = await shareCardBlob(canvas)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export async function shareOrDownloadCard({ hollandCode, headline, siteOrigin }) {
  const canvas = renderShareCard({ hollandCode, headline, siteOrigin })
  const filename = `thriveABL-${hollandCode}.png`
  const blob = await shareCardBlob(canvas)

  if (navigator.share && navigator.canShare?.({ files: [new File([blob], filename, { type: 'image/png' })] })) {
    try {
      await navigator.share({
        files: [new File([blob], filename, { type: 'image/png' })],
        title: 'My thriveABL Career Identity Report',
        text: `I'm a ${hollandCode} — ${headline}`,
      })
      return
    } catch {
      // user cancelled or share failed — fall through to download
    }
  }
  await downloadShareCard(canvas, filename)
}
