import Foundation
import Security

// One-device private capability storage for artwork a user explicitly saves.
// The image remains watermarked and shareable; this bearer token never leaves
// the iPhone except when the user deliberately requests a private product link.
enum SavedArtworkAccess {
    private static let service = "com.recastme.ios.saved-artwork"

    static func validID(_ id: String) -> Bool {
        id.range(of: "^RC-[A-Za-z0-9-]{1,100}$", options: .regularExpression) != nil
    }
    static func validToken(_ token: String) -> Bool {
        token.range(of: "^[a-fA-F0-9]{64}$", options: .regularExpression) != nil
    }
    static func save(id: String, token: String) -> Bool {
        guard validID(id), validToken(token), let data = token.data(using: .utf8) else { return false }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: id,
            kSecAttrSynchronizable as String: kCFBooleanFalse!
        ]
        let attributes: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        var status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            var add = query
            for (key, value) in attributes { add[key] = value }
            status = SecItemAdd(add as CFDictionary, nil)
        }
        return status == errSecSuccess
    }
    static func token(for id: String) -> String? {
        guard validID(id) else { return nil }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: id,
            kSecAttrSynchronizable as String: kCFBooleanFalse!,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data, let token = String(data: data, encoding: .utf8),
              validToken(token) else { return nil }
        return token
    }
    static func delete(id: String) {
        guard validID(id) else { return }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: id,
            kSecAttrSynchronizable as String: kCFBooleanFalse!
        ]
        SecItemDelete(query as CFDictionary)
    }
    static func productURL(for id: String) -> URL? {
        guard let token = token(for: id),
              var components = URLComponents(string: "https://recastmeai.com/") else { return nil }
        // Fragment is an explicit user-selected private capability. Recast
        // removes the fragment from browser history after loading it.
        let params = "recast=" + id + "&key=" + token + "&shop=1"
        components.percentEncodedFragment = params
        return components.url
    }
}
