export const userTable = {
  name: "users",
  entries: [
    {
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
      index: ["$githubId", "$userId"],
      columns: ["userId", "githubId"],
    },
  ],
};
