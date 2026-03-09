import Combine
import Foundation
import SocketIO

enum RealtimeSignal {
    case message(conversationId: String?)
    case messagesRead(conversationId: String?)
    case notification
    case connectionChanged(Bool)
}

@MainActor
final class RealtimeSocketManager {
    var signals: AnyPublisher<RealtimeSignal, Never> {
        subject.eraseToAnyPublisher()
    }

    private let environment: APIEnvironment
    private let sessionStore: SessionStore
    private let subject = PassthroughSubject<RealtimeSignal, Never>()
    private var manager: SocketManager?
    private var socket: SocketIOClient?

    init(environment: APIEnvironment, sessionStore: SessionStore) {
        self.environment = environment
        self.sessionStore = sessionStore
    }

    func start() {
        guard let token = sessionStore.accessToken, token.isEmpty == false else {
            stop()
            return
        }

        if let socket, socket.status == .connected || socket.status == .connecting {
            return
        }

        stop()

        let manager = SocketManager(
            socketURL: environment.gatewayOrigin,
            config: [
                .log(false),
                .compress,
                .reconnects(true),
                .forceWebsockets(true),
                .path("/socket.io"),
                .connectParams(["token": token])
            ]
        )
        let socket = manager.defaultSocket
        attachListeners(socket)
        self.manager = manager
        self.socket = socket
        socket.connect()
    }

    func stop() {
        socket?.removeAllHandlers()
        socket?.disconnect()
        socket = nil
        manager = nil
        subject.send(.connectionChanged(false))
    }

    private func attachListeners(_ socket: SocketIOClient) {
        socket.on(clientEvent: .connect) { [weak self] _, _ in
            self?.subject.send(.connectionChanged(true))
        }
        socket.on(clientEvent: .disconnect) { [weak self] _, _ in
            self?.subject.send(.connectionChanged(false))
        }
        socket.on("new_message") { [weak self] data, _ in
            self?.subject.send(.message(conversationId: Self.parseConversationID(from: data)))
        }
        socket.on("receive_message") { [weak self] data, _ in
            self?.subject.send(.message(conversationId: Self.parseConversationID(from: data)))
        }
        socket.on("messages_read") { [weak self] data, _ in
            self?.subject.send(.messagesRead(conversationId: Self.parseConversationID(from: data)))
        }
        socket.on("message_read") { [weak self] data, _ in
            self?.subject.send(.messagesRead(conversationId: Self.parseConversationID(from: data)))
        }
        socket.on("notification") { [weak self] _, _ in
            self?.subject.send(.notification)
        }
    }

    private static func parseConversationID(from data: [Any]) -> String? {
        guard let payload = data.first as? [String: Any] else { return nil }
        if let conversationID = payload["conversationId"] as? String, conversationID.isEmpty == false {
            return conversationID
        }
        if let conversationID = payload["conversation"] as? String, conversationID.isEmpty == false {
            return conversationID
        }
        if let nested = payload["data"] as? [String: Any],
           let conversationID = nested["conversationId"] as? String,
           conversationID.isEmpty == false {
            return conversationID
        }
        return nil
    }
}