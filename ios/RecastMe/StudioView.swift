import SwiftUI
import WebKit

struct StudioView: View {
    // Production service for owner testing; App Store release remains gated.
    static let origin = URL(string: "https://recastmeai.com")!
    @ObservedObject var gallery: PreviewGallery
    @State private var loadError: String?
    @State private var isLoading = true
    @State private var externalURL: URL?
    @State private var reloadID = UUID()
    var body: some View {
        ZStack {
            StudioWebView(gallery: gallery, loadError: $loadError, isLoading: $isLoading, externalURL: $externalURL).id(reloadID)
            if isLoading && loadError == nil {
                ProgressView("Opening your studio…").padding().background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
            }
            if let loadError {
                VStack(spacing: 20) {
                    Image(systemName: "wifi.exclamationmark").font(.largeTitle)
                    Text("We couldn’t open the studio").font(.title2.bold())
                    Text(loadError).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    Text("Saved pictures are still in My Recasts.").font(.callout)
                    Button("Try again") { self.loadError = nil; isLoading = true; reloadID = UUID() }.buttonStyle(.borderedProminent)
                }.padding(30).frame(maxWidth: .infinity, maxHeight: .infinity).background(Color(.systemBackground))
            }
        }
        .confirmationDialog("Continue in your browser?", isPresented: Binding(get: { externalURL != nil }, set: { if !$0 { externalURL = nil } })) {
            if let destination = externalURL {
                Button("Open browser") { UIApplication.shared.open(destination); externalURL = nil }
            }
            Button("Stay here", role: .cancel) { externalURL = nil }
        } message: {
            Text("Open \(externalURL?.host ?? "the website") outside Recast Me. Your studio and saved previews stay here.")
        }
    }
}

struct StudioWebView: UIViewRepresentable {
    let gallery: PreviewGallery
    @Binding var loadError: String?
    @Binding var isLoading: Bool
    @Binding var externalURL: URL?
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
        view.load(URLRequest(url: URL(string: "#start", relativeTo: StudioView.origin)!.absoluteURL))
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
            parent.isLoading = false
            // Cross-origin HTTPS navigation requires an explicit native browser handoff.
            if url.scheme == "https",
               !(URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []).contains(where: { $0.name.lowercased().contains("token") }) {
                parent.externalURL = url
            }
        }
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if action.targetFrame == nil, let url = action.request.url, url.scheme == "https", url.host == StudioView.origin.host {
                webView.load(action.request)
            }
            return nil
        }
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) { parent.isLoading = true }
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { parent.isLoading = false; parent.loadError = nil }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { show(error) }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { show(error) }
        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            parent.loadError = "The studio was interrupted. Check your recent previews before starting another render."
        }
        private func show(_ error: Error) {
            parent.isLoading = false
            if (error as NSError).code != NSURLErrorCancelled { parent.loadError = "Check your connection and try again. If a render was running, check Recent Versions before retrying." }
        }
    }
}
