import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dispatchTerminalNotification } from './use-notification-dispatch'
import {
  PANE_KEY,
  resetNotificationDispatchMockState,
  type NotificationDispatchMockState
} from './notification-dispatch-test-harness'

vi.mock('@/store', async () => {
  const harness = await import('./notification-dispatch-test-harness')
  return harness.createNotificationDispatchStoreModuleMock()
})

vi.mock('@/lib/desktop-notification-sound', async () => {
  const harness = await import('./notification-dispatch-test-harness')
  return harness.createDesktopNotificationSoundModuleMock()
})

let mockState: NotificationDispatchMockState

describe('dispatchTerminalNotification for a muted tab', () => {
  beforeEach(() => {
    mockState = resetNotificationDispatchMockState()
    mockState.tabsByWorktree = {
      'wt-primary': [{ id: 'tab-1', ptyId: 'pty-1', notificationsMuted: true }]
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('skips agent completion delivery but still marks the pane unread', () => {
    dispatchTerminalNotification('wt-primary', {
      source: 'agent-task-complete',
      terminalTitle: 'codex',
      paneKey: PANE_KEY
    })

    expect(window.api.notifications.dispatch).not.toHaveBeenCalled()
    expect(mockState.markWorktreeUnread).toHaveBeenCalledWith('wt-primary')
    expect(mockState.markTerminalPaneUnread).toHaveBeenCalledWith(PANE_KEY, 'agent-completion')
  })

  it('skips terminal bell delivery', () => {
    dispatchTerminalNotification('wt-primary', { source: 'terminal-bell', paneKey: PANE_KEY })

    expect(window.api.notifications.dispatch).not.toHaveBeenCalled()
  })

  it('delivers again once the tab is unmuted', () => {
    mockState.tabsByWorktree['wt-primary'][0].notificationsMuted = undefined

    dispatchTerminalNotification('wt-primary', {
      source: 'agent-task-complete',
      terminalTitle: 'codex',
      paneKey: PANE_KEY
    })

    expect(window.api.notifications.dispatch).toHaveBeenCalledTimes(1)
  })
})
