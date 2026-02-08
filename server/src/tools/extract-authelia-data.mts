type AutheliaData = {
  email: string;
  groups: Array<string>;
  nickname: string;
  sub: string;
};

export function extractAutheliaData(token: string): AutheliaData {
  const json = JSON.parse(
    Buffer.from(token.split(".")[1] as string, "base64").toString(),
  );

  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    nickname: json.name,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    email: json.email,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    sub: json.sub,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    groups: json.groups,
  };
}
