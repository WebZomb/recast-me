import SwiftUI
import WebKit

struct StudioView: View {
    // Deliberately preview-only until commerce, privacy and App Review gates pass.
    static let origin = URL(string: "https://recast-secure-previews-2026-09-29-recast-me.sergz24.workers.dev")!
    @ObservedObject var gallery: PreviewGallery
    @State private var loadError: String?
    @State private var reloadID = UUID()
    var body: some View {
        ZStack {
            StudioWebView(gallery: gallery, loadError: $loadError).id(reloadID)
            if let loadError {
                VStack(spacing: 20) {
                    Image(systemName: "wifi.exclamationmark").font(.largeTitle)
                    Text("We couldn’t open the studio").font(.title2.bold())
                    Text(loadError).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    Text("Saved pictures are still in My Recasts.").font(.callout)
                    Button("Try again") { self.loadError = nil; reloadID = UUID() }.buttonStyle(.borderedProminent)
                }.padding(30).frame(maxWidth: .infinity, maxHeight: .infinity).background(Color(.systemBackground))
            }
        }
    }
}

struct StudioWebView: UIViewRepresentable {
    let gallery: PreviewGallery
    @Binding var loadError: String?
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.userContentController.addScriptMessageHandler(context.coordinator, contentWorld: .page, name: "recastPreview")
        let view = WKWebView(frame: .zero, configuration: config)
        view.navigationDelegate = context.coordinator
        view.uiDelegate = context.coordinator
        view.isOpaque = false
        view.backgroundColor = .black
        view.allowsBackForwardNavigationGestures = true
        view.load(URLRequest(url: StudioView.origin))
        return view
    }
    func updateUIView(_ uiView: WKWebView, context: Context) { context.coordinator.parent = self }
    static func dismantleUIView(_ view: WKWebView, coordinator: Coordinator) {
        view.configuration.userContentController.removeScriptMessageHandler(forName: "recastPreview", contentWorld: .page)
        view.navigationDelegate = nil
        view.uiDelegate = nil
    }
    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandlerWithReply {
        var parent: StudioWebView
        init(_ parent: StudioWebView) { self.parent = parent }
        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
            let origin = message.frameInfo.securityOrigin
            guard message.name == "recastPreview", message.frameInfo.isMainFrame,
                  origin.protocol == "https", origin.host == StudioView.origin.host, origin.port == 0 || origin.port == 443,
                  let body = message.body as? [String: Any], let id = body["id"] as? String, let image = body["image"] as? String else {
                replyHandler(nil, "This preview source is not allowed."); return
            }
            do { try parent.gallery.save(id: id, dataURL: image); replyHandler(["saved": true], nil) }
            catch { replyHandler(nil, error.localizedDescription) }
        }
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { decisionHandler(.cancel); return }
            // Keep third-party subframes (e.g. Turnstile) unprivileged. Bridge checks main frame + exact origin.
            if action.targetFrame?.isMainFrame == false { decisionHandler(.allow); return }
            if url.scheme == "https", url.host == StudioView.origin.host, url.port == nil || url.port == 443 {
                decisionHandler(.allow); return
            }
            decisionHandler(.cancel)
            // No automatic cross-origin redirects or custom schemes. Explicit HTTPS links open outside the studio.
            if action.navigationType == .linkActivated, url.scheme == "https",
               !(URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []).contains(where: { $0.name.lowercased().contains("token") }) {
                UIApplication.shared.open(url)
            }
        }
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if action.targetFrame == nil, let url = action.request.url, url.scheme == "https", url.host == StudioView.origin.host {
                webView.load(action.request)
            }
            return nil
        }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { show(error) }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { show(error) }
        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            parent.loadError = "The studio was interrupted. Check your recent previews before starting another render."
        }
        private func show(_ error: Error) {
            if (error as NSError).code != NSURLErrorCancelled { parent.loadError = "Check your connection and try again. If a render was running, check Recent Versions before retrying." }
        }
    }
}
