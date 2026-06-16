// swift-tools-version:6.0
import PackageDescription

let package = Package(
    name: "Klipski",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(
            name: "Klipski",
            path: "Sources/Klipski"
        )
    ]
)
