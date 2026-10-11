export type Member = {
  id: number;
  role: string;
  user: { id: number; name: string; email: string };
};

export type HouseData = {
  id: number;
  name: string;
  type: string;
  inviteCode: string;
  myRole: string;
  members: Member[];
};