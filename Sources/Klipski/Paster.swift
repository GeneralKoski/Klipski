import AppKit
import ApplicationServices

enum Paster {
    /// Verifica (ed eventualmente richiede con prompt di sistema) il permesso Accessibilità.
    @discardableResult
    static func ensureAccessibility(prompt: Bool) -> Bool {
        let key = "AXTrustedCheckOptionPrompt"
        let options = [key: prompt] as CFDictionary
        return AXIsProcessTrustedWithOptions(options)
    }

    static var isTrusted: Bool {
        AXIsProcessTrusted()
    }

    /// Simula Cmd+V. Non fa nulla se manca il permesso Accessibilità.
    static func paste() {
        guard isTrusted else { return }
        let source = CGEventSource(stateID: .combinedSessionState)
        let vKey: CGKeyCode = 9
        let down = CGEvent(keyboardEventSource: source, virtualKey: vKey, keyDown: true)
        let up = CGEvent(keyboardEventSource: source, virtualKey: vKey, keyDown: false)
        down?.flags = .maskCommand
        up?.flags = .maskCommand
        down?.post(tap: .cghidEventTap)
        up?.post(tap: .cghidEventTap)
    }
}
