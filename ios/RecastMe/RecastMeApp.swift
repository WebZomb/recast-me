import SwiftUI

private enum RecastTab: Hashable { case create, recasts, orders, guide }

@main
struct RecastMeApp: App {
    @State private var selectedTab: RecastTab = .create
    @StateObject private var gallery = PreviewGallery()
    var body: some Scene {
        WindowGroup {
            TabView(selection: $selectedTab) {
                StudioView(gallery: gallery, initialURL: URL(string: "#start", relativeTo: StudioView.origin)!.absoluteURL)
                    .tabItem { Label("Create", systemImage: "wand.and.stars") }
                    .tag(RecastTab.create)
                GalleryView(gallery: gallery)
                    .tabItem { Label("My Recasts", systemImage: "photo.on.rectangle.angled") }
                    .tag(RecastTab.recasts)
                StudioView(gallery: gallery, initialURL: StudioView.origin.appendingPathComponent("my-orders.html"))
                    .tabItem { Label("Orders", systemImage: "shippingbox") }
                    .tag(RecastTab.orders)
                NavigationStack {
                    List {
                        Section("Make something worth keeping") {
                            Label("Choose clear photos of your pet or people.", systemImage: "photo")
                            Label("Choose a world and check who to include.", systemImage: "sparkles")
                            Label("Check likeness before choosing merchandise.", systemImage: "checkmark.seal")
                        }
                        Section("Your private collection") {
                            Text("Save a finished watermarked preview from Create. My Recasts keeps up to 20 previews on this device for offline viewing and sharing.")
                            Text("Deleting a local preview does not delete the artwork on Recast Me or cancel an order. Use the private order page to delete unpaid server artwork.")
                            Link("Photo privacy & AI processing", destination: StudioView.origin.appendingPathComponent("privacy.html"))
                        }
                        Section("Testing this app") {
                            Text("This test build uses Recast Me. After Shopify checkout, return here and open Orders for verified status, print updates and shipping links. App return still needs device acceptance before release. Keep Create open during rendering.")
                        }
                        Section("Orders & support") {
                            Link("Order help and shipping", destination: StudioView.origin.appendingPathComponent("support.html"))
                        }
                    }
                    .navigationTitle("Photo guide")
                }.tabItem { Label("Guide", systemImage: "questionmark.circle") }
                    .tag(RecastTab.guide)
            }
            .sensoryFeedback(.selection, trigger: selectedTab)
            .tint(.cyan)
            .preferredColorScheme(.dark)
        }
    }
}
