import { Student, User, Workout } from "@/types";

const STORAGE_KEYS = {
  users: "pt_users",
  students: "pt_students",
  workouts: "pt_workouts",
  currentUser: "pt_current_user",
  migratedFlag: "pt_db_migrated_v1",
};

let migrationPromise: Promise<void> | null = null;

function getLocalArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function ensureLocalStorageMigration(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(STORAGE_KEYS.migratedFlag) === "1") return;

  if (migrationPromise) {
    await migrationPromise;
    return;
  }

  migrationPromise = (async () => {
    const users = getLocalArray<User>(STORAGE_KEYS.users);
    const students = getLocalArray<Student>(STORAGE_KEYS.students);
    const workouts = getLocalArray<Workout>(STORAGE_KEYS.workouts);

    if (users.length === 0 && students.length === 0 && workouts.length === 0) {
      localStorage.setItem(STORAGE_KEYS.migratedFlag, "1");
      return;
    }

    const response = await fetch("/api/migrate-localstorage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users, students, workouts }),
    });

    if (!response.ok) {
      throw new Error("Falha ao migrar dados locais para o banco");
    }

    localStorage.setItem(STORAGE_KEYS.migratedFlag, "1");
  })();

  try {
    await migrationPromise;
  } finally {
    migrationPromise = null;
  }
}

async function apiGet<T>(url: string): Promise<T> {
  await ensureLocalStorageMigration();
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha em GET ${url}`);
  }
  return response.json();
}

async function apiSend<T>(url: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
  await ensureLocalStorageMigration();
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Falha em ${method} ${url}`);
  }

  return response.json();
}

// Users
export async function getUsers(): Promise<User[]> {
  return apiGet<User[]>("/api/users");
}

export async function findUser(username: string): Promise<User | undefined> {
  const query = encodeURIComponent(username.trim());
  const user = await apiGet<User | null>(`/api/users?username=${query}`);
  return user || undefined;
}

export async function createUser(username: string, password: string): Promise<User> {
  return apiSend<User>("/api/users", "POST", {
    username,
    password,
    createdAt: new Date().toISOString(),
  });
}

// Current session
export function setCurrentUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.currentUser);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.currentUser);
}

// Students
export async function getStudents(userId: string): Promise<Student[]> {
  const query = encodeURIComponent(userId);
  return apiGet<Student[]>(`/api/students?userId=${query}`);
}

export async function saveStudent(student: Student): Promise<Student> {
  return apiSend<Student>(`/api/students/${student.id}`, "PUT", student);
}

export async function deleteStudent(id: string): Promise<void> {
  await apiSend<{ ok: boolean }>(`/api/students/${id}`, "DELETE");
}

export async function createStudent(userId: string, data: Omit<Student, "id" | "userId" | "createdAt">): Promise<Student> {
  return apiSend<Student>("/api/students", "POST", {
    ...data,
    userId,
    createdAt: new Date().toISOString(),
  });
}

// Workouts
export async function getWorkouts(userId: string): Promise<Workout[]> {
  const query = encodeURIComponent(userId);
  return apiGet<Workout[]>(`/api/workouts?userId=${query}`);
}

export async function getStudentWorkouts(userId: string, studentId: string): Promise<Workout[]> {
  const all = await getWorkouts(userId);
  return all.filter((w) => w.studentId === studentId);
}

export async function saveWorkout(workout: Workout): Promise<Workout> {
  return apiSend<Workout>(`/api/workouts/${workout.id}`, "PUT", workout);
}

export async function deleteWorkout(id: string): Promise<void> {
  await apiSend<{ ok: boolean }>(`/api/workouts/${id}`, "DELETE");
}

export async function createWorkout(
  userId: string,
  data: Omit<Workout, "id" | "userId" | "createdAt" | "updatedAt">,
): Promise<Workout> {
  return apiSend<Workout>("/api/workouts", "POST", {
    ...data,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function updateWorkout(workout: Workout): Promise<Workout> {
  return saveWorkout({ ...workout, updatedAt: new Date().toISOString() });
}
