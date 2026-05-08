export const userTable = {
  name: "users",
  entries: [
    {
      name: "UserRecord",
      index: ["$userId", "RECORD"],
      columns: [
        "userId",
        "email",
        "username",
        "name",
        "avatarUrl",
        "createdAt",
      ],
    },
    {
      name: "GithubLink",
      index: ["$githubId", "$userId"],
      columns: ["userId", "githubId"],
    },
  ],
} as const;
