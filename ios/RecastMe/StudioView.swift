import SwiftUI
import WebKit
import UIKit
import SafariServices

struct SafariCheckout: Identifiable {
    let id = UUID()
    let url: URL
}

private struct EmbeddedSafari: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> SFSafariViewController {
        let controller = SFSafariViewController(url: url)
        controller.preferredControlTintColor = .systemCyan
        return controller
    }
    func updateUIViewController(_ controller: SFSafariViewController, context: Context) {}
}

struct StudioView: View {
    // Production service for owner testing; App Store release remains gated.
    static let origin = URL(string: "https://recastmeai.com")!
    @ObservedObject var gallery: PreviewGallery
    let initialURL: URL
    @State private var loadError: String?
    @State private var isLoading = true
    @State private var externalURL: URL?
    @State private var checkout: SafariCheckout?
    @State private var reloadID = UUID()
    var body: some View {
        ZStack {
            StudioWebView(gallery: gallery, initialURL: initialURL, loadError: $loadError, isLoading: $isLoading, externalURL: $externalURL, checkout: $checkout).id(reloadID)
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
        .sheet(item: $checkout, onDismiss: {
            NotificationCenter.default.post(name: .init("RecastCheckoutReturned"), object: nil)
        }) { page in
            EmbeddedSafari(url: page.url)
                .ignoresSafeArea()
        }
        .confirmationDialog("Continue to website?", isPresented: Binding(get: { externalURL != nil }, set: { if !$0 { externalURL = nil } })) {
            if let destination = externalURL {
                Button("Open securely in Recast Me") {
                    checkout = SafariCheckout(url: destination)
                    externalURL = nil
                }
                Button("Open in Safari") { UIApplication.shared.open(destination); externalURL = nil }
            }
            Button("Stay here", role: .cancel) { externalURL = nil }
        } message: {
            Text("Continue in a secure browser. Your saved Recasts stay here.")
        }
    }
}

struct StudioWebView: UIViewRepresentable {
    let gallery: PreviewGallery
    let initialURL: URL
    @Binding var loadError: String?
    @Binding var isLoading: Bool
    @Binding var externalURL: URL?
    @Binding var checkout: SafariCheckout?
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.userContentController.addScriptMessageHandler(context.coordinator, contentWorld: .page, name: "recastPreview")
        config.userContentController.addScriptMessageHandler(context.coordinator, contentWorld: .page, name: "recastHaptic")
        config.userContentController.addScriptMessageHandler(context.coordinator, contentWorld: .page, name: "recastAccess")
        // Only the exact Recast main page can send tap feedback. No third-party frames.
        let touchScript = """
        (() => {
          if (location.origin !== 'https://recastmeai.com') return;
          document.addEventListener('click', event => {
            const control = event.target?.closest?.('button, a[href], summary, select, input[type=submit]');
            if (!control || control.disabled || control.getAttribute('aria-disabled') === 'true') return;
            window.webkit?.messageHandlers?.recastHaptic?.postMessage('tap');
          }, true);
        })();
        """
        config.userContentController.addUserScript(WKUserScript(source: touchScript, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        // Migrate access for existing offline pictures from trusted web history
        // to native Keychain; never attach links to unsaved gallery entries.
        let recoveryScript = """
        (() => {
          if (location.origin !== 'https://recastmeai.com') return;
          try {
            const recent = JSON.parse(localStorage.getItem('recast_recent_versions_v12') || '[]');
            const last = JSON.parse(localStorage.getItem('recast_last_request') || 'null');
            const rows = [...(Array.isArray(recent) ? recent : []), last]
              .filter(v => v && /^RC-[A-Za-z0-9-]{1,100}$/.test(v.requestId||'') &&
                           /^[a-fA-F0-9]{64}$/.test(v.accessToken||''))
              .map(v => ({requestId:v.requestId, accessToken:v.accessToken})).slice(0,20);
            if (rows.length) window.webkit?.messageHandlers?.recastAccess?.postMessage({versions:rows});
          } catch {}
        })();
        """
        config.userContentController.addUserScript(WKUserScript(source: recoveryScript, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        let view = WKWebView(frame: .zero, configuration: config)
        view.navigationDelegate = context.coordinator
        view.uiDelegate = context.coordinator
        context.coordinator.webView = view
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Coordinator.appResumed(_:)),
                                               name: UIApplication.didBecomeActiveNotification, object: nil)
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Coordinator.appResumed(_:)),
                                               name: .init("RecastCheckoutReturned"), object: nil)
        view.isOpaque = false
        view.backgroundColor = .black
        view.allowsBackForwardNavigationGestures = true
        view.load(URLRequest(url: initialURL))
        return view
    }
    func updateUIView(_ uiView: WKWebView, context: Context) { context.coordinator.parent = self }
    static func dismantleUIView(_ view: WKWebView, coordinator: Coordinator) {
        view.configuration.userContentController.removeScriptMessageHandler(forName: "recastPreview", contentWorld: .page)
        view.configuration.userContentController.removeScriptMessageHandler(forName: "recastHaptic", contentWorld: .page)
        view.configuration.userContentController.removeScriptMessageHandler(forName: "recastAccess", contentWorld: .page)
        NotificationCenter.default.removeObserver(coordinator, name: UIApplication.didBecomeActiveNotification, object: nil)
        NotificationCenter.default.removeObserver(coordinator, name: .init("RecastCheckoutReturned"), object: nil)
        coordinator.webView = nil
        view.navigationDelegate = nil
        view.uiDelegate = nil
    }
    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandlerWithReply {
        var parent: StudioWebView
        weak var webView: WKWebView?
        init(_ parent: StudioWebView) { self.parent = parent }
        @objc func appResumed(_ notification: Notification) {
            webView?.evaluateJavaScript("window.dispatchEvent(new Event('recast-app-resumed'))", completionHandler: nil)
        }
        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
            let origin = message.frameInfo.securityOrigin
            guard message.frameInfo.isMainFrame,
                  origin.protocol == "https", origin.host == StudioView.origin.host, origin.port == 0 || origin.port == 443 else {
                replyHandler(nil, "This action is not allowed."); return
            }
            if message.name == "recastHaptic" {
                guard let kind = message.body as? String, kind == "tap" || kind == "success" else {
                    replyHandler(nil, "Unknown feedback."); return
                }
                if kind == "tap" { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
                else { UINotificationFeedbackGenerator().notificationOccurred(.success) }
                replyHandler(["ok": true], nil)
                return
            }
            if message.name == "recastAccess" {
                guard let payload = message.body as? [String: Any],
                      let rows = payload["versions"] as? [[String: String]] else {
                    replyHandler(nil, "Invalid recent artwork."); return
                }
                let count = parent.gallery.importRecentAccess(rows)
                replyHandler(["recovered": count], nil)
                return
            }
            guard message.name == "recastPreview",
                  let body = message.body as? [String: Any],
                  let id = body["id"] as? String, let image = body["image"] as? String else {
                replyHandler(nil, "This preview source is not allowed."); return
            }
            do {
                let reusable = try parent.gallery.save(id: id, dataURL: image, accessToken: body["accessToken"] as? String)
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                replyHandler(["saved": true, "reusable": reusable], nil)
            } catch {
                UINotificationFeedbackGenerator().notificationOccurred(.error)
                replyHandler(nil, error.localizedDescription)
            }
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
            // A trusted merchant checkout stays inside Recast Me. Safari supports
            // Apple Pay, Shop Pay and card payment when Shopify offers them.
            // Closing checkout is NOT evidence of payment; the backend verifies it.
            if url.scheme == "https", url.host == "b2wnfu-7g.myshopify.com" {
                parent.checkout = SafariCheckout(url: url)
                return
            }
            // Other off-origin navigation requires an explicit visible handoff.
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
