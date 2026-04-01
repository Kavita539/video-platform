import { useEffect, useState } from "react";
import { authAPI } from "../services/api";
import { Badge } from "../components/Badge";
import { Spinner } from "../components/Button";
import { Empty } from "../components/Empty";

const ROLES = ["viewer", "editor", "admin"];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    authAPI
      .listUsers()
      .then(({ data }) => setUsers(data.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, role) => {
    setUpdating(userId + "_role");
    try {
      const { data } = await authAPI.updateRole(userId, role);
      setUsers((u) => u.map((x) => (x._id === userId ? data.user : x)));
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleStatus = async (userId) => {
    setUpdating(userId + "_status");
    try {
      const { data } = await authAPI.toggleStatus(userId);
      setUsers((u) => u.map((x) => (x._id === userId ? data.user : x)));
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-[20px_16px] md:p-[36px_40px] max-w-[1200px] animate-[fadeUp_0.35s_ease_forwards]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-8">
        <div>
          <h1 className="font-[var(--font-display)] text-[1.6rem] font-extrabold tracking-tight leading-snug">
            Users
          </h1>
          <p className="text-[0.78rem] muted mt-1 tracking-wider">
            {users.length} member{users.length !== 1 ? "s" : ""} in your
            organisation
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-[80px_0]">
          <Spinner size="lg" className="accent" />
        </div>
      ) : users.length === 0 ? (
        <Empty icon="◎" title="No users found" />
      ) : (
        /* Table Wrapper */
        <div className="overflow-x-auto border border rounded-[var(--radius)] animate-[fadeUp_0.35s_ease_forwards]">
          <table className="w-full border-collapse text-[0.80rem]">
            <thead>
              <tr className="border-b border raised">
                <th className="p-[11px_16px] text-left text-[0.68rem] font-semibold tracking-[0.08em] uppercase muted whitespace-nowrap">
                  User
                </th>
                <th className="p-[11px_16px] text-left text-[0.68rem] font-semibold tracking-[0.08em] uppercase muted whitespace-nowrap">
                  Role
                </th>
                <th className="p-[11px_16px] text-left text-[0.68rem] font-semibold tracking-[0.08em] uppercase muted whitespace-nowrap">
                  Status
                </th>
                <th className="p-[11px_16px] text-left text-[0.68rem] font-semibold tracking-[0.08em] uppercase muted whitespace-nowrap">
                  Last login
                </th>
                <th className="p-[11px_16px] text-left text-[0.68rem] font-semibold tracking-[0.08em] uppercase muted whitespace-nowrap">
                  Joined
                </th>
                <th className="p-[11px_16px] text-left text-[0.68rem] font-semibold tracking-[0.08em] uppercase muted whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isUpdatingRole = updating === u._id + "_role";
                const isUpdatingStatus = updating === u._id + "_status";
                return (
                  <tr
                    key={u._id}
                    className={`surface transition-colors duration-[var(--transition)] hover:raised [&:not(:last-child)_td]:border-b [&:not(:last-child)_td]:border ${!u.isActive ? "opacity-55" : ""}`}
                  >
                    <td className="p-[12px_16px] align-middle secondary">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--accent-dim)] accent font-[var(--font-display)] font-bold text-[0.85rem] flex items-center justify-center flex-shrink-0">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium primary whitespace-nowrap">
                            {u.name}
                          </div>
                          <div className="text-[0.70rem] muted whitespace-nowrap">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-[12px_16px] align-middle secondary">
                      {isUpdatingRole ? (
                        <Spinner size="sm" />
                      ) : (
                        <select
                          className="overlay border border rounded-[var(--radius-sm)] secondary font-[var(--font-mono)] text-[0.72rem] p-[5px_8px] cursor-pointer outline-none transition-colors duration-[var(--transition)] tracking-[0.04em] focus:accent"
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u._id, e.target.value)
                          }
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="p-[12px_16px] align-middle secondary">
                      <Badge variant={u.isActive ? "safe" : "failed"}>
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-[12px_16px] align-middle muted font-mono text-[0.72rem] whitespace-nowrap">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="p-[12px_16px] align-middle muted font-mono text-[0.72rem] whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-[12px_16px] align-middle secondary">
                      <button
                        className={`bg-transparent border rounded-[var(--radius-sm)] font-[var(--font-mono)] text-[0.68rem] p-[5px_10px] tracking-[0.06em] uppercase cursor-pointer transition-all duration-[var(--transition)] whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                          u.isActive
                            ? "border muted hover:danger hover:danger hover:bg-[var(--danger-glow)]"
                            : "success border-[rgba(63,207,142,0.3)] hover:bg-[rgba(63,207,142,0.08)]"
                        }`}
                        onClick={() => handleToggleStatus(u._id)}
                        disabled={!!isUpdatingStatus}
                      >
                        {isUpdatingStatus
                          ? "…"
                          : u.isActive
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
