export const userTable = {
  name: "users",
  entries: [
    {
      name: "UserRecord",
      index: ["$userId", "RECORD"],
      columns: [
        "userId",
        "name",
        "username",
        "email",
        "avatarUrl",
        "createdAt",
        "githubId",
      ],
    },
    {
      name: "GithubLink",
      index: ["$githubId", "$userId"],
      columns: ["userId", "githubId"],
    },
  ],
} as const;
