import Foundation

/// Stringa localizzata. La chiave è il testo italiano (vedi it.lproj/Localizable.strings).
/// Con argomenti, la chiave è un formato (es. "Testi (%d)").
func L(_ key: String, _ args: CVarArg...) -> String {
    let format = NSLocalizedString(key, comment: "")
    return args.isEmpty ? format : String(format: format, arguments: args)
}
