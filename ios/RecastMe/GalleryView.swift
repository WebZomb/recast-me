import SwiftUI
import UIKit

// Saved artwork is still watermarked. Product access uses the separately stored,
// device-only private key, never the watermarked JPG or the visible reference ID.
struct GalleryView: View {
    @ObservedObject var gallery: PreviewGallery
    let useOnProduct: (URL) -> Void
    @State private var pendingDelete: SavedPreview?
    @State private var recoveryLink = ""

    private let violet = Color(red: 0.61, green: 0.28, blue: 0.97)
    private let aqua = Color(red: 0.14, green: 0.84, blue: 0.99)

    var body: some View {
        NavigationStack {
            Group {
                if gallery.items.isEmpty {
                    ContentUnavailableView(
                        "Your adventures belong here",
                        systemImage: "photo.stack",
                        description: Text("Create a Recast, then save a watermarked preview. Saved pictures remain available offline.")
                    )
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("YOUR PRIVATE COLLECTION")
                                .font(.caption.bold()).tracking(2.2).foregroundStyle(aqua)
                            Text("Your favorite Recasts")
                                .font(.title2.weight(.bold))
                            Text("\(gallery.items.count) of 20 saved · Open any picture or put it on a product without rendering again.")
                                .font(.subheadline).foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 16).padding(.top, 17).padding(.bottom, 7)

                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 153), spacing: 13)], spacing: 15) {
                            ForEach(gallery.items) { item in
                                savedTile(item)
                            }
                        }
                        .padding(.horizontal, 15).padding(.bottom, 26)
                    }
                }
            }
            .navigationTitle("My Recasts")
            .toolbarBackground(.visible, for: .navigationBar)
            .confirmationDialog("Remove this picture from this iPhone?", isPresented: Binding(
                get: { pendingDelete != nil },
                set: { if !$0 { pendingDelete = nil } }
            )) {
                Button("Remove saved picture", role: .destructive) {
                    UINotificationFeedbackGenerator().notificationOccurred(.warning)
                    if let item = pendingDelete { gallery.remove(item) }
                    pendingDelete = nil
                }
            } message: {
                Text("This removes the offline picture and its private link from this device, but it does not delete server artwork or cancel an existing order.")
            }
            .alert("My Recasts", isPresented: Binding(
                get: { gallery.errorMessage != nil },
                set: { if !$0 { gallery.errorMessage = nil } }
            )) {
                Button("OK") { gallery.errorMessage = nil }
            } message: { Text(gallery.errorMessage ?? "") }
        }
    }

    @ViewBuilder
    private func savedTile(_ item: SavedPreview) -> some View {
        VStack(alignment: .leading, spacing: 9) {
            NavigationLink {
                detail(item)
            } label: {
                VStack(alignment: .leading, spacing: 7) {
                    Group {
                        if let picture = gallery.image(item) {
                            Image(uiImage: picture)
                                .resizable().scaledToFill()
                        } else {
                            Rectangle().fill(Color(red: 0.13, green: 0.16, blue: 0.28))
                                .overlay(Image(systemName: "photo").font(.largeTitle))
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .aspectRatio(0.92, contentMode: .fit)
                    .clipped()
                    .clipShape(RoundedRectangle(cornerRadius: 15))

                    Text(item.styleName ?? "My Recast")
                        .font(.subheadline.weight(.bold))
                        .lineLimit(2).foregroundStyle(.white)
                    Text(item.id)
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundStyle(.white.opacity(0.72))
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                }
            }
            .buttonStyle(.plain)

            if let link = gallery.reusableLink(item) {
                Button {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    useOnProduct(link)
                } label: {
                    Label("Use on Product", systemImage: "bag.fill")
                        .font(.system(size: 12, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
                .buttonStyle(.borderedProminent)
                .tint(aqua)
                .foregroundStyle(Color(red: 0.02, green: 0.09, blue: 0.19))
                .accessibilityLabel("Use artwork \(item.id) on a product")
            } else {
                NavigationLink {
                    detail(item)
                } label: {
                    Label("Link to Product", systemImage: "link.badge.plus")
                        .font(.system(size: 12, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .lineLimit(1)
                }
                .buttonStyle(.bordered)
                .tint(aqua)
                .accessibilityHint("Recover this older saved picture's private product access.")
            }
        }
        .padding(10)
        .background(
            LinearGradient(colors: [
                Color(red: 0.19, green: 0.14, blue: 0.33),
                Color(red: 0.09, green: 0.12, blue: 0.23)
            ], startPoint: .topLeading, endPoint: .bottomTrailing),
            in: RoundedRectangle(cornerRadius: 21)
        )
        .overlay(RoundedRectangle(cornerRadius: 21)
            .stroke(LinearGradient(colors: [violet.opacity(0.8), aqua.opacity(0.63)],
                                   startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 1.3))
    }

    @ViewBuilder
    private func detail(_ item: SavedPreview) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if let picture = gallery.image(item) {
                    Image(uiImage: picture).resizable().scaledToFit()
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .accessibilityLabel("Watermarked Recast preview")
                }
                Text(item.styleName ?? "Your Recast")
                    .font(.title2.bold())
                VStack(alignment: .leading, spacing: 8) {
                    Text("Artwork reference")
                        .font(.caption.bold()).foregroundStyle(aqua)
                    Text(item.id)
                        .font(.system(.callout, design: .monospaced))
                        .textSelection(.enabled)
                    Button {
                        UIPasteboard.general.string = item.id
                        UINotificationFeedbackGenerator().notificationOccurred(.success)
                    } label: { Label("Copy artwork ID", systemImage: "number") }
                        .buttonStyle(.bordered)
                    Text("This reference identifies the picture, but your private access key is needed to use it for products.")
                        .font(.caption).foregroundStyle(.secondary)
                }
                .padding(15)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(.quaternary, in: RoundedRectangle(cornerRadius: 16))

                if let link = gallery.reusableLink(item) {
                    Button {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        useOnProduct(link)
                    } label: {
                        Label("Use This Picture on a Product", systemImage: "bag.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent).tint(aqua)
                    .foregroundStyle(.black)
                    .controlSize(.large)
                    Button {
                        UIPasteboard.general.url = link
                        UINotificationFeedbackGenerator().notificationOccurred(.success)
                    } label: {
                        Label("Copy private product link", systemImage: "link")
                    }.buttonStyle(.bordered)
                    Text("Anyone with this private link can open your artwork. Keep it safe.")
                        .font(.caption).foregroundStyle(.secondary)
                } else {
                    VStack(alignment: .leading, spacing: 11) {
                        Text("Restore product access")
                            .font(.headline).foregroundStyle(aqua)
                        Text("This older saved picture doesn't have its private access key on this iPhone yet. If you kept the private Recast link, paste it below. New saves retain it automatically.")
                            .font(.subheadline).foregroundStyle(.secondary)
                        TextField("Paste private Recast link", text: $recoveryLink)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .keyboardType(.URL)
                            .textContentType(.URL)
                            .textFieldStyle(.roundedBorder)
                        Button {
                            if SavedArtworkAccess.restorePrivateLink(recoveryLink, for: item.id) {
                                recoveryLink = ""
                                gallery.refreshAccess()
                                UINotificationFeedbackGenerator().notificationOccurred(.success)
                            } else {
                                gallery.errorMessage = "This picture needs its complete private link for the same Artwork ID. An ID alone cannot recover the clean file."
                                UINotificationFeedbackGenerator().notificationOccurred(.error)
                            }
                        } label: {
                            Label("Restore Product Link", systemImage: "arrow.clockwise")
                                .frame(maxWidth: .infinity)
                        }.buttonStyle(.borderedProminent).tint(aqua)
                    }
                    .padding(16)
                    .background(.quaternary, in: RoundedRectangle(cornerRadius: 16))
                }
                ShareLink(item: gallery.imageURL(item)) {
                    Label("Share Watermarked Preview", systemImage: "square.and.arrow.up")
                        .frame(maxWidth: .infinity)
                }.buttonStyle(.bordered)
                Button("Remove from this iPhone", role: .destructive) {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    pendingDelete = item
                }
                .font(.footnote)
            }
            .padding(17)
        }
        .navigationTitle("Your Recast")
        .navigationBarTitleDisplayMode(.inline)
    }
}
