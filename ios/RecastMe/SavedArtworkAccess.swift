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
    // Older saves may predate the protected-link Keychain entry.
    // Accept a private link for the SAME artwork ID only, never a bare ID
    // or another website. Reopening still requires server-side verification.
    static func restorePrivateLink(_ input: String, for id: String) -> Bool {
        guard validID(id), input.count < 2048,
              let components = URLComponents(string: input.trimmingCharacters(in: .whitespacesAndNewlines)),
              components.scheme?.lowercased() == "https",
              ["recastmeai.com", "www.recastmeai.com", "recast-me.sergz24.workers.dev"].contains(components.host?.lowercased() ?? ""),
              components.user == nil, components.password == nil,
              components.port == nil || components.port == 443 else { return false }
        let fragment = components.fragment ?? ""
        let parts = URLComponents(string: "https://recastmeai.com/?" + fragment)?.queryItems ?? []
        let linkID = parts.first(where: { $0.name == "recast" })?.value
        let fragmentToken = parts.first(where: { $0.name == "key" })?.value
        let orderID = components.queryItems?.first(where: { $0.name == "requestId" })?.value
        let orderToken = components.queryItems?.first(where: { $0.name == "token" })?.value
        guard (linkID == id && validToken(fragmentToken ?? "")) ||
              (components.path == "/order.html" && orderID == id && validToken(orderToken ?? "")) else { return false }
        return save(id: id, token: fragmentToken ?? orderToken ?? "")
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
