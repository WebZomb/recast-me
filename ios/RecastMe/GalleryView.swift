import SwiftUI
import UIKit

struct GalleryView: View {
    @ObservedObject var gallery: PreviewGallery
    let useOnProduct: (URL) -> Void
    @State private var pendingDelete: SavedPreview?
    var body: some View {
        NavigationStack {
            Group {
                if gallery.items.isEmpty {
                    ContentUnavailableView("Your adventures belong here", systemImage: "photo.stack", description: Text("Create a Recast, then tap Save to My Recasts below your preview. Your saved watermarked pictures will be available offline."))
                } else {
                    ScrollView {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 155))], spacing: 18) {
                            ForEach(gallery.items) { item in
                                NavigationLink {
                                    VStack(spacing: 20) {
                                        if let image = gallery.image(item) {
                                            Image(uiImage: image).resizable().scaledToFit()
                                                .accessibilityLabel("Watermarked Recast preview")
                                        }
                                        Text("@RecastMeAi · Watermarked preview").font(.caption).foregroundStyle(.secondary)
                                        Text(item.id).font(.caption.monospaced()).textSelection(.enabled)
                                            .foregroundStyle(.secondary)
                                        if let link = gallery.reusableLink(item) {
                                            Button {
                                                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                                                useOnProduct(link)
                                            } label: {
                                                Label("Put on a product", systemImage: "bag.fill")
                                                    .frame(maxWidth: .infinity)
                                            }.buttonStyle(.borderedProminent).tint(.cyan)
                                            Button {
                                                UIPasteboard.general.url = link
                                                UINotificationFeedbackGenerator().notificationOccurred(.success)
                                            } label: {
                                                Label("Copy private product link", systemImage: "link")
                                            }.buttonStyle(.bordered)
                                            Text("Anyone with this private link can open your artwork. Keep it safe.")
                                                .font(.caption2).foregroundStyle(.secondary)
                                        } else {
                                            Text("Want this picture on a product? Open this version in Recent Recasts on Create, then save it again to link it securely.")
                                                .font(.caption).foregroundStyle(.secondary)
                                        }
                                        ShareLink(item: gallery.imageURL(item)) { Label("Share preview", systemImage: "square.and.arrow.up") }
                                            .buttonStyle(.borderedProminent)
                                        Button("Remove from this device", role: .destructive) {
                                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                            pendingDelete = item
                                        }
                                        Spacer(minLength: 0)
                                    }.padding().navigationTitle("Your Recast").navigationBarTitleDisplayMode(.inline)
                                } label: {
                                    VStack(alignment: .leading, spacing: 8) {
                                        if let image = gallery.image(item) {
                                            Image(uiImage: image).resizable().scaledToFit().clipShape(RoundedRectangle(cornerRadius: 16))
                                        }
                                        Text(item.savedAt, style: .date).font(.caption).foregroundStyle(.secondary)
                                        Text(item.id).font(.caption2.monospaced()).foregroundStyle(.secondary)
                                    }
                                }.buttonStyle(.plain)
                            }
                        }.padding()
                    }
                }
            }
            .navigationTitle("My Recasts")
            .confirmationDialog("Remove this preview from this device?", isPresented: Binding(get: {pendingDelete != nil}, set: {if !$0 {pendingDelete = nil}})) {
                Button("Remove local preview", role: .destructive) {
                    UINotificationFeedbackGenerator().notificationOccurred(.warning)
                    if let item = pendingDelete { gallery.remove(item) }
                    pendingDelete = nil
                }
            } message: { Text("Your server artwork and orders are kept. You can save this preview again from Create while you still have its private link.") }
            .alert("My Recasts", isPresented: Binding(get: {gallery.errorMessage != nil}, set: {if !$0 {gallery.errorMessage = nil}})) {
                Button("OK") {gallery.errorMessage = nil}
            } message: {Text(gallery.errorMessage ?? "")}
        }
    }
}
