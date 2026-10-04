import Foundation
import UIKit
import Combine

struct SavedPreview: Codable, Identifiable {
    var id: String
    var savedAt: Date
}

@MainActor
final class PreviewGallery: ObservableObject {
    @Published private(set) var items: [SavedPreview] = []
    @Published var errorMessage: String?
    private let folder: URL
    private var available = true
    private var index: URL { folder.appendingPathComponent("index.json") }

    init() {
        folder = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("WatermarkedPreviews", isDirectory: true)
        do {
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            var url = folder
            var values = URLResourceValues()
            values.isExcludedFromBackup = true
            try url.setResourceValues(values)
            if FileManager.default.fileExists(atPath: index.path) {
                items = try JSONDecoder().decode([SavedPreview].self, from: Data(contentsOf: index))
                guard items.allSatisfy({ Self.validID($0.id) }) else { throw GalleryError.invalid }
            }
        } catch {
            available = false
            errorMessage = "Your saved previews could not be opened. Existing files have not been replaced."
        }
    }
    static func validID(_ id: String) -> Bool {
        id.range(of: "^RC-[A-Za-z0-9-]{1,100}$", options: .regularExpression) != nil
    }
    func imageURL(_ item: SavedPreview) -> URL { folder.appendingPathComponent(item.id + ".jpg") }
    func image(_ item: SavedPreview) -> UIImage? { UIImage(contentsOfFile: imageURL(item).path) }
    func save(id: String, dataURL: String) throws {
        guard available, Self.validID(id), dataURL.hasPrefix("data:image/jpeg;base64,"), dataURL.count < 8_000_000,
              let encoded = dataURL.split(separator: ",", maxSplits: 1).last,
              let data = Data(base64Encoded: String(encoded)), data.prefix(3) == Data([255,216,255]),
              let image = UIImage(data: data), image.size.width <= 4096, image.size.height <= 4096 else { throw GalleryError.invalid }
        guard items.contains(where: {$0.id == id}) || items.count < 20 else { throw GalleryError.full }
        let item = SavedPreview(id: id, savedAt: Date())
        let updated = [item] + items.filter { $0.id != id }
        try data.write(to: imageURL(item), options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        try JSONEncoder().encode(updated).write(to: index, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        items = updated
    }
    func remove(_ item: SavedPreview) {
        do {
            let updated = items.filter { $0.id != item.id }
            try JSONEncoder().encode(updated).write(to: index, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
            items = updated
            try FileManager.default.removeItem(at: imageURL(item))
        } catch { errorMessage = "The local preview could not be fully removed. Please try again." }
    }
    enum GalleryError: LocalizedError {
        case invalid, full
        var errorDescription: String? {
            switch self {
            case .invalid: return "This protected preview could not be saved. Please try again."
            case .full: return "My Recasts is full. Remove a local preview before saving another."
            }
        }
    }
}
