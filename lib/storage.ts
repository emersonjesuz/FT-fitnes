import { User, Student, Workout } from "@/types";

// ─── Auth ────────────────────────────────────────────────────────────────────

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem("currentUser");
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function findUser(username: string): Promise<User | null> {
  try {
    const res = await fetch(`/api/users?username=${encodeURIComponent(username)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data || null;
  } catch {
    return null;
  }
}

export async function createUser(username: string, password: string): Promise<User> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

// ─── Students ────────────────────────────────────────────────────────────────

export async function getStudents(userId: string): Promise<Student[]> {
  try {
    const res = await fetch(`/api/students?userId=${userId}`);
    return res.json();
  } catch {
    return [];
  }
}

export async function createStudent(
  userId: string,
  data: Omit<Student, "id" | "userId" | "createdAt">
): Promise<Student> {
  const res = await fetch("/api/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...data }),
  });
  return res.json();
}

export async function saveStudent(student: Student): Promise<Student> {
  const res = await fetch(`/api/students/${student.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student),
  });
  return res.json();
}

export async function deleteStudent(id: string): Promise<void> {
  await fetch(`/api/students/${id}`, { method: "DELETE" });
}

// ─── Workouts ────────────────────────────────────────────────────────────────

export async function getWorkouts(userId: string): Promise<Workout[]> {
  try {
    const res = await fetch(`/api/workouts?userId=${userId}`);
    const data = await res.json();
    return data.map((w: any) => ({
      ...w,
      dias: Array.isArray(w.dias) ? w.dias : [],
      createdAt: typeof w.createdAt === "string" ? w.createdAt : new Date(w.createdAt).toISOString(),
      updatedAt: typeof w.updatedAt === "string" ? w.updatedAt : new Date(w.updatedAt).toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function createWorkout(
  userId: string,
  data: Omit<Workout, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<Workout> {
  const res = await fetch("/api/workouts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...data }),
  });
  return res.json();
}

export async function updateWorkout(workout: Workout): Promise<Workout> {
  const res = await fetch(`/api/workouts/${workout.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workout),
  });
  return res.json();
}

export async function deleteWorkout(id: string): Promise<void> {
  await fetch(`/api/workouts/${id}`, { method: "DELETE" });
}
