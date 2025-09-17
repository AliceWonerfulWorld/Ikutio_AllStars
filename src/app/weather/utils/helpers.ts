export const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    if (hours > 0) return `${hours}時間前`;
    if (minutes > 0) return `${minutes}分前`;
    return "たった今";
  };
  
  export const escapeHtml = (s: string) => {
    return s.replace(/[&<>"']/g, (c) =>
      (
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        } as const
      )[c]!
    );
  };
  
  export const truncate = (s: string, n: number) => {
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  };