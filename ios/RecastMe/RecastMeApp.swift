import SwiftUI

private enum RecastTab: Hashable { case create, recasts, orders, guide }

@main
struct RecastMeApp: App {
    @State private var selectedTab: RecastTab = .create
    @State private var selectedArtworkURL: URL?
    @State private var creatorRevision = 0
    @StateObject private var gallery = PreviewGallery()
    var body: some Scene {
        WindowGroup {
            TabView(selection: $selectedTab) {
                StudioView(gallery: gallery, initialURL: selectedArtworkURL ?? URL(string: "#start", relativeTo: StudioView.origin)!.absoluteURL)
                    .id(creatorRevision)
                    .tabItem { Label("Create", systemImage: "wand.and.stars") }
                    .tag(RecastTab.create)
                GalleryView(gallery: gallery) { link in
                    selectedArtworkURL = link
                    creatorRevision += 1
                    selectedTab = .create
                }
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
                            Text("My Recasts keeps up to 20 offline watermarked previews. Open a saved picture and tap Put on a product without using another render. Its private link is kept in this iPhone's Keychain.")
                            Text("Deleting a local picture also removes its iPhone-only product link, but server artwork and paid orders remain. Keep private links safe; an Artwork ID alone does not unlock a picture.")
                            Link("Photo privacy & AI processing", destination: StudioView.origin.appendingPathComponent("privacy.html"))
                        }
                        Section("Testing this app") {
                            Text("This test build uses Recast Me. After Shopify checkout, return here and open Orders for verified status, print updates and shipping links. App return still needs device acceptance before release. Keep Create open during rendering.")
                        }
                        Section("Orders & support") {
                            Link("Order help and shipping", destination: StudioView.origin.appendingPathComponent("support.html"))
                            Link("Preview the celebration without buying", destination: StudioView.origin.appendingPathComponent("purchase-demo.html"))
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
