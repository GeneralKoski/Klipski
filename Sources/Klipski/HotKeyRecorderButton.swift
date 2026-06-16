import AppKit
import Carbon

enum HotKeyFormatter {
    static func carbonModifiers(from flags: NSEvent.ModifierFlags) -> UInt32 {
        var carbon: UInt32 = 0
        if flags.contains(.command) { carbon |= UInt32(cmdKey) }
        if flags.contains(.shift) { carbon |= UInt32(shiftKey) }
        if flags.contains(.option) { carbon |= UInt32(optionKey) }
        if flags.contains(.control) { carbon |= UInt32(controlKey) }
        return carbon
    }

    static func string(keyCode: UInt32, modifiers: UInt32) -> String {
        var result = ""
        if modifiers & UInt32(controlKey) != 0 { result += "⌃" }
        if modifiers & UInt32(optionKey) != 0 { result += "⌥" }
        if modifiers & UInt32(shiftKey) != 0 { result += "⇧" }
        if modifiers & UInt32(cmdKey) != 0 { result += "⌘" }
        result += keyName(keyCode)
        return result
    }

    private static func keyName(_ code: UInt32) -> String {
        if let name = keyMap[code] { return name }
        return "#\(code)"
    }

    private static let keyMap: [UInt32: String] = [
        0: "A", 1: "S", 2: "D", 3: "F", 4: "H", 5: "G", 6: "Z", 7: "X", 8: "C", 9: "V",
        11: "B", 12: "Q", 13: "W", 14: "E", 15: "R", 16: "Y", 17: "T",
        18: "1", 19: "2", 20: "3", 21: "4", 22: "6", 23: "5", 24: "=", 25: "9", 26: "7",
        27: "-", 28: "8", 29: "0", 30: "]", 31: "O", 32: "U", 33: "[", 34: "I", 35: "P",
        36: "↩", 37: "L", 38: "J", 39: "'", 40: "K", 41: ";", 42: "\\", 43: ",", 44: "/",
        45: "N", 46: "M", 47: ".", 48: "⇥", 49: "Spazio", 50: "`", 51: "⌫", 53: "⎋",
        123: "←", 124: "→", 125: "↓", 126: "↑"
    ]
}

@MainActor
final class HotKeyRecorderButton: NSButton {
    /// (keyCode, carbonModifiers). Chiamato quando l'utente registra una nuova combinazione.
    var onCapture: ((UInt32, UInt32) -> Void)?

    private var keyCode: UInt32 = 9
    private var modifiers: UInt32 = UInt32(cmdKey | shiftKey)

    private var recording = false {
        didSet { refreshTitle() }
    }

    override var acceptsFirstResponder: Bool { true }

    func setHotKey(keyCode: UInt32, modifiers: UInt32) {
        self.keyCode = keyCode
        self.modifiers = modifiers
        refreshTitle()
    }

    private func refreshTitle() {
        title = recording ? L("Premi i tasti…") : HotKeyFormatter.string(keyCode: keyCode, modifiers: modifiers)
    }

    override func mouseDown(with event: NSEvent) {
        recording = true
        window?.makeFirstResponder(self)
    }

    override func keyDown(with event: NSEvent) {
        if recording {
            capture(event)
        } else {
            super.keyDown(with: event)
        }
    }

    override func performKeyEquivalent(with event: NSEvent) -> Bool {
        if recording {
            capture(event)
            return true
        }
        return super.performKeyEquivalent(with: event)
    }

    private func capture(_ event: NSEvent) {
        if event.keyCode == 53 { // Esc annulla
            recording = false
            return
        }
        let carbon = HotKeyFormatter.carbonModifiers(from: event.modifierFlags)
        guard carbon != 0 else {
            NSSound.beep() // serve almeno un modificatore
            return
        }
        keyCode = UInt32(event.keyCode)
        modifiers = carbon
        recording = false
        onCapture?(keyCode, carbon)
    }
}
