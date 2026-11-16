import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import ManagerTasks from "./manager-tasks"

const { mockTasksApi } = vi.hoisted(() => ({
  mockTasksApi: {
    listTasks: vi.fn(),
    getStats: vi.fn(),
    toggleChecklistItem: vi.fn(),
    createTask: vi.fn(),
  },
}))

vi.mock("@/lib/api", () => ({ tasksApi: mockTasksApi }))
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }))

const TASK = {
  id: "task-1",
  title: "Turn over unit 2",
  description: "",
  taskType: "turnover",
  status: "pending",
  priority: "medium",
  propertyId: null,
  assignedTo: null,
  createdBy: "manager-1",
  dueDate: null,
  completedAt: null,
  relatedId: null,
  relatedType: null,
  metadata: {},
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
  checklistItems: [
    { id: "item-1", taskId: "task-1", label: "Replace filters", isDone: false, photoUrl: null, notes: null, sortOrder: 1 },
  ],
}

beforeEach(() => {
  mockTasksApi.listTasks.mockReset().mockResolvedValue([TASK])
  mockTasksApi.getStats.mockReset().mockResolvedValue({ byStatus: {}, byType: {}, overdueCount: 0, total: 1 })
  mockTasksApi.toggleChecklistItem.mockReset()
})

describe("ManagerTasks checklist", () => {
  it("shows what the server saved when the box is toggled twice before the first save returns", async () => {
    const answers: Array<(done: boolean) => void> = []
    // PATCH /tasks/checklist-items/:id/toggle flips is_done on every call and returns the row.
    mockTasksApi.toggleChecklistItem.mockImplementation(
      () =>
        new Promise((resolve) =>
          answers.push((isDone) => resolve({ ...TASK.checklistItems[0], isDone })),
        ),
    )
    render(<ManagerTasks />)

    fireEvent.click(await screen.findByText("Turn over unit 2"))
    const box = screen.getByRole("checkbox")
    fireEvent.click(box)
    fireEvent.click(box)
    expect(mockTasksApi.toggleChecklistItem).toHaveBeenCalledTimes(2)

    await act(async () => {
      answers[0](true)
      answers[1](false)
    })

    await waitFor(() => expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false"))
  })
})
