# Context to Redux Migration Guide

## AuthContext → Redux authSlice
- `useAuth()` → `useSelector(state => state.auth)`
- `user` → `state.auth.user`
- `isAuthenticated` → `state.auth.isAuthenticated`
- `loading` → `state.auth.loading`
- `login()` → `dispatch(loginUser(credentials))`
- `logout()` → `dispatch(logoutUser())`
- `register()` → `dispatch(registerUser(data))`

## NotificationContext → Redux notificationSlice
- `useNotification()` → `useSelector(state => state.notification)`
- `notifications` → `state.notification.notifications`
- `unreadCount` → `state.notification.unreadCount`
- `markAsRead()` → `dispatch(markNotificationAsRead(id))`

## MessageContext → Redux + React Query
- `useMessage()` → `useMessagesQuery()` (React Query hook)
- `conversations` → `const { data: conversations } = useConversationsQuery()`
- `sendMessage()` → `useSendMessageMutation()`

## PaymentContext → Redux paymentSlice
- `usePayment()` → `useSelector(state => state.payment)`
- `wallet` → `state.payment.wallet`
- `transactions` → `state.payment.transactions`

## ContractContext → Redux contractSlice
- `useContract()` → `useSelector(state => state.contract)`
- `contracts` → `state.contract.contracts`
- `activeContract` → `state.contract.activeContract`
