import SwiftUI

private enum RecastTab: Hashable { case create, recasts, orders, specials, community }

@main
struct RecastMeApp: App {
    @State private var selectedTab: RecastTab = .create
    @State private var selectedArtworkURL: URL?
    @State private var creatorRevision = 0
    @StateObject private var gallery = PreviewGallery()
    @StateObject private var photoConsent = PhotoProcessingConsent()
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
                    .tabItem { Label("My Orders", systemImage: "shippingbox.fill") }
                    .tag(RecastTab.orders)
                StudioView(gallery: gallery, initialURL: StudioView.origin.appendingPathComponent("specials.html"))
                    .tabItem { Label("Specials", systemImage: "gift.fill") }
                    .tag(RecastTab.specials)
                StudioView(gallery: gallery, initialURL: StudioView.origin.appendingPathComponent("community"))
                    .tabItem { Label("Community", systemImage: "person.3.fill") }
                    .tag(RecastTab.community)
            }
            .sensoryFeedback(.selection, trigger: selectedTab)
            .tint(.cyan)
            .preferredColorScheme(.dark)
            .environmentObject(photoConsent)
        }
    }
}
