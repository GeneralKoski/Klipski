import AppKit

// Genera un PNG 1024x1024 con monogramma "K" su sfondo a gradiente.
// Usato da build.sh / make_icon.sh per produrre Klipski.icns.

let size = 1024.0
let image = NSImage(size: NSSize(width: size, height: size))
image.lockFocus()

let ctx = NSGraphicsContext.current!.cgContext
let rect = NSRect(x: 0, y: 0, width: size, height: size)

// Sfondo arrotondato stile macOS (con un po' di margine).
let inset = size * 0.08
let bgRect = rect.insetBy(dx: inset, dy: inset)
let radius = bgRect.width * 0.225
let path = NSBezierPath(roundedRect: bgRect, xRadius: radius, yRadius: radius)
path.addClip()

let gradient = NSGradient(colors: [
    NSColor(calibratedRed: 0.36, green: 0.42, blue: 0.95, alpha: 1.0),
    NSColor(calibratedRed: 0.55, green: 0.27, blue: 0.90, alpha: 1.0)
])!
gradient.draw(in: bgRect, angle: -90)

// Lettera "K" bianca centrata.
let letter = "K" as NSString
let font = NSFont.systemFont(ofSize: size * 0.6, weight: .bold)
let attrs: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: NSColor.white
]
let textSize = letter.size(withAttributes: attrs)
let textRect = NSRect(
    x: (size - textSize.width) / 2,
    y: (size - textSize.height) / 2,
    width: textSize.width,
    height: textSize.height
)
letter.draw(in: textRect, withAttributes: attrs)

image.unlockFocus()

guard let tiff = image.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let png = rep.representation(using: .png, properties: [:]) else {
    FileHandle.standardError.write("Errore generazione PNG\n".data(using: .utf8)!)
    exit(1)
}

let out = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "icon_1024.png"
try! png.write(to: URL(fileURLWithPath: out))
