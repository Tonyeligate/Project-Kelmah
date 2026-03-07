import SwiftUI

struct PlaceholderStateView: View {
    let title: String
    let subtitle: String
    let bullets: [String]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(title)
                    .font(.largeTitle.weight(.bold))
                    .foregroundStyle(KelmahTheme.primary)

                Text(subtitle)
                    .font(.body)
                    .foregroundStyle(.secondary)

                ForEach(bullets, id: \.self) { bullet in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(bullet)
                            .font(.body)
                            .foregroundStyle(.primary)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(KelmahTheme.card)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
                }
            }
            .padding(20)
        }
        .background(KelmahTheme.background.ignoresSafeArea())
    }
}
