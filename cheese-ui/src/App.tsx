import { useEffect, useState } from "react";
import "./App.css";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CheeseEvent = {
  cheeser: string;
  cheesee: string;
  time: Date;
};

type AggreatedCheeses = {
  [key: string]: number;
};

type DeviceOwner = {
  device_name: string;
  username: string;
};

type User = {
  user_id: string;
  username: string;
};

function App() {
  const [cheeser, setCheeser] = useState<string | null>(null);
  const [cheeses, setCheeses] = useState<CheeseEvent[]>([]);
  const [cheesee, setCheesee] = useState<DeviceOwner>({} as DeviceOwner);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchNerdsThatGotRekt();

    fetch("http://localhost:3000/whoami")
      .then((resp) => resp.json())
      .then((data) => setCheesee(data));

    fetch("http://localhost:3000/users")
      .then((resp) => resp.json())
      .then((data) => setUsers(data));
  }, []);

  const fetchNerdsThatGotRekt = () => {
    fetch("http://localhost:3000/cheese")
      .then((resp) => resp.json())
      .then((data) => setCheeses(data));
  };

  const commenceCheesening = async () => {
    await fetch("http://localhost:3000/cheese", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cheeser: cheeser }),
    });
    fetchNerdsThatGotRekt();
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Select onValueChange={(val) => setCheeser(val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Who are you" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Users</SelectLabel>
              {users.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.username}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button disabled={!cheeser} onClick={commenceCheesening}>
          Cheese {cheesee.username}'s {cheesee.device_name}
        </Button>
        {Object.entries(
          cheeses.reduce((accumulator: AggreatedCheeses, val: CheeseEvent) => {
            accumulator[val.cheeser] = (accumulator[val.cheeser] || 0) + 1;
            accumulator[val.cheesee] = (accumulator[val.cheesee] || 0) - 1;

            return accumulator;
          }, {})
        )
          .sort((a, b) => b[1] - a[1])
          .map(([rekt, rektCount]) => {
            return (
              <Card key={rekt}>
                <CardHeader>
                  <CardTitle>
                    {
                      users.find((user) => user.user_id.toString() === rekt)
                        ?.username
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{rektCount}</p>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

export default App;
